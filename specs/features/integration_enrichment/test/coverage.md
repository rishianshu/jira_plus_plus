# Integration Enrichment — Test Coverage

| Scenario | Tier (UT / LE2E / Live) | Notes |
|----------|-------------------------|-------|
| Jira issue ingestion pipeline handles create/update/delete | UT | Activity/worker unit tests with mocked Jira payloads. |
| Retry logic for Jira API failures with exponential backoff | UT | Use fake timers to assert p-retry usage. |
| Prisma upserts maintain referential integrity | UT | Database integration test (sqlite) for relationships. |
| Temporal workflow orchestrates enrichment sequence | UT + LE2E | Workflow test kit + manual trigger from admin console. |
| Alerting when enrichment queue backlog grows | UT + Live | Unit for monitoring thresholds; smoke ensures metrics endpoint surfaces data. |
