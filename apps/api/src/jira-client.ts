import { GraphQLError } from "graphql";
import type { PrismaClient, JiraSite } from "@prisma/client";
import { decryptSecret } from "./auth.js";

export interface JiraSiteAuth {
  site: JiraSite;
  token: string;
}

export async function resolveSiteAuth(prisma: PrismaClient, siteId: string): Promise<JiraSiteAuth> {
  const site = await prisma.jiraSite.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    throw new GraphQLError("Jira site not found", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const token = decryptSecret(site.tokenCipher);

  return { site, token };
}

function buildAuthHeaders(email: string, token: string) {
  const basic = Buffer.from(`${email}:${token}`).toString("base64");
  return {
    Authorization: `Basic ${basic}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export interface JiraProjectOption {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string | null;
  lead?: string | null;
}

export interface JiraUserOption {
  accountId: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
}

export async function fetchJiraProjectOptions(
  prisma: PrismaClient,
  siteId: string,
): Promise<JiraProjectOption[]> {
  const { site, token } = await resolveSiteAuth(prisma, siteId);

  let response: Response;
  try {
    response = await fetch(
      `${site.baseUrl.replace(/\/$/, "")}/rest/api/3/project/search?expand=lead&maxResults=100`,
      {
        headers: buildAuthHeaders(site.adminEmail, token),
      },
    );
  } catch (error) {
    throw new GraphQLError("Unable to reach the Jira API. Check network connectivity.", {
      extensions: { code: "BAD_GATEWAY" },
    });
  }

  if (!response.ok) {
    throw new GraphQLError("Failed to fetch Jira projects. Verify credentials and permissions.", {
      extensions: { code: "BAD_REQUEST" },
    });
  }

  const data = (await response.json()) as {
    values?: Array<{
      id: string;
      key: string;
      name: string;
      projectTypeKey?: string;
      lead?: { displayName?: string | null };
    }>;
  };

  return (data.values ?? []).map((project) => ({
    id: project.id,
    key: project.key,
    name: project.name,
    projectTypeKey: project.projectTypeKey ?? null,
    lead: project.lead?.displayName ?? null,
  }));
}

export async function fetchJiraProjectUsers(
  prisma: PrismaClient,
  siteId: string,
  projectKey: string,
): Promise<JiraUserOption[]> {
  const { site, token } = await resolveSiteAuth(prisma, siteId);

  const url = new URL(
    `${site.baseUrl.replace(/\/$/, "")}/rest/api/3/user/assignable/search`,
  );
  url.searchParams.set("project", projectKey);
  url.searchParams.set("maxResults", "200");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: buildAuthHeaders(site.adminEmail, token),
    });
  } catch (error) {
    throw new GraphQLError("Unable to reach the Jira API. Check network connectivity.", {
      extensions: { code: "BAD_GATEWAY" },
    });
  }

  if (!response.ok) {
    throw new GraphQLError("Failed to fetch Jira users. Ensure the API token has read permissions.", {
      extensions: { code: "BAD_REQUEST" },
    });
  }

  const data = (await response.json()) as Array<{
    accountId: string;
    displayName: string;
    emailAddress?: string;
    avatarUrls?: Record<string, string>;
  }>;

  return data.map((user) => ({
    accountId: user.accountId,
    displayName: user.displayName,
    email: user.emailAddress ?? null,
    avatarUrl: user.avatarUrls?.["48x48"] ?? user.avatarUrls?.["24x24"] ?? null,
  }));
}

export interface JiraIssueSearchResponse {
  issues: Array<{
    id: string;
    key: string;
    fields: {
      summary?: string;
      status?: { name?: string } | null;
      priority?: { name?: string } | null;
      assignee?: {
        accountId?: string;
        displayName?: string;
        emailAddress?: string;
        avatarUrls?: Record<string, string>;
      } | null;
      updated?: string;
      created?: string;
    };
  }>;
  total: number;
  nextPageToken: string;
  isLast: boolean;
  maxResults: number;
}

export async function searchJiraIssues(params: {
  baseUrl: string;
  adminEmail: string;
  token: string;
  jql: string;
  nextPageToken?: string;
  maxResults?: number;
}): Promise<JiraIssueSearchResponse> {
  const url = `${params.baseUrl.replace(/\/$/, "")}/rest/api/3/search/jql`;
  const payload = {
    method: 'POST',
    headers: buildAuthHeaders(params.adminEmail, params.token),
    body: JSON.stringify({
      jql: params.jql,
      nextPageToken: params.nextPageToken,
      maxResults: params.maxResults ?? 100,
      fields: ['summary', 'status', 'priority', 'assignee', 'updated', 'created'],
    }),
  };
  console.log(url, params);
  const response = await fetch(url, payload);

  

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Jira search failed (${response.status}): ${message}`);
  }

  const data = (await response.json()) as JiraIssueSearchResponse;
  return data;
}

export async function fetchJiraIssueDetail(params: {
  baseUrl: string;
  adminEmail: string;
  token: string;
  issueIdOrKey: string;
}): Promise<any> {
  const url = new URL(
    `${params.baseUrl.replace(/\/$/, "")}/rest/api/3/issue/${encodeURIComponent(params.issueIdOrKey)}`,
  );
  url.searchParams.set("expand", "renderedFields,comment,worklog,changelog");
  url.searchParams.set("fields", "summary,status,priority,assignee,updated,created");

  const response = await fetch(url, {
    headers: buildAuthHeaders(params.adminEmail, params.token),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to fetch issue details (${response.status}): ${message}`);
  }

  return response.json();
}
