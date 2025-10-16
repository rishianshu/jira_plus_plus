import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import path from "node:path";
import { promises as fs } from "node:fs";
import { ApolloServer, HeaderMap } from "@apollo/server";
import { schema } from "./schema.js";
import { createContext } from "./context.js";
import { getEnv } from "./env.js";
import { seedAdminUser } from "./auth.js";
import {
  exportSummariesToPdf,
  exportSummariesToSlackPayload,
  generateSummariesForDate,
  generateSummaryForUser,
} from "./services/dailySummaryService.js";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function setCors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function bootstrap() {
  const env = getEnv();

  await seedAdminUser();

  const apollo = new ApolloServer({ schema });
  await apollo.start();

  const server = createServer(async (req, res) => {
    setCors(res);

    if ((req.method ?? "").toUpperCase() === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `localhost:${env.PORT}`}`);

    try {
      if (url.pathname === "/healthz") {
        sendJson(res, 200, { status: "ok", timestamp: new Date().toISOString() });
        return;
      }

      if (url.pathname === "/graphql") {
        await handleGraphQLRequest(req, res, url, apollo);
        return;
      }

      if (url.pathname === "/api/scrum/summaries" && (req.method ?? "").toUpperCase() === "GET") {
        await handleSummariesRequest(req, res, url);
        return;
      }

      if (url.pathname === "/api/scrum/generate" && (req.method ?? "").toUpperCase() === "POST") {
        await handleGenerateRequest(req, res);
        return;
      }

      if (url.pathname === "/api/scrum/export" && (req.method ?? "").toUpperCase() === "POST") {
        await handleExportRequest(req, res);
        return;
      }

      sendJson(res, 404, { error: "Not Found" });
    } catch (error) {
      console.error("Unhandled request error", error);
      sendJson(res, 500, { error: "Internal server error" });
    }
  });

  server.listen(env.PORT, () => {
    /* eslint-disable no-console */
    console.log(`🚀 API ready at http://localhost:${env.PORT}/graphql`);
  });
}

async function handleGraphQLRequest(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  apollo: ApolloServer,
) {
  let parsedBody: unknown;
  if ((req.method ?? "").toUpperCase() !== "GET") {
    const rawBody = await readBody(req);
    if (rawBody.length) {
      try {
        parsedBody = JSON.parse(rawBody.toString());
      } catch {
        sendJson(res, 400, { error: "Invalid JSON body" });
        return;
      }
    }
  }

  const headerMap = new HeaderMap();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "undefined") {
      continue;
    }
    headerMap.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const response = await apollo.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: req.method ?? "POST",
      headers: headerMap,
      search: url.search,
      body: parsedBody ?? null,
    },
    context: async () => createContext({ req }),
  });

  if (response.headers) {
    for (const [key, value] of response.headers) {
      res.setHeader(key, value);
    }
  }

  const statusCode = response.status ?? 200;

  if (response.body.kind === "complete") {
    res.writeHead(statusCode);
    res.end(response.body.string);
    return;
  }

  res.writeHead(statusCode);
  for await (const chunk of response.body.asyncIterator) {
    res.write(chunk);
  }
  res.end();
}

async function handleSummariesRequest(req: IncomingMessage, res: ServerResponse, url: URL) {
  const ctx = await createContext({ req });
  if (!ctx.user) {
    sendJson(res, 401, { error: "Authentication required" });
    return;
  }

  const dateParam = url.searchParams.get("date")?.trim() || todayIsoDate();
  const projectId = url.searchParams.get("projectId")?.trim();
  if (!projectId) {
    sendJson(res, 400, { error: "projectId is required" });
    return;
  }

  if (ctx.user.role !== "ADMIN") {
    const membership = await ctx.prisma.userProjectLink.count({
      where: { projectId, userId: ctx.user.id },
    });
    if (!membership) {
      sendJson(res, 403, { error: "You do not have access to this project" });
      return;
    }
  }

  const summaries = await generateSummariesForDate(ctx.prisma, dateParam, projectId);
  sendJson(res, 200, { date: dateParam, summaries });
}

async function handleGenerateRequest(req: IncomingMessage, res: ServerResponse) {
  const ctx = await createContext({ req });
  if (!ctx.user) {
    sendJson(res, 401, { error: "Authentication required" });
    return;
  }

  const rawBody = await readBody(req);
  let payload: Record<string, unknown> = {};
  if (rawBody.length) {
    try {
      payload = JSON.parse(rawBody.toString()) as Record<string, unknown>;
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body" });
      return;
    }
  }

  const requestDate = typeof payload.date === "string" && payload.date ? payload.date : todayIsoDate();
  const projectId = typeof payload.projectId === "string" && payload.projectId ? payload.projectId : null;
  if (!projectId) {
    sendJson(res, 400, { error: "projectId is required" });
    return;
  }
  const targetUserId = typeof payload.userId === "string" && payload.userId ? payload.userId : null;

  if (targetUserId) {
    if (ctx.user.role !== "ADMIN" && ctx.user.id !== targetUserId) {
      sendJson(res, 403, { error: "Insufficient permissions" });
      return;
    }
    if (ctx.user.role !== "ADMIN") {
      const membership = await ctx.prisma.userProjectLink.count({
        where: { projectId, userId: ctx.user.id },
      });
      if (!membership) {
        sendJson(res, 403, { error: "You do not have access to this project" });
        return;
      }
    }
    const summary = await generateSummaryForUser(ctx.prisma, targetUserId, requestDate, projectId);
    sendJson(res, 200, { summary });
    return;
  }

  if (ctx.user.role !== "ADMIN") {
    sendJson(res, 403, { error: "Admin privileges required" });
    return;
  }

  const summaries = await generateSummariesForDate(ctx.prisma, requestDate, projectId);
  sendJson(res, 200, { summaries });
}

async function handleExportRequest(req: IncomingMessage, res: ServerResponse) {
  const ctx = await createContext({ req });
  if (!ctx.user) {
    sendJson(res, 401, { error: "Authentication required" });
    return;
  }
  if (ctx.user.role !== "ADMIN") {
    sendJson(res, 403, { error: "Admin privileges required" });
    return;
  }

  const rawBody = await readBody(req);
  let payload: Record<string, unknown> = {};
  if (rawBody.length) {
    try {
      payload = JSON.parse(rawBody.toString()) as Record<string, unknown>;
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body" });
      return;
    }
  }

  const requestDate = typeof payload.date === "string" && payload.date ? payload.date : todayIsoDate();
  const projectId = typeof payload.projectId === "string" && payload.projectId ? payload.projectId : null;
  if (!projectId) {
    sendJson(res, 400, { error: "projectId is required" });
    return;
  }
  const target = typeof payload.target === "string" ? payload.target.toUpperCase() : "";

  if (target === "PDF") {
    const pdfPath = path.join(process.cwd(), "exports", `daily-scrum-${requestDate}.pdf`);
    await fs.mkdir(path.dirname(pdfPath), { recursive: true });
    const { path: generatedPath } = await exportSummariesToPdf(
      ctx.prisma,
      requestDate,
      projectId,
      pdfPath,
    );
    sendJson(res, 200, { success: true, message: "Daily scrum PDF generated", location: generatedPath });
    return;
  }

  if (target === "SLACK") {
    const { payload: slackPayload } = await exportSummariesToSlackPayload(
      ctx.prisma,
      requestDate,
      projectId,
    );
    const slackPath = path.join(process.cwd(), "exports", `daily-scrum-${requestDate}-slack.json`);
    await fs.mkdir(path.dirname(slackPath), { recursive: true });
    await fs.writeFile(slackPath, JSON.stringify(slackPayload, null, 2), "utf-8");
    sendJson(res, 200, { success: true, message: "Slack payload generated", location: slackPath });
    return;
  }

  sendJson(res, 400, { error: "Unsupported export target" });
}

bootstrap().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
