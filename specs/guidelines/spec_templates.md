# Spec Authoring Guidelines

These guidelines define how we structure product and engineering specifications inside the `specs/` tree.

## Spec Hierarchy

Each major capability should be documented across the following tiers (create only what is useful for the feature’s maturity):

1. **Business Spec** – Why we are investing. Audience: leadership & stakeholders. Captures scope, ROI, success metrics, and dependencies.
2. **Product Spec** – How the user experiences the feature. Audience: product, design, and engineering leads. Includes user stories, flows, UX states, analytics, and launch checklist.
3. **Technical Spec** – Architecture and data design. Audience: engineering. Details data models, APIs, integration contracts, error handling, and risks.
4. **Developer Spec** – Implementation playbook. Audience: individual contributors. Breaks work into deliverables, references code modules, and notes feature flags, rollout steps, and observability hooks.
5. **Test Spec** – Quality strategy. Audience: QA/engineers. Defines test cases, automation coverage, edge scenarios, and validation tooling.

Specs should reference shared standards (e.g., theming, accessibility, error handling) instead of duplicating guidance.

## File Placement

```
specs/
  README.md                 # index
  guidelines/
    spec_templates.md       # this document
  shared/                   # reusable standards (theming, error-handling, etc.)
  business/                 # organisation-wide plans
  features/<feature>/       # feature-specific specs (overview, technical, etc.)
  integrations/<system>/    # third-party integrations
```

## Template Outlines

### 1. Business Spec
```
# <Feature> — Business Brief
## Vision
## Goals & Success Metrics
## Target Personas / Segments
## Release Scope & Phasing
## Dependencies & Risks
## Stakeholders & Approvals
```

### 2. Product Spec
```
# <Feature> — Product Spec
## Problem Statement
## User Stories / Jobs To Be Done
## Experience Map & Wireframes
## Feature Breakdown
## Analytics & Telemetry
## Rollout / Launch Checklist
## Open Questions
```

### 3. Technical Spec
```
# <Feature> — Technical Spec
## Architecture Overview
## Data Model & Schema Changes
## API Contracts (GraphQL/REST/Webhooks)
## External Integrations
## Performance & Capacity Considerations
## Security, Privacy, Compliance
## Error Handling (reference shared spec)
## Risks & Mitigations
```

### 4. Developer Spec
```
# <Feature> — Developer Implementation Plan
## Summary
## Work Breakdown Structure (tickets/tasks)
## Code Modules & Ownership
## Feature Flags / Config
## Observability (logs, metrics, dashboards)
## Rollout Steps & Backout Plan
```

### 5. Test Spec
```
# <Feature> — Test Plan
## Scope & Ownership
## Test Environments & Data
## Manual Test Cases
## Automation Coverage
## Regression / Performance Testing
## Sign-off Criteria
## Post-launch Monitoring
```

## Writing Principles
- Keep the overview docs concise; dive deep via linked sub-specs.
- Date-stamp significant revisions and note approvers.
- Use tables or checklists for acceptance criteria.
- Cross-link to shared standards (`../shared/*.md`) instead of duplicating content.
- Prefer Markdown headings over long paragraphs; each section should answer a single question.
