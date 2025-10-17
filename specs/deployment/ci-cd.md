# Jira++ CI/CD Operating Guide

UAT is our only live environment today. The goals are to keep a clean
mainline history, land changes with confidence, and automate the deploy
whenever `main` advances.

---

## Branching Workflow

- `main` — holds the current UAT release. Nothing merges here without a PR.
- `develop` — integration branch for the *next* UAT drop.
- Feature work — branch from `develop` using `feature/<summary>` (e.g.
  `feature/jira-pagination`).
- Urgent fixes — branch from `main` using `hotfix/<issue>`, then merge back
  into both `main` and `develop`.

## Pull Requests & Reviews

- Every branch lands via PR into `develop` or `main`.
- Codex runs the code review; PRs must address its findings before merging.
- Update `.env.example`, docs, and migrations as part of the PR.
- Rebase or merge latest `develop` before requesting review to keep history tidy.

## Commit Hygiene

- Prefer small commits with descriptive messages. Follow Conventional
  Commits (`feat:`, `fix:`, `chore:` …) when possible.
- Never commit secrets or local `.env` files. Update templates instead.
- Keep generated artefacts out of the repo (Docker outputs, build folders).

## CI Pipeline (GitHub Actions)

Triggered on all PRs and commits to `develop` / `main`:

1. **Install & Lint**  
   `pnpm install --frozen-lockfile`  
   `pnpm lint` / `pnpm format:check`

2. **Typecheck & Tests**  
   `pnpm --filter @jira-plus-plus/api test`  
   `pnpm --filter @jira-plus-plus/web test` (or Cypress unit suite)

3. **Build Images** (optional for now)  
   `docker build -f Dockerfile.api .`  
   `docker build -f Dockerfile.web .`

The job fails fast on any stage so we never merge broken builds.

### Local Verification & Git Hook

- Run `pnpm verify` before opening a PR. It executes `scripts/verify.sh` which
  installs deps, lints, typechecks, runs tests, and performs local Docker
  builds of the API and web images.
- Shareable git hooks live under `.github/hooks`. Install them via:

  ```bash
  cp .github/hooks/pre-commit.sample .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit
  ```

- Hooks stay local-only, so there’s no risk of leaking secrets; adjust the
  script as your workflow evolves.

## Deployments

- **`develop` → UAT staging**  
  Merge PRs freely after Codex review. Manual deploy via
  `./infra/deploy.sh infra/.env.uat` when you want stakeholders to test.

- **`main` → UAT live**  
  When we’re satisfied with a batch on `develop`, open a PR into `main`.
  On merge, GitHub Actions will:
  - rebuild images
  - push tags (e.g. `uat-YYYYMMDD`)
  - SSH to the Hetzner host and run `./infra/deploy.sh infra/.env.uat`

  The workflow only triggers on `main` merges so releases stay batched.

## Release Cadence

- Target one formal merge into `main` per week (or as needed). Capture release
  notes in the PR description.
- Hotfixes can go directly to `main`, but should be followed immediately by
  merging `main` back into `develop`.

## Rollback Strategy

- Keep the previous image tag (e.g. `uat-prev`).  
- To roll back, SSH to the host and deploy the old tag:
  ```bash
  docker compose pull api:web@uat-prev
  ./infra/deploy.sh infra/.env.uat
  ```
- Database snapshots (nightly `pg_dump`) give us a safety net for data issues.

---

This playbook should be revisited as we add a production environment or expand
the team. For now, it balances hygiene with the realities of a single
maintainer and one deployment tier. Continuous improvement is the goal—let’s
iterate as tooling and needs evolve.
