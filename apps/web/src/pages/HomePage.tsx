import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <div className="space-y-2">
        <h2 className="text-4xl font-semibold tracking-tight">Welcome to Jira++</h2>
        <p className="max-w-2xl text-base text-slate-300">
          Next-gen daily scrum and sprint intelligence. Connect your Jira workspace and unlock AI-driven insights for developers and managers.
        </p>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <Link
          to="/scrum"
          className="rounded-md bg-slate-50 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
        >
          Daily Scrum Board
        </Link>
        <Link
          to="/focus"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500"
        >
          Developer Focus Board
        </Link>
        <Link
          to="/manager"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500"
        >
          Manager Summary Board
        </Link>
      </div>
    </section>
  );
}
