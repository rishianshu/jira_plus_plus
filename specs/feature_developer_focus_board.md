


# Feature: Developer Focus Board

## Purpose
Provide developers with a focused workspace showing only relevant Jira issues, comments, worklogs, and blockers — so they can plan their day efficiently without navigating the entire Jira interface.

## Objectives
- Display all issues assigned to the current developer across active sprints.
- Highlight blockers and recently updated tasks.
- Show time spent and remaining effort for better daily planning.
- Support quick actions: log work, add comment, mark blocker resolved.

---

## Data Flow
1. **Data Collection**
   - Fetch Jira issues assigned to the logged-in user.
   - Include related comments, worklogs, and labels.
   - Identify blockers via issue status or linked issues.

2. **Processing**
   - Aggregate issues by sprint and priority.
   - Compute time spent, remaining estimate, and aging metrics.
   - Enrich data with AI summaries (“what changed since yesterday”).

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
1. **Header:** Developer name and current sprint.
2. **My Issues Tab:** List of assigned issues grouped by priority.
3. **Comments Tab:** Recent comments or mentions.
4. **Blockers Tab:** Issues in blocked status or pending dependencies.
5. **AI Summary Widget:** Shows "What changed since yesterday."

**Components:**
- `FocusHeader.tsx`
- `IssueList.tsx`
- `CommentFeed.tsx`
- `BlockerPanel.tsx`
- `AISummary.tsx`

**Interactions:**
- Click issue → open details dialog.
- Inline comment and worklog updates.
- “Regenerate Summary” button refreshes AI insight.

---

## API Endpoints
| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/focus/issues` | GET | Fetch issues assigned to current user |
| `/api/focus/blockers` | GET | Retrieve blocker issues |
| `/api/focus/ai-summary` | POST | Generate summary for developer’s day |

---

## AI Prompt Template
```json
{
  "prompt": "Summarize the developer’s progress, blockers, and upcoming tasks based on Jira issues, comments, and worklogs.",
  "input": "{issues, worklogs, comments}",
  "output_format": {
    "summaryText": "string",
    "topIssues": ["string"],
    "blockers": ["string"]
  }
}
```

---

## Acceptance Criteria
- [ ] Developer sees all assigned issues with correct status and priority.
- [ ] AI summary correctly highlights yesterday’s progress and today’s focus.
- [ ] Blockers update automatically from Jira sync.
- [ ] Comment and worklog updates work inline.
- [ ] Page loads in under 2 seconds for 100+ issues.

---

## Future Enhancements
- Add “Focus Mode” timer with Pomodoro-style tracking.
- Integrate notifications for new comments or blockers.
- Predict task completion based on worklog trends.