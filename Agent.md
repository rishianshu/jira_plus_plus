# Agent Workflow Agreements

To keep Jira++ healthy and avoid breaking builds, we'll hold ourselves to the following loop whenever we touch the codebase:

1. **Edit consciously**
   - Read the spec and existing code before changing anything.
   - Keep diffs focused; note every assumption in commit messages or PR descriptions.

2. **Run quick feedback commands after each logical change**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test     # when tests exist for the area we touched
   ```
   - For small edits, run `pnpm typecheck` immediately after saving.
   - Use `pnpm verify` before handing work off (runs lint, typecheck, and tests together).

3. **Address failures immediately**
   - Fix lint or type errors before moving to another task.
   - If a command can't run (network/offline), document the reason in the PR or handoff.

4. **Document assumptions**
   - Update specs (e.g., `specs/feature_admin_console.md`) whenever we add new behaviour or workflow.
   - Capture infrastructure or workflow changes (like this pattern) in dedicated docs.

5. **Final handoff checklist**
   - `pnpm format` (or ensure the editor auto-formatted).
  - `pnpm verify`
  - Summarise what changed, the commands you ran, and any remaining TODOs.

By codifying this loop we minimize regressions and make collaboration smoother—future edits should follow the same beat: **edit → lint/typecheck/tests → document → handoff**.
