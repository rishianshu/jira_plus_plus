import { Button } from "../ui/button";

interface FocusHeaderProps {
  projects: Array<{ id: string; key: string; name: string }>;
  selectedProjectId: string | null;
  startDate: string;
  endDate: string;
  onProjectChange: (projectId: string | null) => void;
  onDateChange: (range: { start: string; end: string }) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function formatDateInput(value: string): string {
  return value ?? "";
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function getYesterday(): string {
  return getDaysAgo(1);
}

export function FocusHeader({
  projects,
  selectedProjectId,
  startDate,
  endDate,
  onProjectChange,
  onDateChange,
  onRefresh,
  isRefreshing,
}: FocusHeaderProps) {
  const today = getToday();
  const yesterday = getYesterday();
  const quickRanges = [
    { id: "today", label: "Today", start: today, end: today },
    { id: "yesterday", label: "Yesterday", start: yesterday, end: yesterday },
    { id: "last7", label: "Last 7 Days", start: getDaysAgo(6), end: today },
    { id: "last30", label: "Last 30 Days", start: getDaysAgo(29), end: today },
  ];

  const activeQuickRange =
    quickRanges.find((range) => range.start === startDate && range.end === endDate)?.id ?? null;

  return (
    <header className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-950/40">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Developer Focus Board
          </h2>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Track progress, blockers, and effort across all your projects. Adjust the date range to explore different reporting windows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col text-sm font-medium text-slate-600 dark:text-slate-300">
            <label className="mb-1">Project</label>
            <select
              value={selectedProjectId ?? ""}
              onChange={(event) => {
                const next = event.target.value;
                onProjectChange(next === "" ? null : next);
              }}
              className="min-w-[220px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} · {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col text-sm font-medium text-slate-600 dark:text-slate-300">
            <label className="mb-1">Start</label>
            <input
              type="date"
              value={formatDateInput(startDate)}
              max={endDate}
              onChange={(event) => {
                const nextStart = event.target.value;
                onDateChange({ start: nextStart, end: endDate });
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
            />
          </div>
          <div className="flex flex-col text-sm font-medium text-slate-600 dark:text-slate-300">
            <label className="mb-1">End</label>
            <input
              type="date"
              value={formatDateInput(endDate)}
              min={startDate}
              onChange={(event) => {
                const nextEnd = event.target.value;
                onDateChange({ start: startDate, end: nextEnd });
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
            />
          </div>
          <div className="flex flex-col text-sm font-medium text-slate-600 dark:text-slate-300">
            <label className="mb-1">Quick Ranges</label>
            <div className="flex flex-wrap gap-2">
              {quickRanges.map((range) => {
                const isActive = range.id === activeQuickRange;
                return (
                  <Button
                    key={range.id}
                    type="button"
                    variant={isActive ? "default" : "secondary"}
                    size="sm"
                    onClick={() =>
                      onDateChange({
                        start: range.start,
                        end: range.end,
                      })
                    }
                    className="min-w-[110px]"
                  >
                    {range.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col text-sm font-medium text-slate-600 dark:text-slate-300">
            <span className="mb-1 invisible">Refresh</span>
            <Button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="min-w-[120px] justify-center"
            >
              <span className="inline-block">{isRefreshing ? "Refreshing…" : "Refresh"}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
