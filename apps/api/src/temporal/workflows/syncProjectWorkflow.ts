import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/syncActivities.js';

export const SYNC_WORKFLOW_NAME = 'syncProjectWorkflow';

const { prepareProjectSync, syncIssuesBatch, finalizeProjectSync, failProjectSync } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '10 minute',
    // heartbeatTimeout: '5 seconds',
    retry: {
      maximumAttempts: 5,
    },
  });

export interface SyncProjectInput {
  projectId: string;
  fullResync?: boolean;
  accountIds?: string[];
}

export interface SyncCursor {
  nextPageToken: string | null;
  since?: string | null;
  lastUpdatedAt?: string | null;
}

export async function syncProjectWorkflow(input: SyncProjectInput): Promise<void> {
  const config = await prepareProjectSync({
    projectId: input.projectId,
    fullResync: input.fullResync ?? false,
    accountIds: input.accountIds ?? null,
  });

  if (!config.trackedAccountIds.length) {
    await finalizeProjectSync({
      projectId: input.projectId,
      status: 'SUCCESS',
      lastUpdatedAt: config.since ?? null,
      message: 'No tracked Jira users. Skipping sync.',
    });
    return;
  }

  let cursor: SyncCursor = {
    nextPageToken: null,
    since: config.since ?? null,
    lastUpdatedAt: config.since ?? null,
  };

  try {
    // Each loop retrieves up to 100 issues.
    // The activity returns whether more data is available and the updated cursor.
    let hasMore = true;
    while (hasMore) {
      const result = await syncIssuesBatch({
        ...config,
        cursor,
      });


      hasMore = result.hasMore;
      cursor = {
        nextPageToken: result.nextPageToken ?? null,
        since: config.since ?? null,
        lastUpdatedAt: result.lastUpdatedAt ?? cursor.lastUpdatedAt ?? config.since ?? null,
      };

      if (hasMore) {
        // reset pagination if Jira response indicates we've consumed the window
        if (!result.hasMore) {
          hasMore = false;
        }
      }
    }

    await finalizeProjectSync({
      projectId: input.projectId,
      status: 'SUCCESS',
      lastUpdatedAt: cursor.lastUpdatedAt ?? config.since ?? null,
      message: 'Sync completed successfully',
    });
  } catch (error) {
    await failProjectSync({
      projectId: input.projectId,
      error: error instanceof Error ? error.message : 'Unknown sync error',
    });
    throw error;
  }
}
