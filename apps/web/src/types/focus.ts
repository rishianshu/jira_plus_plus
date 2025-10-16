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

export interface FocusBoardData {
  projects: Array<{ id: string; key: string; name: string }>;
  issues: FocusIssue[];
  blockers: FocusIssue[];
  comments: FocusComment[];
  worklogTimeline: WorklogBucket[];
  metrics: FocusDashboardMetrics;
  dateRange: {
    start: string;
    end: string;
  };
  updatedAt: string;
}
