# Agent Workflow Agreements

To keep Jira++ healthy and avoid breaking builds, we'll hold ourselves to the following loop whenever we touch the codebase:

1. **Share the plan first**
   - Before coding, outline the implementation steps you intend to take and get confirmation.

2. **Edit consciously**
   - Read the spec and existing code before changing anything.
   - Keep diffs focused; note every assumption in commit messages or PR descriptions.

3. **Treat tests as first-class**
   - Every feature or spec change must ship with appropriate automated tests.
   - Update the feature-specific coverage doc under `specs/features/*/test/coverage.md` with the new scenarios.
   - Before coding, decide which tiers need coverage:
     1. **Unit Tests** – cheap, code-level (`pnpm --filter … test`).
     2. **Local E2E** – browser + API using Playwright/Cypress against `pnpm dev` stack.
     3. **Live E2E** – smoke tests hitting the deployed UAT URL post-deploy.
   - Record the chosen coverage in the PR description and the relevant spec.

4. **Run quick feedback commands after each logical change**
```bash
pnpm lint
pnpm typecheck
pnpm test     # when tests exist for the area we touched
```
   - For small edits, run `pnpm typecheck` immediately after saving.
   - Use `pnpm verify` before handing work off (runs lint, typecheck, and tests together).

4. **Address failures immediately**
   - Fix lint or type errors before moving to another task.
   - If a command can't run (network/offline), document the reason in the PR or handoff.

5. **Document assumptions**
   - Update specs (e.g., `specs/feature_admin_console.md`) whenever we add new behaviour or workflow.
   - Ensure every shipped feature has its spec (`specs/feature_*.md`) refreshed with behaviour, data flow, and control surfaces.
   - Capture infrastructure or workflow changes (like this pattern) in dedicated docs.

6. **Final handoff checklist**
   - `pnpm format` (or ensure the editor auto-formatted).
   - `pnpm verify`
   - Run the local E2E suite when the story touches cross-cutting UX flows.
   - Summarise what changed, the commands/tests you ran (unit + E2E), and any remaining TODOs.
   - After deploy, kick off the live smoke tests and capture results in the PR or release notes.

By codifying this loop we minimize regressions and make collaboration smoother—future edits should follow the same beat: **edit → lint/typecheck/tests → document → handoff**.
