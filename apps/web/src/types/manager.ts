export interface ManagerSummaryTotals {
  committedIssues: number;
  completedIssues: number;
  completionPercent: number | null;
  velocity: number;
  activeBlockers: number;
  riskLevel: string;
  riskReason: string | null;
  timeProgressPercent: number | null;
}

export interface ManagerSummaryKpi {
  id: string;
  label: string;
  value: number | null;
  formattedValue: string | null;
  subtitle: string | null;
  delta: number | null;
  trendLabel: string | null;
}

export interface ManagerSummaryNarrative {
  headline: string;
  body: string;
  highlights: string[];
}

export interface ManagerSummaryBlocker {
  issue: {
    id: string;
    key: string;
    summary: string | null;
    status: string;
    priority: string | null;
    jiraUpdatedAt: string;
    browseUrl: string | null;
  };
  assignee: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  status: string | null;
  priority: string | null;
  daysOpen: number;
}

export interface ManagerSummary {
  project: {
    id: string;
    key: string;
    name: string;
  };
  sprint: {
    id: string;
    name: string;
    state: string;
    startDate?: string | null;
    endDate?: string | null;
  } | null;
  range: {
    start: string;
    end: string;
  };
  totals: ManagerSummaryTotals;
  kpis: ManagerSummaryKpi[];
  blockers: ManagerSummaryBlocker[];
  aiSummary: ManagerSummaryNarrative | null;
  warnings: Array<{ code: string; message: string }>;
  updatedAt: string;
}
