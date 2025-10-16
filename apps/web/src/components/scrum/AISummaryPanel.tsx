import { RefreshCw, AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "../ui/button";
import type { DailySummaryRecord } from "../../types/scrum";

interface AISummaryPanelProps {
  summary: DailySummaryRecord | null;
  regenerating: boolean;
  onRegenerate: () => void;
}

const STATUS_META = {
  ON_TRACK: {
    label: "On Track",
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  DELAYED: {
    label: "Delayed",
    icon: Clock3,
    className: "text-amber-600 dark:text-amber-400",
  },
  BLOCKED: {
    label: "Blocked",
    icon: AlertCircle,
    className: "text-rose-600 dark:text-rose-400",
  },
} as const;

export function AISummaryPanel({ summary, regenerating, onRegenerate }: AISummaryPanelProps) {
  if (!summary) {
    return (
      <aside className="h-full rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        Select a teammate to review their AI summary.
      </aside>
    );
  }

  const statusMeta = STATUS_META[summary.status];
  const StatusIcon = statusMeta.icon;
  const displayName = summary.user?.displayName ?? summary.trackedUser?.displayName ?? "Unassigned teammate";
  const canRegenerate = Boolean(summary.user?.id);

  return (
    <aside className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-950/50">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            AI Summary
          </p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {displayName}
          </h3>
        </div>
        <Button type="button" onClick={onRegenerate} disabled={regenerating || !canRegenerate}>
          <RefreshCw className={`mr-2 h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "Regenerating" : "Regenerate"}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <StatusIcon className={`h-4 w-4 ${statusMeta.className}`} />
        <span className={`font-medium ${statusMeta.className}`}>{statusMeta.label}</span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-500 dark:text-slate-400">
          Updated {new Date(summary.updatedAt).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {(summary.project?.key ?? "Project").toUpperCase()} · {summary.project?.name ?? "Unknown"}
      </p>
      <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
        <SummarySection title="Yesterday" body={summary.yesterday} />
        <SummarySection title="Today" body={summary.today} />
        <SummarySection title="Blockers" body={summary.blockers} />
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 text-center text-sm">
        <Metric label="Hours" value={`${summary.worklogHours.toFixed(1)}h`} />
        <Metric label="Done" value={summary.issueCounts.done.toString()} />
        <Metric
          label="Pending"
          value={(summary.issueCounts.todo + summary.issueCounts.inProgress).toString()}
        />
        <Metric label="Blockers" value={summary.issueCounts.blocked.toString()} />
      </div>
    </aside>
  );
}

function SummarySection({ title, body }: { title: string; body?: string | null }) {
  return (
    <section className="space-y-1">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </h4>
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {body ?? "—"}
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
