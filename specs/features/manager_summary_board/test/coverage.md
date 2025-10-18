# Manager Summary Board — Test Coverage

| Scenario | Tier (UT / LE2E / Live) | Notes |
|----------|-------------------------|-------|
| `managerSummary` resolver aggregates KPIs, blockers, AI summary | UT | Mock Prisma + AI gateway; assert KPI math and narratives. |
| Sprint selector defaults to active sprint and handles empty state | UT + LE2E | `cypress/e2e/manager-summary.cy.ts` covers default active sprint and reselection. |
| KPI cards update when filters change (project, sprint, date) | LE2E | Cypress spec switches sprints and asserts KPI text changes. |
| Blocker table sorting + drill-in drawer | LE2E + Live | Sorting/drawer UI not yet exposed; keep pending until implemented. |
| AI summary regenerate flow handles success/failure | UT + LE2E | Cypress spec exercises refresh + error recovery; mutation-driven regenerate pending backend wiring. |
| Warning banners appear when partial data | UT + LE2E | Cypress spec asserts warning banner on partial data response. |
| Responsive layout (desktop/tablet) | LE2E | Visual regression or screenshot checks. |
