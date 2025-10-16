# Manager Summary Board — Business Spec

## Vision
Empower managers with a unified dashboard that highlights sprint health, blockers, and team performance, reducing time spent hunting through Jira boards.

## Goals & Metrics
- Increase blocker resolution speed by 20%.
- Provide sprint completion forecasts accurate to ±5%.
- Achieve 60% adoption among engineering managers within one quarter.

## Release Scope & Phasing
- **MVP (Q1):** Sprint KPIs, blocker list, AI summary card.
- **Phase 2 (Q2):** Blocker intelligence visualization, trend charts.
- **Phase 3 (Q3):** Forecasting, risk scoring, exports.

## Target Personas (Business Lens)
- **Engineering Manager:** accountable for sprint delivery and team throughput.
- **Product Manager:** responsible for roadmap confidence and stakeholder updates.
- **Lead Developer:** operational lead balancing workload, removing blockers for their squad.

## Dependencies
- Jira integrator (issues, sprints, worklogs, comments sync).
- AI summarization worker.
- Shared error handling guidelines.

## Risks
- Data freshness if Jira sync lags.
- KPI alignment with leadership expectations.
- AI summary accuracy and trust.
