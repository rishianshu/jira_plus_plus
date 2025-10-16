import { FileDown, Send } from "lucide-react";
import { Button } from "../ui/button";

interface SummaryExportProps {
  onExport: (target: "PDF" | "SLACK") => void;
  isExporting: boolean;
  lastMessage?: string | null;
  lastLocation?: string | null;
  disabled?: boolean;
}

export function SummaryExport({ onExport, isExporting, lastMessage, lastLocation, disabled = false }: SummaryExportProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-950/50">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Export</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Share summaries with stakeholders or drop them into Slack.
          </p>
        </div>
      </header>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isExporting || disabled}
          onClick={() => onExport("PDF")}
        >
          <FileDown className={`mr-2 h-4 w-4 ${isExporting ? "animate-pulse" : ""}`} />
          Export PDF
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isExporting || disabled}
          onClick={() => onExport("SLACK")}
        >
          <Send className={`mr-2 h-4 w-4 ${isExporting ? "animate-pulse" : ""}`} />
          Send to Slack
        </Button>
      </div>
      {lastMessage ? (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {lastMessage}
          {lastLocation ? (
            <>
              {" "}
              <span className="truncate font-medium text-slate-600 underline dark:text-slate-300">
                {lastLocation}
              </span>
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
