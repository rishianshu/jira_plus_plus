import { describe, expect, it } from "vitest";
import { classifyJiraError } from "./errorClassifier.js";

describe("classifyJiraError", () => {
  it("maps suspended payment responses to non-retryable errors", () => {
    const result = classifyJiraError(
      403,
      { errorCode: "SUSPENDED_PAYMENT", errorMessage: "Billing issue" },
      "Forbidden",
    );
    expect(result.code).toBe("SUSPENDED_PAYMENT");
    expect(result.retryable).toBe(false);
    expect(result.message).toContain("Billing issue");
  });

  it("treats network failures as retryable network errors", () => {
    const result = classifyJiraError(null, { errorMessage: "Network unreachable" }, "Fetch failed");
    expect(result.code).toBe("NETWORK");
    expect(result.retryable).toBe(true);
    expect(result.message).toContain("Network unreachable");
  });

  it("classifies rate limit responses as retryable warnings", () => {
    const result = classifyJiraError(429, { errorCode: "RATE_LIMIT" }, "Too many requests");
    expect(result.code).toBe("RATE_LIMIT");
    expect(result.retryable).toBe(true);
    expect(result.severity).toBe("WARN");
  });

  it("classifies server errors as retryable", () => {
    const result = classifyJiraError(500, null, "Internal error");
    expect(result.code).toBe("SERVER_ERROR");
    expect(result.retryable).toBe(true);
  });

  it("classifies bad requests as non-retryable", () => {
    const result = classifyJiraError(400, null, "Bad request");
    expect(result.code).toBe("BAD_REQUEST");
    expect(result.retryable).toBe(false);
  });
});
