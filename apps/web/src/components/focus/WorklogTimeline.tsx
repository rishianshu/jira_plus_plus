import type { WorklogBucket } from "../../types/focus";

interface WorklogTimelineProps {
  timeline: WorklogBucket[];
}

export function WorklogTimeline({ timeline }: WorklogTimelineProps) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Worklog Timeline</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">{timeline.length} day(s)</span>
      </header>
      {timeline.length === 0 ? (
        <p className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          No worklogs recorded in this period.
        </p>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-950/50">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Date</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Hours Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {timeline.map((bucket) => (
                <tr key={bucket.date}>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                    {bucket.date}
                  </td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                    {bucket.hours.toFixed(2)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
