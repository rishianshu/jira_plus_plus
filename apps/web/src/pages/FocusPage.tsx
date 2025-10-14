export function FocusPage() {
  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-3xl font-semibold">Developer Focus Board</h2>
        <p className="text-slate-300">
          Bring assigned issues, worklogs, and blockers into one actionable view aligned with sprint goals.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
        TODO: Wire up GraphQL queries for issues, comments, and blockers from the backend.
      </div>
    </section>
  );
}
