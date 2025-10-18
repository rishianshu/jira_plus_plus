const TOKEN_STORAGE_KEY = "jira-plus-plus/token";
const USER_STORAGE_KEY = "jira-plus-plus/user";

function authenticate(win: Window) {
  win.localStorage.setItem(TOKEN_STORAGE_KEY, "user-token");
  win.localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify({
      id: "user-1",
      email: "user@example.com",
      displayName: "Focus User",
      role: "USER",
    }),
  );
}

const baseProjects = [
  { id: "project-1", key: "PRJ", name: "Project One" },
  { id: "project-2", key: "PR2", name: "Project Two" },
];

function buildBoard(overrides: Partial<ReturnType<typeof baseBoard>> = {}) {
  return { focusBoard: { ...baseBoard(), ...overrides } };
}

function baseBoard() {
  return {
    projects: baseProjects,
    issues: [
      {
        id: "issue-1",
        key: "PRJ-1",
        summary: "Implement authentication flow",
        status: "In Progress",
        browseUrl: null,
        priority: "High",
        jiraUpdatedAt: "2024-05-01T10:00:00.000Z",
        project: baseProjects[0],
      },
    ],
    blockers: [
      {
        id: "issue-2",
        key: "PRJ-2",
        summary: "Dependency blocked by infra",
        status: "Blocked",
        browseUrl: null,
        priority: "Highest",
        jiraUpdatedAt: "2024-05-01T11:00:00.000Z",
        project: baseProjects[0],
      },
    ],
    comments: [
      {
        id: "comment-1",
        body: "Investigated root cause of latency spike.",
        jiraCreatedAt: "2024-05-01T09:30:00.000Z",
        issue: {
          id: "issue-1",
          key: "PRJ-1",
          summary: "Implement authentication flow",
          status: "In Progress",
          browseUrl: null,
          priority: "High",
          jiraUpdatedAt: "2024-05-01T10:00:00.000Z",
          project: baseProjects[0],
        },
        author: {
          id: "author-1",
          displayName: "Focus User",
          avatarUrl: null,
        },
      },
    ],
    issueEvents: [
      {
        issueId: "issue-1",
        events: [
          {
            id: "event-1",
            type: "WORKLOG",
            occurredAt: "2024-05-01T08:00:00.000Z",
            body: null,
            hours: 2,
            author: {
              id: "author-1",
              displayName: "Focus User",
              avatarUrl: null,
            },
          },
          {
            id: "event-2",
            type: "COMMENT",
            occurredAt: "2024-05-01T09:45:00.000Z",
            body: "Need clarification from design.",
            hours: null,
            author: {
              id: "author-2",
              displayName: "Reviewer",
              avatarUrl: null,
            },
          },
        ],
      },
    ],
    worklogTimeline: [
      { date: "2024-04-26", hours: 4 },
      { date: "2024-04-27", hours: 5.5 },
    ],
    metrics: {
      totalIssues: 5,
      inProgressIssues: 2,
      blockerIssues: 1,
      hoursLogged: 32,
      averageHoursPerDay: 6.4,
    },
    warnings: [],
    dateRange: { start: "2024-04-26", end: "2024-05-01" },
    updatedAt: "2024-05-01T12:00:00.000Z",
  };
}

describe("Developer Focus board", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("updates metrics when project filters change", () => {
    cy.mockGraphql({
      FocusBoard: (req) => {
        const projectIds = req.body.variables?.projectIds;
        if (Array.isArray(projectIds) && projectIds[0] === "project-2") {
          return {
            data: buildBoard({
              metrics: {
                totalIssues: 2,
                inProgressIssues: 1,
                blockerIssues: 0,
                hoursLogged: 12,
                averageHoursPerDay: 4,
              },
              issues: [
                {
                  id: "issue-3",
                  key: "PR2-7",
                  summary: "Refactor analytics module",
                  status: "In Progress",
                  browseUrl: null,
                  priority: "Medium",
                  jiraUpdatedAt: "2024-05-01T13:00:00.000Z",
                  project: baseProjects[1],
                },
              ],
              blockers: [],
            }),
          };
        }

        return { data: buildBoard() };
      },
    });

    cy.visit("/focus", { onBeforeLoad: authenticate });

    cy.contains("Total Issues").parents("article").find("p").eq(1).should("have.text", "5");

    cy.get("select").first().select("PR2 · Project Two");
    cy.wait("@gqlFocusBoard");

    cy.contains("Total Issues").parents("article").find("p").eq(1).should("have.text", "2");
  });

  it("shows issue timelines when a card is expanded", () => {
    cy.mockGraphql({
      FocusBoard: { data: buildBoard() },
    });

    cy.visit("/focus", { onBeforeLoad: authenticate });

    cy.contains("button", "PRJ-1").click();

    cy.contains("Timeline").should("be.visible");
    cy.contains("Need clarification from design.").should("be.visible");
  });

  it("surfaces API errors and retries successfully", () => {
    let attempts = 0;

    cy.mockGraphql({
      FocusBoard: (req) => {
        attempts += 1;
        if (attempts === 1) {
          req.reply({
            statusCode: 200,
            body: {
              errors: [{ message: "Focus board service unavailable" }],
            },
          });
          return;
        }

        req.reply({
          body: {
            data: buildBoard({
              metrics: {
                totalIssues: 4,
                inProgressIssues: 2,
                blockerIssues: 1,
                hoursLogged: 28,
                averageHoursPerDay: 5.6,
              },
            }),
          },
        });
      },
    });

    cy.visit("/focus", { onBeforeLoad: authenticate });

    cy.contains("Focus board service unavailable").should("be.visible");
    cy.contains("button", "Retry").click();
    cy.wait("@gqlFocusBoard");
    cy.contains("Focus board service unavailable").should("not.exist");
    cy.contains("Total Issues").parents("article").find("p").eq(1).should("have.text", "4");
  });
});
