# Admin Console — Test Coverage

| Scenario | Tier (UT / LE2E / Live) | Notes |
|----------|-------------------------|-------|
| Admin authentication (login, JWT issuance, logout) | UT + LE2E + Live | Unit for auth service; `cypress/e2e/auth.cy.ts` covers login/logout; live smoke hitting `/admin`. |
| Register Jira site form encrypts token & validates base URL | UT + LE2E | Unit for service; `cypress/e2e/admin-console.cy.ts` verifies modal error + success refetch. |
| Jira project discovery dialog paginates & manual fallback | UT + LE2E | Cypress spec refreshes discovery results and submits manual fallback. |
| Project user roster refresh + track toggles | UT + LE2E + Live | Unit for `fetchJiraProjectUsers`; `cypress/e2e/admin-console.cy.ts` toggles assignable users and asserts tracked counts. |
| Temporal sync controls (start/pause/resume/reschedule) | UT + LE2E | Unit for Temporal client; Cypress manages pause/trigger/reschedule buttons and asserts state changes. |
| Sync logs modal fetches latest entries | UT + LE2E | Telemetry unit + Cypress asserts log list refresh after actions. |
| User provisioning (create/edit, password hashing) | UT + LE2E | Unit ensures bcrypt usage; Cypress covers manual invites and Jira import flow (emails dispatched). |
| Access guards redirect non-admins | LE2E | `cypress/e2e/admin-console.cy.ts` exercises guard redirect. |
