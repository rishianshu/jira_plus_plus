# Specs Home

This directory stores all product, technical, and quality specifications for Jira++.

## Structure

```
specs/
  README.md                 ← this index
  business/                 ← portfolio-level plans (e.g., project_overview.md)
  features/
    <feature>/
      overview.md           ← feature overview / business spec
      technical.md          ← technical spec (optional)
      product.md            ← product spec (optional)
      developer.md          ← implementation plan (optional)
      test.md               ← test plan (optional)
      ...                   ← feature-specific addenda (e.g., error_handling.md)
  integrations/
    ...                     ← specs about external systems
  shared/                   ← reusable standards (theming, error handling, accessibility)
  guidelines/               ← authoring templates & conventions
```

> Use the templates in [`guidelines/spec_templates.md`](./guidelines/spec_templates.md) when creating new documents.

## Shared Standards
- [Error Handling](./shared/error_handling.md)
- (Add theming, accessibility, analytics, etc. here as they are created.)

## Feature Specs
- Developer Focus Board: [`features/developer_focus_board/overview.md`](./features/developer_focus_board/overview.md)
- Manager Summary Board: [`features/manager_summary_board/overview.md`](./features/manager_summary_board/overview.md)
- Daily Scrum Board: [`features/daily_scrum_board/overview.md`](./features/daily_scrum_board/overview.md)
- Admin Console: [`features/admin_console/overview.md`](./features/admin_console/overview.md)

## Integrations
- Jira Integrator: [`integrations/jira/overview.md`](./integrations/jira/overview.md)

## Business Plans
- Project Overview: [`business/project_overview.md`](./business/project_overview.md)

## Adding New Specs
1. Decide which tier(s) you need (business, product, technical, developer, test).
2. Copy the relevant outline from [`guidelines/spec_templates.md`](./guidelines/spec_templates.md).
3. Place the file under the appropriate folder.
4. Link it here (and from any related feature docs).
