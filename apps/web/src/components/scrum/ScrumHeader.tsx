import { ChangeEvent } from "react";
import clsx from "clsx";
import { RefreshCw } from "lucide-react";

interface ScrumHeaderProps {
  date: string;
  projectId: string | null;
  projects: Array<{ id: string; key: string; name: string }>;
  onDateChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  projectsLoading?: boolean;
  lastUpdated?: string | null;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
}

export function ScrumHeader({
  date,
  projectId,
  projects,
  onDateChange,
  onProjectChange,
  onRefresh,
  isRefreshing,
  projectsLoading = false,
  lastUpdated,
  autoRefresh,
  onAutoRefreshChange,
}: ScrumHeaderProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onDateChange(event.target.value);
  };

  const handleProjectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onProjectChange(event.target.value);
  };

  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-950/40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Daily Scrum Board
          </h2>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            AI-powered snapshots of yesterday&apos;s progress, today&apos;s focus, and blockers across the team.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[220px] flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Project</span>
            <select
              value={projectId ?? ""}
              onChange={handleProjectChange}
              disabled={projectsLoading || projects.length === 0}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
            >
              <option value="" disabled>
                {projectsLoading ? "Loading..." : "Select project"}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} · {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Date</span>
            <input
              type="date"
              value={date}
              onChange={handleChange}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
            />
          </div>
          <RefreshControls
            onRefresh={onRefresh}
            disabled={!projectId}
            isRefreshing={isRefreshing}
            autoRefresh={autoRefresh}
            onAutoRefreshChange={onAutoRefreshChange}
          />
        </div>
      </div>
      {lastUpdated ? (
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Last updated {lastUpdated}
        </p>
      ) : null}
    </header>
  );
}

function RefreshControls({
  onRefresh,
  disabled,
  isRefreshing,
  autoRefresh,
  onAutoRefreshChange,
}: {
  onRefresh: () => void;
  disabled: boolean;
  isRefreshing: boolean;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={onRefresh}
        disabled={disabled || isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing ? "Refreshing" : "Refresh"}
      </button>
      <span className="h-full w-px bg-slate-200 dark:bg-slate-700" aria-hidden />
      <button
        type="button"
        className={clsx(
          "px-3 py-2 text-xs font-semibold uppercase tracking-wide transition",
          autoRefresh
            ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        )}
        onClick={() => onAutoRefreshChange(!autoRefresh)}
        aria-pressed={autoRefresh}
      >
        {autoRefresh ? "Auto On" : "Auto Off"}
      </button>
    </div>
  );
}
