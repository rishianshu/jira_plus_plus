import { GraphQLError } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import { CredentialType } from "@prisma/client";
import type { RequestContext } from "./context";
import {
  createAuthToken,
  encryptSecret,
  hashPassword,
  verifyPassword,
} from "./auth";
import {
  fetchJiraProjectOptions,
  fetchJiraProjectUsers,
} from "./jira-client";

function requireUser(ctx: RequestContext) {
  if (!ctx.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return ctx.user;
}

function requireAdmin(ctx: RequestContext) {
  const user = requireUser(ctx);
  if (user.role !== "ADMIN") {
    throw new GraphQLError("Admin privileges required", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return user;
}

export const resolvers = {
  DateTime: DateTimeResolver,
  Query: {
    health: () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
    me: async (_parent: unknown, _args: unknown, ctx: RequestContext) => {
      const auth = requireUser(ctx);
      return ctx.prisma.user.findUnique({
        where: { id: auth.id },
      });
    },
    users: async (_parent: unknown, _args: unknown, ctx: RequestContext) => {
      requireAdmin(ctx);
      return ctx.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });
    },
    jiraSites: async (_parent: unknown, _args: unknown, ctx: RequestContext) => {
      requireAdmin(ctx);
      return ctx.prisma.jiraSite.findMany({
        include: { projects: true },
        orderBy: { createdAt: "desc" },
      });
    },
    jiraProjects: async (
      _parent: unknown,
      args: { siteId: string },
      ctx: RequestContext,
    ) => {
      requireAdmin(ctx);
      return ctx.prisma.jiraProject.findMany({
        where: { siteId: args.siteId },
        include: { site: true, trackedUsers: true },
        orderBy: { createdAt: "desc" },
      });
    },
    userProjectLinks: async (
      _parent: unknown,
      args: { userId: string },
      ctx: RequestContext,
    ) => {
      requireAdmin(ctx);
      return ctx.prisma.userProjectLink.findMany({
        where: { userId: args.userId },
        include: { project: { include: { site: true } }, user: true },
        orderBy: { createdAt: "desc" },
      });
    },
    jiraProjectOptions: async (
      _parent: unknown,
      args: { siteId: string },
      ctx: RequestContext,
    ) => {
      requireAdmin(ctx);
      return fetchJiraProjectOptions(ctx.prisma, args.siteId);
    },
    jiraProjectUserOptions: async (
      _parent: unknown,
      args: { siteId: string; projectKey: string },
      ctx: RequestContext,
    ) => {
      requireAdmin(ctx);
      return fetchJiraProjectUsers(ctx.prisma, args.siteId, args.projectKey);
    },
    projectTrackedUsers: async (
      _parent: unknown,
      args: { projectId: string },
      ctx: RequestContext,
    ) => {
      requireAdmin(ctx);
      return ctx.prisma.projectTrackedUser.findMany({
        where: { projectId: args.projectId },
        orderBy: { displayName: "asc" },
      });
    },
  },
  Mutation: {
    login: async (
      _parent: unknown,
      args: { input: { email: string; password: string } },
      ctx: RequestContext,
    ) => {
      const { email, password } = args.input;
      const user = await ctx.prisma.user.findUnique({
        where: { email },
        include: { credential: true },
      });

      if (!user || !user.credential) {
        throw new GraphQLError("Invalid credentials", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const isValid = await verifyPassword(password, user.credential.secretHash);
      if (!isValid) {
        throw new GraphQLError("Invalid credentials", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const payload = {
        token: createAuthToken({
          id: user.id,
          email: user.email,
          role: user.role,
        }),
        user,
      };

      return payload;
    },
    createUser: async (
      _parent: unknown,
      args: {
        input: { email: string; displayName: string; password: string; role?: "ADMIN" | "USER" };
      },
      ctx: RequestContext,
    ) => {
      requireAdmin(ctx);
      const { email, displayName, password, role = "USER" } = args.input;

      const existing = await ctx.prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new GraphQLError("A user with this email already exists", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const passwordHash = await hashPassword(password);
      return ctx.prisma.user.create({
        data: {
          email,
          displayName,
          role,
          credential: {
            create: {
              type: CredentialType.LOCAL,
              secretHash: passwordHash,
            },
          },
        },
      });
    },
    updateUserRole: async (
      _parent: unknown,
      args: { input: { userId: string; role: "ADMIN" | "USER" } },
      ctx: RequestContext,
    ) => {
      const requester = requireAdmin(ctx);

      if (requester.id === args.input.userId) {
        throw new GraphQLError("You cannot change your own role", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      return ctx.prisma.user.update({
        where: { id: args.input.userId },
        data: { role: args.input.role },
      });
    },
    registerJiraSite: async (
      _parent: unknown,
      args: {
        input: {
          alias: string;
          baseUrl: string;
          adminEmail: string;
          apiToken: string;
        };
      },
      ctx: RequestContext,
    ) => {
      const admin = requireAdmin(ctx);
      const { alias, baseUrl, adminEmail, apiToken } = args.input;

      try {
        // eslint-disable-next-line no-new
        new URL(baseUrl);
      } catch {
        throw new GraphQLError("Base URL must be a valid URL", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const encryptedToken = encryptSecret(apiToken);

      return ctx.prisma.jiraSite.create({
        data: {
          alias,
          baseUrl,
          adminEmail,
          tokenCipher: encryptedToken,
          createdById: admin.id,
        },
        include: { projects: true },
      });
    },
    registerJiraProject: async (
      _parent: unknown,
      args: {
        input: { siteId: string; jiraId: string; key: string; name: string };
      },
      ctx: RequestContext,
    ) => {
      requireAdmin(ctx);

      const site = await ctx.prisma.jiraSite.findUnique({
        where: { id: args.input.siteId },
      });

      if (!site) {
        throw new GraphQLError("Jira site not found", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      return ctx.prisma.jiraProject.create({
        data: {
          siteId: args.input.siteId,
          jiraId: args.input.jiraId,
          key: args.input.key,
          name: args.input.name,
        },
        include: { site: true },
      });
    },
    mapUserToProject: async (
      _parent: unknown,
      args: { input: { userId: string; projectId: string; jiraAccountId: string } },
      ctx: RequestContext,
    ) => {
      requireAdmin(ctx);

      const [user, project] = await Promise.all([
        ctx.prisma.user.findUnique({ where: { id: args.input.userId } }),
        ctx.prisma.jiraProject.findUnique({
          where: { id: args.input.projectId },
          include: { site: true },
        }),
      ]);

      if (!user || !project) {
        throw new GraphQLError("User or project not found", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      return ctx.prisma.userProjectLink.upsert({
        where: {
          userId_projectId: {
            userId: args.input.userId,
            projectId: args.input.projectId,
          },
        },
        update: {
          jiraAccountId: args.input.jiraAccountId,
        },
        create: {
          userId: args.input.userId,
          projectId: args.input.projectId,
          jiraAccountId: args.input.jiraAccountId,
        },
        include: {
          user: true,
          project: { include: { site: true } },
        },
      });
    },
    setProjectTrackedUsers: async (
      _parent: unknown,
      args: {
        input: {
          projectId: string;
          users: Array<{
            jiraAccountId: string;
            displayName: string;
            email?: string | null;
            avatarUrl?: string | null;
            isTracked?: boolean | null;
          }>;
        };
      },
      ctx: RequestContext,
    ) => {
      requireAdmin(ctx);

      const project = await ctx.prisma.jiraProject.findUnique({
        where: { id: args.input.projectId },
      });

      if (!project) {
        throw new GraphQLError("Project not found", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const incoming = args.input.users ?? [];
      const accountIds = incoming.map((user) => user.jiraAccountId);

      if (accountIds.length > 0) {
        await ctx.prisma.projectTrackedUser.deleteMany({
          where: {
            projectId: args.input.projectId,
            jiraAccountId: {
              notIn: accountIds,
            },
          },
        });
      } else {
        await ctx.prisma.projectTrackedUser.deleteMany({
          where: { projectId: args.input.projectId },
        });
      }

      for (const user of incoming) {
        await ctx.prisma.projectTrackedUser.upsert({
          where: {
            projectId_jiraAccountId: {
              projectId: args.input.projectId,
              jiraAccountId: user.jiraAccountId,
            },
          },
          update: {
            displayName: user.displayName,
            email: user.email ?? null,
            avatarUrl: user.avatarUrl ?? null,
            isTracked: user.isTracked ?? true,
          },
          create: {
            projectId: args.input.projectId,
            jiraAccountId: user.jiraAccountId,
            displayName: user.displayName,
            email: user.email ?? null,
            avatarUrl: user.avatarUrl ?? null,
            isTracked: user.isTracked ?? true,
          },
        });
      }

      return ctx.prisma.projectTrackedUser.findMany({
        where: { projectId: args.input.projectId },
        orderBy: { displayName: "asc" },
      });
    },
    unlinkUserFromProject: async (
      _parent: unknown,
      args: { linkId: string },
      ctx: RequestContext,
    ) => {
      requireAdmin(ctx);
      try {
        await ctx.prisma.userProjectLink.delete({
          where: { id: args.linkId },
        });
        return true;
      } catch {
        return false;
      }
    },
  },
  JiraSite: {
    projects: async (
      parent: { id: string },
      _args: unknown,
      ctx: RequestContext,
    ) => {
      return ctx.prisma.jiraProject.findMany({
        where: { siteId: parent.id },
        include: { site: true },
        orderBy: { createdAt: "desc" },
      });
    },
  },
  JiraProject: {
    site: async (parent: { siteId: string }, _args: unknown, ctx: RequestContext) => {
      return ctx.prisma.jiraSite.findUnique({
        where: { id: parent.siteId },
      });
    },
    trackedUsers: async (parent: { id: string }, _args: unknown, ctx: RequestContext) => {
      return ctx.prisma.projectTrackedUser.findMany({
        where: { projectId: parent.id },
        orderBy: { displayName: "asc" },
      });
    },
  },
  UserProjectLink: {
    user: async (parent: { userId: string }, _args: unknown, ctx: RequestContext) => {
      return ctx.prisma.user.findUnique({ where: { id: parent.userId } });
    },
    project: async (parent: { projectId: string }, _args: unknown, ctx: RequestContext) => {
      return ctx.prisma.jiraProject.findUnique({
        where: { id: parent.projectId },
        include: { site: true },
      });
    },
  },
};
