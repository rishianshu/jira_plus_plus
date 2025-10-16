# Manager Summary Board — Product Spec

**Purpose of this doc:** Translate the business goals into a concrete user experience so design, QA, and engineering share the same mental model before implementation. The technical and developer specs explain *how* we build it; this document focuses on *what the user needs and how it behaves*.

## Problem Statement
Managers spend too long stitching together sprint status from Jira boards, reports, and stand-up notes. They need a single dashboard that surfaces health, blockers, and risks with minimal clicks.

## Personas (Product View)
- **Engineering Manager (EM):** responsible for unblocking teams and reporting progress. Measures success via sprint completion and blocker removal.
- **Product Manager (PM):** monitors release readiness and scope confidence. Needs quick signals when scope slips.
- **Lead Developer (LD):** triages blockers affecting their squad. Uses the board to reassign work or escalate.

> The business spec introduces these personas at a high level; here we capture their day-to-day goals and the core journeys the UI must support.

## Key User Stories
1. **EM views sprint health:** “As an engineering manager, I want to see plan vs done and velocity so I can gauge if the sprint is on track.”
2. **PM spotlights blockers:** “As a product manager, I want a ranked list of blockers so I can coordinate cross-team help.”
3. **LD drills into an issue:** “As a lead developer, I want to click into a blocker and see its metadata without leaving the dashboard.”
4. **EM consumes AI summary:** “As an engineering manager, I want an AI-generated recap so I can brief leadership quickly.”

## Experience Map
1. Select project/sprint (defaults to the active sprint).
2. Review KPI cards (plan vs done, velocity, active blockers, risk badge).
3. Scan the blocker table; open drill-in drawer as needed.
4. Read the AI summary for narrative context.
5. Trigger export/share if stakeholders need a snapshot.

## UI Specification (React + shadcn/ui)
**Page:** `/manager`

**Sections**
1. **Header:** Project + sprint selector with quick ranges.
2. **Team Summary:** KPI cards (plan vs done, velocity, active blockers, risk badge).
3. **Blocker Section:** Table by owner, age, severity with drill-in drawer.
4. **AI Summary Panel:** Narrative paragraph with regenerate button.
5. **Charts:** Velocity/completion trend line (Phase 2).

**Components**
- `ManagerHeader.tsx`
- `SummaryCard.tsx`
- `BlockerTable.tsx`
- `AISummary.tsx`
- `VelocityChart.tsx` (Phase 2)

## Feature Breakdown
| Feature | Description | Priority |
|---------|-------------|----------|
| Sprint Selector | Project + sprint dropdown with quick filters | P0 |
| KPI Cards | Plan vs done, velocity, active blockers, risk | P0 |
| Blocker Table | Sortable table by owner, age, priority | P0 |
| AI Summary Panel | Generated narrative with regenerate button | P0 |
| Trend Chart | Velocity or completion trend | P1 |
| Blocker Clustering | Group blockers by dependency/label | P2 |

## UX States
- Loading skeletons for KPI cards and tables.
- Empty state when sprint has no data (prompt re-sync).
- Warning banner when data is partial (hooked to warnings array).
- Error state with retry when GraphQL request fails.

## Interaction Rules
- Sprint selector persists the last-used value per user.
- KPI cards update instantly on filter change (defer to cached data to avoid flashes).
- Blocker table supports sorting by severity (default), age, owner.
- AI summary “Regenerate” shows optimistic toast + busy state; disable until response returns.

## Acceptance Criteria
- Aggregated summary computed and displayed for each sprint/team.
- Blocker list updates within one sync cycle; supports sort/filter.
- AI summary regenerates with <3s latency and displays regeneration status.
- Velocity trend shows accurate points when enabled.
- Responsive layout renders correctly on desktop and tablet.

## Analytics & Telemetry
- Track views per session, regenerate clicks, export usage, navigation events.
- Capture warnings surfaced (comments/worklogs missing) for monitoring.

## Launch Checklist
- [ ] UX copy reviewed by PM/Design.
- [ ] Analytics events vetted.
- [ ] Documentation updated (help center entry).
- [ ] Feature flag plan defined.

## Open Questions
- Should we provide per-team vs per-squad segmentation?
- Do we require integration with company OKR dashboards?

## Relationship to Other Specs
- **Business overview** defines scope & phasing: [`../overview.md`](../overview.md)
- **Technical spec** describes models/APIs powering these views: [`../technical/overview.md`](../technical/overview.md)
- **Developer plan** enumerates tasks and ownership for delivery: [`../developer/overview.md`](../developer/overview.md)
