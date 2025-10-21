# Monorepo Layout Migration — Sprint 1 (Point-1 Only)

**Objective:** Introduce a pnpm workspaces skeleton and move the current app under `/apps/jira-plus-plus` without changing runtime behavior.

**Branch:** `feat/monorepo-s1-layout`

---

## Step 1 — Workspace scaffold (no file moves)

**Changes**

1. Create `pnpm-workspace.yaml` at repo root:

   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
   ```

2. Update root `package.json`:

   ```json
   {
     "private": true,
     "name": "jira-plus-plus-monorepo",
     "workspaces": ["apps/*", "packages/*"],
     "scripts": {
       "bootstrap": "pnpm -r install && pnpm -r build",
       "dev": "pnpm -r --parallel dev || echo 'no dev scripts yet'",
       "build": "pnpm -r build || echo 'no build scripts yet'",
       "lint": "pnpm -r lint || echo 'no lint scripts yet'"
     },
     "packageManager": "pnpm@9"
   }
   ```

3. Scaffold directories:

   ```
   mkdir -p apps packages infra
   touch apps/.gitkeep packages/.gitkeep infra/.gitkeep
   ```

**Acceptance Criteria**

- `pnpm install` succeeds.
- Existing dev/build commands behave as before.

**Commit message:** `chore(monorepo): add pnpm workspace scaffold (apps/, packages/, infra/)`

---

## Step 2 — App shell & proxy wiring (no file moves)

**Changes**

1. Create `/apps/jira-plus-plus/package.json` with proxy scripts.
2. Add proxy runners in `/scripts` (`dev-proxy.cjs`, `build-proxy.cjs`, `lint-proxy.cjs`, `test-proxy.cjs`).
3. Add matching root scripts (`dev-root`, `build-root`, etc.) and wire root scripts to the app workspace.

**Acceptance Criteria**

- `pnpm dev` continues to run the app.
- `pnpm -C apps/jira-plus-plus dev` works.

**Commit message:** `chore(monorepo): add jira-plus-plus app shell with proxy scripts`

---

## Step 3 — Shared base configs

**Changes**

1. Add `tsconfig.base.json`.
2. (Optional) add `.eslintrc.base.json` and `.prettierrc.json`.

**Acceptance Criteria**

- `pnpm build` / `pnpm lint` continue to succeed.

**Commit message:** `chore(monorepo): add shared tsconfig/eslint/prettier base configs`

---

## Step 4 — Move app into `/apps/jira-plus-plus`

**Changes**

1. Move existing app sources under `/apps/jira-plus-plus`.
2. Add `tsconfig.json` inside the app referencing the base config.
3. Replace proxy scripts with real app scripts (Next dev/build/start, lint, test).

**Acceptance Criteria**

- `pnpm dev` serves UI unchanged.
- `pnpm build && pnpm start` succeed.

**Commit message:** `refactor(monorepo): move app into /apps/jira-plus-plus and wire scripts`

---

## Step 5 — Shared package placeholders

**Changes**

1. Create packages: `clients`, `envelopes`, `tools`, `policies`.
2. Each has `package.json` and `index.js` exporting nothing.

**Acceptance Criteria**

- `pnpm -r build` / `pnpm -r dev` succeed.

**Commit message:** `chore(monorepo): add placeholder shared packages (clients/envelopes/tools/policies)`

---

## Step 6 — CI workspace updates

**Changes**

1. Update GitHub Actions (or other CI) to use pnpm and workspace commands.

**Acceptance Criteria**

- CI jobs run `pnpm install`, `pnpm -r lint`, `pnpm -r build`, `pnpm -r test`.

**Commit message:** `ci(monorepo): switch CI to pnpm workspace commands`

---

## Step 7 — README updates

**Changes**

1. Document workspace commands (`pnpm install`, `pnpm dev`, etc.).

**Acceptance Criteria**

- Fresh clone instructions remain accurate.

**Commit message:** `docs(monorepo): update README with workspace commands`

---

## Rollback plan

- Each step is shipped in an isolated PR. Revert the PR to undo it.
- If the app move (Step 4) causes issues, revert and retry in smaller chunks (configs first, then code).

---

## Notes

- Run tests (`pnpm test`) after each step.
- Keep app behavior identical until follow-up stories explicitly change functionality.
