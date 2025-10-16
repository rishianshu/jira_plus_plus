export type DailySummaryStatus = "ON_TRACK" | "DELAYED" | "BLOCKED";

export interface IssueStatusCounts {
  todo: number;
  inProgress: number;
  backlog: number;
}

export interface JiraUserRef {
  id: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface WorklogEntry {
  id: string;
  description?: string | null;
  timeSpent?: number | null;
  jiraStartedAt: string;
  author: JiraUserRef;
}

export interface CommentEntry {
  id: string;
  body: string;
  jiraCreatedAt: string;
  author: JiraUserRef;
}

export interface IssueRef {
  id: string;
  key: string;
  summary?: string | null;
  status: string;
  priority?: string | null;
  jiraUpdatedAt: string;
  project?: {
    id: string;
    key: string;
    name: string;
  } | null;
}

export interface DailySummaryWorkItem {
  issue: IssueRef;
  totalWorklogHours: number;
  recentWorklogs: WorklogEntry[];
  recentComments: CommentEntry[];
}

export interface DailySummaryWorkItemGroup {
  status: string;
  items: DailySummaryWorkItem[];
}

export interface DailySummaryRecord {
  id: string;
  projectId: string;
  project: {
    id: string;
    key: string;
    name: string;
  } | null;
  trackedUser?: {
    id: string;
    jiraAccountId: string;
    displayName: string;
    email?: string | null;
    avatarUrl?: string | null;
    isTracked: boolean;
  } | null;
  jiraAccountId?: string | null;
  date: string;
  yesterday?: string | null;
  today?: string | null;
  blockers?: string | null;
  createdAt: string;
  updatedAt: string;
  status: DailySummaryStatus;
  worklogHours: number;
  issueCounts: IssueStatusCounts;
  workItems: DailySummaryWorkItemGroup[];
  user: {
    id: string;
    displayName: string;
    email: string;
    role: string;
  } | null;
}
