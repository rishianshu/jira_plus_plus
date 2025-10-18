// Cypress support file

const TOKEN_STORAGE_KEY = "jira-plus-plus/token";
const USER_STORAGE_KEY = "jira-plus-plus/user";

Cypress.Commands.add("setAuth", (user) => {
  const payload = {
    id: user.id ?? "user-1",
    email: user.email ?? "user@example.com",
    displayName: user.displayName ?? "Test User",
    role: user.role ?? "USER",
  };

  const token = user.token ?? "test-token";

  cy.window().then((win) => {
    win.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    win.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload));
  });
});

Cypress.Commands.add("clearAuth", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem(TOKEN_STORAGE_KEY);
    win.localStorage.removeItem(USER_STORAGE_KEY);
  });
});

type GraphQLResponder =
  | ((req: Cypress.Interception) => void | { data?: unknown; errors?: unknown })
  | { data?: unknown; errors?: unknown };

declare global {
  namespace Cypress {
    interface Chainable {
      setAuth(user: {
        id?: string;
        email?: string;
        displayName?: string;
        role?: "ADMIN" | "USER";
        token?: string;
      }): Chainable<void>;
      clearAuth(): Chainable<void>;
      mockGraphql(handlers: Record<string, GraphQLResponder | undefined>): Chainable<void>;
    }
  }
}

function extractOperationName(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const operationName = (body as Record<string, unknown>).operationName;
  if (typeof operationName === "string" && operationName.length) {
    return operationName;
  }
  const query = (body as Record<string, unknown>).query;
  if (typeof query === "string") {
    const match = query.match(/(?:query|mutation)\s+([A-Za-z0-9_]+)/);
    if (match) {
      return match[1];
    }
  }
  return null;
}

Cypress.Commands.add("mockGraphql", (handlers) => {
  cy.intercept("POST", "**/graphql", (req) => {
    const operationName = extractOperationName(req.body) ?? "UnknownOperation";
    req.alias = `gql${operationName}`;
    const handler = handlers[operationName];
    if (!handler) {
      req.reply({ body: { data: {} } });
      return;
    }

    if (typeof handler === "function") {
      const maybeResponse = handler(req);
      if (maybeResponse !== undefined) {
        req.reply({ body: maybeResponse });
      }
      return;
    }

    req.reply({ body: handler });
  });
});

export {};
