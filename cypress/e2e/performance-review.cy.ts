const TOKEN_STORAGE_KEY = "jira-plus-plus/token";
const USER_STORAGE_KEY = "jira-plus-plus/user";

function authenticate(win: Window) {
  win.localStorage.setItem(TOKEN_STORAGE_KEY, "manager-token");
  win.localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify({
      id: "user-1",
      email: "manager@example.com",
      displayName: "Manager User",
      role: "USER",
    }),
  );
}

const projects = [
  { id: "project-1", key: "PRJ", name: "Project One" },
  { id: "project-2", key: "PR2", name: "Project Two" },
];

const trackedUsers = [
  { id: "tracked-1", displayName: "Alice Smith", email: "alice@example.com", avatarUrl: null, isTracked: true },
  { id: "tracked-2", displayName: "Bob Lee", email: "bob@example.com", avatarUrl: null, isTracked: false },
];

const metricsPayload = {
  metrics: {
    range: { start: "2024-04-24", end: "2024-05-07", days: 14 },
    trackedUser: {
      id: "tracked-1",
      displayName: "Alice Smith",
      avatarUrl: null,
      jiraAccountId: "acct-1",
    },
    project: projects[0],
    productivity: {
      storyCompletion: { committed: 12, completed: 10, ratio: 0.83 },
      velocity: {
        totalResolved: 18,
        weekly: [
          { weekStart: "2024-04-22", resolved: 9 },
          { weekStart: "2024-04-29", resolved: 9 },
        ],
      },
      workConsistency: {
        totalHours: 52,
        averageHours: 5.2,
        stdDevHours: 1.1,
        daily: [
          { date: "2024-04-29", hours: 4.5 },
          { date: "2024-04-30", hours: 6.2 },
        ],
      },
      predictability: { ratio: 0.9 },
    },
    quality: {
      reopenCount: 1,
      bugCount: 2,
      blockerOwnership: { resolved: 1, active: 0 },
      reviewHighlights: ["Great async alignment with design", "Mentored junior dev on PRs"],
    },
    collaboration: {
      commentsAuthored: 14,
      mentionsReceived: 3,
      crossTeamLinks: 2,
      responseLatencyHours: 2.5,
      peersInteractedWith: 6,
    },
    notes: {
      markdown: "Existing coaching notes.",
      lastUpdated: "2024-05-01T12:00:00.000Z",
    },
    warnings: [],
  },
};

const summaryPayload = {
  summary: {
    narrative: "Alice maintained steady throughput with high collaboration scores.",
    strengths: ["Consistently unblocked teammates", "High code review engagement"],
    improvements: ["Reduce work-in-progress overlap"],
    anomalies: [],
  },
};

const comparisonPayload = {
  comparison: {
    current: metricsPayload.metrics,
    compare: metricsPayload.metrics,
    deltas: {
      storyCompletion: 4.5,
      velocity: 2,
      totalHours: 6.5,
      commentsAuthored: 3,
    },
  },
};

describe("Performance review mode", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("loads metrics for the default teammate and saves notes", () => {
    cy.mockGraphql({
      ScrumProjectsForPerformance: { data: { scrumProjects: projects } },
      ProjectTrackedUsersForPerformance: { data: { projectTrackedUsers: trackedUsers } },
    });

    cy.intercept("GET", "**/api/performance/metrics**", (req) => {
      req.reply({ statusCode: 200, body: metricsPayload });
    }).as("getMetrics");

    cy.intercept("POST", "**/api/performance/summary", (req) => {
      req.reply({ statusCode: 200, body: summaryPayload });
    }).as("postSummary");

    const updatedNotes = {
      note: {
        markdown: "Updated notes after 1:1.",
        updatedAt: "2024-05-03T10:00:00.000Z",
      },
    };

    cy.intercept("PUT", "**/api/performance/notes", (req) => {
      req.reply({ statusCode: 200, body: updatedNotes });
    }).as("putNotes");

    cy.visit("/manager", { onBeforeLoad: authenticate });

    cy.contains("Performance Review").click();

    cy.wait("@getMetrics");
    cy.wait("@postSummary");

    cy.get("select").first().should("have.value", "project-1");
    cy.get("select").eq(1).should("have.value", "tracked-1");

    cy.contains("Mentions Received").siblings("p").first().should("have.text", "3");
    cy.get("textarea").should("have.value", "Existing coaching notes.");
    cy.contains("Alice maintained steady throughput").should("be.visible");

    cy.get("textarea").clear().type("Updated notes after 1:1.");
    cy.contains("button", "Save Notes").click();
    cy.wait("@putNotes");
    cy.contains("Last saved").invoke("text").should((text) => {
      expect(text.trim()).to.have.length.greaterThan(10);
    });
  });

  it("recovers from metrics failures and refreshes comparison data", () => {
    let metricsAttempts = 0;

    cy.mockGraphql({
      ScrumProjectsForPerformance: { data: { scrumProjects: projects } },
      ProjectTrackedUsersForPerformance: { data: { projectTrackedUsers: trackedUsers } },
    });

    cy.intercept("GET", "**/api/performance/metrics**", (req) => {
      metricsAttempts += 1;
      if (metricsAttempts === 1) {
        req.reply({ statusCode: 503, body: { error: "Metrics service unavailable" } });
        return;
      }
      req.reply({ statusCode: 200, body: metricsPayload });
    }).as("getMetrics");

    cy.intercept("POST", "**/api/performance/summary", (req) => {
      req.reply({ statusCode: 200, body: summaryPayload });
    }).as("postSummary");

    cy.intercept("GET", "**/api/performance/compare**", (req) => {
      req.reply({ statusCode: 200, body: comparisonPayload });
    }).as("getComparison");

    cy.visit("/manager", { onBeforeLoad: authenticate });
    cy.contains("Performance Review").click();

    cy.wait("@getMetrics");
    cy.contains("Metrics service unavailable").should("be.visible");

    cy.contains("button", "Refresh Data").click();
    cy.wait("@getMetrics");
    cy.wait("@postSummary");
    cy.contains("Metrics service unavailable").should("not.exist");

    cy.contains("button", "Refresh Comparison").click();
    cy.wait("@getComparison");
    cy.contains("Story Completion Δ").siblings("dd").should("contain.text", "+4.5");
  });
});
