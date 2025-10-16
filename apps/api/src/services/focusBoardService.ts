import { DateTime } from "luxon";
import type { Comment, Issue, JiraProject, JiraSite, PrismaClient, Worklog } from "@prisma/client";

const BLOCKER_STATUS_KEYWORDS = ["block", "blocked", "imped", "hold", "waiting"];
const IN_PROGRESS_STATUS_KEYWORDS = ["progress", "doing", "active", "review", "selected"];
const CURRENT_ASSIGNMENT_LOOKBACK_DAYS = 30;

export interface FocusBoardFilters {
  projectIds?: string[] | null;
  start?: string | Date | null;
  end?: string | Date | null;
}

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

type IssueWithProjectSite = Issue & { project: JiraProject & { site: JiraSite } };

export interface FocusBoardResult {
  projects: JiraProject[];
  issues: Array<IssueWithProjectSite & { browseUrl: string | null }>;
  blockers: Array<IssueWithProjectSite & { browseUrl: string | null }>;
  comments: Array<Comment & { issue: IssueWithProjectSite & { browseUrl: string | null } }>;
  worklogTimeline: WorklogBucket[];
  metrics: FocusDashboardMetrics;
  dateRange: { start: string; end: string };
  updatedAt: Date;
}

interface NormalizedRange {
  start: DateTime;
  end: DateTime;
  days: number;
}

function toDateTime(
  value: string | Date | null | undefined,
  boundary: "start" | "end",
): DateTime | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    const dt = DateTime.fromJSDate(value, { zone: "utc" });
    if (!dt.isValid) {
      return null;
    }
    return boundary === "start" ? dt.startOf("day") : dt.endOf("day");
  }

  if (typeof value === "string" && value.trim()) {
    const dt = DateTime.fromISO(value, { zone: "utc" });
    if (!dt.isValid) {
      return null;
    }
    return boundary === "start" ? dt.startOf("day") : dt.endOf("day");
  }

  return null;
}

function normalizeDateRange(start?: string | Date | null, end?: string | Date | null): NormalizedRange {
  const validEnd = toDateTime(end, "end") ?? DateTime.utc().endOf("day");
  let validStart = toDateTime(start, "start") ?? validEnd.minus({ days: 6 }).startOf("day");

  if (validStart > validEnd) {
    validStart = validEnd.minus({ days: 1 }).startOf("day");
  }

  const days = Math.max(1, Math.round(validEnd.diff(validStart, "days").days) + 1);
  return { start: validStart, end: validEnd, days };
}

function isBlockedStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }
  const lowered = status.toLowerCase();
  return BLOCKER_STATUS_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

function isInProgressStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }
  const lowered = status.toLowerCase();
  return IN_PROGRESS_STATUS_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

function uniqueProjects(links: Array<{ project: JiraProject }>): JiraProject[] {
  const map = new Map<string, JiraProject>();
  for (const link of links) {
    map.set(link.project.id, link.project);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildWorklogTimeline(worklogs: Worklog[]): WorklogBucket[] {
  const bucket = new Map<string, number>();
  for (const worklog of worklogs) {
    const date = DateTime.fromJSDate(worklog.jiraStartedAt).toISODate();
    const hours = (worklog.timeSpent ?? 0) / 3600;
    bucket.set(date, (bucket.get(date) ?? 0) + hours);
  }
  return Array.from(bucket.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hours]) => ({ date, hours: Number(hours.toFixed(2)) }));
}

export async function buildFocusBoard(
  prisma: PrismaClient,
  userId: string,
  filters: FocusBoardFilters,
): Promise<FocusBoardResult> {
  const { start, end, days } = normalizeDateRange(filters.start, filters.end);
  const assignmentWindowStart = start.minus({ days: CURRENT_ASSIGNMENT_LOOKBACK_DAYS });

  const projectLinks = await prisma.userProjectLink.findMany({
    where: { userId },
    include: { project: { include: { site: true } } },
  });

  const accessibleProjects = uniqueProjects(projectLinks);
  const requestedProjectIds =
    filters.projectIds && filters.projectIds.length
      ? new Set(filters.projectIds)
      : null;

  const scopedLinks = requestedProjectIds
    ? projectLinks.filter((link) => requestedProjectIds.has(link.projectId))
    : projectLinks;

  const scopedProjects = uniqueProjects(scopedLinks);
  const projectIds = scopedProjects.map((project) => project.id);
  const accountIds = Array.from(
    new Set(scopedLinks.map((link) => link.jiraAccountId).filter((value): value is string => Boolean(value))),
  );

  if (!projectIds.length || !accountIds.length) {
    return {
      projects: accessibleProjects,
      issues: [],
      blockers: [],
      comments: [],
      worklogTimeline: [],
      metrics: {
        totalIssues: 0,
        inProgressIssues: 0,
        blockerIssues: 0,
        hoursLogged: 0,
        averageHoursPerDay: 0,
      },
      dateRange: { start: start.toISODate(), end: end.toISODate() },
      updatedAt: new Date(),
    };
  }

  const issuesRaw = await prisma.issue.findMany({
    where: {
      projectId: { in: projectIds },
      OR: [
        {
          assignee: {
            accountId: { in: accountIds },
          },
          jiraUpdatedAt: {
            gte: assignmentWindowStart.toJSDate(),
          },
        },
        {
          worklogs: {
            some: {
              author: {
                accountId: { in: accountIds },
              },
              jiraStartedAt: {
                gte: start.toJSDate(),
                lte: end.toJSDate(),
              },
            },
          },
        },
        {
          comments: {
            some: {
              author: {
                accountId: { in: accountIds },
              },
              jiraCreatedAt: {
                gte: start.toJSDate(),
                lte: end.toJSDate(),
              },
            },
          },
        },
      ],
    },
    include: {
      project: { include: { site: true } },
    },
    orderBy: {
      jiraUpdatedAt: "desc",
    },
  });

  const buildBrowseUrl = (issue: IssueWithProjectSite): string | null => {
    const baseUrl = issue.project.site?.baseUrl;
    if (!baseUrl) {
      return null;
    }
    return `${baseUrl.replace(/\/$/, "")}/browse/${issue.key}`;
  };

  const issues = issuesRaw.map((issue) => ({
    ...issue,
    browseUrl: buildBrowseUrl(issue),
  }));

  const blockers = issues.filter((issue) => isBlockedStatus(issue.status));

  const commentResults = await prisma.comment.findMany({
    where: {
      issue: {
        projectId: { in: projectIds },
      },
      author: {
        accountId: { in: accountIds },
      },
      jiraCreatedAt: {
        gte: start.toJSDate(),
        lte: end.toJSDate(),
      },
    },
    include: {
      issue: {
        include: {
          project: { include: { site: true } },
        },
      },
      author: true,
    },
    orderBy: { jiraCreatedAt: "desc" },
    take: 50,
  });

  const comments = commentResults.map((comment) => ({
    ...comment,
    issue: {
      ...comment.issue,
      browseUrl: buildBrowseUrl(comment.issue),
    },
  }));

  const worklogs = await prisma.worklog.findMany({
    where: {
      author: {
        accountId: { in: accountIds },
      },
      jiraStartedAt: {
        gte: start.toJSDate(),
        lte: end.toJSDate(),
      },
    },
    include: {
      issue: {
        include: {
          project: true,
        },
      },
      author: true,
    },
    orderBy: { jiraStartedAt: "asc" },
  });

  const totalWorkSeconds = worklogs.reduce((sum, item) => sum + (item.timeSpent ?? 0), 0);
  const hoursLogged = Number((totalWorkSeconds / 3600).toFixed(2));
  const averageHours = Number((hoursLogged / days).toFixed(2));

  const metrics: FocusDashboardMetrics = {
    totalIssues: issues.length,
    inProgressIssues: issues.filter((issue) => isInProgressStatus(issue.status)).length,
    blockerIssues: blockers.length,
    hoursLogged,
    averageHoursPerDay: averageHours,
  };

  return {
    projects: accessibleProjects,
    issues,
    blockers,
    comments,
    worklogTimeline: buildWorklogTimeline(worklogs),
    metrics,
    dateRange: { start: start.toISODate(), end: end.toISODate() },
    updatedAt: new Date(),
  };
}
