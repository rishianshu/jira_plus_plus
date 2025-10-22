import { DateTime } from "luxon";
import type {
  Comment,
  Issue,
  JiraProject,
  PrismaClient,
  ProjectTrackedUser,
  Role,
  Worklog,
} from "@platform/cdm";

export class PerformanceReviewError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "PerformanceReviewError";
    this.statusCode = statusCode;
  }
}

const DONE_STATUS_KEYWORDS = ["done", "closed", "resolved", "complete", "completed", "cancelled", "accepted"];
const BLOCKER_STATUS_KEYWORDS = ["block", "blocked", "imped", "hold", "waiting"];
const REOPEN_STATUS_KEYWORDS = ["reopen", "re-open"];
const BUG_ISSUE_TYPE_KEYWORDS = ["bug", "defect", "issue"];
const HOURS_IN_SECOND = 1 / 3600;

interface NormalizedRange {
  start: DateTime;
  end: DateTime;
  startDate: Date;
  endDate: Date;
  isoStart: string;
  isoEnd: string;
  days: number;
}

export interface PerformanceReviewFilters {
  projectId: string;
  trackedUserId: string;
  start?: string | null;
  end?: string | null;
}

export interface PerformanceMetrics {
  range: { start: string; end: string; days: number };
  trackedUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    jiraAccountId: string;
  };
  project: { id: string; key: string; name: string };
  productivity: {
    storyCompletion: {
      committed: number;
      completed: number;
      ratio: number | null;
    };
    velocity: {
      totalResolved: number;
      weekly: Array<{ weekStart: string; resolved: number }>;
    };
    workConsistency: {
      totalHours: number;
      averageHours: number;
      stdDevHours: number;
      daily: Array<{ date: string; hours: number }>;
    };
    predictability: {
      ratio: number | null;
    };
  };
  quality: {
    reopenCount: number;
    bugCount: number;
    blockerOwnership: {
      resolved: number;
      active: number;
    };
    reviewHighlights: string[];
  };
  collaboration: {
    commentsAuthored: number;
    mentionsReceived: number;
    crossTeamLinks: number;
    responseLatencyHours: number | null;
    peersInteractedWith: number;
  };
  notes: {
    markdown: string | null;
    lastUpdated: string | null;
  };
  warnings: Array<{ code: string; message: string }>;
}

export interface PerformanceSummary {
  narrative: string;
  strengths: string[];
  improvements: string[];
  anomalies: string[];
}

export interface PerformanceComparison {
  current: PerformanceMetrics;
  compare: PerformanceMetrics;
  deltas: {
    storyCompletion: number | null;
    velocity: number;
    totalHours: number;
    commentsAuthored: number;
  };
}

interface LoadedContext {
  trackedUser: ProjectTrackedUser & { project: Pick<JiraProject, "id" | "key" | "name"> };
  range: NormalizedRange;
  issues: Array<Issue & { project: Pick<JiraProject, "id" | "key" | "name"> }>;
  worklogs: Array<Worklog & { issue: Pick<Issue, "id" | "key" | "summary" | "jiraCreatedAt"> }>;
  comments: Array<
    Comment & {
      issue: Pick<Issue, "id" | "key" | "summary">;
      author: { accountId: string; displayName: string | null };
    }
  >;
  notesMarkdown: string | null;
  notesUpdatedAt: string | null;
}

type ManagerIdentity = {
  id: string;
  role: Role;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeRange(start?: string | null, end?: string | null): NormalizedRange {
  let parsedEnd = end ? DateTime.fromISO(end, { zone: "utc" }) : DateTime.utc();
  if (!parsedEnd.isValid) {
    throw new PerformanceReviewError("Invalid end date provided");
  }
  parsedEnd = parsedEnd.endOf("day");

  let parsedStart = start ? DateTime.fromISO(start, { zone: "utc" }) : parsedEnd.minus({ days: 13 });
  if (!parsedStart.isValid) {
    throw new PerformanceReviewError("Invalid start date provided");
  }
  parsedStart = parsedStart.startOf("day");

  if (parsedStart > parsedEnd) {
    throw new PerformanceReviewError("Start date must be before end date");
  }

  const days = Math.max(1, Math.round(parsedEnd.diff(parsedStart, "days").days) + 1);
  return {
    start: parsedStart,
    end: parsedEnd,
    startDate: parsedStart.toJSDate(),
    endDate: parsedEnd.toJSDate(),
    isoStart: parsedStart.toISO(),
    isoEnd: parsedEnd.toISO(),
    days,
  };
}

async function assertProjectAccess(prisma: PrismaClient, manager: ManagerIdentity, projectId: string) {
  if (manager.role === "ADMIN") {
    return;
  }

  const link = await prisma.userProjectLink.findFirst({
    where: { userId: manager.id, projectId },
    select: { id: true },
  });

  if (!link) {
    throw new PerformanceReviewError("You do not have access to this project", 403);
  }
}

function isDoneStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }
  const lowered = status.toLowerCase();
  return DONE_STATUS_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

function isBlockerStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }
  const lowered = status.toLowerCase();
  return BLOCKER_STATUS_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

function isReopenStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }
  const lowered = status.toLowerCase();
  return REOPEN_STATUS_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

function extractIssueType(issue: Issue): string | null {
  const remote = issue.remoteData;
  if (!isRecord(remote)) {
    return null;
  }
  const fields = remote.fields;
  if (!isRecord(fields)) {
    return null;
  }
  const issueType = fields.issuetype;
  if (!isRecord(issueType)) {
    return null;
  }
  const name = issueType.name;
  return typeof name === "string" ? name : null;
}

function extractIssueLinks(issue: Issue): string[] {
  const remote = issue.remoteData;
  if (!isRecord(remote)) {
    return [];
  }
  const fields = remote.fields;
  if (!isRecord(fields)) {
    return [];
  }
  const issueLinks = fields.issuelinks;
  if (!Array.isArray(issueLinks)) {
    return [];
  }
  const keys: string[] = [];
  for (const link of issueLinks) {
    if (!isRecord(link)) {
      continue;
    }
    const outward = link.outwardIssue;
    const inward = link.inwardIssue;
    const target = (isRecord(outward) ? outward : isRecord(inward) ? inward : null) as Record<string, unknown> | null;
    if (!target) {
      continue;
    }
    const key = target.key;
    if (typeof key === "string") {
      keys.push(key);
    }
  }
  return keys;
}

function computeStdDev(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance =
    values.reduce((acc, value) => {
      const diff = value - mean;
      return acc + diff * diff;
    }, 0) / values.length;
  return Math.sqrt(variance);
}

function buildDailyHours(range: NormalizedRange, worklogs: Array<Worklog & { issue: Pick<Issue, "id"> }>) {
  const buckets = new Map<string, number>();
  for (const worklog of worklogs) {
    const date = DateTime.fromJSDate(worklog.jiraStartedAt, { zone: "utc" }).toISODate();
    if (!date) {
      continue;
    }
    const hours = (worklog.timeSpent ?? 0) * HOURS_IN_SECOND;
    buckets.set(date, (buckets.get(date) ?? 0) + hours);
  }

  const results: Array<{ date: string; hours: number }> = [];
  for (let cursor = range.start; cursor <= range.end; cursor = cursor.plus({ days: 1 })) {
    const isoDate = cursor.toISODate();
    const value = buckets.get(isoDate ?? "") ?? 0;
    results.push({
      date: isoDate ?? cursor.toFormat("yyyy-LL-dd"),
      hours: Number(value.toFixed(2)),
    });
  }
  return results;
}

function summarizeReviewHighlights(
  comments: LoadedContext["comments"],
  trackedAccountId: string,
): string[] {
  const peerComments = comments
    .filter((comment) => comment.author.accountId !== trackedAccountId)
    .sort((a, b) => b.jiraCreatedAt.getTime() - a.jiraCreatedAt.getTime());

  return peerComments.slice(0, 3).map((comment) => {
    const snippet = comment.body.length > 180 ? `${comment.body.slice(0, 177)}…` : comment.body;
    return `${comment.issue.key}: ${snippet}`;
  });
}

function countMentions(comments: LoadedContext["comments"], tracked: ProjectTrackedUser): number {
  const displayName = tracked.displayName?.trim();
  const patterns: RegExp[] = [];
  if (displayName) {
    patterns.push(new RegExp(`\\b${displayName.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i"));
    const firstName = displayName.split(/\s+/)[0];
    if (firstName && firstName.length > 2) {
      patterns.push(new RegExp(`@${firstName.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`, "i"));
    }
  }
  if (tracked.email) {
    patterns.push(new RegExp(tracked.email.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"), "i"));
  }

  if (!patterns.length) {
    return 0;
  }

  return comments.reduce((acc, comment) => {
    if (comment.author.accountId === tracked.jiraAccountId) {
      return acc;
    }
    const matched = patterns.some((pattern) => pattern.test(comment.body));
    return matched ? acc + 1 : acc;
  }, 0);
}

function calculateResponseLatencyHours(
  issues: LoadedContext["issues"],
  worklogs: LoadedContext["worklogs"],
  comments: LoadedContext["comments"],
  trackedAccountId: string,
): number | null {
  type WorklogEntry = LoadedContext["worklogs"][number];
  type CommentEntry = LoadedContext["comments"][number];

  const latencyBuckets: number[] = [];
  const worklogsByIssue = new Map<string, WorklogEntry[]>();
  for (const worklog of worklogs) {
    const list = worklogsByIssue.get(worklog.issueId) ?? [];
    list.push(worklog);
    worklogsByIssue.set(worklog.issueId, list);
  }

  const commentsByIssue = new Map<string, CommentEntry[]>();
  for (const comment of comments) {
    const list = commentsByIssue.get(comment.issueId) ?? [];
    list.push(comment);
    commentsByIssue.set(comment.issueId, list);
  }

  for (const issue of issues) {
    const events: DateTime[] = [];
    const issueWorklogs = worklogsByIssue.get(issue.id) ?? [];
    for (const worklog of issueWorklogs) {
      events.push(DateTime.fromJSDate(worklog.jiraStartedAt));
    }
    const issueComments = commentsByIssue.get(issue.id) ?? [];
    for (const comment of issueComments) {
      if (comment.author.accountId === trackedAccountId) {
        events.push(DateTime.fromJSDate(comment.jiraCreatedAt));
      }
    }
    if (!events.length) {
      continue;
    }
    const firstEvent = events.reduce((earliest, current) => (current < earliest ? current : earliest));
    const latency = firstEvent.diff(DateTime.fromJSDate(issue.jiraCreatedAt), "hours").hours;
    if (latency >= 0) {
      latencyBuckets.push(latency);
    }
  }

  if (!latencyBuckets.length) {
    return null;
  }

  const average = latencyBuckets.reduce((acc, value) => acc + value, 0) / latencyBuckets.length;
  return Number(average.toFixed(2));
}

async function loadContext(
  prisma: PrismaClient,
  manager: ManagerIdentity,
  filters: PerformanceReviewFilters,
): Promise<LoadedContext> {
  const range = normalizeRange(filters.start, filters.end);
  const trackedUser = await prisma.projectTrackedUser.findUnique({
    where: { id: filters.trackedUserId },
    include: { project: { select: { id: true, key: true, name: true } } },
  });

  if (!trackedUser || trackedUser.projectId !== filters.projectId) {
    throw new PerformanceReviewError("Tracked user not found for provided project", 404);
  }

  await assertProjectAccess(prisma, manager, filters.projectId);

  if (!trackedUser.jiraAccountId) {
    throw new PerformanceReviewError("Tracked user is missing Jira account mapping", 409);
  }

  const [issues, worklogs, comments, note] = await Promise.all([
    prisma.issue.findMany({
      where: {
        projectId: filters.projectId,
        assignee: { accountId: trackedUser.jiraAccountId },
        jiraCreatedAt: { lte: range.endDate },
        jiraUpdatedAt: { gte: range.startDate, lte: range.endDate },
      },
      include: {
        project: { select: { id: true, key: true, name: true } },
      },
    }),
    prisma.worklog.findMany({
      where: {
        issue: { projectId: filters.projectId },
        author: { accountId: trackedUser.jiraAccountId },
        jiraStartedAt: { gte: range.startDate, lte: range.endDate },
      },
      include: {
        issue: { select: { id: true, key: true, summary: true, jiraCreatedAt: true } },
      },
    }),
    prisma.comment.findMany({
      where: {
        issue: { projectId: filters.projectId, assignee: { accountId: trackedUser.jiraAccountId } },
        jiraCreatedAt: { gte: range.startDate, lte: range.endDate },
      },
      include: {
        issue: { select: { id: true, key: true, summary: true } },
        author: { select: { accountId: true, displayName: true } },
      },
    }),
    prisma.performanceReviewNote.findFirst({
      where: {
        tenantId: trackedUser.tenantId,
        projectId: filters.projectId,
        trackedUserId: filters.trackedUserId,
        managerId: manager.id,
        startDate: range.startDate,
        endDate: range.endDate,
      },
    }),
  ]);

  return {
    trackedUser,
    range,
    issues,
    worklogs,
    comments,
    notesMarkdown: note?.markdown ?? null,
    notesUpdatedAt: note?.updatedAt?.toISOString() ?? null,
  };
}

export async function buildPerformanceMetrics(
  prisma: PrismaClient,
  manager: ManagerIdentity,
  filters: PerformanceReviewFilters,
): Promise<PerformanceMetrics> {
  const context = await loadContext(prisma, manager, filters);
  const { trackedUser, range, issues, worklogs, comments } = context;

  const committedIssues = issues.length;
  const completedIssues = issues.filter((issue) => isDoneStatus(issue.status) && issue.jiraUpdatedAt >= range.startDate).length;

  const storyCompletionRatio =
    committedIssues === 0 ? null : Math.round((completedIssues / committedIssues) * 100);

  const velocityWeekly = new Map<string, number>();
  for (const issue of issues) {
    if (!isDoneStatus(issue.status)) {
      continue;
    }
    const resolvedAt = DateTime.fromJSDate(issue.jiraUpdatedAt).startOf("week");
    const key = resolvedAt.toISODate();
    if (key) {
      velocityWeekly.set(key, (velocityWeekly.get(key) ?? 0) + 1);
    }
  }
  const weeklyVelocity = Array.from(velocityWeekly.entries())
    .sort(([a], [b]) => (a ?? "").localeCompare(b ?? ""))
    .map(([weekStart, resolved]) => ({ weekStart, resolved }));

  const worklogDaily = buildDailyHours(range, worklogs);
  const totalHours = worklogDaily.reduce((acc, entry) => acc + entry.hours, 0);
  const averageHours = worklogDaily.length ? totalHours / worklogDaily.length : 0;
  const stdDevHours = computeStdDev(worklogDaily.map((entry) => entry.hours));

  const reopenCount = issues.filter((issue) => isReopenStatus(issue.status)).length;
  const bugCount = issues.reduce((acc, issue) => {
    const typeName = extractIssueType(issue);
    if (!typeName) {
      return acc;
    }
    return BUG_ISSUE_TYPE_KEYWORDS.some((keyword) => typeName.toLowerCase().includes(keyword)) ? acc + 1 : acc;
  }, 0);

  const blockerIssues = issues.filter((issue) => isBlockerStatus(issue.status));
  const resolvedBlockers = blockerIssues.filter((issue) => isDoneStatus(issue.status)).length;

  const reviewHighlights = summarizeReviewHighlights(comments, trackedUser.jiraAccountId);
  const mentionsReceived = countMentions(comments, trackedUser);
  const commentsAuthored = comments.filter((comment) => comment.author.accountId === trackedUser.jiraAccountId).length;

  let crossTeamLinks = 0;
  for (const issue of issues) {
    const linkedKeys = extractIssueLinks(issue);
    crossTeamLinks += linkedKeys.filter((key) => typeof key === "string" && !key.startsWith(issue.project.key)).length;
  }

  const responseLatencyHours = calculateResponseLatencyHours(issues, worklogs, comments, trackedUser.jiraAccountId);
  const peersInteractedWith = new Set(
    comments
      .filter((comment) => comment.author.accountId !== trackedUser.jiraAccountId)
      .map((comment) => comment.author.accountId),
  ).size;

  const warnings: PerformanceMetrics["warnings"] = [];
  if (!worklogs.length) {
    warnings.push({
      code: "MISSING_WORKLOGS",
      message: "No worklogs were recorded for the selected period.",
    });
  }
  if (!comments.length) {
    warnings.push({
      code: "LOW_COLLABORATION",
      message: "No comments detected for the selected period; collaboration signals may be incomplete.",
    });
  }

  return {
    range: { start: range.isoStart, end: range.isoEnd, days: range.days },
    trackedUser: {
      id: trackedUser.id,
      displayName: trackedUser.displayName,
      avatarUrl: trackedUser.avatarUrl ?? null,
      jiraAccountId: trackedUser.jiraAccountId,
    },
    project: {
      id: trackedUser.project.id,
      key: trackedUser.project.key,
      name: trackedUser.project.name,
    },
    productivity: {
      storyCompletion: {
        committed: committedIssues,
        completed: completedIssues,
        ratio: storyCompletionRatio,
      },
      velocity: {
        totalResolved: completedIssues,
        weekly: weeklyVelocity,
      },
      workConsistency: {
        totalHours: Number(totalHours.toFixed(2)),
        averageHours: Number(averageHours.toFixed(2)),
        stdDevHours: Number(stdDevHours.toFixed(2)),
        daily: worklogDaily,
      },
      predictability: {
        ratio: storyCompletionRatio,
      },
    },
    quality: {
      reopenCount,
      bugCount,
      blockerOwnership: {
        resolved: resolvedBlockers,
        active: blockerIssues.length - resolvedBlockers,
      },
      reviewHighlights,
    },
    collaboration: {
      commentsAuthored,
      mentionsReceived,
      crossTeamLinks,
      responseLatencyHours,
      peersInteractedWith,
    },
    notes: {
      markdown: context.notesMarkdown,
      lastUpdated: context.notesUpdatedAt,
    },
    warnings,
  };
}

export async function generatePerformanceSummary(
  prisma: PrismaClient,
  manager: ManagerIdentity,
  filters: PerformanceReviewFilters,
): Promise<PerformanceSummary> {
  const metrics = await buildPerformanceMetrics(prisma, manager, filters);
  const parts: string[] = [];

  const completion = metrics.productivity.storyCompletion.ratio;
  if (completion !== null) {
    parts.push(
      `${metrics.trackedUser.displayName} closed ${metrics.productivity.storyCompletion.completed}/${metrics.productivity.storyCompletion.committed} assignments (${completion}% completion).`,
    );
  } else {
    parts.push(`${metrics.trackedUser.displayName} had no assigned issues during this period.`);
  }

  if (metrics.productivity.workConsistency.totalHours > 0) {
    parts.push(
      `Logged ${metrics.productivity.workConsistency.totalHours.toFixed(1)} hours with a daily average of ${metrics.productivity.workConsistency.averageHours.toFixed(1)}h.`,
    );
  }

  if (metrics.collaboration.commentsAuthored > 0) {
    parts.push(`Posted ${metrics.collaboration.commentsAuthored} comments, engaging with ${metrics.collaboration.peersInteractedWith} teammates.`);
  } else if (metrics.collaboration.peersInteractedWith === 0) {
    parts.push("Collaboration signals were minimal across the selected range.");
  }

  if (metrics.quality.blockerOwnership.resolved > 0) {
    parts.push(`Resolved ${metrics.quality.blockerOwnership.resolved} blocker(s).`);
  }

  if (metrics.quality.reopenCount > 0) {
    parts.push(`Detected ${metrics.quality.reopenCount} reopened item(s) that may need follow-up.`);
  }

  const strengths: string[] = [];
  if (completion !== null && completion >= 90) {
    strengths.push("Consistently exceeds committed scope.");
  }
  if (metrics.productivity.workConsistency.stdDevHours < 2 && metrics.productivity.workConsistency.totalHours > 0) {
    strengths.push("Maintains steady daily throughput.");
  }
  if (metrics.collaboration.commentsAuthored >= 5) {
    strengths.push("High collaboration via comments and reviews.");
  }
  if (metrics.quality.blockerOwnership.resolved > 0) {
    strengths.push("Actively resolves blockers impacting the team.");
  }

  const improvements: string[] = [];
  if (completion !== null && completion < 75 && metrics.productivity.storyCompletion.committed > 5) {
    improvements.push("Review planning accuracy to improve completion rate.");
  }
  if (metrics.productivity.workConsistency.totalHours > 0 && metrics.productivity.workConsistency.stdDevHours > 3) {
    improvements.push("Balance daily workload to reduce spikes in logged hours.");
  }
  if (metrics.collaboration.commentsAuthored === 0) {
    improvements.push("Increase written updates or code review participation.");
  }
  if (metrics.quality.reopenCount > 0) {
    improvements.push("Inspect reopened issues to identify quality gaps.");
  }

  const anomalies: string[] = [];
  if (metrics.productivity.workConsistency.totalHours === 0) {
    anomalies.push("No worklogs recorded; verify Jira time tracking coverage.");
  }
  if (metrics.warnings.some((warning) => warning.code === "MISSING_WORKLOGS") && !anomalies.includes("No worklogs recorded; verify Jira time tracking coverage.")) {
    anomalies.push("Worklog data missing for the selected period.");
  }
  if (metrics.warnings.some((warning) => warning.code === "LOW_COLLABORATION")) {
    anomalies.push("Lack of collaboration signals detected.");
  }
  if (metrics.collaboration.responseLatencyHours !== null && metrics.collaboration.responseLatencyHours > 48) {
    anomalies.push("Slow response time to first activity after assignment.");
  }

  return {
    narrative: parts.join(" "),
    strengths,
    improvements,
    anomalies,
  };
}

export async function comparePerformanceMetrics(
  prisma: PrismaClient,
  manager: ManagerIdentity,
  currentFilters: PerformanceReviewFilters,
  compareFilters: PerformanceReviewFilters,
): Promise<PerformanceComparison> {
  const [current, compare] = await Promise.all([
    buildPerformanceMetrics(prisma, manager, currentFilters),
    buildPerformanceMetrics(prisma, manager, compareFilters),
  ]);

  const storyCompletionDelta =
    current.productivity.storyCompletion.ratio === null || compare.productivity.storyCompletion.ratio === null
      ? null
      : Number((current.productivity.storyCompletion.ratio - compare.productivity.storyCompletion.ratio).toFixed(2));

  const velocityDelta = current.productivity.velocity.totalResolved - compare.productivity.velocity.totalResolved;
  const hoursDelta =
    Number((current.productivity.workConsistency.totalHours - compare.productivity.workConsistency.totalHours).toFixed(2));
  const commentDelta = current.collaboration.commentsAuthored - compare.collaboration.commentsAuthored;

  return {
    current,
    compare,
    deltas: {
      storyCompletion: storyCompletionDelta,
      velocity: velocityDelta,
      totalHours: hoursDelta,
      commentsAuthored: commentDelta,
    },
  };
}

export async function savePerformanceNote(
  prisma: PrismaClient,
  manager: ManagerIdentity,
  filters: PerformanceReviewFilters & { markdown: string },
): Promise<{ markdown: string; updatedAt: string }> {
  const { range, trackedUser } = await loadContext(prisma, manager, filters);

  const record = await prisma.performanceReviewNote.upsert({
    where: {
      tenantId_projectId_trackedUserId_managerId_startDate_endDate: {
        tenantId: trackedUser.tenantId,
        projectId: filters.projectId,
        trackedUserId: filters.trackedUserId,
        managerId: manager.id,
        startDate: range.startDate,
        endDate: range.endDate,
      },
    },
    update: {
      markdown: filters.markdown,
    },
    create: {
      tenantId: trackedUser.tenantId,
      projectId: filters.projectId,
      trackedUserId: trackedUser.id,
      managerId: manager.id,
      startDate: range.startDate,
      endDate: range.endDate,
      markdown: filters.markdown,
    },
  });

  return {
    markdown: record.markdown,
    updatedAt: record.updatedAt.toISOString(),
  };
}
