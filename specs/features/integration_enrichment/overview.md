# Cross-System Integration & Enrichment — Feature Brief

## Purpose
Fuse HR, project, and collaboration signals into a unified work-graph so Jira++ can reason about delivery, people, and outcomes without caring where the data originates. Initial focus: ingest org data from Zoho People (or similar HRMS), map it to Jira++ users/work items, and expose enriched insights (manager hierarchies, contact details, cross-team impact).

## Objectives
- Ingest HRMS data (employees, departments, org hierarchy, contact info) via modular connectors.
- Resolve multiple external identities (Jira accounts, HR employees, other project tools) into a single Jira++ “Person”.
- Enrich work items and dashboards with org-aware metadata (manager, team, schedule, availability).
- Expose APIs/UI so downstream experiences (Scrum Board, Manager Summary, AI narratives) can query the enriched model.
- Ensure integration is pluggable: Zoho People first, but easily extendable to other HRMS or collaboration tools.

## Non-Goals
- Building a full HR system inside Jira++.
- Handling payroll/benefits data; focus on directory + hierarchy only.

## Architecture Outline

### 1. Integration Runtime (Shared)
Leverage the dedicated ingestion runtime (see `integration_runtime` feature brief):
- Implement `ZohoPeopleEndpoint` (HTTP adapter) providing org data resources (employees, teams, reporting chain).
- Schedule incremental syncs via Temporal workflows.
- Store raw artifacts + metadata separate from app services.

### 2. Identity Resolution Service
- Extend Jira++ schema with `Person` entity containing:
  - canonical id (platform user if authenticated) + contact fields (email(s), phone, WhatsApp handle, location).
  - references to external identities (`external_identity`: system, external_id, metadata).
- Matching logic: when ingesting HR data, find existing people by email/Jira account; otherwise create provisional records.
- Support manual merge/split via Admin Console.

### 3. Org Graph & Hierarchies
- Tables `department`, `team`, `manager_relation` map to Persons.
- Computed fields: manager chain, peer list, team size, availability windows (optional).
- Expose GraphQL/REST queries: `orgHierarchy(personId)`, `teamMembers(teamId)`, `managerInsights(teamId)`.

### 4. Work Item Enrichment
- Extend work item model with foreign keys to `Person`, `Team`, `Manager`.
- Enrichment jobs attach HR context to Jira tasks (e.g., owner’s manager, team capacity, contact info).
- AI narratives and dashboards consume enriched fields for better context (“Blocked by Zoe (QA Lead) — escalate to her manager Priya”).

### 5. UI Touchpoints
- **Daily Scrum**: show manager/phone on quick glance; enable calls/messages.
- **Manager Summary**: org-aware filters (by org unit, manager chain); highlight high-risk teams.
- **Admin Console**: integration settings for HRMS, identity merge tooling.

## Milestones
1. Schema & identity resolution design (ERD + migration plan).
2. Zoho People connector (ingestion runtime + Temporal workflow).
3. Identity sync job that produces `Person` + contact profile records.
4. Work item enrichment + API surface (GraphQL additions, queries for dashboards).
5. UI updates in Scrum/Manager boards + Admin console for integration status and manual overrides.
6. Additional connectors (e.g., BambooHR, Slack user directory) once the pattern is proven.

## Risks & Considerations
- **Data privacy:** ensure consent and access controls for contact data; respect Zoho’s API terms.
- **Identity collision:** multiple systems may disagree—need admin tooling to resolve merges.
- **Sync cadence:** HR data changes daily; plan for near-real-time vs. nightly depending on load.
- **Extensibility:** design metadata models so new integrations reuse the same identity + enrichment flow.

## Next Steps
- Finalize schema changes (`Person`, `ExternalIdentity`, `Team`, `ManagerRelation`).
- Draft Zoho connector spec (auth flow, endpoints, fields).
- Prototype identity merge algorithm and admin UI wireframes.
- Define enrichment job contract (input artifacts → updates to Person/WorkItem).
