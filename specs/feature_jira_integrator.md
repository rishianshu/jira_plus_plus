

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

## Error Handling & Logging
- Retry failed requests with `p-retry` (three attempts per Jira call).
- Workflow failures funnel into `SyncLog` with level `ERROR` and mark `SyncState` + `SyncJob` as `FAILED`/`ERROR`.
- Gracefully handle expired tokens or Jira downtime; admins can resume after correcting secrets.
- Detect schema changes in Jira API and flag mismatches in logs for operator review.

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
