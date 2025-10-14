import { config } from "dotenv";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JIRA_BASE_URL: z.string().min(1, "JIRA_BASE_URL is required"),
  JIRA_EMAIL: z.string().email(),
  JIRA_API_TOKEN: z.string().min(1, "JIRA_API_TOKEN is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
});

type EnvShape = z.infer<typeof envSchema>;

let cachedEnv: EnvShape | null = null;

export function getEnv(): EnvShape {
  if (!cachedEnv) {
    config();
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}
