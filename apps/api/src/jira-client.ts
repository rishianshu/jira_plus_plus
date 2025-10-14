import { GraphQLError } from "graphql";
import type { PrismaClient, JiraSite } from "@prisma/client";
import { decryptSecret } from "./auth";

interface JiraSiteAuth {
  site: JiraSite;
  token: string;
}

async function resolveSiteAuth(prisma: PrismaClient, siteId: string): Promise<JiraSiteAuth> {
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
