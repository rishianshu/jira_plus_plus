import type { FocusComment } from "../../types/focus";

interface FocusCommentsProps {
  comments: FocusComment[];
}

function truncate(text: string, length = 160): string {
  if (text.length <= length) {
    return text;
  }
  return `${text.slice(0, length - 1)}…`;
}

function formatRelativeTime(dateIso: string): string {
  const target = new Date(dateIso);
  if (Number.isNaN(target.getTime())) {
    return dateIso;
  }

  const diffMs = Date.now() - target.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

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

  return target.toLocaleString();
}

export function FocusComments({ comments }: FocusCommentsProps) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Comments</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">{comments.length} item(s)</span>
      </header>
      {comments.length === 0 ? (
        <p className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          No comments recorded for this period.
        </p>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-950/50 dark:hover:border-slate-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {comment.issue.browseUrl ? (
                      <a
                        href={comment.issue.browseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700 hover:decoration-slate-400 dark:text-slate-100 dark:decoration-slate-700 dark:hover:text-slate-200 dark:hover:decoration-slate-500"
                      >
                        {comment.issue.key}
                      </a>
                    ) : (
                      comment.issue.key
                    )}
                    {` · ${comment.issue.summary ?? "No summary"}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatRelativeTime(comment.jiraCreatedAt)}
                  </p>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {comment.issue.project.key} · {comment.issue.project.name}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{truncate(comment.body)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
