# Error Handling & Messaging Guidelines

The following rules apply across Jira++ APIs and UI components to provide a consistent experience when failures occur.

## API Layer
- **Fail Fast:** When a blocking dependency fails (database access, upstream API), throw a `GraphQLError` (or HTTP 5xx for REST) with a human-readable message and `extensions.code`.
- **Contextual Logging:** Log with a stable prefix (e.g., `[FocusBoard]`) and include identifiers (userId, projectId, operation name) plus the original error stack.
- **Redaction:** Never log secrets, tokens, or raw request payloads containing PII.
- **Graceful Degradation:** For optional enrichments, log the error and proceed with partial data while setting `extensions.partial = true` to signal the client.
- **Testing:** Provide service-level tests that simulate downstream failures and assert message/extension codes.

## UI Layer
- **Surface Errors Visibly:** When GraphQL or REST requests return errors, render an inline banner near the affected widget. Include the server message when safe to display.
- **Preserve Previous Data:** Continue to show cached/previous results when available, alongside the error notice.
- **Retry affordance:** Expose a quick retry action when meaningful (e.g., “Retry” button calling `refetch`).
- **Analytics Hooks:** Emit a client-side event (TODO) for centralized error tracking once analytics is available.
- **Accessibility:** Error banners should be reachable via keyboard and announced (e.g., `role="alert"`).

## Shared Utilities (Future Work)
- Centralize error banner styling in a reusable component.
- Provide helper functions for mapping `GraphQLError` / `ApolloError` to user-facing copy.
- Integrate with monitoring/alerting once platform instrumentation is ready.
