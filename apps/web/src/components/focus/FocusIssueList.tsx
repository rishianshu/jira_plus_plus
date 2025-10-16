import type { FocusIssue } from "../../types/focus";

interface FocusIssueListProps {
  issues: FocusIssue[];
  title: string;
  emptyState: string;
}

interface GroupedIssues {
  projectId: string;
  projectKey: string;
  projectName: string;
  items: FocusIssue[];
}

function groupIssuesByProject(issues: FocusIssue[]): GroupedIssues[] {
  const groups = new Map<string, GroupedIssues>();

  for (const issue of issues) {
    const key = issue.project.id;
    if (!groups.has(key)) {
      groups.set(key, {
        projectId: issue.project.id,
        projectKey: issue.project.key,
        projectName: issue.project.name,
        items: [],
      });
    }
    groups.get(key)?.items.push(issue);
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    items: [...group.items].sort((a, b) => b.jiraUpdatedAt.localeCompare(a.jiraUpdatedAt)),
  }));
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

export function FocusIssueList({ issues, title, emptyState }: FocusIssueListProps) {
  const grouped = groupIssuesByProject(issues);

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">{issues.length} issue(s)</span>
      </header>
      {issues.length === 0 ? (
        <p className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          {emptyState}
        </p>
      ) : (
        grouped.map((group) => (
          <article
            key={group.projectId}
            className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-950/50"
          >
            <header className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {group.projectKey} · {group.projectName}
              </h4>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {group.items.length} item(s)
              </span>
            </header>
            <ul className="space-y-2">
              {group.items.map((issue) => (
                <li
                  key={issue.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {issue.browseUrl ? (
                          <a
                            href={issue.browseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700 hover:decoration-slate-400 dark:text-slate-100 dark:decoration-slate-700 dark:hover:text-slate-200 dark:hover:decoration-slate-500"
                          >
                            {issue.key}
                          </a>
                        ) : (
                          issue.key
                        )}
                        {` · ${issue.summary ?? "No summary provided"}`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Last updated {formatRelativeTime(issue.jiraUpdatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full border border-slate-300 px-2 py-1 text-slate-600 dark:border-slate-600 dark:text-slate-300">
                        {issue.status ?? "Unknown"}
                      </span>
                      {issue.priority ? (
                        <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          {issue.priority}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))
      )}
    </section>
  );
}
