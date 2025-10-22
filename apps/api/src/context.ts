import type { IncomingMessage } from "http";
import type { PrismaClient, Role } from "@platform/cdm";
import { prisma } from "./prisma.js";
import { resolveUserFromRequest } from "./auth.js";
import { getEnv } from "./env.js";
import { withTenant } from "@platform/clients";

export interface RequestContext {
  prisma: PrismaClient;
  logger: typeof console;
  user: AuthenticatedUser | null;
  tenantId: string;
  withTenant<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T>;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

interface CreateContextArgs {
  req?: IncomingMessage;
}

export async function createContext({ req }: CreateContextArgs = {}): Promise<RequestContext> {
  const auth = await resolveUserFromRequest(req);
  const env = getEnv();

  return {
    prisma,
    logger: console,
    user: auth,
    tenantId: env.TENANT_ID,
    withTenant: <T>(fn: (tx: PrismaClient) => Promise<T>) =>
      withTenant(prisma, env.TENANT_ID, fn),
  };
}
