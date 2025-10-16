# Manager Summary Board — Performance Review Mode

**Purpose of this doc:** Define the scope, experience, and technical touchpoints for the Performance Review Mode that lives inside the Manager Summary Board. This companion spec ensures product, engineering, and data teams deliver a consistent manager-facing review experience.

## Problem Statement
Managers lack an integrated view that converts raw Jira activity into actionable performance narratives for 1:1s, retros, and quarterly reviews. They currently piece together worklogs, issue histories, and ad-hoc notes, which is time-consuming and unreliable.

## Goals & Non-Goals
- Deliver an at-a-glance performance snapshot for each team member within the Manager Summary Board.
- Blend quantitative metrics with AI-authored qualitative insight to highlight strengths, gaps, and anomalies.
- Support comparisons across review periods so managers can discuss trends, not just individual sprints.
- Stay focused on Jira-derived signals; non-engineering KPIs (OKRs, HR systems) are out of scope for this release.

## Target Personas
- **Engineering Manager:** prepares for performance conversations and needs defensible data-backed narratives.
- **Product/Program Manager:** monitors cross-team collaboration signals and recognizes blockers/escalations.
- **Lead Developer / Tech Lead:** reviews peer impact and suggests growth opportunities during mentorship sessions.

## Review Period Controls
- Default range: current sprint, with quick filters for last sprint, last month, last quarter, and custom date range.
- Users remain within the Manager Summary Board via a mode toggle (`Summary` vs `Performance Review`).
- Selected person and date range persist per manager (local storage) to streamline recurrent usage.

## Data Inputs & Refresh Windows
| Source | Notes | Refresh |
|--------|-------|---------|
| Jira worklogs | Daily breakdown of effort; used for throughput and consistency calculations. | Hourly sync |
| Issue history | Creation, transitions, resolutions, reopen counts. | Hourly sync |
| Comments & mentions | Collaboration signals, blocker escalations. | Near real-time (webhook) |
| AI summaries | Generated on-demand; can be cached per user + date range for 12 hours. | On-demand |
| Manager notes | Optional free-form text saved per manager + review period. | Immediate |

## Metrics Framework
### Productivity
- **Story Completion %** = completed points / committed points for the selected window.
- **Velocity Trend** = issues resolved per week, plotted across the selected period.
- **Work Consistency Index** = standard deviation of daily logged hours (flag high variance).
- **Delivery Predictability** = committed vs completed ratio (surface misses).

### Quality
- **Reopen & Bug Count** = number of issues reopened or with QA-failed status.
- **Review Notes Extracts** = top themes pulled from linked PR or QA comments.
- **Blocker Ownership** = blockers resolved or escalated by the individual.

### Collaboration & Engagement
- **Comment/Mention Activity** = outbound comments + @mentions normalized by team average.
- **Cross-Team Links** = count of issues linked outside the primary project.
- **Response Latency** = mean time from assignment to first update/comment.

## AI Insight Modules
- **Performance Narrative:** Cohesive summary of throughput, quality, and collaboration highlights.
- **Growth Suggestions:** AI-generated prompts for skills development or cross-functional exposure.
- **Role Fit Signals:** Flags recurring strengths (e.g., QA anchors) or gaps (e.g., cross-team coordination).
- **Anomaly Detection:** Detects streaks of missing worklogs, sudden reopen spikes, or latency shifts.
- **Manager Notes Primer:** Surfaces prior notes relevant to the selected period to inform new feedback.

## UX Specification (React + shadcn/ui)
**Placement:** Within `/manager` route under a `Performance Review` toggle.

**Layout**
- **Left Rail:** Team roster list with search/filter; selecting a card updates the main canvas.
- **Primary Canvas:** KPI strip, AI summary card, timeline chart, collaboration insights, notes editor.
- **Right Drawer (optional):** Comparison view to juxtapose previous period metrics.

**Core Components**
- `PerformanceToggle.tsx` — mode switch that persists selection.
- `UserPerformanceCard.tsx` — summary tiles (completion, blockers resolved, hours logged).
- `PerformanceTimelineChart.tsx` — stacked area chart for worklogs + status changes.
- `CollaborationSignals.tsx` — table or chips for mentions, cross-links, response times.
- `AIInsightsPanel.tsx` — narrative, growth areas, anomaly flags with regenerate action.
- `ManagerNotesEditor.tsx` — markdown-compatible text area with autosave.

## Interaction Rules
- Mode toggle swaps datasets without navigating away; keep filters intact.
- Regenerating AI insights shows spinner and disables secondary controls until response returns.
- Comparison drawer defaults to prior sprint; managers can change to any saved period.
- Notes autosave every 5 seconds of inactivity and on blur; success toast confirms saves.
- Timeline chart tooltips reveal issue IDs; clicking opens issue drawer already used in Summary mode.

## Data Flow Overview
1. **Aggregation Layer:** Existing Manager Summary pipeline enriches user-level aggregates by period.
2. **Performance Service:** New service composes productivity, quality, and collaboration metrics into a normalized payload.
3. **AI Orchestrator:** Calls internal LLM endpoint with metric context and manager notes to generate narrative blocks.
4. **Cache Strategy:** Metric payloads cached per user + period (1 hour). AI summaries cached per user + period (12 hours).
5. **Frontend Query:** React query hooks fetch `/api/performance/metrics` then lazily request `/api/performance/summary`.

## API Contracts
| Endpoint | Method | Payload | Response |
|----------|--------|---------|----------|
| `/api/performance/metrics` | `GET` | `userId`, `teamId`, `dateRange` | Metrics object `{ productivity, quality, collaboration, notesMeta }` |
| `/api/performance/summary` | `POST` | Body includes `userId`, `dateRange`, `metrics`, optional `managerNotes` | AI narrative `{ strengths[], improvements[], anomalies[], narrative }` |
| `/api/performance/compare` | `GET` | `userId`, `currentRange`, `compareRange` | Comparative deltas for key metrics |
| `/api/performance/notes` | `PUT` | `userId`, `dateRange`, `markdown` | `{ status: "ok", updatedAt }` |

### Error & Warning States
- Propagate existing shared warning objects (partial sync, missing worklogs) to the UI.
- AI endpoints must return structured errors with retry hints; fall back to last cached summary when available.

## Analytics & Telemetry
- Track mode toggle usage, regenerate clicks, note edits, comparison drawer opens.
- Log AI fallback occurrences and anomaly flags accepted/dismissed by managers.
- Capture export events (PDF/Confluence) with user + period metadata.

## Dependencies
- Jira integrator for worklogs, issue histories, and comments.
- AI service configured for performance narratives (shared with Developer Focus Board).
- Export service (PDF/Confluence) shared with Manager Summary board.
- Shared error handling spec: [`../../../shared/error_handling.md`](../../../shared/error_handling.md).

## Launch Checklist
- [ ] UX copy reviewed by design and HR partners.
- [ ] Metrics validated against known historical sprints.
- [ ] AI prompts tuned with anonymized data samples.
- [ ] Data retention policy for manager notes approved.
- [ ] Feature flags defined for beta rollout per team.

## Success Metrics
- ≥70% of managers adopt Performance Review Mode during review cycles.
- Managers report ≥20% time savings preparing for performance conversations.
- Anomaly detection generates ≤5% false positives per sprint.
- AI summary satisfaction (thumbs-up rating) ≥80%.

## Future Enhancements
- Integrate Git provider signals (PR volume, review turnaround).
- Introduce goal-tracking alignment (OKRs/KPIs) per individual.
- Allow peer feedback ingestion with sentiment analysis.
- Enable burnout risk detection via sustained overtime and blocker load.

## Open Questions
- Do we need role-based filtering to hide sensitive metrics from certain managers?
- Should managers be able to edit AI-generated text before exporting?
- Is integration with HR performance systems required for later phases?
