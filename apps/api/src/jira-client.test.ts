import { afterEach, describe, expect, it, vi } from "vitest";
import { JiraClientError, searchJiraIssues } from "./jira-client.js";

describe("searchJiraIssues", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("classifies suspended subscription errors", async () => {
    const mockResponse = {
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          errorCode: "SUSPENDED_PAYMENT",
          errorMessage: "Your Atlassian Cloud subscription requires renewal",
        }),
      ),
    } as unknown as Response;

    vi.spyOn(global, "fetch").mockResolvedValue(mockResponse);

    await expect(
      searchJiraIssues({
        baseUrl: "https://example.atlassian.net",
        adminEmail: "admin@example.com",
        token: "token",
        jql: "project = TEST",
      }),
    ).rejects.toBeInstanceOf(JiraClientError);

    try {
      await searchJiraIssues({
        baseUrl: "https://example.atlassian.net",
        adminEmail: "admin@example.com",
        token: "token",
        jql: "project = TEST",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(JiraClientError);
      const jiraError = error as JiraClientError;
      expect(jiraError.classification.code).toBe("SUSPENDED_PAYMENT");
      expect(jiraError.classification.retryable).toBe(false);
    }
  });
});
