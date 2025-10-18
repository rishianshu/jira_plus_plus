# Jira++ Test Coverage Specification

This document enumerates the behaviours we must protect with automated tests.
Use it whenever you add a feature, fix a bug, or write new specs. Each item
identifies the minimum coverage required across the test tiers defined in
`specs/deployment/ci-cd.md`.

Legend:

- **UT** – unit test (vitest)
- **LE2E** – local end-to-end/browser test (Playwright/Cypress against dev stack)
- **Live** – post-deploy smoke test hitting the UAT endpoint

---

## Cross-Cutting

| Use Case | UT | LE2E | Live | Notes |
|----------|----|------|------|-------|
| Navigation hides secure routes when unauthenticated | ✅ | ✅ | ✅ | Ensure only `Home` is present for anonymous users. |
| Authenticated navigation (standard user) | ✅ | ✅ | ✅ | Tabs include Scrum/Focus/Manager; admin tab absent. |
| Admin navigation shows Admin Console | ✅ | ✅ | ✅ | Requires seeded ADMIN user. |
| Theme toggle persists preference | ✅ | ✅ |   | Exercised in `cypress/e2e/auth.cy.ts`. |
| Login form – success & failure paths | ✅ | ✅ | ✅ | `cypress/e2e/auth.cy.ts` covers success + error flows. |
| Logout clears session & redirects | ✅ | ✅ | ✅ | Validated in `cypress/e2e/auth.cy.ts`. |

## Feature-Specific Coverage

Detailed scenarios live alongside their feature specs:

| Feature | Coverage Doc |
|---------|--------------|
| Daily Scrum Board | [`specs/features/daily_scrum_board/test/coverage.md`](../features/daily_scrum_board/test/coverage.md) |
| Developer Focus Board | [`specs/features/developer_focus_board/test/coverage.md`](../features/developer_focus_board/test/coverage.md) |
| Manager Summary Board | [`specs/features/manager_summary_board/test/coverage.md`](../features/manager_summary_board/test/coverage.md) |
| Performance Review View | [`specs/features/manager_summary_board/performance_review/test/coverage.md`](../features/manager_summary_board/performance_review/test/coverage.md) |
| Admin Console | [`specs/features/admin_console/test/coverage.md`](../features/admin_console/test/coverage.md) |
| Integration Enrichment | [`specs/features/integration_enrichment/test/coverage.md`](../features/integration_enrichment/test/coverage.md) |

Add new entries as additional feature specs are introduced.

---

### Adding New Use Cases

1. Update this matrix with the behaviour, tier expectations, and notes.
2. Link the relevant section from the feature spec (`specs/features/...`).
3. Provide test IDs/selectors to aid LE2E authoring (add to component if missing).

### Reporting

- PR description must list which tiers were executed and link to run output.
- After UAT deployment, append smoke test results to the release notes.
