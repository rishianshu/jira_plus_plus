import { useMemo, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { FocusHeader, FocusDashboard, FocusIssueList, FocusComments, WorklogTimeline } from "../components/focus";
import type { FocusBoardData } from "../types/focus";

const FOCUS_BOARD_QUERY = gql`
  query FocusBoard($projectIds: [ID!], $start: Date, $end: Date) {
    focusBoard(projectIds: $projectIds, start: $start, end: $end) {
      projects {
        id
        key
        name
      }
      issues {
        id
        key
        summary
        status
        browseUrl
        priority
        jiraUpdatedAt
        project {
          id
          key
          name
        }
      }
      blockers {
        id
        key
        summary
        status
        browseUrl
        priority
        jiraUpdatedAt
        project {
          id
          key
          name
        }
      }
      comments {
        id
        body
        jiraCreatedAt
        author {
          id
          displayName
          avatarUrl
        }
        issue {
          id
          key
          summary
          status
          browseUrl
          priority
          jiraUpdatedAt
          project {
            id
            key
            name
          }
        }
      }
      worklogTimeline {
        date
        hours
      }
      metrics {
        totalIssues
        inProgressIssues
        blockerIssues
        hoursLogged
        averageHoursPerDay
      }
      dateRange {
        start
        end
      }
      updatedAt
    }
  }
`;

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function FocusPage() {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(defaultRange);

  const variables = useMemo(
    () => ({
      projectIds: selectedProjectId ? [selectedProjectId] : null,
      start: dateRange.start,
      end: dateRange.end,
    }),
    [selectedProjectId, dateRange],
  );

  const { data, previousData, loading, refetch } = useQuery<{ focusBoard: FocusBoardData }>(FOCUS_BOARD_QUERY, {
    variables,
    fetchPolicy: "cache-and-network",
  });

  const board = data?.focusBoard ?? previousData?.focusBoard;

  const handleRefresh = () => {
    void refetch(variables);
  };

  return (
    <section className="space-y-6">
      <FocusHeader
        projects={board?.projects ?? []}
        selectedProjectId={selectedProjectId}
        startDate={dateRange.start}
        endDate={dateRange.end}
        onProjectChange={setSelectedProjectId}
        onDateChange={(next) => setDateRange(next)}
        onRefresh={handleRefresh}
        isRefreshing={loading}
      />

      {!board ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:shadow-slate-950/40">
          {loading ? "Loading your focus board…" : "No data available for the selected filters."}
        </div>
      ) : (
        <>
          <FocusDashboard metrics={board.metrics} />
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <FocusIssueList
                issues={board.issues}
                title="My Assigned Issues"
                emptyState="No assigned issues were found across your projects."
              />
              <FocusIssueList
                issues={board.blockers}
                title="Blockers"
                emptyState="Great news—no blockers detected for this time range."
              />
            </div>
            <div className="space-y-6">
              <FocusComments comments={board.comments} />
              <WorklogTimeline timeline={board.worklogTimeline} />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Updated {new Date(board.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
