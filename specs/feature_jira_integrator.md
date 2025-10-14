

# Feature: Jira Data Integrator

## Purpose
Serve as the backbone of Jira++ by synchronizing data from Jira REST APIs into the local data store, ensuring that every module (Scrum Board, Focus Board, Manager Dashboard) always works with the freshest, normalized data.

## Objectives
- Continuously sync Jira issues, comments, worklogs, and sprints.
- Provide normalized, queryable datasets for UI and AI modules.
- Handle API pagination, rate limits, and incremental updates efficiently.
- Maintain change tracking and metadata for historical comparisons.

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
```

---

## Integration & Storage Design
| Component | Description |
|------------|--------------|
| **Sync Job (Node)** | Periodic worker that fetches new/updated records via Jira API |
| **Prisma ORM** | Handles model definitions and upserts |
| **GraphQL Server** | Exposes unified read API |
| **Cache Layer (optional)** | Reduces redundant API calls |
| **Config Loader** | Reads Jira credentials, base URL, and sync intervals |

---

## API Endpoints
| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/jira/sync` | POST | Triggers full or incremental sync |
| `/api/jira/issues` | GET | Returns issues based on filters |
| `/api/jira/status` | GET | Shows sync history and health |

---

## Error Handling & Logging
- Retry failed requests with exponential backoff.
- Log failures to `SyncLog` table with timestamps.
- Gracefully handle expired tokens or Jira downtime.
- Detect schema changes in Jira API and flag mismatches.

---

## Scheduling & Sync Strategy
- Default sync interval: every 15 minutes.
- Incremental sync based on `updated` timestamp.
- Full sync (admin-only) for initial setup or data recovery.

---

## Acceptance Criteria
- [ ] Successfully syncs Jira issues, comments, and worklogs.
- [ ] Handles pagination and rate-limiting gracefully.
- [ ] Updates `SyncState` timestamps on each successful run.
- [ ] Data available via GraphQL within 5 seconds post-sync.
- [ ] Supports both manual and scheduled sync triggers.

---

## Future Enhancements
- Add webhook-based real-time updates from Jira.
- Introduce delta-based AI summarization (only changed records).
- Add multi-tenant support for multiple Jira instances.