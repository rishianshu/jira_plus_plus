export function ScrumPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Daily Scrum Board
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          AI-powered snapshots of what changed yesterday, what is on deck today, and who is blocked.
        </p>
      </header>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
        Connect the Jira integrator and generator workflows to populate summaries here.
      </div>
    </section>
  );
}
