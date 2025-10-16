import clsx from "clsx";
import type { DailySummaryRecord } from "../../types/scrum";
import { AISummaryPanel } from "./AISummaryPanel";

interface AISummaryDrawerProps {
  open: boolean;
  summary: DailySummaryRecord | null;
  regenerating: boolean;
  onRegenerate: () => void;
  onClose: () => void;
}

export function AISummaryDrawer({ open, summary, regenerating, onRegenerate, onClose }: AISummaryDrawerProps) {
  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 transition",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div
        className={clsx(
          "absolute inset-0 bg-slate-950/50 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={clsx(
          "absolute right-0 top-0 h-full w-full max-w-md transform transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              AI Summary
            </h2>
            <button
              type="button"
              className="rounded-full border border-transparent p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              onClick={onClose}
            >
              <span className="sr-only">Close summary</span>
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <AISummaryPanel summary={summary} regenerating={regenerating} onRegenerate={onRegenerate} />
          </div>
        </div>
      </div>
    </div>
  );
}
