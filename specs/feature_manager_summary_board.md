


# Feature: Manager Summary Board

## Purpose
Provide a comprehensive view for managers showing team progress, blockers, sprint completion rate, and user engagement, all driven by Jira data and AI-generated summaries.

## Objectives
- Summarize project health at sprint or release level.
- Identify blockers per user and team.
- Track daily progress across stories and epics.
- Enable quick drill-down into team or user activity.

---

## Data Flow
1. **Data Collection:**  
   - Pull Jira issues, comments, worklogs, and sprint metadata using Jira REST APIs.
   - Fetch user mapping and team relationships from the local database.

2. **Processing Layer:**  
   - Aggregate data by project, sprint, and user.  
   - Compute KPIs: story completion rate, open blockers, active stories, and delayed tasks.
   - Generate AI summaries highlighting key updates or anomalies.

3. **Storage:**  
   - Store processed metrics in Prisma models (`Summary`, `Blocker`, `Sprint`).

4. **Presentation:**  
   - Use GraphQL APIs to fetch summaries and progress indicators.
   - Display real-time dashboards with visual indicators (progress bars, status chips).

---

## GraphQL Schema
```graphql
type ManagerSummary {
  id: ID!
  team: String!
  sprint: String!
  progressPercent: Float!
  blockers: [Blocker!]!
  summaryText: String
}

type Blocker {
  id: ID!
  issueKey: String!
  summary: String!
  owner: String!
  status: String!
}
```

---

## UI Specification (React + shadcn/ui)
**Page:** `/manager`  
**Sections:**
1. **Header:** Project and sprint selector.
2. **Team Summary:** Cards showing each team’s sprint completion percentage.
3. **Blocker Section:** Table showing blockers by owner and age.
4. **AI Summary Panel:** Short summary paragraph (“Top highlights from the sprint”).
5. **Charts:** Progress trend line or velocity chart.

**Components:**
- `ManagerHeader.tsx`
- `SummaryCard.tsx`
- `BlockerTable.tsx`
- `AISummary.tsx`

---

## API Endpoints
| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/manager/summary` | GET | Returns aggregated sprint summary per team |
| `/api/manager/blockers` | GET | Lists blockers and their status |
| `/api/manager/ai-summary` | POST | Generates AI summary text using GPT |

---

## AI Prompt Template (for Summary Generation)
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

---

## Acceptance Criteria
- [ ] Aggregated summary correctly computed for each sprint and team.
- [ ] Blockers list updates in real time with sync job.
- [ ] AI summary regenerates successfully via `/api/manager/ai-summary`.
- [ ] Progress chart displays correct trend.
- [ ] UI responsive across desktop and mobile.

---

## Future Enhancements
- Add user-level trend analytics.
- Integrate velocity prediction.
- Include “what changed since yesterday” summaries.