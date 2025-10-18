# Local Development Setup

## Prerequisites

- Node.js 20.x and PNPM (`corepack enable pnpm`) 
- Docker Engine + Docker Compose 
- PostgreSQL client tools (optional, for manual inspection)

## First Run

```bash
pnpm install
pnpm --filter @jira-plus-plus/api prisma migrate dev
pnpm --filter @jira-plus-plus/api dev
pnpm --filter @jira-plus-plus/web dev
```

For the full stack, start the infrastructure compose file:

```bash
docker compose -f infra/docker-compose.yml up postgres temporal temporal-ui
```

## Test Strategy

- **Unit tests**: `pnpm --filter @jira-plus-plus/* test -- --run` for the package you touch.
- **Local E2E**: `./scripts/run-e2e-local.sh` (invoked automatically by the pre-push hook, wraps `pnpm e2e:run`).
- **Live E2E**: `./scripts/run-e2e-live.sh` after the release hits UAT
  (`https://app.jira-plus-plus.in`).

`pnpm verify` executes `scripts/verify.sh`, which installs deps, lints,
typechecks, runs tests, and builds Docker images. Make it part of your
workflow before pushing changes.

## Git Hooks

Copy the provided sample pre-commit hook:

```bash
cp .github/hooks/pre-commit.sample .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Now every commit runs `pnpm verify` automatically.

To install both the commit and push hooks in one go:

```bash
pnpm hooks
```

The pre-push hook blocks direct commits on `main`, nudging you back to the PR flow.

## Environment Variables

- `apps/web/.env.development` targets the local API (`http://localhost:4000`).
- `.env.example` is the canonical template for new developers.
- Never commit real secrets; use `infra/.env.template` to document runtime
  expectations.

Refer to `specs/deployment/plan.md` and `specs/deployment/ci-cd.md` for the
deployment story and branching conventions.
