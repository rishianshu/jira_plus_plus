# Daily Scrum Board – Test Coverage

| Scenario | Tier (UT / LE2E / Live) | Notes |
|----------|-------------------------|-------|
| Query `dailySummaries` returns summaries for given date | UT | Mock Prisma + ensure DTO matches schema |
| Resolver rejects unauthenticated access | UT | GraphQL context guard |
| Auto-select first project and summary | LE2E | Covered by `cypress/e2e/daily-scrum.cy.ts` (auto-select & focus mode). |
| Auto-refresh timer refetches data | UT + LE2E | UT for hook logic; Cypress test toggles auto-refresh and asserts refetch. |
| Inline “Regenerate summary” mutation updates card | LE2E | `cypress/e2e/daily-scrum.cy.ts` regenerates summary and asserts toast/content. |
| Export summaries to PDF triggers download | LE2E + Live | UI control still stubbed – local coverage pending once export action is wired. |
| Blocker detection highlights cards | UT + LE2E | Cypress test verifies blocked badge rendering; unit test tracks detection logic. |
| Unauthorized user redirected to `/` | LE2E + Live | Ensure nav guard works |
