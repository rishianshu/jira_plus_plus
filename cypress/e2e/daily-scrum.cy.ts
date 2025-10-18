const TOKEN_STORAGE_KEY = "jira-plus-plus/token";
const USER_STORAGE_KEY = "jira-plus-plus/user";

function authenticate(win: Window) {
  win.localStorage.setItem(TOKEN_STORAGE_KEY, "user-token");
  win.localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify({
      id: "user-1",
      email: "user@example.com",
      displayName: "Test User",
      role: "USER",
    }),
  );
}

describe("Daily Scrum board", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("auto-selects the first project and summary", () => {
    const projects = [
      { id: "project-1", key: "PRJ", name: "Project One" },
      { id: "project-2", key: "PR2", name: "Project Two" },
    ];

    const summaries = [
      {
        id: "summary-1",
        projectId: "project-1",
        project: projects[0],
        trackedUser: {
          id: "tracked-1",
          jiraAccountId: "acct-1",
          displayName: "Alice",
          email: "alice@example.com",
          avatarUrl: null,
          isTracked: true,
        },
        user: {
          id: "user-1",
          displayName: "Alice",
          email: "alice@example.com",
          role: "USER",
        },
        jiraAccountId: "acct-1",
        date: "2024-05-01",
        yesterday: "Wrapped up story ABC-123",
        today: "Start on story ABC-124",
        blockers: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "ON_TRACK",
        worklogHours: 5,
        issueCounts: { todo: 1, inProgress: 2, backlog: 0, done: 4, blocked: 0 },
        workItems: [],
      },
      {
        id: "summary-2",
        projectId: "project-1",
        project: projects[0],
        trackedUser: {
          id: "tracked-2",
          jiraAccountId: "acct-2",
          displayName: "Bob",
          email: "bob@example.com",
          avatarUrl: null,
          isTracked: true,
        },
        user: {
          id: "user-2",
          displayName: "Bob",
          email: "bob@example.com",
          role: "USER",
        },
        jiraAccountId: "acct-2",
        date: "2024-05-01",
        yesterday: "Investigated API latency",
        today: "Profiling GraphQL resolvers",
        blockers: "Awaiting infra fix",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "BLOCKED",
        worklogHours: 3,
        issueCounts: { todo: 2, inProgress: 1, backlog: 1, done: 1, blocked: 2 },
        workItems: [],
      },
    ];

    cy.mockGraphql({
      ScrumProjects: { data: { scrumProjects: projects } },
      DailySummaries: { data: { dailySummaries: summaries } },
    });

    cy.visit("/scrum", { onBeforeLoad: authenticate });
    cy.get("select").first().should("have.value", "project-1");

    cy.contains("button", "Focus Mode").click();
    cy.contains("h3", "Alice").should("be.visible");
  });

  it("refetches summaries when auto-refresh is enabled", () => {
    let fetchCount = 0;

    cy.clock();

    cy.mockGraphql({
      ScrumProjects: {
        data: {
          scrumProjects: [{ id: "project-1", key: "PRJ", name: "Project One" }],
        },
      },
      DailySummaries: (req) => {
        fetchCount += 1;
        const refreshed = fetchCount > 1;
        req.reply({
          body: {
            data: {
              dailySummaries: [
                {
                  id: "summary-1",
                  projectId: "project-1",
                  project: { id: "project-1", key: "PRJ", name: "Project One" },
                  trackedUser: {
                    id: "tracked-1",
                    jiraAccountId: "acct-1",
                    displayName: "Alice",
                    email: "alice@example.com",
                    avatarUrl: null,
                    isTracked: true,
                  },
                  user: {
                    id: "user-1",
                    displayName: "Alice",
                    email: "alice@example.com",
                    role: "USER",
                  },
                  jiraAccountId: "acct-1",
                  date: "2024-05-01",
                  yesterday: "Wrapped up story ABC-123",
                  today: refreshed ? "Paired on code review" : "Start on story ABC-124",
                  blockers: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  status: "ON_TRACK",
                  worklogHours: refreshed ? 6 : 5,
                  issueCounts: { todo: 1, inProgress: 2, backlog: 0, done: refreshed ? 5 : 4, blocked: 0 },
                  workItems: [],
                },
              ],
            },
          },
        });
      },
    });

    cy.visit("/scrum", { onBeforeLoad: authenticate });
    cy.wait("@gqlDailySummaries");

    cy.contains("button", /auto off/i).click();
    cy.contains("button", /auto on/i).should("be.visible");

    cy.tick(60000);
    cy.wait("@gqlDailySummaries");
    cy.wrap(null).should(() => {
      expect(fetchCount).to.be.greaterThan(1);
    });

    cy.contains("Paired on code review").should("be.visible");
  });

  it("regenerates a summary and shows the updated content", () => {
    let regenerated = false;

    const originalSummary = {
      id: "summary-1",
      projectId: "project-1",
      project: { id: "project-1", key: "PRJ", name: "Project One" },
      trackedUser: {
        id: "tracked-1",
        jiraAccountId: "acct-1",
        displayName: "Alice",
        email: "alice@example.com",
        avatarUrl: null,
        isTracked: true,
      },
      user: {
        id: "user-1",
        displayName: "Alice",
        email: "alice@example.com",
        role: "USER",
      },
      jiraAccountId: "acct-1",
      date: "2024-05-01",
      yesterday: "Wrapped up story ABC-123",
      today: "Start on story ABC-124",
      blockers: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "ON_TRACK",
      worklogHours: 5,
      issueCounts: { todo: 1, inProgress: 2, backlog: 0, done: 4, blocked: 0 },
      workItems: [],
    };

    const updatedSummary = {
      ...originalSummary,
      today: "Pairing with Bob on rollout plan",
      updatedAt: new Date(Date.now() + 60000).toISOString(),
    };

    cy.mockGraphql({
      ScrumProjects: {
        data: {
          scrumProjects: [{ id: "project-1", key: "PRJ", name: "Project One" }],
        },
      },
      DailySummaries: (req) => {
        req.reply({
          body: {
            data: {
              dailySummaries: [regenerated ? updatedSummary : originalSummary],
            },
          },
        });
      },
      RegenerateDailySummary: (req) => {
        regenerated = true;
        req.reply({
          body: {
            data: {
              regenerateDailySummary: updatedSummary,
            },
          },
        });
      },
    });

    cy.visit("/scrum", { onBeforeLoad: authenticate });

    cy.contains("button", "Alice").click();
    cy.contains("button", "Regenerate").click();

    cy.wait("@gqlRegenerateDailySummary");
    cy.wait("@gqlDailySummaries");

    cy.contains("Summary regenerated for Alice").should("be.visible");
    cy.contains("Pairing with Bob on rollout plan").should("be.visible");
  });

  it("highlights blocked teammates in the UI", () => {
    cy.mockGraphql({
      ScrumProjects: {
        data: {
          scrumProjects: [{ id: "project-1", key: "PRJ", name: "Project One" }],
        },
      },
      DailySummaries: {
        data: {
          dailySummaries: [
            {
              id: "summary-1",
              projectId: "project-1",
              project: { id: "project-1", key: "PRJ", name: "Project One" },
              trackedUser: {
                id: "tracked-1",
                jiraAccountId: "acct-1",
                displayName: "Charlie",
                email: "charlie@example.com",
                avatarUrl: null,
                isTracked: true,
              },
              user: null,
              jiraAccountId: "acct-1",
              date: "2024-05-01",
              yesterday: "Awaiting review on PR-42",
              today: "Unblocked once API fix lands",
              blockers: "API deployment pending",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: "BLOCKED",
              worklogHours: 2,
              issueCounts: { todo: 0, inProgress: 1, backlog: 1, done: 0, blocked: 3 },
              workItems: [],
            },
          ],
        },
      },
    });

    cy.visit("/scrum", { onBeforeLoad: authenticate });

    cy.contains("Blocked").should("be.visible");
    cy.contains("API deployment pending").should("be.visible");
  });
});
