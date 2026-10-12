import { timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { getDb } from "./db";
import { courierSafetyIncidents, deliveries } from "../drizzle/schema";
import { handleManusMcp } from "./mcp-manus";
import { getMcpBearer, mcpOAuthChallenge, MCP_PROJECT_READ_SCOPE, MCP_READ_SCOPE, MCP_WRITE_SCOPE, verifyMcpAccessToken } from "./mcp-oauth";

const PROJECT_ROOT = path.resolve(process.cwd());
const MAX_FILE_BYTES = 500_000;
const MAX_RESULTS = 200;
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const BLOCKED_PATH = /(^|\/)(\.env(?:\..*)?|\.git|node_modules|dist|build|coverage|\.DS_Store)(\/|$)|(^|\/)(.*(?:secret|credential|password|private[-_]?key|\.pem|\.p12|\.pfx).*)$/i;
const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".mdx", ".css", ".html", ".xml",
  ".sql", ".yaml", ".yml", ".toml", ".txt", ".swift", ".plist", ".gradle", ".properties", ".xcconfig",
]);

function jsonText(value: unknown): { content: [{ type: "text"; text: string }] } {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function safeRelativePath(input: string): string {
  const normalized = input.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("\0") || BLOCKED_PATH.test(normalized)) {
    throw new Error("That project path is not available through the read-only MCP.");
  }
  const absolute = path.resolve(PROJECT_ROOT, normalized);
  if (absolute !== PROJECT_ROOT && !absolute.startsWith(`${PROJECT_ROOT}${path.sep}`)) {
    throw new Error("Project paths must remain inside the Mzansi Couriers project.");
  }
  return normalized;
}

async function walk(relativeDir = ""): Promise<string[]> {
  const directory = path.join(PROJECT_ROOT, relativeDir);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    const relative = path.posix.join(relativeDir.replaceAll("\\", "/"), entry.name);
    if (BLOCKED_PATH.test(relative) || entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) result.push(...await walk(relative));
    else result.push(relative);
  }
  return result;
}

async function readProjectText(relativePath: string): Promise<string> {
  const safePath = safeRelativePath(relativePath);
  const absolute = path.join(PROJECT_ROOT, safePath);
  const stat = await fs.stat(absolute);
  if (!stat.isFile() || stat.size > MAX_FILE_BYTES) {
    throw new Error(`The file must be a text file no larger than ${MAX_FILE_BYTES} bytes.`);
  }
  const extension = path.extname(safePath).toLowerCase();
  if (!TEXT_EXTENSIONS.has(extension) && stat.size > 0) {
    throw new Error("Binary and unrecognised file types are not exposed through the read-only MCP.");
  }
  const content = await fs.readFile(absolute, "utf8");
  if (content.includes("\0")) throw new Error("Binary files are not exposed through the read-only MCP.");
  return content;
}

function createReadonlyMcpServer() {
  const server = new McpServer({
    name: "mzansi-couriers-read-only",
    version: "1.0.0",
  });

  server.registerTool(
    "project_manifest",
    {
      title: "Project manifest",
      description: "Read-only summary of the Mzansi Couriers project identity, release versions, architecture, and exposed capabilities.",
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => jsonText({
      project: "Mzansi Couriers",
      package: "com.mzansi.couriers",
      webApp: "South African peer-to-peer courier and relay logistics platform",
      nativeVersions: { ios: "2.0.2 (30)", android: "2.0.2 (30)" },
      stack: ["React", "TypeScript", "tRPC", "Drizzle ORM", "MySQL", "Capacitor iOS", "Capacitor Android"],
      capabilities: ["customer parcel booking", "courier routes", "relay handoffs", "tracking", "proof of delivery", "offline route snapshots", "courier Safety Centre", "account deletion"],
      accessMode: "read-only MCP; no write or mutation tools are registered",
    }),
  );

  server.registerTool(
    "list_project_files",
    {
      title: "List project files",
      description: "List readable source, configuration, documentation, and schema files in the project. Sensitive files, dependencies, build output, and credentials are excluded.",
      inputSchema: { prefix: z.string().optional().describe("Optional relative directory prefix, for example client/src or server") },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ prefix }) => {
      const safePrefix = prefix ? safeRelativePath(prefix).replace(/\/$/, "") : "";
      const files = (await walk(safePrefix)).filter((file) => !BLOCKED_PATH.test(file));
      return jsonText({ count: files.length, files: files.slice(0, 2000) });
    },
  );

  server.registerTool(
    "read_project_file",
    {
      title: "Read project file",
      description: "Read a text source or documentation file from the Mzansi Couriers project. This tool cannot write, delete, or modify files and blocks credential-bearing paths.",
      inputSchema: { path: z.string().min(1).describe("Relative project path") },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ path: filePath }) => textResult(await readProjectText(filePath)),
  );

  server.registerTool(
    "search_project",
    {
      title: "Search project source",
      description: "Search readable project source and documentation for a plain-text term. Results include file paths and line numbers only; no files are changed.",
      inputSchema: {
        query: z.string().min(1).max(200).describe("Plain-text search term"),
        prefix: z.string().optional().describe("Optional relative directory prefix"),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ query, prefix }) => {
      const safePrefix = prefix ? safeRelativePath(prefix).replace(/\/$/, "") : "";
      const files = await walk(safePrefix);
      const matches: Array<{ file: string; line: number; text: string }> = [];
      for (const file of files) {
        if (matches.length >= MAX_RESULTS || !TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
        try {
          const content = await readProjectText(file);
          content.split(/\r?\n/).forEach((line, index) => {
            if (matches.length < MAX_RESULTS && line.toLowerCase().includes(query.toLowerCase())) {
              matches.push({ file, line: index + 1, text: line.trim().slice(0, 500) });
            }
          });
        } catch {
          // Skip unreadable or blocked files while continuing the read-only search.
        }
      }
      return jsonText({ query, count: matches.length, truncated: matches.length >= MAX_RESULTS, matches });
    },
  );

  server.registerTool(
    "operational_summary",
    {
      title: "Operational summary",
      description: "Read-only aggregate delivery and safety counts from the live database. No personal addresses, phone numbers, bank details, or secret payment data are returned.",
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      const db = await getDb();
      if (!db) return textResult("Database is not available in this environment.");
      const [deliveryCounts, incidentCounts] = await Promise.all([
        db.select({ status: deliveries.status, count: count() }).from(deliveries).groupBy(deliveries.status),
        db.select({ status: courierSafetyIncidents.status, count: count() }).from(courierSafetyIncidents).groupBy(courierSafetyIncidents.status),
      ]);
      return jsonText({ deliveryCounts, safetyIncidentCounts: incidentCounts, readOnly: true });
    },
  );

  server.registerTool(
    "active_deliveries",
    {
      title: "Active deliveries",
      description: "Read-only list of active parcel operations using tracking codes, statuses, courier IDs, customer IDs, and timestamps. Exact addresses and payment secrets are intentionally excluded.",
      inputSchema: { limit: z.number().int().min(1).max(100).optional().default(50) },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ limit }) => {
      const db = await getDb();
      if (!db) return textResult("Database is not available in this environment.");
      const rows = await db.select({
        id: deliveries.id,
        trackingCode: deliveries.trackingCode,
        customerId: deliveries.customerId,
        courierId: deliveries.courierId,
        status: deliveries.status,
        packageSize: deliveries.packageSize,
        distance: deliveries.distance,
        estimatedDeliveryTime: deliveries.estimatedDeliveryTime,
        createdAt: deliveries.createdAt,
        updatedAt: deliveries.updatedAt,
      }).from(deliveries).where(eq(deliveries.status, "in-transit")).orderBy(desc(deliveries.updatedAt)).limit(limit ?? 50);
      return jsonText({ count: rows.length, deliveries: rows, readOnly: true });
    },
  );

  server.registerTool(
    "safety_incidents",
    {
      title: "Courier safety incidents",
      description: "Read-only list of courier safety incidents for operational review. Sensitive location coordinates, descriptions, emergency numbers, and resolution notes are redacted.",
      inputSchema: { limit: z.number().int().min(1).max(100).optional().default(50) },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ limit }) => {
      const db = await getDb();
      if (!db) return textResult("Database is not available in this environment.");
      const rows = await db.select({
        id: courierSafetyIncidents.id,
        courierId: courierSafetyIncidents.courierId,
        deliveryId: courierSafetyIncidents.deliveryId,
        type: courierSafetyIncidents.type,
        urgency: courierSafetyIncidents.urgency,
        status: courierSafetyIncidents.status,
        createdAt: courierSafetyIncidents.createdAt,
        updatedAt: courierSafetyIncidents.updatedAt,
        resolvedAt: courierSafetyIncidents.resolvedAt,
      }).from(courierSafetyIncidents).orderBy(desc(courierSafetyIncidents.createdAt)).limit(limit ?? 50);
      return jsonText({ count: rows.length, incidents: rows, readOnly: true });
    },
  );

  return server;
}

function isAuthorized(req: import("node:http").IncomingMessage): boolean {
  return tokenMatches(req, process.env.MCP_READ_ONLY_TOKEN);
}

function tokenMatches(req: import("node:http").IncomingMessage, configured?: string): boolean {
  const provided = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7).trim() : "";
  if (!configured || !provided) return false;
  const expected = Buffer.from(configured);
  const actual = Buffer.from(provided);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function handleReadonlyMcp(req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse, body?: unknown) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  const bearer = getMcpBearer(req);
  const oauthClaims = bearer?.startsWith("mcp_at_") ? await verifyMcpAccessToken(bearer) : null;
  if (!bearer) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", mcpOAuthChallenge(MCP_PROJECT_READ_SCOPE));
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }
  if (oauthClaims?.scope.includes(MCP_PROJECT_READ_SCOPE)) {
    const server = createReadonlyMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
    return;
  }
  if (oauthClaims?.scope.some((scope) => scope === MCP_READ_SCOPE || scope === MCP_WRITE_SCOPE)) {
    await handleManusMcp(req, res, body);
    return;
  }
  // The personal Manus API bridge uses a separate bearer token. The existing
  // token continues to expose only the original read-only Mzansi tools.
  if (tokenMatches(req, process.env.MCP_MANUS_TOKEN)) {
    await handleManusMcp(req, res, body);
    return;
  }
  if (!tokenMatches(req, process.env.MCP_READ_ONLY_TOKEN)) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", mcpOAuthChallenge(MCP_PROJECT_READ_SCOPE, "invalid_token"));
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "invalid_token" }));
    return;
  }
  if (!process.env.MCP_READ_ONLY_TOKEN) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "MCP is not configured. Set MCP_READ_ONLY_TOKEN in project secrets." }));
    return;
  }
  const server = createReadonlyMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}

export const READONLY_MCP_TOOL_NAMES = [
  "project_manifest",
  "list_project_files",
  "read_project_file",
  "search_project",
  "operational_summary",
  "active_deliveries",
  "safety_incidents",
] as const;
