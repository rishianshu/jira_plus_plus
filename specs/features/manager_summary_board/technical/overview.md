# Manager Summary Board — Technical Spec

## Architecture Overview
- **Services**: GraphQL API (`managerSummary` query), background sync jobs.
- **Data Sources**: Jira REST (issues, sprints, worklogs, comments), local Prisma models (`Summary`, `Blocker`, `SprintMetric`).
- **Processing**: Aggregators compute KPIs per sprint/team; AI worker generates summaries.

## Data Flow
1. **Data Collection**
   - Pull Jira issues, comments, worklogs, and sprint metadata.
   - Fetch user mapping and team relationships from the local DB.
2. **Processing Layer**
   - Aggregate by project, sprint, user.
   - Compute KPIs: completion rate, active blockers, delayed tasks.
   - Generate AI summaries highlighting anomalies.
3. **Storage**
   - Persist metrics in Prisma (`ManagerSprintMetric`, `ManagerBlocker`, `Sprint`).
4. **Presentation**
   - GraphQL resolvers expose summaries and indicators to the UI.

## Data Model & Schema
- Extend Prisma with:
  - `ManagerSprintMetric` (projectId, sprintId, planPoints, completedPoints, velocity, blockerCount, riskScore).
  - `ManagerBlocker` (issueId, ownerId, ageDays, severity, status).
- GraphQL additions:
  ```graphql
  type ManagerSprintSummary {
    id: ID!
    project: Project!
    sprint: Sprint!
    metrics: ManagerSprintMetric!
    blockers: [ManagerBlocker!]!
    aiSummary: String
    warnings: [FocusBoardWarning!]
  }

  type ManagerBlocker {
    id: ID!
    issue: Issue!
    owner: JiraUser!
    severity: String!
    ageDays: Int!
    status: String!
  }
  ```

## API Contracts
- `managerSummary(projectId: ID!, sprintId: ID!): ManagerSprintSummary!`
- `managerBlockers(projectId: ID!, sprintId: ID!): [ManagerBlocker!]!`
- `generateManagerSummary(input: { projectId: ID!, sprintId: ID! }): AISummaryPayload!`

## AI Prompt Template
```json
{
  "prompt": "Summarize the current sprint’s health, blockers, and key achievements for the manager dashboard.",
  "input": "{issues, worklogs, comments, sprint_metrics}",
  "output_format": {
    "summaryText": "string",
    "topBlockers": ["string"],
    "recommendations": ["string"]
  }
}
```

## Sync Strategy
- Reuse Jira sync cadence; create derived metrics job post-sync.
- Delta updates: only recompute metrics for sprints touched in last sync.

## Performance
- Target <500ms for GraphQL `managerSummary` (excluding AI regeneration).
- Cache aggregated metrics in Redis (TTL 5 min) to avoid recomputation for repeated views.

## Security & Access
- Authorize managers by project membership (`UserProjectLink` role check).
- Redact blockers with restricted labels until permissions handled.

## Error Handling
- Leverage shared spec (`../../shared/error_handling.md`).
- Append warnings for partial data (missing worklogs/comments).

## Risks & Mitigations
- **Large Jira payloads**: implement pagination & backoff.
- **Metric drift**: versioned KPI definitions; include lineage metadata.
- **AI latency**: async generation + cached summaries.
