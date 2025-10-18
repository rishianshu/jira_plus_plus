export type JiraErrorCode =
  | "SUSPENDED_PAYMENT"
  | "UNAUTHORIZED"
  | "RATE_LIMIT"
  | "NETWORK"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "BAD_REQUEST"
  | "UNKNOWN";

export interface JiraErrorClassification {
  code: JiraErrorCode;
  status: number | null;
  message: string;
  retryable: boolean;
  severity: "INFO" | "WARN" | "ERROR";
}

interface AtlassianErrorPayload {
  errorCode?: string;
  errorMessage?: string;
  errors?: unknown;
}

function mapCodeFromAtlassian(code?: string): JiraErrorCode | null {
  switch (code) {
    case "SUSPENDED_PAYMENT":
      return "SUSPENDED_PAYMENT";
    case "AUTHENTICATION_DENIED":
    case "AUTHENTICATING_PROXY_DENIED":
      return "UNAUTHORIZED";
    case "RATE_LIMIT_EXCEEDED":
    case "RATE_LIMIT":
      return "RATE_LIMIT";
    default:
      return null;
  }
}

export function classifyJiraError(
  status: number | null,
  payload: AtlassianErrorPayload | null,
  fallbackMessage: string,
): JiraErrorClassification {
  const defaultClassification: JiraErrorClassification = {
    code: "UNKNOWN",
    status,
    message: payload?.errorMessage ?? fallbackMessage,
    retryable: true,
    severity: "ERROR",
  };

  if (status === null) {
    return {
      ...defaultClassification,
      code: "NETWORK",
      message: payload?.errorMessage ?? "Network error while contacting Jira",
    };
  }

  const mapped = mapCodeFromAtlassian(payload?.errorCode);
  if (mapped === "SUSPENDED_PAYMENT") {
    return {
      code: mapped,
      status,
      message: payload?.errorMessage ?? "Jira subscription suspended",
      retryable: false,
      severity: "ERROR",
    };
  }

  if (mapped === "RATE_LIMIT") {
    return {
      code: "RATE_LIMIT",
      status,
      message: payload?.errorMessage ?? "Rate limit reached",
      retryable: true,
      severity: "WARN",
    };
  }

  if (mapped === "UNAUTHORIZED") {
    return {
      code: "UNAUTHORIZED",
      status,
      message: payload?.errorMessage ?? "Unauthorized Jira credentials",
      retryable: false,
      severity: "ERROR",
    };
  }

  switch (status) {
    case 400:
      return { ...defaultClassification, code: "BAD_REQUEST", retryable: false };
    case 401:
    case 403:
      return {
        ...defaultClassification,
        code: "UNAUTHORIZED",
        retryable: false,
        message: payload?.errorMessage ?? "Unauthorized Jira credentials",
      };
    case 404:
      return {
        ...defaultClassification,
        code: "NOT_FOUND",
        retryable: false,
        message: payload?.errorMessage ?? "Requested Jira resource not found",
      };
    case 429:
      return {
        ...defaultClassification,
        code: "RATE_LIMIT",
        retryable: true,
        severity: "WARN",
        message: payload?.errorMessage ?? "Rate limit reached",
      };
    default:
      if (status >= 500) {
        return {
          ...defaultClassification,
          code: "SERVER_ERROR",
          retryable: true,
        };
      }
      return defaultClassification;
  }
}
