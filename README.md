# Jira++ Monorepo

Bootstrapped development workspace for the Jira++ platform described in `specs/`. The environment ships with a TypeScript-first GraphQL API, a React + Vite dashboard, Prisma schema, and tooling to integrate Jira data through future iterations.

## Requirements
- Node.js 20+
- pnpm 8+
- Docker (for Postgres)
- Temporal server 1.20+ (e.g. [temporalite](https://github.com/temporalio/temporalite) for local dev)

## Project Structure
- `apps/api` – Apollo GraphQL server (Node.js + Prisma)
- `apps/web` – React 18 dashboard powered by Vite, React Router, Tailwind, and shadcn-style UI helpers
- `specs/` – Product and feature specifications
- `docker-compose.yml` – Local Postgres service

## Getting Started
1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Copy environment variables**
   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
3. **Start Postgres**
   ```bash
   docker compose up -d postgres
   ```
4. **Prisma setup**
   ```bash
   pnpm --filter @jira-plus-plus/api prisma generate
   pnpm --filter @jira-plus-plus/api prisma migrate dev --name init
   ```
5. **Start the Temporal worker** (in a separate terminal)
   ```bash
   pnpm --filter @jira-plus-plus/api temporal:worker
   ```
   Ensure your Temporal server is running (`temporalite start --ephemeral` works great locally).

6. **Run development servers**
   ```bash
   pnpm dev
   ```
   - API available on `http://localhost:4000/graphql`
   - Web app available on `http://localhost:3000`
   - Admin console reachable at `http://localhost:3000/admin`
     - Use `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (update to secure values before booting)

### Additional Notes

- See [docs/development/setup.md](docs/development/setup.md) for environment details,
  verification scripts, and Git hooks.

## Tooling
- **Linting** – `pnpm lint`
- **Type checking** – `pnpm typecheck`
- **Formatting** – `pnpm format`
- **Testing** – `pnpm test`
- **Full verification** – `pnpm verify`

## Next Steps
- Flesh out GraphQL schema & resolvers per feature specs.
- Implement Jira REST client, syncing into Prisma models.
- Build dashboard views using `@apollo/client` queries, React Router layouts, and shadcn-inspired components.
- Flesh out Jira site polling & health checks, token rotation, and audit logging in the admin console.
- Enhance ingest metrics (throughput/error rates) surfaced in the admin console.
- Persist theme preferences per user profile and add accessibility audits for the admin console design system.
