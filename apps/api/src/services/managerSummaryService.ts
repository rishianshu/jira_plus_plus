import { DateTime } from "luxon";
import type { Issue, JiraProject, JiraUser, PrismaClient, Role, Sprint } from "@platform/cdm";

const DONE_STATUS_KEYWORDS = ["done", "closed", "resolved", "complete", "completed", "cancelled"];
const BLOCKER_STATUS_KEYWORDS = ["block", "blocked", "imped", "hold", "waiting", "stuck"];

type ManagerIdentity = {
  id: string;
  role: Role;
};

export interface ManagerSummaryFilters {
  projectId: string;
  sprintId?: string | null;
}

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
  issue: Issue & { assignee: JiraUser | null };
  assignee: JiraUser | null;
  status: string | null;
  priority: string | null;
  daysOpen: number;
}

export interface ManagerSummaryResult {
  project: Pick<JiraProject, "id" | "key" | "name">;
  sprint: Sprint | null;
  range: { start: string; end: string };
  totals: ManagerSummaryTotals;
  kpis: ManagerSummaryKpi[];
  blockers: ManagerSummaryBlocker[];
  aiSummary: ManagerSummaryNarrative | null;
  warnings: Array<{ code: string; message: string }>;
  updatedAt: Date;
}

interface ResolvedRange {
  sprint: Sprint | null;
  start: DateTime;
  end: DateTime;
  days: number;
}

async function assertProjectAccess(prisma: PrismaClient, manager: ManagerIdentity, projectId: string) {
  if (manager.role === "ADMIN") {
    return;
  }

  const membership = await prisma.userProjectLink.count({
    where: { projectId, userId: manager.id },
  });

  if (!membership) {
    const error = new Error("You do not have access to this project");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
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

async function resolveRange(
  prisma: PrismaClient,
  projectId: string,
  sprintId?: string | null,
): Promise<ResolvedRange> {
  if (sprintId) {
    const sprint = await prisma.sprint.findFirst({
      where: { id: sprintId, issues: { some: { projectId } } },
    });
    if (!sprint) {
      const error = new Error("Sprint not found for this project");
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }

    const start = sprint.startDate
      ? DateTime.fromJSDate(sprint.startDate, { zone: "utc" })
      : DateTime.utc().minus({ days: 13 }).startOf("day");
    const end = sprint.endDate
      ? DateTime.fromJSDate(sprint.endDate, { zone: "utc" })
      : start.plus({ days: 13 }).endOf("day");

    const normalizedStart = start.isValid ? start.startOf("day") : DateTime.utc().minus({ days: 13 }).startOf("day");
    const normalizedEnd = end.isValid ? end.endOf("day") : normalizedStart.plus({ days: 13 }).endOf("day");
    const days = Math.max(1, Math.round(normalizedEnd.diff(normalizedStart, "days").days) + 1);

    return { sprint, start: normalizedStart, end: normalizedEnd, days };
  }

  const activeSprint = await prisma.sprint.findFirst({
    where: {
      issues: { some: { projectId } },
      state: { in: ["active", "in progress", "started"] },
    },
    orderBy: [
      { startDate: "desc" as const },
      { createdAt: "desc" as const },
    ],
  });

  if (activeSprint) {
    return resolveRange(prisma, projectId, activeSprint.id);
  }

  const latestSprint = await prisma.sprint.findFirst({
    where: { issues: { some: { projectId } } },
    orderBy: [
      { endDate: "desc" as const },
      { startDate: "desc" as const },
      { createdAt: "desc" as const },
    ],
  });

  if (latestSprint) {
    return resolveRange(prisma, projectId, latestSprint.id);
  }

  const end = DateTime.utc().endOf("day");
  const start = end.minus({ days: 13 }).startOf("day");
  return { sprint: null, start, end, days: 14 };
}

function computeRisk(
  completionPercent: number | null,
  timeProgressPercent: number | null,
  activeBlockers: number,
): { level: string; reason: string | null } {
  if (completionPercent === null) {
    return { level: "UNKNOWN", reason: "No committed work to evaluate progress." };
  }

  if (timeProgressPercent === null) {
    if (activeBlockers >= 5) {
      return { level: "HIGH", reason: "High number of blockers with limited schedule context." };
    }
    return { level: activeBlockers >= 3 ? "MEDIUM" : "LOW", reason: null };
  }

  const delta = completionPercent - timeProgressPercent;

  if (completionPercent < 40 && timeProgressPercent > 60) {
    return {
      level: "HIGH",
      reason: `Completion ${completionPercent.toFixed(0)}% vs schedule ${timeProgressPercent.toFixed(0)}%.`,
    };
  }

  if (delta < -15 || activeBlockers >= 5) {
    return {
      level: "HIGH",
      reason: `Completion is ${Math.abs(delta).toFixed(0)} pts behind schedule (${timeProgressPercent.toFixed(0)}%).`,
    };
  }

  if (delta < -8 || activeBlockers >= 3) {
    return {
      level: "MEDIUM",
      reason: `Completion trails schedule by ${Math.abs(delta).toFixed(0)} pts.`,
    };
  }

  if (delta > 10) {
    return {
      level: "LOW",
      reason: `Completion is ${delta.toFixed(0)} pts ahead of schedule.`,
    };
  }

  return { level: "LOW", reason: null };
}

function buildKpis(totals: ManagerSummaryTotals): ManagerSummaryKpi[] {
  return [
    {
      id: "plan_vs_done",
      label: "Plan vs Done",
      value: totals.completionPercent,
      formattedValue: totals.completionPercent === null ? null : `${totals.completionPercent.toFixed(1)}%`,
      subtitle: `${totals.completedIssues}/${totals.committedIssues} issues completed`,
      delta:
        totals.completionPercent !== null && totals.timeProgressPercent !== null
          ? Number((totals.completionPercent - totals.timeProgressPercent).toFixed(1))
          : null,
      trendLabel:
        totals.timeProgressPercent !== null ? `Expected ${totals.timeProgressPercent.toFixed(1)}%` : null,
    },
    {
      id: "velocity",
      label: "Velocity",
      value: totals.velocity,
      formattedValue: `${totals.velocity.toFixed(1)} issues/wk`,
      subtitle: "Resolved during this sprint window",
      delta: null,
      trendLabel: null,
    },
    {
      id: "blockers",
      label: "Active Blockers",
      value: totals.activeBlockers,
      formattedValue: `${totals.activeBlockers}`,
      subtitle: totals.activeBlockers === 1 ? "1 issue needs attention" : `${totals.activeBlockers} issues to unblock`,
      delta: null,
      trendLabel: null,
    },
    {
      id: "risk",
      label: "Risk",
      value: null,
      formattedValue: totals.riskLevel,
      subtitle: totals.riskReason,
      delta: null,
      trendLabel: null,
    },
  ];
}

function buildNarrative(totals: ManagerSummaryTotals, rangeLabel: string, blockers: ManagerSummaryBlocker[]): ManagerSummaryNarrative {
  const completionText =
    totals.completionPercent === null
      ? "No planned work has been recorded for the selected sprint."
      : `Completion is tracking at ${totals.completionPercent.toFixed(1)}%, with ${totals.completedIssues} of ${totals.committedIssues} issues delivered.`;

  const velocityText = totals.velocity
    ? `Velocity is averaging ${totals.velocity.toFixed(1)} issues per week across ${rangeLabel}.`
    : "Velocity cannot be calculated yet.";

  const blockerText =
    totals.activeBlockers === 0
      ? "No active blockers are currently flagged."
      : `${totals.activeBlockers} blocker${totals.activeBlockers > 1 ? "s" : ""} require attention, including ${blockers
          .slice(0, 2)
          .map((blocker) => blocker.issue.key)
          .join(", ") || "key items"}.`;

  const headline =
    totals.riskLevel === "HIGH"
      ? "⚠️ Sprint at risk — blockers mounting"
      : totals.riskLevel === "MEDIUM"
        ? "⚠️ Sprint needs monitoring"
        : totals.riskLevel === "LOW"
          ? "✅ Sprint tracking well"
          : "ℹ️ Sprint insight";

  const highlights: string[] = [];
  if (totals.completionPercent !== null) {
    highlights.push(`Completion ${totals.completionPercent.toFixed(1)}%`);
  }
  highlights.push(`Velocity ${totals.velocity.toFixed(1)} issues/wk`);
  highlights.push(
    totals.activeBlockers === 0
      ? "No active blockers"
      : `${totals.activeBlockers} active blocker${totals.activeBlockers > 1 ? "s" : ""}`,
  );
  if (totals.riskLevel !== "LOW" && totals.riskLevel !== "UNKNOWN") {
    highlights.push(`Risk: ${totals.riskLevel}`);
  }

  return {
    headline,
    body: `${completionText} ${velocityText} ${blockerText}`,
    highlights,
  };
}

export async function buildManagerSummary(
  prisma: PrismaClient,
  manager: ManagerIdentity,
  filters: ManagerSummaryFilters,
): Promise<ManagerSummaryResult> {
  await assertProjectAccess(prisma, manager, filters.projectId);

  const project = await prisma.jiraProject.findUnique({
    where: { id: filters.projectId },
    select: { id: true, key: true, name: true },
  });

  if (!project) {
    const error = new Error("Project not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const range = await resolveRange(prisma, filters.projectId, filters.sprintId ?? null);

  const issues = await prisma.issue.findMany({
    where: {
      projectId: filters.projectId,
      ...(range.sprint
        ? { sprintId: range.sprint.id }
        : {
            jiraUpdatedAt: {
              gte: range.start.toJSDate(),
              lte: range.end.toJSDate(),
            },
          }),
    },
    include: {
      assignee: true,
    },
  });

  const committedIssues = issues.length;
  const completedIssues = issues.filter((issue) => isDoneStatus(issue.status)).length;
  const completionPercent =
    committedIssues > 0 ? Number(((completedIssues / committedIssues) * 100).toFixed(1)) : null;

  const rangeWeeks = Math.max(1, range.days / 7);
  const velocity = committedIssues > 0 ? Number((completedIssues / rangeWeeks).toFixed(2)) : 0;

  const blockers = issues
    .filter((issue) => isBlockerStatus(issue.status))
    .map((issue) => {
      const lastUpdate = DateTime.fromJSDate(issue.jiraUpdatedAt, { zone: "utc" });
      const openSince = lastUpdate.isValid ? lastUpdate : DateTime.fromJSDate(issue.jiraCreatedAt, { zone: "utc" });
      const daysOpen = Math.max(0, Math.round(DateTime.utc().diff(openSince, "days").days));
      return {
        issue,
        assignee: issue.assignee,
        status: issue.status,
        priority: issue.priority ?? null,
        daysOpen,
      };
    });

  const activeBlockers = blockers.length;

  let timeProgressPercent: number | null = null;
  if (range.sprint && range.days > 0) {
    const now = DateTime.utc();
    if (now <= range.start) {
      timeProgressPercent = 0;
    } else if (now >= range.end) {
      timeProgressPercent = 100;
    } else {
      timeProgressPercent = Number(
        ((now.diff(range.start).toMillis() / range.end.diff(range.start).toMillis()) * 100).toFixed(1),
      );
    }
  }

  const risk = computeRisk(completionPercent, timeProgressPercent, activeBlockers);

  const totals: ManagerSummaryTotals = {
    committedIssues,
    completedIssues,
    completionPercent,
    velocity,
    activeBlockers,
    riskLevel: risk.level,
    riskReason: risk.reason,
    timeProgressPercent,
  };

  const kpis = buildKpis(totals);

  const warnings: ManagerSummaryResult["warnings"] = [];
  if (!committedIssues) {
    warnings.push({
      code: "NO_COMMITTED_WORK",
      message: "No issues were assigned to this sprint range. Verify sprint scope or pick another sprint.",
    });
  }
  if (!blockers.length && completionPercent !== null && completionPercent < 50 && (timeProgressPercent ?? 0) > 60) {
    warnings.push({
      code: "LOW_COMPLETION",
      message: "Completion is lagging behind schedule without explicit blockers. Review planning accuracy.",
    });
  }

  const rangeLabel = `${range.start.toFormat("LLL d")}–${range.end.toFormat("LLL d")}`;
  const aiSummary =
    committedIssues === 0 && blockers.length === 0
      ? null
      : buildNarrative(totals, rangeLabel, blockers);

  return {
    project,
    sprint: range.sprint,
    range: {
      start: range.start.toISODate() ?? range.start.toISO() ?? range.start.toFormat("yyyy-LL-dd"),
      end: range.end.toISODate() ?? range.end.toISO() ?? range.end.toFormat("yyyy-LL-dd"),
    },
    totals,
    kpis,
    blockers,
    aiSummary,
    warnings,
    updatedAt: new Date(),
  };
}

function mergeRiskLevels(
  summaries: ManagerSummaryResult[],
): { level: string; reason: string | null } {
  const rank: Record<string, number> = {
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    UNKNOWN: 1,
  };

  let top: { level: string; reason: string | null } | null = null;
  let topScore = -1;

  for (const summary of summaries) {
    const { riskLevel, riskReason } = summary.totals;
    const score = rank[riskLevel] ?? 0;
    if (score > topScore) {
      topScore = score;
      top = { level: riskLevel, reason: riskReason };
    }
  }

  return top ?? { level: "UNKNOWN", reason: null };
}

export async function buildPortfolioManagerSummary(
  prisma: PrismaClient,
  manager: ManagerIdentity,
  projectIds: string[],
): Promise<ManagerSummaryResult> {
  const uniqueIds = Array.from(new Set(projectIds)).filter(Boolean);
  if (!uniqueIds.length) {
    const error = new Error("No projects available");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const summaries = (
    await Promise.all(
      uniqueIds.map(async (projectId) => {
        try {
          return await buildManagerSummary(prisma, manager, { projectId, sprintId: null });
        } catch (error) {
          console.error("[ManagerSummary] Failed to build project summary", {
            managerId: manager.id,
            projectId,
            error,
          });
          return null;
        }
      }),
    )
  ).filter((value): value is ManagerSummaryResult => value !== null);

  if (!summaries.length) {
    const error = new Error("Unable to assemble portfolio summary");
    (error as Error & { statusCode?: number }).statusCode = 500;
    throw error;
  }

  const committedIssues = summaries.reduce((total, summary) => total + summary.totals.committedIssues, 0);
  const completedIssues = summaries.reduce((total, summary) => total + summary.totals.completedIssues, 0);
  const activeBlockers = summaries.reduce((total, summary) => total + summary.totals.activeBlockers, 0);
  const velocitySum = summaries.reduce((total, summary) => total + summary.totals.velocity, 0);
  const timeProgressValues = summaries
    .map((summary) => summary.totals.timeProgressPercent)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  const completionPercent =
    committedIssues > 0 ? Number(((completedIssues / committedIssues) * 100).toFixed(1)) : null;
  const velocity = Number(velocitySum.toFixed(2));
  const timeProgressPercent =
    timeProgressValues.length > 0
      ? Number(
          (
            timeProgressValues.reduce((total, value) => total + value, 0) / timeProgressValues.length
          ).toFixed(1),
        )
      : null;

  const { level: aggregatedRiskLevel, reason: aggregatedRiskReason } = mergeRiskLevels(summaries);

  const totals: ManagerSummaryTotals = {
    committedIssues,
    completedIssues,
    completionPercent,
    velocity,
    activeBlockers,
    riskLevel: aggregatedRiskLevel,
    riskReason: aggregatedRiskReason,
    timeProgressPercent,
  };

  const kpis = buildKpis(totals);
  const blockers = summaries.flatMap((summary) => summary.blockers);
  const warnings = summaries.flatMap((summary) => summary.warnings);
  if (summaries.length < uniqueIds.length) {
    warnings.push({
      code: "PROJECT_SUMMARY_UNAVAILABLE",
      message: "Some projects could not be included due to data issues or access restrictions.",
    });
  }

  const rangeStarts = summaries
    .map((summary) => DateTime.fromISO(summary.range.start, { zone: "utc" }))
    .filter((dt) => dt.isValid);
  const rangeEnds = summaries
    .map((summary) => DateTime.fromISO(summary.range.end, { zone: "utc" }))
    .filter((dt) => dt.isValid);

  const resolvedStartCandidate = rangeStarts.length > 0 ? DateTime.min(...rangeStarts) : null;
  const resolvedEndCandidate = rangeEnds.length > 0 ? DateTime.max(...rangeEnds) : null;

  const resolvedStart = (resolvedStartCandidate && resolvedStartCandidate.isValid
    ? resolvedStartCandidate
    : DateTime.utc().minus({ days: 13 }).startOf("day")
  ).startOf("day");
  const resolvedEnd = (resolvedEndCandidate && resolvedEndCandidate.isValid
    ? resolvedEndCandidate
    : DateTime.utc().endOf("day")
  ).endOf("day");

  const summaryUpdatedAt = new Date();

  return {
    project: {
      id: "all-projects",
      key: "ALL",
      name: "All Projects",
    },
    sprint: null,
    range: {
      start: resolvedStart.toISODate() ?? resolvedStart.toISO() ?? resolvedStart.toFormat("yyyy-LL-dd"),
      end: resolvedEnd.toISODate() ?? resolvedEnd.toISO() ?? resolvedEnd.toFormat("yyyy-LL-dd"),
    },
    totals,
    kpis,
    blockers,
    aiSummary: null,
    warnings,
    updatedAt: summaryUpdatedAt,
  };
}
