import { DateTime } from "luxon";
import pRetry from "p-retry";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../prisma.js";
import {
  resolveSiteAuth,
  searchJiraIssues,
  fetchJiraIssueDetail,
} from "../../jira-client.js";
import type { SyncCursor } from "../workflows/syncProjectWorkflow.js";
import { getEnv } from "../../env.js";

const ENTITY_KEYS = ["issue", "comment", "worklog"] as const;

interface PrepareProjectSyncArgs {
  projectId: string;
  fullResync: boolean;
  accountIds: string[] | null;
}

interface PrepareProjectSyncResult {
  projectId: string;
  projectKey: string;
  siteId: string;
  baseUrl: string;
  adminEmail: string;
  token: string;
  trackedAccountIds: string[];
  since: string | null;
}

interface SyncIssuesBatchArgs extends PrepareProjectSyncResult {
  cursor: SyncCursor;
}

interface SyncIssuesBatchResult {
  hasMore: boolean;
  nextPageToken?: string | null;
  lastUpdatedAt?: string | null;
}

export async function prepareProjectSync(
  args: PrepareProjectSyncArgs,
): Promise<PrepareProjectSyncResult> {
  const project = await prisma.jiraProject.findUnique({
    where: { id: args.projectId },
    include: {
      site: true,
      trackedUsers: true,
      syncStates: true,
      syncJob: true,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const trackedUsers: Array<{
    jiraAccountId: string;
    displayName: string;
    isTracked?: boolean;
  }> = args.accountIds
    ? args.accountIds.map((accountId) => ({
        jiraAccountId: accountId,
        displayName: accountId,
      }))
    : project.trackedUsers.filter((user) => user.isTracked);

  const trackedAccountIds = trackedUsers.map((user) => user.jiraAccountId);

  await ensureSyncJobRecord(prisma, project, trackedAccountIds);
  await ensureSyncStates(prisma, project.id);

  const states = await prisma.syncState.findMany({
    where: { projectId: project.id },
  });

  const lastSyncTimes = states
    .map((state) => state.lastSyncTime)
    .filter((value): value is Date => Boolean(value));

  const since =
    !args.fullResync && lastSyncTimes.length > 0
      ? DateTime.fromJSDate(new Date(Math.min(...lastSyncTimes.map((d) => d.getTime()))))
          .toUTC()
          .toISO()
      : null;

  await prisma.syncState.updateMany({
    where: { projectId: project.id, entity: { in: ENTITY_KEYS as unknown as string[] } },
    data: {
      status: "RUNNING",
      updatedAt: new Date(),
    },
  });

  await prisma.syncJob.update({
    where: { projectId: project.id },
    data: {
      status: "ACTIVE",
      lastRunAt: new Date(),
    },
  });

  await prisma.syncLog.create({
    data: {
      projectId: project.id,
      level: "INFO",
      message: `Sync starting${args.fullResync ? " (full)" : ""} for project ${project.key}`,
      details: {
        trackedUsers: trackedAccountIds,
        since,
      },
    },
  });

  const { site, token } = await resolveSiteAuth(prisma, project.siteId);

  return {
    projectId: project.id,
    projectKey: project.key,
    siteId: site.id,
    baseUrl: site.baseUrl,
    adminEmail: site.adminEmail,
    token,
    trackedAccountIds,
    since,
  };
}

export async function syncIssuesBatch(args: SyncIssuesBatchArgs): Promise<SyncIssuesBatchResult> {
  if (!args.trackedAccountIds.length) {
    return { hasMore: false, lastUpdatedAt: args.since };
  }

  const quotedAccounts = args.trackedAccountIds.map((id) => `"${id}"`).join(", ");
  let jql = `project = "${args.projectKey}" AND (assignee in (${quotedAccounts}) OR assignee was in (${quotedAccounts}))`;

  if (args.cursor.since) {
    const formatted = DateTime.fromISO(args.cursor.since, { zone: "utc" }).toFormat("yyyy/MM/dd HH:mm");
    jql += ` AND updated >= "${formatted}"`;
  }

  const searchResponse = await pRetry(
    () =>
      searchJiraIssues({
        baseUrl: args.baseUrl,
        adminEmail: args.adminEmail,
        token: args.token,
        jql,
        nextPageToken: args.cursor.nextPageToken ?? undefined,
        maxResults: 100,
      }),
    { retries: 3 },
  );

  if (!searchResponse.issues.length) {
    return {
      hasMore: false,
      nextPageToken: searchResponse.nextPageToken,
      lastUpdatedAt: args.cursor.lastUpdatedAt ?? args.since,
    };
  }

  let lastUpdatedAt = args.cursor.lastUpdatedAt ?? args.since ?? null;
  let processedCount = 0;

  for (const issueSummary of searchResponse.issues) {
    const detail = await pRetry(
      () =>
        fetchJiraIssueDetail({
          baseUrl: args.baseUrl,
          adminEmail: args.adminEmail,
          token: args.token,
          issueIdOrKey: issueSummary.key,
        }),
      { retries: 3 },
    );

    await upsertIssueFromDetail(args.projectId, detail);
    processedCount += 1;

    const updated = detail.fields?.updated ?? issueSummary.fields.updated;
    if (updated) {
      const iso = DateTime.fromISO(updated).toUTC().toISO();
      if (!lastUpdatedAt || (iso && iso > lastUpdatedAt)) {
        lastUpdatedAt = iso;
      }
    }
  }

  await prisma.syncLog.create({
    data: {
      projectId: args.projectId,
      level: 'INFO',
      message: `Synced ${processedCount} issues (startAt=${searchResponse.nextPageToken})`,
      details: {
        startAt: searchResponse.nextPageToken,
        total: searchResponse.total,
      },
    },
  });

  return {
    hasMore: !searchResponse.isLast,
    nextPageToken: searchResponse.nextPageToken,
    lastUpdatedAt,
  };
}

export async function finalizeProjectSync(args: {
  projectId: string;
  status: "SUCCESS" | "FAILED";
  lastUpdatedAt: string | null;
  message?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const lastSyncTime = args.lastUpdatedAt ? new Date(args.lastUpdatedAt) : undefined;

  await prisma.syncState.updateMany({
    where: { projectId: args.projectId, entity: { in: ENTITY_KEYS as unknown as string[] } },
    data: {
      status: args.status === "SUCCESS" ? "SUCCESS" : "FAILED",
      lastSyncTime,
      updatedAt: new Date(),
    },
  });

  await prisma.syncJob.update({
    where: { projectId: args.projectId },
    data: {
      status: args.status === "SUCCESS" ? "ACTIVE" : "ERROR",
      lastRunAt: new Date(),
    },
  });

  await prisma.syncLog.create({
    data: {
      projectId: args.projectId,
      level: args.status === "SUCCESS" ? "INFO" : "ERROR",
      message: args.message ?? `Sync ${args.status.toLowerCase()}`,
      details: args.details ? (args.details as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function failProjectSync(args: { projectId: string; error: string }): Promise<void> {
  await prisma.syncState.updateMany({
    where: { projectId: args.projectId, entity: { in: ENTITY_KEYS as unknown as string[] } },
    data: {
      status: "FAILED",
      updatedAt: new Date(),
    },
  });

  await prisma.syncJob.update({
    where: { projectId: args.projectId },
    data: {
      status: "ERROR",
    },
  });

  await prisma.syncLog.create({
    data: {
      projectId: args.projectId,
      level: "ERROR",
      message: "Sync failed",
      details: { error: args.error },
    },
  });
}

async function ensureSyncJobRecord(
  db: PrismaClient,
  project: Prisma.JiraProjectGetPayload<{
    include: { syncJob: true };
  }>,
  trackedAccountIds: string[],
) {
  if (!project.syncJob) {
    const env = getEnv();
    await db.syncJob.create({
      data: {
        projectId: project.id,
        workflowId: `jira-sync-${project.id}`,
        scheduleId: `jira-sync-schedule-${project.id}`,
        cronSchedule: env.SYNC_DEFAULT_CRON,
        status: "ACTIVE",
        lastRunAt: null,
        nextRunAt: null,
      },
    });
  } else {
    await db.syncJob.update({
      where: { id: project.syncJob.id },
      data: {
        status: "ACTIVE",
      },
    });
  }

  await db.syncLog.create({
    data: {
      projectId: project.id,
      level: "DEBUG",
      message: "Sync job ensured",
      details: { trackedAccountIds },
    },
  });
}

async function ensureSyncStates(db: PrismaClient, projectId: string) {
  for (const entity of ENTITY_KEYS) {
    await db.syncState.upsert({
      where: {
        projectId_entity: {
          projectId,
          entity,
        },
      },
      create: {
        projectId,
        entity,
        status: "IDLE",
      },
      update: {},
    });
  }
}

async function upsertIssueFromDetail(projectId: string, detail: any) {
  const fields = detail.fields ?? {};
const assigneeId = await upsertJiraUser(fields.assignee, detail.id);

  let sprintId: string | null = null;
  const sprintField = fields.sprint ?? (fields.closedSprints?.[0] ?? null);
  if (sprintField?.id && sprintField?.name) {
    const sprint = await prisma.sprint.upsert({
      where: { jiraId: sprintField.id },
      create: {
        jiraId: sprintField.id,
        name: sprintField.name,
        state: sprintField.state ?? "UNKNOWN",
        startDate: sprintField.startDate ? new Date(sprintField.startDate) : undefined,
        endDate: sprintField.endDate ? new Date(sprintField.endDate) : undefined,
      },
      update: {
        name: sprintField.name,
        state: sprintField.state ?? "UNKNOWN",
        startDate: sprintField.startDate ? new Date(sprintField.startDate) : undefined,
        endDate: sprintField.endDate ? new Date(sprintField.endDate) : undefined,
      },
    });
    sprintId = sprint.id;
  }

  const issueRecord = await prisma.issue.upsert({
    where: { jiraId: detail.id },
    create: {
      jiraId: detail.id,
      key: detail.key,
      projectId,
      summary: fields.summary ?? null,
      status: fields.status?.name ?? "Unknown",
      priority: fields.priority?.name ?? null,
      assigneeId,
      sprintId,
      jiraCreatedAt: fields.created ? new Date(fields.created) : new Date(),
      jiraUpdatedAt: fields.updated ? new Date(fields.updated) : new Date(),
      remoteData: detail,
    },
    update: {
      key: detail.key,
      summary: fields.summary ?? null,
      status: fields.status?.name ?? "Unknown",
      priority: fields.priority?.name ?? null,
      assigneeId,
      sprintId,
      jiraUpdatedAt: fields.updated ? new Date(fields.updated) : new Date(),
      remoteData: detail,
    },
  });

  const comments = detail.fields?.comment?.comments ?? [];
  for (const comment of comments) {
    const commentAuthorId = await upsertJiraUser(comment.author, comment.id);
    await prisma.comment.upsert({
      where: { jiraId: comment.id },
      create: {
        jiraId: comment.id,
        issueId: issueRecord.id,
        authorId: commentAuthorId,
        body: comment.body ?? "",
        jiraCreatedAt: comment.created ? new Date(comment.created) : new Date(),
        jiraUpdatedAt: comment.updated ? new Date(comment.updated) : null,
      },
      update: {
        issueId: issueRecord.id,
        authorId: commentAuthorId,
        body: comment.body ?? "",
        jiraUpdatedAt: comment.updated ? new Date(comment.updated) : null,
      },
    });
  }

  const worklogs = detail.fields?.worklog?.worklogs ?? [];
  for (const worklog of worklogs) {
    const worklogAuthorId = await upsertJiraUser(worklog.author, worklog.id);
    await prisma.worklog.upsert({
      where: { jiraId: worklog.id },
      create: {
        jiraId: worklog.id,
        issueId: issueRecord.id,
        authorId: worklogAuthorId,
        description: typeof worklog.comment === "string" ? worklog.comment : null,
        timeSpent: worklog.timeSpentSeconds ?? 0,
        jiraStartedAt: worklog.started ? new Date(worklog.started) : new Date(),
        jiraUpdatedAt: worklog.updated ? new Date(worklog.updated) : new Date(),
      },
      update: {
        issueId: issueRecord.id,
        authorId: worklogAuthorId,
        description: typeof worklog.comment === "string" ? worklog.comment : null,
        timeSpent: worklog.timeSpentSeconds ?? 0,
        jiraStartedAt: worklog.started ? new Date(worklog.started) : new Date(),
        jiraUpdatedAt: worklog.updated ? new Date(worklog.updated) : new Date(),
      },
    });
  }
}

async function upsertJiraUser(user: any, fallbackKey?: string): Promise<string> {
  const accountId =
    user?.accountId ??
    (fallbackKey ? `anon-${fallbackKey}` : `anon-${Math.random().toString(36).slice(2)}`);

  const record = await prisma.jiraUser.upsert({
    where: { accountId },
    create: {
      accountId,
      displayName: user?.displayName ?? accountId,
      email: user?.emailAddress ?? null,
      avatarUrl: user?.avatarUrls?.["48x48"] ?? user?.avatarUrls?.["24x24"] ?? null,
    },
    update: {
      displayName: user?.displayName ?? accountId,
      email: user?.emailAddress ?? null,
      avatarUrl: user?.avatarUrls?.["48x48"] ?? user?.avatarUrls?.["24x24"] ?? null,
      updatedAt: new Date(),
    },
  });

  return record.id;
}
