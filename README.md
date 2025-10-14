# Jira++ Monorepo

Bootstrapped development workspace for the Jira++ platform described in `specs/`. The environment ships with a TypeScript-first GraphQL API, a React + Vite dashboard, Prisma schema, and tooling to integrate Jira data through future iterations.

## Requirements
- Node.js 20+
- pnpm 8+
- Docker (for Postgres)

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
5. **Run development servers**
   ```bash
   pnpm dev
   ```
   - API available on `http://localhost:4000/graphql`
   - Web app available on `http://localhost:3000`

## Tooling
- **Linting** – `pnpm lint`
- **Formatting** – `pnpm format`
- **Testing** – `pnpm test`

## Next Steps
- Flesh out GraphQL schema & resolvers per feature specs.
- Implement Jira REST client, syncing into Prisma models.
- Build dashboard views using `@apollo/client` queries, React Router layouts, and shadcn-inspired components.
