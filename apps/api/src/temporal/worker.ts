import path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "@temporalio/worker";
import { getEnv } from "../env.js";
import * as syncActivities from "./activities/syncActivities.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const env = getEnv();
  const workflowsEntry = path.join(__dirname, "workflows");

  const worker = await Worker.create({
    workflowsPath: workflowsEntry,
    activities: syncActivities,
    taskQueue: env.TEMPORAL_TASK_QUEUE,
  });

  await worker.run();
}

run().catch((error) => {
  console.error("Temporal worker failed", error);
  process.exit(1);
});
