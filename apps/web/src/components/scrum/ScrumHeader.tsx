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
          <label className="flex min-w-[200px] flex-col text-sm font-medium text-slate-600 dark:text-slate-300">
            <span className="mb-1">Project</span>
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
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={handleChange}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            disabled={isRefreshing || !projectId}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </Button>
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
