import type { IncomingMessage } from "http";
import type { PrismaClient, Role } from "@prisma/client";
import { prisma } from "./prisma.js";
import { resolveUserFromRequest } from "./auth.js";

export interface RequestContext {
  prisma: PrismaClient;
  logger: typeof console;
  user: AuthenticatedUser | null;
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

  return {
    prisma,
    logger: console,
    user: auth,
  };
}
