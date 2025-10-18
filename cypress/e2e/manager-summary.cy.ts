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

const projects = [{ id: "project-1", key: "PRJ", name: "Project One" }];

const sprints = [
  {
    id: "sprint-1",
    name: "Sprint 42",
    state: "CLOSED",
    startDate: "2024-04-10",
    endDate: "2024-04-23",
  },
  {
    id: "sprint-2",
    name: "Sprint 43",
    state: "ACTIVE",
    startDate: "2024-04-24",
    endDate: "2024-05-07",
  },
];

function summaryForSprint(sprintId: string, overrides: Partial<ManagerSummaryResponse> = {}): ManagerSummaryResponse {
  const base: ManagerSummaryResponse = {
    project: projects[0],
    sprint: sprints.find((sprint) => sprint.id === sprintId) ?? null,
    range: {
      start: "2024-04-24",
      end: "2024-05-07",
    },
    totals: {
      committedIssues: sprintId === "sprint-1" ? 20 : 18,
      completedIssues: sprintId === "sprint-1" ? 15 : 9,
      completionPercent: sprintId === "sprint-1" ? 75 : 50,
      velocity: sprintId === "sprint-1" ? 12 : 9,
      activeBlockers: sprintId === "sprint-1" ? 1 : 3,
      riskLevel: sprintId === "sprint-1" ? "Medium" : "High",
      riskReason: sprintId === "sprint-1" ? "Scope adjusted mid-sprint" : "Blockers trending upward",
      timeProgressPercent: 60,
    },
    kpis: [
      {
        id: "kpi-committed",
        label: "Committed",
        value: sprintId === "sprint-1" ? 20 : 18,
        formattedValue: null,
        subtitle: "Issues",
        delta: sprintId === "sprint-1" ? 5 : -2,
        trendLabel: sprintId === "sprint-1" ? "Up vs prior sprint" : "Down vs prior sprint",
      },
      {
        id: "kpi-completed",
        label: "Completed",
        value: sprintId === "sprint-1" ? 15 : 9,
        formattedValue: null,
        subtitle: "Issues done",
        delta: sprintId === "sprint-1" ? 2 : -4,
        trendLabel: null,
      },
      {
        id: "kpi-velocity",
        label: "Velocity",
        value: sprintId === "sprint-1" ? 12 : 9,
        formattedValue: `${sprintId === "sprint-1" ? 12 : 9} pts`,
        subtitle: "per sprint",
        delta: sprintId === "sprint-1" ? 1 : -3,
        trendLabel: null,
      },
      {
        id: "kpi-blockers",
        label: "Blockers",
        value: sprintId === "sprint-1" ? 1 : 3,
        formattedValue: null,
        subtitle: "active issues",
        delta: sprintId === "sprint-1" ? -1 : 2,
        trendLabel: null,
      },
    ],
    blockers: [
      {
        issue: {
          id: "issue-1",
          key: "PRJ-10",
          summary: "Deployment pipeline stalled",
          status: "Blocked",
          priority: "High",
          jiraUpdatedAt: "2024-05-01T10:00:00.000Z",
          browseUrl: null,
        },
        assignee: {
          id: "user-2",
          displayName: "Dev One",
          avatarUrl: null,
        },
        status: "Blocked",
        priority: "High",
        daysOpen: sprintId === "sprint-1" ? 2 : 4,
      },
    ],
    aiSummary: {
      headline: sprintId === "sprint-1" ? "Team recovering velocity" : "Blockers threaten completion",
      body:
        sprintId === "sprint-1"
          ? "Sprint 42 finished strong after trimming scope, but focus on closing active blockers."
          : "Sprint 43 is trending behind due to external dependencies; unblock critical issues to recover.",
      highlights: ["Velocity improving", "Scope stabilized", "Monitor blockers"],
    },
    warnings: sprintId === "sprint-1" ? [] : [{ code: "BLOCKERS_UP", message: "Blockers increased week over week." }],
    updatedAt: sprintId === "sprint-1" ? "2024-05-01T12:00:00.000Z" : "2024-05-02T09:30:00.000Z",
  };

  return { ...base, ...overrides };
}

interface ManagerSummaryResponse {
  project: typeof projects[number];
  sprint: (typeof sprints)[number] | null;
  range: { start: string; end: string };
  totals: {
    committedIssues: number;
    completedIssues: number;
    completionPercent: number | null;
    velocity: number;
    activeBlockers: number;
    riskLevel: string;
    riskReason: string | null;
    timeProgressPercent: number | null;
  };
  kpis: Array<{
    id: string;
    label: string;
    value: number | null;
    formattedValue: string | null;
    subtitle: string | null;
    delta: number | null;
    trendLabel: string | null;
  }>;
  blockers: Array<{
    issue: {
      id: string;
      key: string;
      summary: string | null;
      status: string;
      priority: string | null;
      jiraUpdatedAt: string;
      browseUrl: string | null;
    };
    assignee: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    } | null;
    status: string | null;
    priority: string | null;
    daysOpen: number;
  }>;
  aiSummary: {
    headline: string;
    body: string;
    highlights: string[];
  } | null;
  warnings: Array<{ code: string; message: string }>;
  updatedAt: string;
}

describe("Manager summary board", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("defaults to the active sprint and updates KPIs when the selection changes", () => {
    cy.mockGraphql({
      ManagerScrumProjects: { data: { scrumProjects: projects } },
      ManagerProjectSprints: { data: { projectSprints: sprints } },
      ManagerSummary: (req) => {
        const sprintId = req.body.variables?.sprintId ?? "sprint-2";
        req.reply({
          body: {
            data: {
              managerSummary: summaryForSprint(sprintId || "sprint-2"),
            },
          },
        });
      },
    });

    cy.visit("/manager", { onBeforeLoad: authenticate });

    cy.wait("@gqlManagerSummary");

    cy.get("select").first().should("have.value", "project-1");
    cy.get("select").eq(1).should("have.value", "sprint-2");
    cy.contains("Committed").siblings("p").first().should("have.text", "18");

    cy.get("select").eq(1).select("Sprint 42");
    cy.wait("@gqlManagerSummary");

    cy.contains("Committed").siblings("p").first().should("have.text", "20");
    cy.contains("Medium").should("be.visible");
  });

  it("handles refreshes, warnings, and error recovery", () => {
    let refreshed = false;
    let attempts = 0;

    cy.mockGraphql({
      ManagerScrumProjects: { data: { scrumProjects: projects } },
      ManagerProjectSprints: { data: { projectSprints: sprints } },
      ManagerSummary: (req) => {
        attempts += 1;
        if (attempts === 1) {
          req.reply({
            statusCode: 200,
            body: {
              errors: [{ message: "Unable to load manager summary." }],
            },
          });
          return;
        }

        const data = summaryForSprint("sprint-2", refreshed ? { updatedAt: "2024-05-02T12:00:00.000Z" } : {});
        req.reply({
          body: {
            data: {
              managerSummary: data,
            },
          },
        });
      },
    });

    cy.visit("/manager", { onBeforeLoad: authenticate });

    cy.contains("Unable to load manager summary.").should("be.visible");
    cy.contains("button", "Retry").click();
    cy.wait("@gqlManagerSummary");

    cy.contains("Blockers increased week over week.").should("be.visible");

    cy.contains(/Updated/).invoke("text").then((initialText) => {
      refreshed = true;
      cy.contains("button", "Refresh Data").click();
      cy.wait("@gqlManagerSummary");
      cy.contains(/Updated/).invoke("text").should((updatedText) => {
        expect(updatedText).to.not.equal(initialText);
      });
    });
  });
});
