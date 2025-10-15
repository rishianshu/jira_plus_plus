import { Connection, Client } from "@temporalio/client";
import { getEnv } from "../env.js";

let cachedClient: Client | null = null;
let cachedConnection: Connection | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (cachedClient) {
    return cachedClient;
  }

  const env = getEnv();

  if (!cachedConnection) {
    cachedConnection = await Connection.connect({
      address: env.TEMPORAL_ADDRESS,
    });
  }

  cachedClient = new Client({
    connection: cachedConnection,
    namespace: env.TEMPORAL_NAMESPACE,
  });

  return cachedClient;
}

export function getTaskQueue(): string {
  return getEnv().TEMPORAL_TASK_QUEUE;
}
