const TOKEN_STORAGE_KEY = "jira-plus-plus/token";

describe("Navigation and access control", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("shows only Home nav when unauthenticated", () => {
    cy.visit("/");
    cy.contains("nav", "Home").should("exist");
    cy.contains("nav", "Daily Scrum").should("not.exist");
    cy.contains("nav", "Developer Focus").should("not.exist");

    // Visiting secure route should redirect back to home
    cy.visit("/scrum");
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
  });

  it("shows user navigation when authenticated", () => {
    cy.mockGraphql({
      ScrumProjects: {
        data: {
          scrumProjects: [
            { id: "project-1", key: "PRJ", name: "Project One" },
            { id: "project-2", key: "PR2", name: "Project Two" },
          ],
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
                displayName: "Alice",
                email: "alice@example.com",
                avatarUrl: null,
                isTracked: true,
              },
              user: {
                id: "user-1",
                displayName: "Test User",
                email: "user@example.com",
                role: "USER",
              },
              jiraAccountId: "acct-1",
              date: "2024-05-01",
              yesterday: "Worked on feature X",
              today: "Continue feature X",
              blockers: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: "ON_TRACK",
              worklogHours: 4,
              issueCounts: { todo: 1, inProgress: 2, backlog: 0, done: 3, blocked: 0 },
              workItems: [],
            },
          ],
        },
      },
    });

    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          TOKEN_STORAGE_KEY,
          "test-token",
        );
        win.localStorage.setItem(
          "jira-plus-plus/user",
          JSON.stringify({
            id: "user-1",
            email: "user@example.com",
            displayName: "Test User",
            role: "USER",
          }),
        );
      },
    });

    cy.contains("nav", "Home").should("exist");
    cy.contains("nav", "Daily Scrum").should("exist");
    cy.contains("nav", "Developer Focus").should("exist");
    cy.contains("nav", "Manager Summary").should("not.exist");
    cy.contains("nav", "Admin Console").should("not.exist");

    cy.visit("/scrum");
    cy.url().should("contain", "/scrum");
  });

  it("grants admin console to admin role", () => {
    cy.mockGraphql({
      AdminConsoleData: {
        data: {
          users: [
            { id: "admin-1", email: "admin@example.com", displayName: "Admin", role: "ADMIN", createdAt: new Date().toISOString() },
          ],
          jiraSites: [],
        },
      },
    });

    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          TOKEN_STORAGE_KEY,
          "test-token",
        );
        win.localStorage.setItem(
          "jira-plus-plus/user",
          JSON.stringify({
            id: "admin-1",
            email: "admin@example.com",
            displayName: "Admin",
            role: "ADMIN",
          }),
        );
      },
    });

    cy.contains("nav", "Admin Console").should("exist");
    cy.visit("/admin");
    cy.url().should("contain", "/admin");
  });

  it("shows manager navigation when manager role", () => {
    cy.mockGraphql({});

    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem(TOKEN_STORAGE_KEY, "manager-token");
        win.localStorage.setItem(
          "jira-plus-plus/user",
          JSON.stringify({
            id: "manager-1",
            email: "manager@example.com",
            displayName: "Manager",
            role: "MANAGER",
          }),
        );
      },
    });

    cy.contains("nav", "Daily Scrum").should("exist");
    cy.contains("nav", "Developer Focus").should("exist");
    cy.contains("nav", "Manager Summary").should("exist");
    cy.contains("nav", "Admin Console").should("not.exist");

    cy.visit("/manager");
    cy.url().should("contain", "/manager");
  });
});
