# Developer Focus Board — Test Coverage

| Scenario | Tier (UT / LE2E / Live) | Notes |
|----------|-------------------------|-------|
| GraphQL `focusBoard` query aggregates metrics per developer | UT | Mock Prisma + ensure expected structure. |
| Filters (project multi-select, date range) influence results | UT + LE2E | `cypress/e2e/developer-focus.cy.ts` switches project filter and asserts metric updates. |
| Card drill-in displays issue timeline | LE2E | Cypress spec expands issue card and verifies timeline/events render. |
| Error banner when API call fails | UT + LE2E | Cypress spec forces GraphQL error, clicks retry, and confirms recovery. |
| Performance view toggles (velocity, blockers, throughput) | LE2E | UI toggles not present in current build; keep scenario flagged until component ships. |
| Unauthorized access redirects to `/` | LE2E + Live | Confirm guard matches navigation rules. |
| Auto-refresh respects toggle | UT | Timer logic similar to Scrum board; optional LE2E smoke. |
