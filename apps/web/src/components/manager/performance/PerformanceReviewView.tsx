import { useCallback, useEffect, useMemo, useState } from "react";
import { gql, useLazyQuery, useQuery } from "@apollo/client";
import { Loader2, RefreshCcw, Sparkles, TrendingUp, Users, AlertTriangle, Save } from "lucide-react";
import { Button } from "../../ui/button";
import { useAuth } from "../../../providers/AuthProvider";
import { apiFetch } from "../../../lib/api-client";
import type { PerformanceComparison, PerformanceMetrics, PerformanceSummary } from "../../../types/performance";

interface ScrumProject {
  id: string;
  key: string;
  name: string;
}

interface ProjectTrackedUser {
  id: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  isTracked: boolean;
}

const SCRUM_PROJECTS_QUERY = gql`
  query ScrumProjectsForPerformance {
    scrumProjects {
      id
      key
      name
    }
  }
`;

const PROJECT_TRACKED_USERS_QUERY = gql`
  query ProjectTrackedUsersForPerformance($projectId: ID!) {
    projectTrackedUsers(projectId: $projectId) {
      id
      displayName
      email
      avatarUrl
      isTracked
    }
  }
`;

function getDefaultRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 13);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function computePreviousRange(currentStart: string, days: number) {
  const anchor = new Date(currentStart);
  if (Number.isNaN(anchor.getTime())) {
    return null;
  }
  const end = new Date(anchor);
  end.setDate(anchor.getDate() - 1);
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - days);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function MetricCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string | null;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-slate-950/50">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      {sublabel ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sublabel}</p> : null}
    </div>
  );
}

function TimelineBar({ date, hours, max }: { date: string; hours: number; max: number }) {
  const percent = max === 0 ? 0 : Math.round((hours / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{date.slice(5)}</span>
        <span>{hours.toFixed(1)}h</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-2 rounded-full bg-sky-500 transition-all dark:bg-sky-400"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function SummarySection({
  summary,
  loading,
  onRefresh,
}: {
  summary: PerformanceSummary | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-slate-950/50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Performance Narrative</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Automatically interprets throughput, quality, and collaboration signals for this review period.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void onRefresh()}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Regenerate
        </Button>
      </div>
      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Generating fresh insight…</p>
        ) : summary ? (
          <>
            <p className="text-base text-slate-700 dark:text-slate-200">{summary.narrative}</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-500 dark:text-emerald-400">
                  Strengths
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {summary.strengths.length ? (
                    summary.strengths.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li>No standout strengths recorded.</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-500 dark:text-amber-400">
                  Growth Areas
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {summary.improvements.length ? (
                    summary.improvements.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li>No improvement opportunities flagged.</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-rose-500 dark:text-rose-400">
                  Anomalies
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {summary.anomalies.length ? (
                    summary.anomalies.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li>No anomalies detected.</li>
                  )}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No AI summary is available yet for this configuration—generate one to get insight.
          </p>
        )}
      </div>
    </section>
  );
}

function ComparisonSection({
  comparison,
  loading,
  onRefresh,
}: {
  comparison: PerformanceComparison | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-slate-950/50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Period Comparison</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Benchmarks the current window against the immediately previous period of equal length.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void onRefresh()}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
          Refresh Comparison
        </Button>
      </div>
      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Crunching historical comparison…</p>
        ) : comparison ? (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Story Completion Δ
              </dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {comparison.deltas.storyCompletion === null
                  ? "n/a"
                  : `${comparison.deltas.storyCompletion >= 0 ? "+" : ""}${comparison.deltas.storyCompletion.toFixed(1)} pts`}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Velocity Δ</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {comparison.deltas.velocity >= 0 ? "+" : ""}
                {comparison.deltas.velocity}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Hours Logged Δ</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {comparison.deltas.totalHours >= 0 ? "+" : ""}
                {comparison.deltas.totalHours.toFixed(1)}h
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Collaboration Δ</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {comparison.deltas.commentsAuthored >= 0 ? "+" : ""}
                {comparison.deltas.commentsAuthored}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Comparison data is not available yet. Refresh to pull the previous-period baseline.
          </p>
        )}
      </div>
    </section>
  );
}

export function PerformanceReviewView() {
  const { token } = useAuth();
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(defaultRange);

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState<string>("");
  const [notesUpdatedAt, setNotesUpdatedAt] = useState<string | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: projectsData,
    loading: projectsLoading,
    error: projectsError,
  } = useQuery<{ scrumProjects: ScrumProject[] }>(SCRUM_PROJECTS_QUERY, {
    fetchPolicy: "cache-first",
  });

  const projects = projectsData?.scrumProjects ?? [];

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId(null);
      return;
    }
    if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]?.id ?? null);
    }
  }, [projects, selectedProjectId]);

  const [loadTrackedUsers, { data: trackedData, loading: trackedLoading, error: trackedError }] = useLazyQuery<{
    projectTrackedUsers: ProjectTrackedUser[];
  }>(PROJECT_TRACKED_USERS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }
    void loadTrackedUsers({ variables: { projectId: selectedProjectId } });
  }, [selectedProjectId, loadTrackedUsers]);

  const trackedUsers = trackedData?.projectTrackedUsers ?? [];

  useEffect(() => {
    if (!trackedUsers.length) {
      setSelectedUserId(null);
      return;
    }
    if (!selectedUserId || !trackedUsers.some((user) => user.id === selectedUserId)) {
      const firstTracked = trackedUsers.find((user) => user.isTracked) ?? trackedUsers[0];
      setSelectedUserId(firstTracked.id);
    }
  }, [trackedUsers, selectedUserId]);

  useEffect(() => {
    setMetrics(null);
    setSummary(null);
    setComparison(null);
    setNotesDraft("");
    setNotesUpdatedAt(null);
  }, [selectedProjectId, selectedUserId, dateRange.start, dateRange.end]);

  const fetchMetrics = useCallback(async () => {
    if (!token) {
      setMetricsError("Authentication is required to load performance data.");
      return;
    }
    if (!selectedProjectId || !selectedUserId) {
      return;
    }
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const params = new URLSearchParams({
        projectId: selectedProjectId,
        trackedUserId: selectedUserId,
      });
      if (dateRange.start) {
        params.set("start", dateRange.start);
      }
      if (dateRange.end) {
        params.set("end", dateRange.end);
      }
      const data = await apiFetch<{ metrics: PerformanceMetrics }>(`/api/performance/metrics?${params.toString()}`, {
        token,
      });
      setMetrics(data.metrics);
      setNotesDraft(data.metrics.notes.markdown ?? "");
      setNotesUpdatedAt(data.metrics.notes.lastUpdated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load performance metrics.";
      setMetricsError(message);
    } finally {
      setMetricsLoading(false);
    }
  }, [dateRange.end, dateRange.start, selectedProjectId, selectedUserId, token]);

  useEffect(() => {
    if (!selectedProjectId || !selectedUserId || !token) {
      return;
    }
    void fetchMetrics();
  }, [selectedProjectId, selectedUserId, dateRange.start, dateRange.end, refreshKey, fetchMetrics, token]);

  const fetchSummary = useCallback(async () => {
    if (!token || !selectedProjectId || !selectedUserId) {
      return;
    }
    setSummaryLoading(true);
    try {
      const payload = await apiFetch<{ summary: PerformanceSummary }>("/api/performance/summary", {
        method: "POST",
        token,
        body: JSON.stringify({
          projectId: selectedProjectId,
          trackedUserId: selectedUserId,
          start: dateRange.start,
          end: dateRange.end,
        }),
      });
      setSummary(payload.summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate performance summary.";
      setSummary({
        narrative: message,
        strengths: [],
        improvements: [],
        anomalies: [],
      });
    } finally {
      setSummaryLoading(false);
    }
  }, [dateRange.end, dateRange.start, selectedProjectId, selectedUserId, token]);

  useEffect(() => {
    if (!metrics || !token) {
      return;
    }
    void fetchSummary();
  }, [metrics, fetchSummary, token]);

  const handleRefreshMetrics = useCallback(async () => {
    setRefreshKey((value) => value + 1);
    await fetchMetrics();
  }, [fetchMetrics]);

  const handleFetchComparison = useCallback(async () => {
    if (!token || !metrics || !selectedProjectId || !selectedUserId) {
      return;
    }
    const days = metrics.range.days ?? 0;
    const previousRange = computePreviousRange(metrics.range.start, days);
    if (!previousRange) {
      return;
    }
    setComparisonLoading(true);
    try {
      const params = new URLSearchParams({
        projectId: selectedProjectId,
        trackedUserId: selectedUserId,
        currentStart: dateRange.start,
        currentEnd: dateRange.end,
        compareStart: previousRange.start,
        compareEnd: previousRange.end,
      });
      const payload = await apiFetch<{ comparison: PerformanceComparison }>(
        `/api/performance/compare?${params.toString()}`,
        { token },
      );
      setComparison(payload.comparison);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load comparison data.";
      setComparison({
        current: metrics,
        compare: metrics,
        deltas: {
          storyCompletion: null,
          velocity: 0,
          totalHours: 0,
          commentsAuthored: 0,
        },
      });
      console.error(message);
    } finally {
      setComparisonLoading(false);
    }
  }, [dateRange.end, dateRange.start, metrics, selectedProjectId, selectedUserId, token]);

  const handleSaveNotes = useCallback(async () => {
    if (!token || !selectedProjectId || !selectedUserId) {
      return;
    }
    setNotesSaving(true);
    try {
      const payload = await apiFetch<{ note: { markdown: string; updatedAt: string } }>("/api/performance/notes", {
        method: "PUT",
        token,
        body: JSON.stringify({
          projectId: selectedProjectId,
          trackedUserId: selectedUserId,
          start: dateRange.start,
          end: dateRange.end,
          markdown: notesDraft,
        }),
      });
      setNotesDraft(payload.note.markdown);
      setNotesUpdatedAt(payload.note.updatedAt);
    } catch (error) {
      console.error(error);
    } finally {
      setNotesSaving(false);
    }
  }, [dateRange.end, dateRange.start, notesDraft, selectedProjectId, selectedUserId, token]);

  const projectStatusMessage = useMemo(() => {
    if (projectsError) {
      const graphMessage = projectsError.graphQLErrors?.[0]?.message;
      return graphMessage ?? projectsError.message ?? "Unable to load projects.";
    }
    if (trackedError) {
      const graphMessage = trackedError.graphQLErrors?.[0]?.message;
      return graphMessage ?? trackedError.message ?? "Unable to load tracked users.";
    }
    return null;
  }, [projectsError, trackedError]);

  const maxDailyHours = useMemo(() => {
    if (!metrics?.productivity.workConsistency.daily.length) {
      return 0;
    }
    return Math.max(
      ...metrics.productivity.workConsistency.daily.map((entry) => entry.hours),
      0,
    );
  }, [metrics]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-slate-950/50">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Performance Review Mode</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Blend Jira activity, collaboration signals, and AI narratives to prep for 1:1s or quarterly reviews.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void handleRefreshMetrics()} disabled={metricsLoading}>
            {metricsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh Data
          </Button>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Project
            </span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-400 dark:focus:ring-sky-400/40"
              value={selectedProjectId ?? ""}
              onChange={(event) => setSelectedProjectId(event.target.value || null)}
              disabled={projectsLoading}
            >
              {projectsLoading ? <option>Loading…</option> : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} — {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Team Member
            </span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-400 dark:focus:ring-sky-400/40"
              value={selectedUserId ?? ""}
              onChange={(event) => setSelectedUserId(event.target.value || null)}
              disabled={trackedLoading}
            >
              {trackedLoading ? <option>Loading…</option> : null}
              {trackedUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Range Start
            </span>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-400 dark:focus:ring-sky-400/40"
              value={dateRange.start}
              max={dateRange.end}
              onChange={(event) => setDateRange((prev) => ({ ...prev, start: event.target.value }))}
            />
          </label>

  <label className="space-y-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Range End
            </span>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-400 dark:focus:ring-sky-400/40"
              value={dateRange.end}
              min={dateRange.start}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDateRange((prev) => ({ ...prev, end: event.target.value }))}
            />
          </label>
        </div>

        {projectStatusMessage ? (
          <div className="mt-4 flex items-center gap-2 rounded-3xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            <span>{projectStatusMessage}</span>
          </div>
        ) : null}
      </section>

      {metricsError ? (
        <div className="flex items-center justify-between gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/40 dark:bg-rose-950/40 dark:text-rose-100">
          <span>{metricsError}</span>
          <Button type="button" size="sm" variant="secondary" onClick={() => void handleRefreshMetrics()} disabled={metricsLoading}>
            Retry
          </Button>
        </div>
      ) : null}

      {metricsLoading && !metrics ? (
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:shadow-slate-950/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading performance metrics…</span>
        </div>
      ) : null}

      {metrics ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Story Completion"
              value={
                metrics.productivity.storyCompletion.ratio === null
                  ? "n/a"
                  : `${metrics.productivity.storyCompletion.ratio}%`
              }
              sublabel={`${metrics.productivity.storyCompletion.completed}/${metrics.productivity.storyCompletion.committed} issues`}
            />
            <MetricCard
              label="Velocity"
              value={`${metrics.productivity.velocity.totalResolved}`}
              sublabel="Issues resolved this period"
            />
            <MetricCard
              label="Hours Logged"
              value={`${metrics.productivity.workConsistency.totalHours.toFixed(1)}h`}
              sublabel={`Avg ${metrics.productivity.workConsistency.averageHours.toFixed(1)}h • σ ${metrics.productivity.workConsistency.stdDevHours.toFixed(1)}h`}
            />
            <MetricCard
              label="Collaboration"
              value={`${metrics.collaboration.commentsAuthored} comments`}
              sublabel={`${metrics.collaboration.peersInteractedWith} teammates engaged`}
            />
          </section>

          {metrics.warnings.length ? (
            <div className="space-y-2">
              {metrics.warnings.map((warning) => (
                <div
                  key={warning.code}
                  className="flex items-center gap-2 rounded-3xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-100"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>{warning.message}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-slate-950/50 lg:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Daily Worklog Timeline</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tracks consistency of logged effort across the selected range.
              </p>
              <div className="mt-4 space-y-2">
                {metrics.productivity.workConsistency.daily.length ? (
                  metrics.productivity.workConsistency.daily.map((day) => (
                    <TimelineBar
                      key={day.date}
                      date={day.date}
                      hours={day.hours}
                      max={maxDailyHours}
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No worklogs were recorded.</p>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-slate-950/50">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quality Signals</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>Reopened issues: {metrics.quality.reopenCount}</li>
                <li>Bug-type issues: {metrics.quality.bugCount}</li>
                <li>
                  Blocker ownership: {metrics.quality.blockerOwnership.resolved} resolved / {metrics.quality.blockerOwnership.active} active
                </li>
              </ul>
              <div className="mt-4">
                <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Review Highlights
                </h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {metrics.quality.reviewHighlights.length ? (
                    metrics.quality.reviewHighlights.map((highlight) => <li key={highlight}>• {highlight}</li>)
                  ) : (
                    <li>No review feedback snippets captured.</li>
                  )}
                </ul>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-slate-950/50">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Collaboration Pulse</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <MetricCard label="Mentions Received" value={`${metrics.collaboration.mentionsReceived}`} />
              <MetricCard
                label="Cross-Team Links"
                value={`${metrics.collaboration.crossTeamLinks}`}
                sublabel="Issues linked outside project"
              />
              <MetricCard
                label="Response Latency"
                value={
                  metrics.collaboration.responseLatencyHours === null
                    ? "n/a"
                    : `${metrics.collaboration.responseLatencyHours.toFixed(1)}h`
                }
                sublabel="Time to first update after assignment"
              />
              <MetricCard
                label="Peers Engaged"
                value={`${metrics.collaboration.peersInteractedWith}`}
                sublabel="Unique collaborators"
              />
            </div>
          </section>

          <SummarySection summary={summary} loading={summaryLoading} onRefresh={fetchSummary} />

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/40 dark:shadow-slate-950/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Manager Notes</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Capture personal observations to revisit next review cycle.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleSaveNotes()}
                disabled={notesSaving}
              >
                {notesSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Notes
              </Button>
            </div>
            <textarea
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-400 dark:focus:ring-sky-400/40"
              rows={6}
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder="Add highlights, goals, or follow-ups for this person."
            />
            {notesUpdatedAt ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Last saved {formatDateLabel(notesUpdatedAt)}
              </p>
            ) : null}
          </section>

          <ComparisonSection comparison={comparison} loading={comparisonLoading} onRefresh={handleFetchComparison} />
        </>
      ) : null}

      {!metricsLoading && !metrics ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">
          <Users className="h-10 w-10 text-slate-400 dark:text-slate-600" />
          <div className="max-w-xl space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Choose a project, teammate, and range to analyze.
            </h3>
            <p className="text-sm">
              Performance Review Mode surfaces productivity, quality, and collaboration signals once a tracked teammate
              and timeframe are selected.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
