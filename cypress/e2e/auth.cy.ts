const TOKEN_STORAGE_KEY = "jira-plus-plus/token";
const USER_STORAGE_KEY = "jira-plus-plus/user";

describe("Authentication and preferences", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("persists theme preference between sessions", () => {
    cy.visit("/");

    cy.get('button[aria-label="Toggle theme"]').click();

    cy.window().then((win) => {
      const storedTheme = win.localStorage.getItem("jira-plus-plus/theme");
      expect(storedTheme).to.equal("dark");
      expect(win.document.documentElement.classList.contains("dark")).to.equal(true);
    });

    cy.reload();

    cy.window().then((win) => {
      const storedTheme = win.localStorage.getItem("jira-plus-plus/theme");
      expect(storedTheme).to.equal("dark");
      expect(win.document.documentElement.classList.contains("dark")).to.equal(true);
    });
  });

  it("signs in admin users and redirects to the console on success", () => {
    cy.mockGraphql({
      Login: {
        data: {
          login: {
            token: "admin-token",
            user: {
              id: "admin-1",
              email: "admin@example.com",
              displayName: "Admin Jane",
              role: "ADMIN",
            },
          },
        },
      },
      AdminConsoleData: {
        data: {
          users: [
            {
              id: "admin-1",
              email: "admin@example.com",
              displayName: "Admin Jane",
              role: "ADMIN",
              createdAt: new Date().toISOString(),
            },
          ],
          jiraSites: [],
        },
      },
    });

    cy.visit("/");

    cy.get('input[type="email"]').type("admin@example.com");
    cy.get('input[type="password"]').type("password123");
    cy.contains("button", "Sign in").click();

    cy.wait("@gqlLogin");
    cy.location("pathname").should("eq", "/admin");

    cy.window().then((win) => {
      expect(win.localStorage.getItem(TOKEN_STORAGE_KEY)).to.equal("admin-token");
      const user = JSON.parse(win.localStorage.getItem(USER_STORAGE_KEY) ?? "{}");
      expect(user).to.include({ role: "ADMIN", displayName: "Admin Jane" });
    });

    cy.contains("Admin Console").should("exist");
  });

  it("surfaces login errors when credentials are invalid", () => {
    cy.mockGraphql({
      Login: (req) => {
        req.reply({
          statusCode: 200,
          body: {
            errors: [{ message: "Invalid credentials" }],
          },
        });
      },
    });

    cy.visit("/");

    cy.get('input[type="email"]').type("wrong@example.com");
    cy.get('input[type="password"]').type("wrongpass");
    cy.contains("button", "Sign in").click();

    cy.contains("Invalid credentials").should("be.visible");
    cy.location("pathname").should("eq", "/");
  });

  it("logs out and clears session data", () => {
    cy.mockGraphql({
      ScrumProjects: {
        data: {
          scrumProjects: [
            { id: "project-1", key: "PRJ", name: "Project One" },
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
              blockers: "None",
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

    cy.visit("/scrum", {
      onBeforeLoad(win) {
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
      },
    });

    cy.contains("button", /Test User/i).click();
    cy.contains("button", "Sign out").click();

    cy.location("pathname").should("eq", "/");
    cy.window().then((win) => {
      expect(win.localStorage.getItem(TOKEN_STORAGE_KEY)).to.be.null;
      expect(win.localStorage.getItem(USER_STORAGE_KEY)).to.be.null;
    });
  });
});
