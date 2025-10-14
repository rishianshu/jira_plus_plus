export function FocusPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Developer Focus Board
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Bring assigned issues, worklogs, and blockers into one actionable view aligned with sprint goals.
        </p>
      </header>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
        TODO: Wire up GraphQL queries for issues, comments, and blockers from the backend.
      </div>
    </section>
  );
}
