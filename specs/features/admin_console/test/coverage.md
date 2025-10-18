# Admin Console — Test Coverage

| Scenario | Tier (UT / LE2E / Live) | Notes |
|----------|-------------------------|-------|
| Admin authentication (login, JWT issuance, logout) | UT + LE2E + Live | Unit for auth service; Playwright flow; live smoke hitting `/admin`. |
| Register Jira site form encrypts token & validates base URL | UT + LE2E | Unit for service; browser test verifies success + error states. |
| Jira project discovery dialog paginates & manual fallback | UT + LE2E | Mock Jira responses for pagination error cases. |
| Project user roster refresh + track toggles | UT + LE2E + Live | Unit for `fetchJiraProjectUsers`; Playwright toggles and saves; live smoke ensures API returns >0 users. |
| Temporal sync controls (start/pause/resume/reschedule) | UT + LE2E | Unit for Temporal client; E2E ensures UI buttons make API calls. |
| Sync logs modal fetches latest entries | UT + LE2E | Api unit + UI check. |
| User provisioning (create/edit, password hashing) | UT + LE2E | Unit ensures bcrypt usage; E2E verifies forms and success toast. |
| Access guards redirect non-admins | LE2E | Browser ensures route protected. |
