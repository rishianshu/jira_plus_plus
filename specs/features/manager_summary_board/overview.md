# Manager Summary Board — Business Overview

This is the top-level business spec; detailed docs live in sub-folders:

- Product UX: [`product/overview.md`](./product/overview.md)
- Technical Architecture: [`technical/overview.md`](./technical/overview.md)
- Developer Implementation: [`developer/overview.md`](./developer/overview.md)
- Test Plan: [`test/overview.md`](./test/overview.md)
- Additional sub-features can add their own files (e.g., `product/blocker_insights.md`).

## Purpose
Provide a comprehensive view for managers showing team progress, blockers, sprint completion rate, and user engagement, all driven by Jira data and AI-generated summaries.

## Objectives
- Summarize project health at sprint or release level.
- Identify blockers per user and team.
- Track daily progress across stories and epics.
- Enable quick drill-down into team or user activity.

## Success Metrics
- Managers identify top blockers within 2 clicks.
- Sprint completion forecasts accurate to ±5%.
- AI summary viewed in ≥60% of manager sessions.

## Personas
- **Engineering Manager:** needs sprint-level status and blocker visibility.
- **Product Manager:** tracks roadmap confidence and release readiness.
- **Lead Developer:** triages blockers and reallocates work rapidly.

## Scope & Phasing
- **Phase 1 (MVP):** Sprint health KPIs, blocker table, AI summary card.
- **Phase 2:** Blocker intelligence (clustering, dependency graph), historical trends.
- **Phase 3:** Forecasting, risk scoring, comparative exports.

## Dependencies
- Jira integrator for issues, comments, worklogs, sprint metadata.
- Shared error handling guidelines: [`../../shared/error_handling.md`](../../shared/error_handling.md).
- Spec templates/process: [`../../guidelines/spec_templates.md`](../../guidelines/spec_templates.md).

## Acceptance Criteria (Business)
- [ ] Aggregated summary available for every active sprint/team.
- [ ] Blocker list updates within one sync cycle.
- [ ] AI summary generated on demand with acceptable latency (<3s).
- [ ] Dashboard usable on desktop and tablet breakpoints.

## Future Enhancements
- User-level trend analytics and benchmarking.
- Velocity prediction with proactive alerts.
- “What changed since yesterday” summary chips.
- Export artifacts for leadership/HR reviews.
