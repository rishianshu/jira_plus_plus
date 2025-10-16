# Manager Summary Board — Developer Implementation Plan

## Summary
Build the manager dashboard iteratively with feature flags to limit exposure while metrics stabilize.

## Work Breakdown
1. **Backend Metrics Service**
   - Add Prisma models (`ManagerSprintMetric`, `ManagerBlocker`).
   - Implement aggregator job triggered post-sync.
   - Expose GraphQL `managerSummary` + `managerBlockers` queries.
2. **Frontend Dashboard**
   - Create page scaffold `/manager` behind feature flag `managerSummaryBoard`.
   - Build KPI cards, blocker table, AI summary panel, trend chart.
   - Wire warnings banner and retry states.
3. **AI Summary Integration**
   - Implement `/api/manager/ai-summary` mutation calling shared AI worker.
   - Cache summaries per sprint; allow manual regeneration.
4. **Observability**
   - Add logger contexts `[ManagerSummary]`.
   - Metrics: fetch latency, cache hits, AI generation success.
5. **Rollout**
   - Stage env verification → internal beta → GA toggle.

## Modules & Ownership
- `apps/api/src/services/managerSummaryService.ts` — backend team.
- `apps/web/src/pages/ManagerPage.tsx` — frontend team.
- `apps/api/src/resolvers.ts` (new query) — shared.

## Feature Flags / Config
- `managerSummaryBoard` (frontend route/components).
- `managerSummaryAI` (AI regenerate button).

## Observability
- New dashboards in Grafana: `manager_summary_kpis`, `manager_summary_errors`.
- Structured logs for aggregator job results.

## Code Reuse & Impact
- Extract shared KPI card styles from the Focus dashboard to avoid duplicate Tailwind tokens.
- Extend existing issue table primitives for blocker table (share sorting/pagination logic).
- Reuse the focus-board warning banner component once generalized.
- Aggregator job can reuse Jira sync repositories; avoid new Jira client wrappers.

## Rollout Steps
- [ ] Land backend metrics aggregator.
- [ ] Gate UI behind flag and release to internal users.
- [ ] Capture feedback & iterate on KPIs.
- [ ] GA toggle + communication to managers.
