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

---


## Extended Design: Manager Summary Board + Performance Review Mode

This section merges the roadmap, shared specs guidance, and the detailed phases for both the Manager Summary Board and Performance Review Mode into a unified specification for implementation and future planning.

### 1. Architecture Overview (Shared Elements)

- **Data Sources:** Jira REST APIs for issues, comments, worklogs, sprints; plus local database for user/team mapping.
- **Processing:** Aggregation of metrics by project, sprint, user; AI-generated summaries and narratives.
- **Storage:** Centralized Prisma models for summaries, blockers, sprints, user metrics, and user narratives.
- **APIs:** REST/GraphQL endpoints for summary, blockers, AI summaries, user metrics, and comparative reports.
- **UI Framework:** React with shadcn/ui components, supporting both manager and user-centric dashboards.
- **AI Prompts:** Canonical templates for sprint summaries and performance narratives, ensuring consistent outputs.

### 2. Manager Summary Board Phases

- **Phase 1 — Sprint Health & Basic Blockers**
  - KPIs: Plan vs done, burndown, active blockers.
  - Features: Team and sprint selection, completion rates, blockers table, AI summary.
  - Acceptance: Accurate aggregation, real-time updates, responsive UI.

- **Phase 2 — Blockers Intelligence**
  - Features: Blocker clustering, dependency graphs, advanced filtering.
  - Acceptance: Visualizes relationships between blockers and their impact.

- **Phase 3 — Forecasting & Risk**
  - Features: Completion probability, risk badges, velocity prediction.
  - Acceptance: Provides proactive insights and risk assessments for ongoing sprints.

### 3. Performance Review Mode Phases

- **Phase 1 — Metrics Baseline (MVP)**
  - Goal: Review-ready per-user dashboard for chosen date range (sprint/month/quarter).
  - Data & Models: `UserMetricSnapshot` (userId, periodStart, periodEnd, completionPct, velocity, consistency, predictability, blockersResolved, reopens, comments, mentions, responseLatencyP50).
  - APIs: 
    - `GET /api/performance/metrics?userId=&from=&to=`
    - `GET /api/performance/compare?userId=&from=&to=&prevFrom=&prevTo=`
  - UI: User cards, timeline of worklogs, transitions, comments.
  - Acceptance: Metrics match canonical definitions and are backfilled for recent sprints.

- **Phase 2 — Qualitative Insights**
  - Goal: AI-generated narratives and growth suggestions per user.
  - Data & Models: `UserNarrative` (userId, period, summary, strengths[], improvements[], anomalies[]).
  - APIs: 
    - `POST /api/performance/summary` (uses canonical performance narrative prompt).
  - UI: AI summary panel, strengths/improvements chips.
  - Acceptance: High prompt validity and idempotent narrative generation.

- **Phase 3 — Comparative Reports & Exports**
  - Goal: Review packs for 1:1s and HR cycles.
  - Features: Cross-user heatmaps (velocity, predictability, collaboration), cross-sprint/user deltas, export to PDF/Confluence.
  - Acceptance: Exports complete quickly (≤5s for up to 50 users), artifacts versioned and linkable.

### 4. Shared Components

- **Metrics Catalog**
  - Canonical KPI names, formulas, edge cases, and data lineage (Jira fields → internal KPIs).
  - Versioned changes for longitudinal analysis.

- **Database Models**
  - Centralized Prisma models:
    - `Summary`, `Blocker`, `Sprint` (for manager board)
    - `UserMetricSnapshot`, `UserNarrative` (for performance review)

- **API Endpoints**
  - `/api/manager/summary` (GET): Aggregated sprint summary per team.
  - `/api/manager/blockers` (GET): Blockers and status.
  - `/api/manager/ai-summary` (POST): AI sprint summary.
  - `/api/performance/metrics` (GET): Per-user metrics.
  - `/api/performance/compare` (GET): Comparative metrics.
  - `/api/performance/summary` (POST): AI-generated user narrative.

- **AI Prompts**
  - Sprint summary prompt:
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
  - Performance review narrative prompt:
    - Input: User metrics, timeline, peer feedback.
    - Output: Summary, strengths, improvements, anomalies.

### 5. Future Integration Notes

- **User-Level Trend Analytics:** Add more granular trend analysis for individuals.
- **Velocity Prediction:** Integrate predictive models to forecast team/user velocity.
- **Daily Change Summaries:** “What changed since yesterday” panels for both manager and user views.
- **Exports and HR Integration:** Expand comparative exports and integrate with HR review cycles.
- **Sync Cadence:** Align ingestion and sync jobs with overall Jira sync strategy.

---