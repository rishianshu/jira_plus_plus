


# Feature: Developer Focus Board

## Purpose
Provide developers with a focused workspace showing only relevant Jira issues, comments, worklogs, and blockers — so they can plan their day efficiently without navigating the entire Jira interface.

## Objectives
- Provide a single view of **all work** for the logged-in developer across every tracked project (default scope = all projects, optional project filter).
- Highlight blockers and recently updated tasks.
- Show time spent, remaining effort, and dashboard metrics (totals, worklog per day, velocity indicators) to support daily planning.
- Support quick actions: log work, add comment, mark blocker resolved.
- Allow filtering the view by custom **date range** (start/end) to analyse performance over any period.

---

## Data Flow
1. **Data Collection**
   - Fetch Jira issues assigned to the logged-in user across all accessible projects (with optional project filter).
   - Include related comments, worklogs (bounded by selected date range), and labels.
   - Identify blockers via issue status or linked issues.
   - Aggregate worklog totals per day within the selected range.

2. **Processing**
   - Aggregate issues by sprint, priority, and project.
   - Compute time spent, remaining estimate, aging metrics, and per-day worklog totals for the selected date window.
   - Enrich data with AI summaries (“what changed since yesterday / in this period”).
   - Produce dashboard metrics (e.g., total issues, completed issues, total hours logged, average hours per day, blockers count).

3. **Storage**
   - Persist issue snapshots in Prisma models (`Issue`, `Worklog`, `Comment`, `Blocker`).

4. **Presentation**
   - Query issues and blockers via GraphQL.
   - Display dynamic UI components for My Issues, Comments, Blockers.

---

## GraphQL Schema
```graphql
type FocusBoard {
  id: ID!
  user: User!
  issues: [Issue!]!
  blockers: [Blocker!]
  lastUpdated: DateTime!
}

type Issue {
  id: ID!
  key: String!
  summary: String!
  priority: String
  status: String
  timeSpent: Int
  remainingEstimate: Int
  updated: DateTime!
}
```

---

## UI Specification (React + shadcn/ui)
**Page:** `/focus`  
**Sections:**
1. **Header:** Developer name, project selector (`All Projects` default), date range picker (start/end), quick presets (Today, This Week, Custom).
2. **Focus Dashboard:** KPI cards (Total Issues, In Progress, Blockers, Hours Logged, Avg Hours/Day).
3. **My Issues Tab:** List of assigned issues grouped by priority and project, filtered by date range.
4. **Comments Tab:** Recent comments/mentions within date range.
5. **Blockers Tab:** Issues in blocked status or pending dependencies.
6. **Worklog Timeline:** Chart/table showing daily hours logged in the selected range.
7. **AI Summary Widget:** Summarises progress for the chosen period (yesterday by default).

**Components:**
- `FocusHeader.tsx` – includes project selector + date range controls.
- `FocusDashboard.tsx` – KPI cards for totals/worklog metrics.
- `IssueList.tsx`
- `CommentFeed.tsx`
- `BlockerPanel.tsx`
- `WorklogTimeline.tsx`
- `AISummary.tsx`

**Interactions:**
- Click issue → open details dialog.
- Inline comment and worklog updates.
- “Regenerate Summary” button refreshes AI insight scoped to selected range.
- Filters (project, date range) update all sections instantly.

---

## API Endpoints
| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/focus/issues` | GET | Fetch issues assigned to current user (filters: projectId?, start?, end?) |
| `/api/focus/blockers` | GET | Retrieve blocker issues (same filters) |
| `/api/focus/metrics` | GET | Aggregate totals and worklog per-day metrics |
| `/api/focus/ai-summary` | POST | Generate summary for developer’s day |

---

## AI Prompt Template
```json
{
  "prompt": "Summarize the developer’s progress, blockers, and upcoming tasks within the selected date range based on Jira issues, comments, and worklogs.",
  "input": "{issues, worklogs, comments, dateRange}",
  "output_format": {
    "summaryText": "string",
    "topIssues": ["string"],
    "blockers": ["string"],
    "keyWins": ["string"],
    "nextFocus": ["string"]
  }
}
```

---

## Acceptance Criteria
- [ ] The developer sees all assigned issues across projects with correct status, priority, and project context; default view includes every project the user participates in.
- [ ] AI summary correctly highlights progress for the selected date range (default yesterday → today).
- [ ] Blockers update automatically from Jira sync.
- [ ] Comment and worklog updates work inline and respect the filters.
- [ ] Dashboard metrics (totals, worklog per day, blockers) reflect the selected time window.
- [ ] Page loads in under 2 seconds for 100+ issues.

---

## Future Enhancements
- Add “Focus Mode” timer with Pomodoro-style tracking.
- Integrate notifications for new comments or blockers.
- Predict task completion based on worklog trends.
