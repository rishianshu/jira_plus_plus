import { useState } from "react";
import clsx from "clsx";
import { ManagerSummaryView } from "../components/manager/summary";
import { PerformanceReviewView } from "../components/manager/performance";

type ManagerMode = "summary" | "performance";

export function ManagerPage() {
  const [mode, setMode] = useState<ManagerMode>("summary");

  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Manager Summary Board</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Analyze team delivery signals at a glance or dive into per-person reviews powered by Jira intelligence.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-950/40 dark:shadow-slate-950/50">
          {[
            { id: "summary" as ManagerMode, label: "Manager Summary" },
            { id: "performance" as ManagerMode, label: "Performance Review" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                mode === option.id
                  ? "bg-sky-500 text-white shadow-sm shadow-sky-500/40 dark:bg-sky-400 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/60",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {mode === "summary" ? <ManagerSummaryView /> : <PerformanceReviewView />}
    </section>
  );
}
