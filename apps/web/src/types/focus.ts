export interface FocusDashboardMetrics {
  totalIssues: number;
  inProgressIssues: number;
  blockerIssues: number;
  hoursLogged: number;
  averageHoursPerDay: number;
}

export interface WorklogBucket {
  date: string;
  hours: number;
}

export type FocusIssueEventType = "COMMENT" | "WORKLOG";

export interface FocusIssueEvent {
  id: string;
  type: FocusIssueEventType;
  occurredAt: string;
  body?: string | null;
  hours?: number | null;
  author?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
}

export interface FocusIssueEventGroup {
  issueId: string;
  events: FocusIssueEvent[];
}

export interface FocusIssue {
  id: string;
  key: string;
  summary?: string | null;
  status: string;
  browseUrl?: string | null;
  priority?: string | null;
  jiraUpdatedAt: string;
  project: {
    id: string;
    key: string;
    name: string;
  };
}

export interface FocusComment {
  id: string;
  body: string;
  jiraCreatedAt: string;
  issue: FocusIssue;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface FocusBoardWarning {
  code: string;
  message: string;
}

export interface FocusBoardData {
  projects: Array<{ id: string; key: string; name: string }>;
  issues: FocusIssue[];
  blockers: FocusIssue[];
  comments: FocusComment[];
  issueEvents: FocusIssueEventGroup[];
  worklogTimeline: WorklogBucket[];
  metrics: FocusDashboardMetrics;
  warnings: FocusBoardWarning[];
  dateRange: {
    start: string;
    end: string;
  };
  updatedAt: string;
}
