import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import {
  createManusTask,
  getManusTask,
  getManusTaskResults,
  sendManusFollowup,
} from "./manus-api-client";
import {
  getMcpBearer,
  mcpOAuthChallenge,
  scopesForMcpRequest,
  verifyMcpAccessToken,
} from "./mcp-oauth";

const MANUS_MCP_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const;

const structuredOutputSchema = z.record(z.string(), z.unknown()).optional();
const messageOptions = {
  connectors: z.array(z.string()).optional(),
  enable_skills: z.array(z.string()).optional(),
  force_skills: z.array(z.string()).optional(),
};

function jsonText(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function createManusMcpServer() {
  const server = new McpServer({ name: "manus-api-v2-private", version: "1.0.0" });

  server.registerTool(
    "create_manus_task",
    {
      title: "Create Manus task",
      description: "Create a private asynchronous task in the authenticated personal Manus API v2 account. Returns the task ID and task URL; the task runs asynchronously.",
      inputSchema: {
        content: z.string().min(1).max(100_000).describe("The instruction to send to the Manus agent"),
        project_id: z.string().optional().describe("Optional Manus project ID"),
        locale: z.string().optional(),
        interactive_mode: z.boolean().optional().default(false),
        hide_in_task_list: z.boolean().optional().default(false),
        share_visibility: z.enum(["private", "team", "public"]).optional().default("private"),
        agent_profile: z.enum(["manus-1.6", "manus-1.6-lite", "manus-1.6-max"]).optional(),
        title: z.string().max(200).optional(),
        structured_output_schema: structuredOutputSchema,
        ...messageOptions,
      },
      annotations: MANUS_MCP_ANNOTATIONS,
    },
    async ({ content, project_id, locale, interactive_mode, hide_in_task_list, share_visibility, agent_profile, title, structured_output_schema, connectors, enable_skills, force_skills }) => {
      const result = await createManusTask({
        message: { content, connectors, enable_skills, force_skills },
        project_id,
        locale,
        interactive_mode,
        hide_in_task_list,
        share_visibility,
        agent_profile,
        title,
        structured_output_schema,
      });
      return jsonText(result);
    },
  );

  server.registerTool(
    "get_manus_task",
    {
      title: "Get Manus task",
      description: "Retrieve the current status and metadata for a Manus task from the authenticated personal API v2 account.",
      inputSchema: { task_id: z.string().min(1).max(200).describe("Manus task ID") },
      annotations: { ...MANUS_MCP_ANNOTATIONS, idempotentHint: true },
    },
    async ({ task_id }) => jsonText(await getManusTask(task_id)),
  );

  server.registerTool(
    "get_manus_task_results",
    {
      title: "Get Manus task results",
      description: "Retrieve the event history, status updates, assistant messages, errors, and structured output for a Manus task. Use the cursor for additional pages.",
      inputSchema: {
        task_id: z.string().min(1).max(200).describe("Manus task ID"),
        limit: z.number().int().min(1).max(200).optional().default(50),
        cursor: z.string().optional(),
        order: z.enum(["asc", "desc"]).optional().default("desc"),
        verbose: z.boolean().optional().default(false),
      },
      annotations: { ...MANUS_MCP_ANNOTATIONS, idempotentHint: true },
    },
    async ({ task_id, limit, cursor, order, verbose }) => jsonText(await getManusTaskResults({ taskId: task_id, limit, cursor, order, verbose })),
  );

  server.registerTool(
    "send_manus_followup",
    {
      title: "Send Manus follow-up",
      description: "Send a follow-up message to an existing Manus task and resume its conversation. This can consume Manus credits and may cause the agent to perform actions; review the task and request before using it.",
      inputSchema: {
        task_id: z.string().min(1).max(200).describe("Manus task ID, or agent-default-main_task for the default IM agent"),
        content: z.string().min(1).max(100_000).describe("The follow-up instruction"),
        agent_profile: z.enum(["manus-1.6", "manus-1.6-lite", "manus-1.6-max"]).optional(),
        structured_output_schema: structuredOutputSchema,
        clear_connectors: z.boolean().optional().default(false),
        ...messageOptions,
      },
      annotations: MANUS_MCP_ANNOTATIONS,
    },
    async ({ task_id, content, agent_profile, structured_output_schema, clear_connectors, connectors, enable_skills, force_skills }) => {
      const result = await sendManusFollowup({
        task_id,
        message: { content, connectors, enable_skills, force_skills },
        agent_profile,
        structured_output_schema,
        clear_connectors,
      });
      return jsonText(result);
    },
  );

  return server;
}

function tokenMatches(req: IncomingMessage): boolean {
  const configured = process.env.MCP_MANUS_TOKEN?.trim();
  const provided = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7).trim() : "";
  if (!configured || !provided) return false;
  const expected = Buffer.from(configured);
  const actual = Buffer.from(provided);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function isMcpOAuthBearer(req: IncomingMessage): boolean {
  return Boolean(getMcpBearer(req)?.startsWith("mcp_at_"));
}

export async function handleManusMcp(req: IncomingMessage, res: ServerResponse, body?: unknown) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (!process.env.MANUS_API_KEY) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Manus MCP is not configured." }));
    return;
  }
  const bearer = getMcpBearer(req);
  const legacyToken = tokenMatches(req);
  const accessToken = bearer?.startsWith("mcp_at_") ? await verifyMcpAccessToken(bearer) : null;
  const requiredScopes = scopesForMcpRequest(body);
  const hasRequiredScopes = Boolean(accessToken && requiredScopes.every((scope) => accessToken.scope.includes(scope)));
  if (!legacyToken && !hasRequiredScopes) {
    res.statusCode = accessToken ? 403 : 401;
    res.setHeader("WWW-Authenticate", mcpOAuthChallenge(requiredScopes.join(" "), accessToken ? "insufficient_scope" : (bearer ? "invalid_token" : undefined)));
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: bearer ? "invalid_token" : "unauthorized" }));
    return;
  }
  const server = createManusMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}

export const MANUS_MCP_TOOL_NAMES = [
  "create_manus_task",
  "get_manus_task",
  "get_manus_task_results",
  "send_manus_followup",
] as const;
