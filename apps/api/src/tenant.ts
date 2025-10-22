import { getEnv } from "./env.js";

export function resolveTenantId(tenantId?: string): string {
  return tenantId ?? getEnv().TENANT_ID;
}
