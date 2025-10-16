# Manager Summary Board — Test Plan

## Scope & Ownership
- QA Lead: TBA
- Engineers: responsible for unit/integration tests across services/UI.

## Environments & Data
- Stage seeded with two projects, three teams, synthetic sprints.
- Jira sandbox with representative blockers, completed/active stories.

## Manual Test Matrix
| Area | Cases |
|------|-------|
| Sprint Selector | Default to active sprint, cross-project switching, empty state |
| KPI Cards | Plan vs done accuracy, velocity units, risk badge thresholds |
| Blocker Table | Sort, filter, drill-in drawer |
| AI Summary | Generate, regenerate, handling failure, cache reuse |
| Warning Banners | Display on partial data, dismiss behaviour |
| Responsive Layout | Desktop, tablet |

## Automation Coverage
- API contract tests for `managerSummary` and `managerBlockers`.
- UI regression tests (Playwright) for KPI cards + blockers table.
- Aggregator job unit tests covering KPI formulas.

## Regression / Performance
- Load test GraphQL query at 50 req/s (<500ms avg).
- Verify Redis cache effectiveness.

## Sign-off Criteria
- All P0/P1 cases pass in stage.
- Automation green for two consecutive runs.
- No Sev1/Sev2 bugs open.

## Post-launch Monitoring
- Track warnings emitted per request.
- Monitor AI generation latency spikes.
- Review telemetry dashboards weekly with PM.
