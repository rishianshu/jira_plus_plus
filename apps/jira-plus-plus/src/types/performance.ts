export interface PerformanceMetrics {
  range: { start: string; end: string; days: number };
  trackedUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    jiraAccountId: string;
  };
  project: {
    id: string;
    key: string;
    name: string;
  };
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
    blockerOwnership: { resolved: number; active: number };
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
