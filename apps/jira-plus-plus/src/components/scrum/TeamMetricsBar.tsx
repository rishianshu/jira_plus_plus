import { Flame, PauseCircle, CheckCircle2, AlertTriangle, Clock, Sparkles } from "lucide-react";
import clsx from "clsx";

interface TeamMetricsBarProps {
  hoursLogged: number;
  pending: number;
  blocked: number;
  done: number;
  backlog: number;
  focusHeadline?: string | null;
}

const METRIC_DEFINITIONS = [
  {
    id: "hours",
    label: "Hours Logged",
    icon: Clock,
    color: "text-sky-600",
    formatter: (value: number) => `${value.toFixed(1)}h`,
  },
  {
    id: "pending",
    label: "Pending",
    icon: Flame,
    color: "text-amber-600",
    formatter: (value: number) => value.toString(),
  },
  {
    id: "blocked",
    label: "Blocked",
    icon: AlertTriangle,
    color: "text-rose-600",
    formatter: (value: number) => value.toString(),
  },
  {
    id: "done",
    label: "Done",
    icon: CheckCircle2,
    color: "text-emerald-600",
    formatter: (value: number) => value.toString(),
  },
  {
    id: "backlog",
    label: "Backlog",
    icon: PauseCircle,
    color: "text-slate-500",
    formatter: (value: number) => value.toString(),
  },
] as const;

export function TeamMetricsBar({
  hoursLogged,
  pending,
  blocked,
  done,
  backlog,
  focusHeadline,
}: TeamMetricsBarProps) {
  const values: Record<(typeof METRIC_DEFINITIONS)[number]["id"], number> = {
    hours: hoursLogged,
    pending,
    blocked,
    done,
    backlog,
  };

  return (
    <aside className="sticky top-[88px] z-30 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-sm shadow-slate-200/50 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-slate-950/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5" />
            Team pulse
          </span>
          {focusHeadline ? (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{focusHeadline}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
          {METRIC_DEFINITIONS.map((metric) => {
            const Icon = metric.icon;
            return (
              <span key={metric.id} className="inline-flex items-center gap-1">
                <Icon className={clsx("h-4 w-4", metric.color)} />
                <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {metric.label}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {metric.formatter(Math.max(0, values[metric.id]))}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
