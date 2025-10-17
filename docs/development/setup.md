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

## Verification Script

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

## Environment Variables

- `apps/web/.env.development` targets the local API (`http://localhost:4000`).
- `.env.example` is the canonical template for new developers.
- Never commit real secrets; use `infra/.env.template` to document runtime
  expectations.

Refer to `specs/deployment/plan.md` and `specs/deployment/ci-cd.md` for the
deployment story and branching conventions.
