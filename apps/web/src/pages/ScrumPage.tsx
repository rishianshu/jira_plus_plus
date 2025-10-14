export function ScrumPage() {
  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-3xl font-semibold">Daily Scrum Board</h2>
        <p className="text-slate-300">
          AI-powered snapshots of what changed yesterday, what is on deck today, and who is blocked.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
        Connect the Jira integrator and generator workflows to populate summaries here.
      </div>
    </section>
  );
}
