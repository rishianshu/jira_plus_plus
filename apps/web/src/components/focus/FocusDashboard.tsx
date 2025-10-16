import type { FocusDashboardMetrics } from "../../types/focus";

interface FocusDashboardProps {
  metrics: FocusDashboardMetrics;
}

const METRIC_TILES: Array<{
  key: keyof FocusDashboardMetrics;
  label: string;
  format?: (value: number) => string;
}> = [
  { key: "totalIssues", label: "Total Issues" },
  { key: "inProgressIssues", label: "In Progress" },
  { key: "blockerIssues", label: "Blockers" },
  {
    key: "hoursLogged",
    label: "Hours Logged",
    format: (value) => `${value.toFixed(1)}h`,
  },
  {
    key: "averageHoursPerDay",
    label: "Avg Hours / Day",
    format: (value) => `${value.toFixed(1)}h`,
  },
];

export function FocusDashboard({ metrics }: FocusDashboardProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {METRIC_TILES.map((tile) => {
        const value = metrics[tile.key];
        const display = tile.format ? tile.format(value) : String(value);
        return (
          <article
            key={tile.key}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-950/50"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {tile.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{display}</p>
          </article>
        );
      })}
    </section>
  );
}
