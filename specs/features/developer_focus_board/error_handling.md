# Focus Board Error Handling Specification

## Goals
- Surface backend failures to the UI so users are aware when data is incomplete.
- Capture actionable diagnostics in server logs for observability.
- Prevent partial data from silently masking ingestion issues (e.g., comment/worklog fetch failures).

## Scope
- GraphQL `focusBoard` query pipeline (service/resolver layers).
- Timeline enrichment for comments and worklogs.
- Applies to Prisma data access failures, unexpected null values, and parsing issues encountered while building the board response.

## Requirements
1. **Resilient Timeline:** If the service cannot retrieve panel or timeline activity, log the failure, emit a warning entry (e.g., `COMMENTS_PANEL_UNAVAILABLE`, `WORKLOGS_TIMELINE_UNAVAILABLE`), and continue returning the core board payload so the UI remains usable.
2. **Structured Logging:** Log failures with the `[FocusBoard]` prefix and attach context (`userId`, `projectIds`, and original error).
3. **Consistent Messaging:** Populate the `warnings` array with codes/messages (e.g., `COMMENTS_UNAVAILABLE`). The UI displays these inline banners near the board content.
4. **Safe Defaults:** For future enrichment hiccups, follow the same pattern—log, append a warning, and continue with partial data.
5. **Test Coverage:** Add regression tests around the service layer to assert that simulated Prisma errors bubble up as `GraphQLError` with the expected message/code (TODO).

## Follow-ups
- Adopt the shared guidance in [error_handling_guidelines.md](../../shared/error_handling.md) for UI presentation and future API work.
- Add client-side handling to display error banners or inline warnings when the GraphQL response contains errors.
- Introduce metrics/alerts (e.g., via application monitoring) for `[FocusBoard]` error logs to track frequency.
