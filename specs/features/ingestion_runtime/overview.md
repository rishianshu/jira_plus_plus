# Integration Runtime — Feature Brief

## Purpose
Create a standalone ingestion service that abstracts external systems (Jira, HRMS, etc.) behind a consistent HTTP endpoint contract. The runtime ingests data, captures metadata, and surfaces APIs that application teams (e.g., Jira++) can consume without binding to a specific vendor.

## Goals
- Standardise ingestion across HTTP-based systems using configurable endpoints.
- Register API resources and metadata so agents or orchestrators can pick relevant integrations automatically.
- Orchestrate ingestion runs via Temporal (or equivalent) while keeping tools like Spark optional plug-ins.
- Publish REST/CLI interfaces for configuring endpoints, triggering jobs, and monitoring status.

## Non-Goals
- Replacing existing ingestion flows inside Jira++ today.
- Extending beyond HTTP integrations in the first iteration (e.g., direct DB connectors are handled separately).

## Proposed Architecture
1. **Endpoint Abstractions**
   - `HttpEndpoint` base class for auth, retries, pagination, rate limits.
   - Domain-specific subclasses (e.g., `JiraEndpoint`, `ZohoPeopleEndpoint`) registering resources, schemas, and transforms.
   - Metadata registry mapping endpoint name → resource definitions (method, path, payload schema, sample response).

2. **Ingestion Orchestrator**
   - Temporal workflows manage schedules, dependency chains, and retries.
   - Activities call endpoint adapters, write raw payloads, and emit events.
   - Supports incremental checkpoints (watermarks, cursors) stored in the runtime state database.

3. **Storage & Metadata**
   - Normalised tables (`source_system`, `endpoint`, `resource`, `ingestion_run`, `artifact`) separate from any consumer app.
   - Artifact storage pluggable (object store, data lake).

4. **Access & Control Plane**
   - REST API:
     - `POST /endpoints` to register/update an integration.
     - `POST /runs` to trigger ingestions.
     - `GET /runs/:id` for status & metrics.
   - CLI mirroring API for local testing.
   - Event bus hooks (e.g., webhooks, Slack, email) for success/failure notifications.

5. **Consumer Integration (e.g., Jira++)**
   - Jira++ calls runtime APIs to fetch artefacts or subscribe to run events.
   - Internal mapping layer ingests runtime outputs into platform-native models.

## Implementation Notes
- Start from `spark-ingestion` patterns: reuse endpoint contracts, metadata registration, and planner modules.
- Factor execution toolsets (Spark, Pandas, etc.) as plugins implementing a shared `ExecutionTool` interface.
- Containerise the runtime for deployment; ship a Helm chart with Temporal + runtime service components.
- Provide SDK stubs (Python initially) to make authoring new endpoints straightforward.

## Milestones
1. Repository scaffold with core endpoint base classes and Temporal workflow skeleton.
2. Jira REST adapter (read-only) producing normalised artefacts.
3. REST API + CLI for endpoint registration and manual run triggers.
4. MVP deployment (e.g., Docker Compose) with sample config and docs.
5. Extension hooks: notifications, incremental cursors, auth secrets management.

## Open Questions
- Should credentials be managed by the runtime or an external secrets manager (e.g., Vault)?
- Do we support GraphQL/webhook sources in the first version?
- How do we version endpoints and migrations when external APIs evolve?

## Next Steps
- Finalise data model & config schema.
- Draft Temporal workflow diagrams (standard vs incremental pulls).
- Prototype Jira endpoint to validate HTTP abstraction.
