import { ChangeEvent } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

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
  onExport: (target: "PDF" | "SLACK") => void;
  exporting?: boolean;
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
  onExport,
  exporting = false,
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
          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            disabled={isRefreshing || !projectId}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </Button>
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 transition dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              checked={autoRefresh}
              onChange={(event) => onAutoRefreshChange(event.target.checked)}
            />
            Auto-refresh
          </label>
          <div className="relative">
            <ExportMenu onExport={onExport} disabled={!projectId} busy={exporting} />
          </div>
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

function ExportMenu({
  onExport,
  disabled,
  busy,
}: {
  onExport: (target: "PDF" | "SLACK") => void;
  disabled: boolean;
  busy?: boolean;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <button
        type="button"
        className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800"
        disabled={disabled || busy}
        onClick={() => onExport("PDF")}
      >
        Export PDF
      </button>
      <span className="h-full w-px bg-slate-200 dark:bg-slate-700" aria-hidden />
      <button
        type="button"
        className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800"
        disabled={disabled || busy}
        onClick={() => onExport("SLACK")}
      >
        Send Slack
      </button>
    </div>
  );
}
