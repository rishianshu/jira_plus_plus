import type { PrismaClient } from "@platform/cdm";

export declare function withTenant<T>(
  prisma: PrismaClient,
  tenantId: string,
  fn: (tx: PrismaClient) => Promise<T>,
): Promise<T>;
