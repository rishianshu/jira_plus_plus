import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const prismaGlobal = globalThis.__prismaClient ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prismaGlobal;
}

export const prisma = prismaGlobal;
