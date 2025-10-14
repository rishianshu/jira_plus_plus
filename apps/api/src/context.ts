import type { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export interface RequestContext {
  prisma: PrismaClient;
  logger: typeof console;
}

export async function createContext(): Promise<RequestContext> {
  return {
    prisma,
    logger: console,
  };
}
