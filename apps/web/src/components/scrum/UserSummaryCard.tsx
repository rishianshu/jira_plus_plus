import { useMemo, useState, MouseEvent, type ComponentType } from "react";
import clsx from "clsx";
import {
  AlertCircle,
  ChevronDown,
  MessageSquareText,
  UserPlus,
  Shuffle,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../ui/button";
import type { DailySummaryRecord, DailySummaryWorkItem } from "../../types/scrum";

export type InlineActionType = "comment" | "reassign" | "status";

export interface InlineActionPayload {
  type: InlineActionType;
  summary: DailySummaryRecord;
  item: DailySummaryWorkItem;
}

interface UserSummaryCardProps {
  summary: DailySummaryRecord;
  expanded: boolean;
  onToggle: () => void;
  onAction: (payload: InlineActionPayload) => void;
}

const STATUS_UI = {
  ON_TRACK: {
    label: "On Track",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
    icon: CheckCircle2,
    border: "border-emerald-200 dark:border-emerald-800",
  },
  DELAYED: {
    label: "Delayed",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
    icon: Clock3,
    border: "border-amber-200 dark:border-amber-800",
  },
  BLOCKED: {
    label: "Blocked",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
    icon: AlertCircle,
    border: "border-rose-200 dark:border-rose-800",
  },
} as const;

const ACTION_META: Record<InlineActionType, { label: string; icon: ComponentType<{ className?: string }> }> = {
  comment: { label: "Add comment", icon: MessageSquareText },
  reassign: { label: "Reassign", icon: UserPlus },
  status: { label: "Change status", icon: Shuffle },
};

export function UserSummaryCard({ summary, expanded, onToggle, onAction }: UserSummaryCardProps) {
  const ui = STATUS_UI[summary.status];
  const StatusIcon = ui.icon;
  const [expandedIssueIds, setExpandedIssueIds] = useState<Set<string>>(new Set());

  const displayName = summary.user?.displayName ?? summary.trackedUser?.displayName ?? "Unassigned teammate";
  const email = summary.user?.email ?? summary.trackedUser?.email ?? "Not linked to Jira++";
  const isUnmapped = !summary.user;

  const yesterdayLines = useMemo(() => normaliseLines(summary.yesterday), [summary.yesterday]);
  const todayLines = useMemo(() => normaliseLines(summary.today), [summary.today]);
  const blockerLines = useMemo(() => normaliseLines(summary.blockers), [summary.blockers]);

  const toggleIssue = (issueId: string) => {
    setExpandedIssueIds((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const handleAction = (event: MouseEvent<HTMLButtonElement>, type: InlineActionType, item: DailySummaryWorkItem) => {
    event.stopPropagation();
    onAction({ type, summary, item });
  };

  const handleCardClick = () => {
    if (expanded) {
      setExpandedIssueIds(new Set());
    }
    onToggle();
  };

  return (
    <article
      className={clsx(
        "flex h-full flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md dark:bg-slate-900/70",
        expanded ? ui.border : "border-slate-200 dark:border-slate-800",
      )}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={handleCardClick}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{displayName}</h3>
            {isUnmapped ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                Jira only
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{email}</p>
          {summary.jiraAccountId ? (
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Jira Account · {summary.jiraAccountId}
            </p>
          ) : null}
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {(summary.project?.key ?? "Project").toUpperCase()} · {summary.project?.name ?? "Unknown"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
              ui.badge,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {ui.label}
          </span>
          <ChevronDown
            className={clsx(
              "h-5 w-5 text-slate-400 transition-transform",
              expanded ? "rotate-180" : "",
            )}
          />
        </div>
      </button>

      <div className="grid gap-4 text-sm text-slate-600 dark:text-slate-300">
        <SummaryList title="Yesterday" lines={yesterdayLines} />
        <SummaryList title="Today" lines={todayLines} />
        <SummaryList title="Blockers" lines={blockerLines} highlight={summary.status === "BLOCKED"} />
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
        <MetricPill label="Total hours" value={`${summary.worklogHours.toFixed(1)}h`} />
        <MetricPill label="In progress" value={summary.issueCounts.inProgress.toString()} />
        <MetricPill label="To do" value={summary.issueCounts.todo.toString()} />
        <MetricPill label="Backlog" value={summary.issueCounts.backlog.toString()} />
      </div>

      {expanded ? (
        <div className="mt-2 space-y-5">
          {summary.workItems.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No detailed work items recorded in the last 24 hours.
            </p>
          ) : (
            summary.workItems.map((group) => (
              <section key={group.status} className="space-y-3">
                <header className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {group.status}
                  </h4>
                  <span className="text-xs text-slate-400">{group.items.length} item(s)</span>
                </header>
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const isIssueOpen = expandedIssueIds.has(item.issue.id);
                    return (
                      <article
                        key={item.issue.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleIssue(item.issue.id);
                            }}
                            className="flex items-center gap-2 text-left text-sm font-medium text-slate-800 transition hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100"
                          >
                            <ChevronDown
                              className={clsx(
                                "h-4 w-4 text-slate-400 transition-transform",
                                isIssueOpen ? "rotate-180" : "",
                              )}
                            />
                            <span>
                              {item.issue.key} · {item.issue.summary ?? "No summary"}
                            </span>
                          </button>
                          <div className="flex flex-wrap gap-2">
                            {(['comment', 'reassign', 'status'] as InlineActionType[]).map((action) => {
                              const meta = ACTION_META[action];
                              const Icon = meta.icon;
                              return (
                                <Button
                                  key={action}
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={(event) => handleAction(event, action, item)}
                                >
                                  <Icon className="mr-2 h-4 w-4" />
                                  {meta.label}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                        <IssueActivityDigest item={item} />
                        {isIssueOpen ? (
                          <div className="mt-4 space-y-4 text-sm">
                            <DetailList
                              title="Recent worklogs"
                              emptyLabel="No worklogs in the last day"
                              entries={item.recentWorklogs.map((log) => ({
                                id: log.id,
                                primary: `${formatHours(log.timeSpent ?? 0)} – ${log.author.displayName}`,
                                secondary: log.description ?? "Logged without description",
                                timestamp: new Date(log.jiraStartedAt).toLocaleString(),
                              }))}
                            />
                            <DetailList
                              title="Recent comments"
                              emptyLabel="No comments in the last day"
                              entries={item.recentComments.map((comment) => ({
                                id: comment.id,
                                primary: comment.author.displayName,
                                secondary: comment.body,
                                timestamp: new Date(comment.jiraCreatedAt).toLocaleString(),
                              }))}
                            />
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      ) : null}
    </article>
  );
}

function SummaryList({
  title,
  lines,
  highlight,
}: {
  title: string;
  lines: string[];
  highlight?: boolean;
}) {
  if (!lines.length) {
    return (
      <section className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {title}
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400">—</p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </h4>
      <ul
        className={clsx(
          "space-y-1 text-sm leading-relaxed",
          highlight ? "text-rose-600 dark:text-rose-300" : "text-slate-600 dark:text-slate-300",
        )}
      >
        {lines.map((line, index) => (
          <li key={`${title}-${index}`}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

function DetailList({
  title,
  emptyLabel,
  entries,
}: {
  title: string;
  emptyLabel: string;
  entries: Array<{ id: string; primary: string; secondary: string; timestamp: string }>;
}) {
  return (
    <section className="space-y-2">
      <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </h5>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="font-medium text-slate-800 dark:text-slate-200">{entry.primary}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{entry.secondary}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{entry.timestamp}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/40">
      <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</span>
    </span>
  );
}

function IssueActivityDigest({ item }: { item: DailySummaryWorkItem }) {
  const latestComment = item.recentComments[0] ?? null;
  const commentRemainder = Math.max(0, item.recentComments.length - 1);
  const recentWorklogs = item.recentWorklogs.slice(0, 2);
  const additionalWorklogs = Math.max(0, item.recentWorklogs.length - recentWorklogs.length);

  if (!latestComment && recentWorklogs.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
      {latestComment ? (
        <p>
          <span className="font-semibold text-sky-600 dark:text-sky-400">comment</span>{" "}
          <span className="text-slate-400 dark:text-slate-500">
            {formatRelativeTime(latestComment.jiraCreatedAt)} by {latestComment.author.displayName}
          </span>
          {": "}
          {truncateText(latestComment.body, 160)}
          {commentRemainder > 0 ? (
            <span className="text-slate-400 dark:text-slate-500"> (+{commentRemainder} more)</span>
          ) : null}
        </p>
      ) : null}
      {recentWorklogs.map((log) => (
        <p key={log.id}>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">worklog</span>{" "}
          <span className="text-slate-400 dark:text-slate-500">
            {formatRelativeTime(log.jiraStartedAt)} by {log.author.displayName}
          </span>
          {": "}
          {formatHours(log.timeSpent ?? 0)}
          {log.description ? ` – ${truncateText(log.description, 120)}` : ""}
        </p>
      ))}
      {additionalWorklogs > 0 ? (
        <p className="text-slate-400 dark:text-slate-500">+{additionalWorklogs} more worklogs logged</p>
      ) : null}
    </div>
  );
}

function normaliseLines(input?: string | null): string[] {
  if (!input) {
    return [];
  }
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatHours(timeSpent: number): string {
  if (!timeSpent) {
    return "0h";
  }
  const minutes = Math.round(timeSpent / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  return `${(timeSpent / 3600).toFixed(1)}h`;
}

function truncateText(value: string, limit = 140): string {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit - 1)}…`;
}

function formatRelativeTime(dateIso: string): string {
  const target = new Date(dateIso).getTime();
  const diffMs = Date.now() - target;
  const diffMinutes = Math.round(diffMs / 60000);
  if (Number.isNaN(diffMinutes)) {
    return new Date(dateIso).toLocaleString();
  }
  if (Math.abs(diffMinutes) < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return `${diffDays}d ago`;
  }
  return new Date(dateIso).toLocaleDateString();
}
