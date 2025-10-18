# Performance Review View — Test Coverage

| Scenario | Tier (UT / LE2E / Live) | Notes |
|----------|-------------------------|-------|
| Metrics API (`/performance/metrics`) returns aggregates | UT | Mock services to assert calculations + Prisma usage. |
| User/project dropdowns load data and persist selection | UT + LE2E | `cypress/e2e/performance-review.cy.ts` covers default selection after GraphQL hydration. |
| Notes editor loads draft, autosaves, and displays toast | LE2E | Cypress spec loads existing notes and saves updates; toast still TBD in UI. |
| Comparison chart toggles (period vs previous) | LE2E | Cypress spec triggers comparison refresh; toggles pending future UX. |
| Access control (non-admin/manager denied) | LE2E + Live | Attempt to visit route without permission. |
| API error surfaces inline message with retry | UT + LE2E | Cypress spec forces metrics 503, uses Refresh to recover. |
