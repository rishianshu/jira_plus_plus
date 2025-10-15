


# Jira++ Admin Console (Phase 1)

## 🎯 Objective
Deliver a secure control centre for Jira++ where the admin can manage authentication, connect Jira sites, curate enabled projects, and map Jira accounts to platform users.

---

## 🧩 Outcomes & Scope

1. **Authentication Foundation**
   - Pre-provisioned super-admin configured via environment variables (email/password + display name).
   - JWT-based sessions with stateless API authentication.
   - Admin-managed user provisioning (email, display name, temporary password, role).
   - Password hashing with bcrypt and rotation utilities for the future.

2. **Landing & Access Experience**
   - Marketing-style landing page highlighting Jira++ value props and AI-powered insights.
   - Prominent “Sign in” call to action that reveals / routes to the login panel.
   - Login form with validation, error states, and password visibility toggle.
   - Extensible design tokens and tailwind utilities ready for future theming.

3. **Admin Console MVP**
   - Dashboard modules:
     - **Jira Sites:** register/manage base URL, alias, and API credentials (encrypted at rest).
     - **Projects:** curated list of Jira projects per site with metadata badges.
     - **User Directory:** list platform users, role badges, authentication status (local / Jira SSO placeholder).
     - **Account Mapping:** map Jira account IDs to platform users for downstream analytics.
     - **Project Sync Controls:** inspect Temporal job status, pause/resume/reschedule cron, trigger incremental or full resyncs, and browse recent sync logs.
     - **Project Roster:** fetch assignable Jira users per project, track the subset Jira++ should analyze, and surface those tracked identities in downstream flows.
   - Forms provide optimistic UI feedback with loading and success states.
   - Minimal audit context (timestamps, last updated by) surfaced in UI.

4. **Documentation & Operational Runbook**
   - Updated Prisma schema diagrams and seed instructions.
   - Admin flow diagrams + stepwise checklist for provisioning a new organization.
   - Best-practice callouts (password policies, token rotation, secret storage).

---

## 🎨 UX Guidelines

- Default to a light enterprise theme with soft neutrals, while providing a persistent light/dark mode toggle stored per user.
- Use a persistent command sidebar and sticky top navigation to anchor the console experience.
- Display entity collections (sites, projects, users, mappings) in sortable table layouts with hover states; surface create/edit flows via modal dialogs.
- Reserve detail views for larger forms (Jira site registration, user invites) shown inside modal sheets; limit inline forms to quick filters.
- Provide responsive fallbacks: horizontal nav chips on mobile, stacked cards instead of multi-column layouts.

---

## 🛠️ Architecture & Data Model (Phase 1)

| Entity             | Purpose                                                       | Key Fields |
|--------------------|---------------------------------------------------------------|------------|
| `User`             | Platform identity & auth principal                            | id, email, displayName, role, passwordHash?, createdAt |
| `Credential`       | Stores hashed passwords, future proof for OAuth tokens        | id, userId, type (`LOCAL`), hash |
| `JiraSite`         | Linked Jira instance configuration                            | id, alias, baseUrl, adminEmail, credentialCipher, createdBy |
| `JiraProject`      | Enabled project from a Jira site                              | id, jiraId, key, name, siteId, isActive |
| `UserProjectLink`  | Associates platform user to Jira users/project combination    | id, userId, projectId, jiraAccountId |

> 🔐 **Secrets management**: tokens are encrypted using AES-256-GCM with a key derived from `ENCRYPTION_SECRET`. Rotation strategy documented for later phases.

---

## 🚀 Core User Stories

1. **Admin log in**
   - Given I am the seeded admin, when I open Jira++ I see the landing page with CTA to sign in.
   - When I submit valid credentials, I receive an authenticated session and reach the admin console.

2. **Register Jira site**
   - From admin console I capture alias, base URL, API token, and contact email.
   - System validates URL format, encrypts the token, stores the site, and surfaces success feedback.

3. **Curate projects**
   - After registering a site, admin can manually register/sync projects (auto-sync integration parked for future once outbound network is enabled).
   - Projects display badges showing Jira key, status, and source site.

4. **Provision teammate**
   - Admin creates a platform user with display name, email, and optional temporary password.
   - System hashes the password and sends (future) invitation email; today UI surfaces plaintext instructions for secure sharing.

5. **Map Jira account**
   - Admin selects a platform user and associates one or more Jira account IDs per project.
   - Mappings feed Daily Scrum board and analytics modules.
6. **Discover Jira projects**
   - When the admin opens the “Register Jira project” dialog, Jira++ auto-fetches available Jira projects for the chosen site and pre-fills IDs/keys to minimize manual input.
   - The admin can still fall back to manual entry when needed.
7. **Track project users**
   - Admin launches a Jira user roster per project, refreshes the list from Jira, and toggles which accounts should be tracked.
   - Tracked accounts become selectable when mapping Jira identities to Jira++ workspace users.

---

## 🧱 Future Enhancements (Next Phases)

- Role-based access (admin, manager, analyst, developer) with fine-grained permissions.
- OAuth 2.0 / SAML SSO integration, replacing local passwords.
- Automated Jira project & user discovery with pagination + webhook refresh.
- Activity audit log (who created site, updated creds, etc.).
- Secrets vault integration (AWS Secrets Manager, GCP Secret Manager, etc.).

---

## 📘 References & Best Practices

- Jira REST API docs: [https://developer.atlassian.com/cloud/jira/platform/rest/v3/](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- OWASP Password Storage Cheat Sheet — use bcrypt with cost ≥ 12.
- JWT best practices — short-lived access tokens + future refresh token rotation.

---

## ✅ Acceptance Criteria

- [ ] Admin can authenticate via seeded credentials and receive JWT stored client-side.
- [ ] Admin console surfaces Jira sites, projects, and user directory with live GraphQL data.
- [ ] New Jira sites persist encrypted credentials and display health state.
- [ ] Admin can create platform users and map them to Jira account IDs.
- [ ] Landing page + login panel meet responsive design requirements (desktop + tablet + mobile).
- [ ] Documentation updated with provisioning guide and security considerations.
- [ ] Admins can view sync job state/logs and manage cron/trigger controls per project.
