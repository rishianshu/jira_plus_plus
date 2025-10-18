import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { rescheduleProjectSync } from "../syncService.js";
import { sendCommunication } from "../communication/index.js";
import type { JiraErrorClassification } from "../../jira/errorClassifier.js";

const BACKOFF_CRON_STEPS = ["*/30 * * * *", "0 * * * *", "0 */3 * * *", "0 */6 * * *", "0 */12 * * *"];

function buildBackoffCronSequence(originalCron: string): string[] {
  const sequence = [originalCron];
  for (const candidate of BACKOFF_CRON_STEPS) {
    if (!sequence.includes(candidate)) {
      sequence.push(candidate);
    }
  }
  return sequence;
}

interface SyncFailureEvent {
  projectId: string;
  classification: JiraErrorClassification;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function recordSyncFailure(event: SyncFailureEvent): Promise<void> {
  const project = await prisma.jiraProject.findUnique({
    where: { id: event.projectId },
    include: {
      site: true,
      syncJob: true,
    },
  });

  if (!project || !project.syncJob) {
    console.error("[Telemetry] Sync failure for unknown project", event.projectId);
    return;
  }

  const job = project.syncJob;
  const originalCron = job.backoffOriginalCron ?? job.cronSchedule;
  const cronSequence = buildBackoffCronSequence(originalCron);
  const nextLevel = Math.min(job.backoffLevel + 1, cronSequence.length - 1);
  const nextCron = cronSequence[nextLevel];
  const levelIncreased = nextLevel > job.backoffLevel;

  if (nextCron && nextCron !== job.cronSchedule) {
    await rescheduleProjectSync(prisma, project.id, nextCron);
  }

  await prisma.syncJob.update({
    where: { id: job.id },
    data: {
      backoffLevel: nextLevel,
      backoffOriginalCron: originalCron,
      backoffLastNotifiedAt: levelIncreased ? new Date() : job.backoffLastNotifiedAt,
      status: "ERROR",
    },
  });

  await prisma.syncLog.create({
    data: {
      projectId: project.id,
      level: "ERROR",
      message: event.message,
      details: {
        errorCode: event.classification.code,
        retryable: event.classification.retryable,
        cronSchedule: nextCron,
        backoffLevel: nextLevel,
        ...event.metadata,
      } satisfies Prisma.JsonObject,
    },
  });

  if (levelIncreased) {
    const html = `
      <p>Jira sync for <strong>${project.key}</strong> on site <strong>${project.site.alias}</strong> is failing repeatedly.</p>
      <ul>
        <li><strong>Error Code:</strong> ${event.classification.code}</li>
        <li><strong>Message:</strong> ${event.classification.message}</li>
        <li><strong>Backoff Level:</strong> ${nextLevel}</li>
        <li><strong>New Schedule:</strong> ${nextCron}</li>
      </ul>
      <p>The sync cadence has been slowed automatically. Once the Jira issue is resolved, the system will restore the original schedule after the next successful run.</p>
    `;

    await sendCommunication({
      channel: "email",
      payload: {
        to: [],
        subject: `[Jira++] Sync degraded for ${project.key}`,
        text: [
          `Jira sync for ${project.key} (${project.site.alias}) is failing repeatedly.`,
          `Error code: ${event.classification.code}`,
          `Message: ${event.classification.message}`,
          `Backoff level: ${nextLevel}`,
          `New schedule: ${nextCron}`,
          "Cadence will restore automatically after the next successful sync.",
        ].join("\n"),
        html,
      },
    });
  }
}

export async function recordSyncSuccess(projectId: string): Promise<void> {
  const job = await prisma.syncJob.findUnique({
    where: { projectId },
  });

  if (!job || job.backoffLevel === 0) {
    return;
  }

  const restoreCron = job.backoffOriginalCron ?? job.cronSchedule;
  if (restoreCron && job.cronSchedule !== restoreCron) {
    await rescheduleProjectSync(prisma, projectId, restoreCron);
  }

  await prisma.syncJob.update({
    where: { id: job.id },
    data: {
      backoffLevel: 0,
      backoffOriginalCron: null,
      backoffLastNotifiedAt: null,
      status: "ACTIVE",
    },
  });

  await prisma.syncLog.create({
    data: {
      projectId,
      level: "INFO",
      message: "Sync cadence restored after successful run",
      details: restoreCron ? ({ restoredCron: restoreCron } as Prisma.JsonObject) : undefined,
    },
  });
}
