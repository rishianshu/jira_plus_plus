

# Feature: Jira Data Integrator

## Purpose
Serve as the backbone of Jira++ by synchronizing data from Jira REST APIs into the local data store, ensuring that every module (Scrum Board, Focus Board, Manager Dashboard) always works with the freshest, normalized data.

## Objectives
- Continuously sync Jira issues, comments, worklogs, and sprints for every tracked Jira user.
- Provide normalized, queryable datasets for UI and AI modules.
- Handle API pagination, rate limits, and incremental updates efficiently via Temporal workflows.
- Maintain change tracking, sync logs, and metadata for historical comparisons.

---

## Data Flow
1. **Source:**  
   - Jira REST APIs (`/rest/api/3/search`, `/rest/api/3/issue/{id}`, `/rest/api/3/worklog`, etc.)
2. **Extraction:**  
   - API client handles pagination, filtering (updatedSince), and authentication.
3. **Transformation:**  
   - Map Jira entities → local Prisma models (`Issue`, `Comment`, `Worklog`, `Sprint`, `User`).
   - Convert timestamps, enrich with tenant/user mapping.
4. **Load:**  
   - Upsert into SQLite/PostgreSQL via Prisma.
   - Maintain sync logs in `SyncState` model for incremental sync.
5. **Serve:**  
   - Expose via GraphQL to other modules.

---

## GraphQL Schema
```graphql
type Issue {
  id: ID!
  key: String!
  summary: String!
  status: String!
  priority: String
  assignee: User
  updated: DateTime!
  sprint: Sprint
  comments: [Comment!]!
  worklogs: [Worklog!]!
}

type Comment {
  id: ID!
  author: User!
  body: String!
  created: DateTime!
  updated: DateTime
}

type Worklog {
  id: ID!
  author: User!
  timeSpent: Int
  started: DateTime!
  updated: DateTime!
}

type Sprint {
  id: ID!
  name: String!
  state: String!
  startDate: DateTime
  endDate: DateTime
}

type SyncState {
  entity: String!
  lastSyncTime: DateTime!
  status: String!
}

type SyncJob {
  id: ID!
  workflowId: String!
  scheduleId: String!
  cronSchedule: String!
  status: SyncJobStatus!
  lastRunAt: DateTime
  nextRunAt: DateTime
}

enum SyncJobStatus {
  ACTIVE
  PAUSED
  ERROR
}

enum SyncStatus {
  IDLE
  RUNNING
  SUCCESS
  FAILED
}
```

---

## Integration & Storage Design
| Component | Description |
|------------|--------------|
| **Temporal Workflow** | `syncProjectWorkflow` orchestrates incremental ingestion in 100-record batches |
| **Temporal Schedule** | Per-project cron schedule (default `*/15 * * * *`) that admins can pause/resume/reschedule |
| **Sync Job Record** | `SyncJob` + `SyncState` Prisma models track job metadata, per-entity cursors, and health |
| **Prisma ORM** | Handles model definitions and upserts for issues, comments, worklogs, Jira users, sprints |
| **GraphQL Server** | Exposes unified read + admin control APIs |
| **Config Loader** | Reads Jira credentials, Temporal connection, and sync intervals |
| **Communication Service** | Generic channel abstraction (email, WhatsApp, Slack) used for sync alerts, billing notices, and other ops signals |
| **Error Classification Helper** | Normalizes Jira/HTTP/network failures into canonical codes & guidance strings consumed by workflows, telemetry, and UI |

### Communication Service Requirements
- Provide a reusable mailer that accepts `to`, `cc`, `bcc`, `subject`, `text`, `html`, and `from` overrides. Must support rich HTML bodies with inline styles and attachments (future).
- Expose a channel-agnostic API: `sendMessage({ channel: 'email' | 'whatsapp' | 'slack', payload })`.
- Channel adapters implement the shared contract; only the email adapter is mandatory for v1, using SMTP or provider API.
- Error handling within adapters should bubble structured failure reasons back to telemetry so repeated notification failures can be surfaced.

---

## GraphQL Admin Controls

| Mutation | Purpose |
|----------|---------|
| `startProjectSync(projectId: ID!, full: Boolean)` | Resume schedule and run an on-demand sync (optionally full) |
| `pauseProjectSync(projectId: ID!)` | Pause Temporal schedule for the project |
| `resumeProjectSync(projectId: ID!)` | Resume the schedule without triggering a run |
| `rescheduleProjectSync(projectId: ID!, cron: String!)` | Update cron expression |
| `triggerProjectSync(projectId: ID!, full: Boolean, accountIds: [String!])` | Fire a manual run outside the schedule |

Supporting queries:

- `syncStates(projectId)` – per-entity cursor/state.
- `syncLogs(projectId, limit)` – recent log entries (INFO/ERROR/DEBUG).
- `jiraProjectOptions`, `jiraProjectUserOptions` – used by admin console for project/user discovery.

---

## Error Handling, Telemetry & Alerting
- Retry failed requests with `p-retry` (three attempts per Jira call). Attach structured metadata (`errorCode`, `errorMessage`) returned by Jira so downstream helpers can classify the root cause.
- Introduce a dedicated **Jira error classifier** helper that inspects HTTP status, Atlassian error codes, and network failures to label events (`SUSPENDED_PAYMENT`, `RATE_LIMIT`, `NETWORK_GLITCH`, etc.). This module lives alongside the Jira client and is reused by activities, telemetry analysers, and UI health endpoints.
- Workflow failures funnel into `SyncLog` with level `ERROR` and mark `SyncState` + `SyncJob` as `FAILED`/`ERROR`. `SyncLog.details` must include the classified error code.
- Gracefully handle expired tokens or Jira downtime; admins can resume after correcting secrets. Classification helper should emit actionable advice (e.g., re-authenticate vs. contact billing).
- Telemetry collector consumes Temporal workflow history and sync logs to detect repeated failures with the same classification (e.g., ≥3 consecutive `SUSPENDED_PAYMENT`). When thresholds are crossed the telemetry layer instructs the scheduler to apply exponential back-off and raises an alert via the communication module.
- Detect schema changes in Jira API and flag mismatches in logs for operator review.

### Telemetry-driven Scheduling
- Temporal itself remains the source of truth for scheduling. Rather than allowing API calls to mutate cron expressions directly, a telemetry processor (worker task) analyses Temporal histories and SyncLog entries to determine when to slow down or restore schedules.
- Back-off strategy: maintain original cron + a ladder of longer intervals. Telemetry requests an updated cadence when repeated failures are observed; it also restores the original interval after the first successful run.
- The processor also watches for prolonged "slow response" scenarios (high latency without outright failure) to optionally stagger future runs or open an ops ticket (future enhancement).

### Communication Module
- Alerts ride through a pluggable communication service that supports multiple channels (initially email, extensible to WhatsApp/SMS, Slack). Each channel exposes a consistent interface: `send({ to, subject, text, html, channelSpecificMetadata })`.
- Alert payloads produced by telemetry send a structured message (project id, site alias, error category, suggested action) to the communication module, which fans out to configured channels based on policy (e.g., billing alerts → email + WhatsApp, latency alerts → Slack).

---

## Scheduling & Sync Strategy
- Default sync interval: every 15 minutes (configurable via `SYNC_DEFAULT_CRON`).
- Activity batches limit to 100 issues per loop; workflow iterates until Jira reports no more results.
- Incremental sync uses the minimum `lastSyncTime` across `issue`, `comment`, and `worklog` states.
- Full sync (admin-triggered) bypasses `lastSyncTime` and re-fetches all issues matching tracked users.
- Temporal schedules are created automatically when a project is registered and can be paused/resumed/rescheduled from the admin console.
- When tracked user selections change, a full resync is triggered for the project to backfill historical work items for the newly tracked accounts.

## Prisma Model Additions

- `JiraUser`, `Sprint`, `SyncJob`, `SyncState`, `SyncLog`, and updated `Issue`, `Comment`, `Worklog` models capture normalized Jira data and ingest metadata.
- `ProjectTrackedUser` keeps the curated watchlist per project; ingestion targets only current `isTracked = true` accounts.

## Temporal Worker

- `apps/api/src/temporal/worker.ts` registers `syncProjectWorkflow` and activities from `syncActivities.ts`.
- Worker runs via `pnpm --filter @jira-plus-plus/api temporal:worker` and requires a Temporal server (`TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_TASK_QUEUE`).
- Activities perform Jira API calls, normalize payloads, and upsert Prisma records while updating sync logs/states.

---

## Acceptance Criteria
- [ ] Successfully syncs Jira issues, comments, and worklogs.
- [ ] Handles pagination and rate-limiting gracefully.
- [ ] Updates `SyncState` timestamps on each successful run.
- [ ] Data available via GraphQL within 5 seconds post-sync.
- [ ] Supports both manual and scheduled sync triggers.
- [ ] Admin console exposes start/pause/resume/reschedule/trigger controls backed by Temporal schedules.
- [ ] Sync logs and per-entity state visible to administrators.
- [ ] Tracked user updates trigger historical backfills for added accounts.

---

## Future Enhancements
- Add webhook-based real-time updates from Jira.
- Introduce delta-based AI summarization (only changed records).
- Add multi-tenant support for multiple Jira instances.
- Backfill sprint data with full pagination (beyond first page in `worklog`/`comment`).
- Surface ingestion metrics (throughput, last error code) in admin console dashboards.
- Expand telemetry insights to detect slow-but-successful syncs and automatically open ops alerts.
- Add WhatsApp/Slack adapters to the communication service for multi-channel escalation.
- Monitor workflow histories for success streaks to automatically clear back-off without operator involvement even if alerts were not acknowledged.
