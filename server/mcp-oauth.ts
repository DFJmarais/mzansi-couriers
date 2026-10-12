import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import type { IncomingMessage } from "node:http";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { mcpCollaboratorApprovals, mcpOAuthClients } from "../drizzle/schema";
import { getAdminSession, getAdminSessionTokenFromRequest } from "./_core/admin-session";

export const MCP_READ_SCOPE = "manus:tasks.read";
export const MCP_WRITE_SCOPE = "manus:tasks.write";
export const MCP_PROJECT_READ_SCOPE = "mzansi:project.read";
export const MCP_SCOPES = [MCP_READ_SCOPE, MCP_WRITE_SCOPE, MCP_PROJECT_READ_SCOPE] as const;

const PUBLIC_BASE_URL = (process.env.MCP_PUBLIC_BASE_URL ?? "https://mzansicourier-nsebzqbt.manus.space").replace(/\/$/, "");
export const MCP_RESOURCE_URL = process.env.MCP_RESOURCE_URL ?? `${PUBLIC_BASE_URL}/api/mcp`;
export const MCP_OAUTH_ISSUER = process.env.MCP_OAUTH_ISSUER ?? PUBLIC_BASE_URL;
const AUTHORIZE_URL = `${MCP_OAUTH_ISSUER}/api/mcp/oauth/authorize`;
const TOKEN_URL = `${MCP_OAUTH_ISSUER}/api/mcp/oauth/token`;
const REGISTER_URL = `${MCP_OAUTH_ISSUER}/api/mcp/oauth/register`;
const RESOURCE_METADATA_URL = `${PUBLIC_BASE_URL}/.well-known/oauth-protected-resource`;
const AUTHORIZATION_SERVER_METADATA_URL = `${MCP_OAUTH_ISSUER}/.well-known/oauth-authorization-server`;
const CODE_TTL_MS = 5 * 60_000;
const ACCESS_TOKEN_TTL_SECONDS = 3600;

type RegisteredClient = { clientId: string; redirectUris: string[]; clientName?: string; createdAt: number };
type AuthorizationCode = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope: string[];
  resource: string;
  expiresAt: number;
  collaboratorOpenId: string;
};
type AccessTokenClaims = { sub: string; aud: string; scope: string[]; exp: number; iat: number; jti: string };

const clients = new Map<string, RegisteredClient>();
const authorizationCodes = new Map<string, AuthorizationCode>();

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Json<T>(value: string): T | null {
  try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T; } catch { return null; }
}

function oauthSecret(): string {
  const secret = process.env.MCP_OAUTH_SIGNING_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (!secret) throw new Error("MCP OAuth signing secret is not configured.");
  return secret;
}

function mac(value: string): string {
  return createHmac("sha256", oauthSecret()).update(value).digest("base64url");
}

function signedToken(claims: AccessTokenClaims): string {
  const payload = base64url(JSON.stringify(claims));
  return `mcp_at_${payload}.${mac(payload)}`;
}

export async function verifyMcpAccessToken(token: string): Promise<AccessTokenClaims | null> {
  if (!token.startsWith("mcp_at_")) return null;
  const encoded = token.slice("mcp_at_".length);
  const [payload, signature] = encoded.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(mac(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  const claims = decodeBase64Json<AccessTokenClaims>(payload);
  if (!claims || claims.aud !== MCP_RESOURCE_URL || claims.exp <= Math.floor(Date.now() / 1000) || !(await isAllowedCollaborator(claims.sub))) return null;
  if (!claims.scope.every((scope) => (MCP_SCOPES as readonly string[]).includes(scope))) return null;
  return claims;
}

export function getMcpBearer(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() || null : null;
}

export function mcpOAuthChallenge(scopes = MCP_SCOPES.join(" "), error?: string): string {
  const parts = ["Bearer", `resource_metadata=\"${RESOURCE_METADATA_URL}\"`, `scope=\"${scopes}\"`];
  if (error) parts.push(`error=\"${error}\"`);
  return parts.join(", ");
}

export function scopesForMcpRequest(body: unknown): string[] {
  const tool = typeof body === "object" && body !== null && "params" in body && typeof (body as any).params?.name === "string"
    ? (body as any).params.name
    : null;
  return tool === "get_manus_task" || tool === "get_manus_task_results" ? [MCP_READ_SCOPE] : [...MCP_SCOPES];
}

function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

function collaboratorAllowlist(): string[] {
  return (process.env.MCP_COLLABORATOR_OPEN_IDS ?? "").split(/[\s,]+/).map((value) => value.trim()).filter(Boolean);
}

async function isAllowedCollaborator(openId: string): Promise<boolean> {
  if (collaboratorAllowlist().includes(openId)) return true;
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ openId: mcpCollaboratorApprovals.openId, status: mcpCollaboratorApprovals.status })
    .from(mcpCollaboratorApprovals)
    .where(eq(mcpCollaboratorApprovals.openId, openId))
    .limit(1);
  return rows[0]?.openId === openId && rows[0].status === "approved";
}

async function authenticatedCollaborator(req: Request): Promise<{ openId: string; name: string; email?: string } | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    return { openId: user.openId, name: user.name ?? "Collaborator", email: user.email ?? undefined };
  } catch {
    return null;
  }
}

async function recordPendingCollaborator(user: { openId: string; name: string; email?: string }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(mcpCollaboratorApprovals).values({
    openId: user.openId,
    displayName: user.name,
    accountEmail: user.email ?? null,
    status: "pending",
  }).onDuplicateKeyUpdate({ set: { displayName: user.name, accountEmail: user.email ?? null } });
}

function collaboratorLoginUrl(resumeQuery: string): string {
  const redirectUri = `${PUBLIC_BASE_URL}/api/oauth/callback`;
  const state = base64url(JSON.stringify({ redirectUri, mcpResume: base64url(resumeQuery) }));
  const portal = new URL(`${process.env.VITE_OAUTH_PORTAL_URL ?? "https://manus.im"}/app-auth`);
  portal.searchParams.set("appId", ENV.appId);
  portal.searchParams.set("redirectUri", redirectUri);
  portal.searchParams.set("state", state);
  portal.searchParams.set("type", "signIn");
  return portal.toString();
}

function validRedirectUri(client: RegisteredClient, redirectUri: string): boolean {
  return client.redirectUris.includes(redirectUri);
}

async function registerClient(input: { redirect_uris?: unknown; client_name?: unknown }): Promise<RegisteredClient> {
  const redirectUris = Array.isArray(input.redirect_uris) ? input.redirect_uris.filter((uri): uri is string => typeof uri === "string" && /^https:\/\//.test(uri)) : [];
  if (redirectUris.length === 0 || redirectUris.length > 20) throw new Error("redirect_uris must contain one to twenty HTTPS URLs.");
  const clientId = `c_${randomBytes(18).toString("base64url")}`;
  const client = { clientId, redirectUris, clientName: typeof input.client_name === "string" ? input.client_name.slice(0, 200) : undefined, createdAt: Date.now() };
  clients.set(clientId, client);
  const db = await getDb();
  if (db) {
    await db.insert(mcpOAuthClients).values({ clientId, redirectUris, clientName: client.clientName ?? null });
  }
  return client;
}

async function getRegisteredClient(clientId: string): Promise<RegisteredClient | null> {
  const inMemory = clients.get(clientId);
  if (inMemory) return inMemory;
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(mcpOAuthClients).where(eq(mcpOAuthClients.clientId, clientId)).limit(1);
  const row = rows[0];
  if (!row || !Array.isArray(row.redirectUris)) return null;
  const client: RegisteredClient = {
    clientId: row.clientId,
    redirectUris: row.redirectUris.filter((uri): uri is string => typeof uri === "string"),
    clientName: row.clientName ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Date.now(),
  };
  clients.set(clientId, client);
  return client;
}

function issueAuthorizationCode(input: AuthorizationCode): string {
  const code = `mcp_code_${randomBytes(32).toString("base64url")}`;
  authorizationCodes.set(code, input);
  return code;
}

async function validateCommonAuthorizeParams(query: Record<string, unknown>): Promise<{ client: RegisteredClient; redirectUri: string; codeChallenge: string; scope: string[]; state?: string } | { error: string }> {
  const clientId = typeof query.client_id === "string" ? query.client_id : "";
  const redirectUri = typeof query.redirect_uri === "string" ? query.redirect_uri : "";
  const responseType = query.response_type;
  const codeChallenge = typeof query.code_challenge === "string" ? query.code_challenge : "";
  const method = query.code_challenge_method;
  const resource = typeof query.resource === "string" ? query.resource : MCP_RESOURCE_URL;
  if (responseType !== "code") return { error: "unsupported_response_type" };
  if (resource !== MCP_RESOURCE_URL) return { error: "invalid_target" };
  if (method !== "S256" || codeChallenge.length < 43 || codeChallenge.length > 128) return { error: "invalid_request" };
  const client = await getRegisteredClient(clientId);
  if (!client || !validRedirectUri(client, redirectUri)) return { error: "unauthorized_client" };
  const requested = typeof query.scope === "string" && query.scope.trim() ? query.scope.trim().split(/\s+/) : [...MCP_SCOPES];
  const scope = Array.from(new Set(requested)).filter((item) => (MCP_SCOPES as readonly string[]).includes(item));
  if (scope.length === 0 || scope.length !== requested.length) return { error: "invalid_scope" };
  return { client, redirectUri, codeChallenge, scope, state: typeof query.state === "string" ? query.state : undefined };
}

function redirectError(res: Response, redirectUri: string, error: string, state?: string) {
  const target = new URL(redirectUri);
  target.searchParams.set("error", error);
  if (state) target.searchParams.set("state", state);
  target.searchParams.set("iss", MCP_OAUTH_ISSUER);
  res.redirect(302, target.toString());
}

export function registerMcpOAuthRoutes(app: Express) {
  app.get("/.well-known/oauth-protected-resource", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ resource: MCP_RESOURCE_URL, authorization_servers: [MCP_OAUTH_ISSUER], scopes_supported: MCP_SCOPES, resource_documentation: `${PUBLIC_BASE_URL}/MANUS_API_MCP_SETUP.md` });
  });
  app.get("/.well-known/oauth-authorization-server", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ issuer: MCP_OAUTH_ISSUER, authorization_response_iss_parameter_supported: true, authorization_endpoint: AUTHORIZE_URL, token_endpoint: TOKEN_URL, registration_endpoint: REGISTER_URL, response_types_supported: ["code"], grant_types_supported: ["authorization_code"], token_endpoint_auth_methods_supported: ["none"], code_challenge_methods_supported: ["S256"], scopes_supported: MCP_SCOPES });
  });
  app.post("/api/mcp/oauth/register", async (req, res) => {
    try {
      const client = await registerClient(req.body ?? {});
      res.status(201).json({ client_id: client.clientId, client_id_issued_at: Math.floor(client.createdAt / 1000), client_secret_expires_at: 0, redirect_uris: client.redirectUris, client_name: client.clientName, token_endpoint_auth_method: "none" });
    } catch (error) {
      res.status(400).json({ error: "invalid_client_metadata", error_description: error instanceof Error ? error.message : "Invalid client metadata" });
    }
  });
  app.get("/api/mcp/oauth/collaborator-approvals", async (req, res) => {
    const admin = getAdminSession(getAdminSessionTokenFromRequest(req));
    if (!admin) { res.status(404).send("Not found"); return; }
    const db = await getDb();
    if (!db) { res.status(503).type("html").send("<!doctype html><title>Unavailable</title><p>Approval storage is temporarily unavailable.</p>"); return; }
    const requests = await db.select().from(mcpCollaboratorApprovals);
    const rows = requests.map((request) => `<tr><td>${htmlEscape(request.displayName ?? "Unknown collaborator")}</td><td>${htmlEscape(request.accountEmail ?? "Not supplied by identity provider")}</td><td><code>${htmlEscape(request.openId)}</code></td><td>${htmlEscape(request.status)}</td><td>${request.status === "pending" ? `<form method="post" action="/api/mcp/oauth/collaborator-approvals/review"><input type="hidden" name="id" value="${request.id}"><button name="decision" value="approved">Approve</button><button class="reject" name="decision" value="rejected">Reject</button></form>` : "—"}</td></tr>`).join("");
    res.type("html").send(`<!doctype html><meta charset="utf-8"><title>Collaborator approvals — Mzansi Couriers</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:32px;color:#102a24}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid #cddbd5;padding:10px;text-align:left;vertical-align:top}th{background:#edf6f1}code{word-break:break-all}button{background:#087f5b;color:#fff;border:0;border-radius:8px;padding:8px 10px;margin-right:6px}.reject{background:#a13b3b}</style><h1>Collaborator approvals</h1><p>Administrator: <strong>${htmlEscape(admin.username)}</strong>. Approving grants the exact authenticated Manus openId below; it does not use a typed email.</p><table><thead><tr><th>Name</th><th>Identity email</th><th>Verified openId</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows || "<tr><td colspan=5>No collaborator requests yet.</td></tr>"}</tbody></table>`);
  });
  app.post("/api/mcp/oauth/collaborator-approvals/review", async (req, res) => {
    const admin = getAdminSession(getAdminSessionTokenFromRequest(req));
    if (!admin) { res.status(404).send("Not found"); return; }
    const id = Number(req.body?.id);
    const decision = req.body?.decision === "approved" ? "approved" : req.body?.decision === "rejected" ? "rejected" : null;
    if (!Number.isInteger(id) || !decision) { res.status(400).send("Invalid review request"); return; }
    const db = await getDb();
    if (!db) { res.status(503).send("Approval storage is temporarily unavailable"); return; }
    await db.update(mcpCollaboratorApprovals).set({ status: decision, reviewedAt: new Date(), reviewedBy: admin.username }).where(eq(mcpCollaboratorApprovals.id, id));
    res.redirect(303, "/api/mcp/oauth/collaborator-approvals");
  });
  app.get("/api/mcp/oauth/authorize", async (req, res) => {
    const checked = await validateCommonAuthorizeParams(req.query as Record<string, unknown>);
    if ("error" in checked) { res.status(400).json({ error: checked.error }); return; }
    const session = await authenticatedCollaborator(req);
    if (!session) {
      res.redirect(302, collaboratorLoginUrl(new URLSearchParams(req.query as Record<string, string>).toString()));
      return;
    }
    if (!(await isAllowedCollaborator(session.openId))) {
      await recordPendingCollaborator(session);
      res.status(403).type("html").send(`<!doctype html><meta charset="utf-8"><title>Approval pending — Mzansi Couriers</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:10vh auto;padding:24px;color:#102a24}main{border:1px solid #b8c9c2;border-radius:16px;padding:24px;background:#f7fbf9}code{word-break:break-all}small{color:#49645a}</style><main><h1>Collaborator approval pending</h1><p>Your verified Manus account is signed in, but a project administrator must approve access before an MCP token can be issued.</p><p>Signed in as <strong>${htmlEscape(session.name)}</strong>.</p><small>No email was typed or used as proof. Approval is bound to the authenticated account identity on the server.</small></main>`);
      return;
    }
    const params = new URLSearchParams(req.query as Record<string, string>);
    params.set("consent", "approved");
    res.type("html").send(`<!doctype html><meta charset="utf-8"><title>Authorize Mzansi Couriers</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:10vh auto;padding:24px;color:#102a24}button{background:#087f5b;color:white;border:0;border-radius:10px;padding:12px 18px;font-size:16px}code{word-break:break-all}</style><h1>Connect Mzansi Couriers to ChatGPT</h1><p>Signed in as <strong>${htmlEscape(session.name)}</strong>.</p><p>This connection permits Manus task access for the scopes: <code>${htmlEscape(checked.scope.join(" "))}</code>.</p><form method="post" action="/api/mcp/oauth/authorize">${Array.from(params.entries()).map(([key, value]) => `<input type="hidden" name="${htmlEscape(key)}" value="${htmlEscape(value)}">`).join("")}<button type="submit">Authorize connection</button></form>`);
  });
  app.post("/api/mcp/oauth/authorize", async (req, res) => {
    const checked = await validateCommonAuthorizeParams(req.body ?? {});
    if ("error" in checked) { res.status(400).json({ error: checked.error }); return; }
    const session = await authenticatedCollaborator(req);
    if (!session) { res.status(401).json({ error: "login_required" }); return; }
    if (!(await isAllowedCollaborator(session.openId))) { res.status(403).json({ error: "collaborator_approval_pending" }); return; }
    const code = issueAuthorizationCode({ clientId: checked.client.clientId, redirectUri: checked.redirectUri, codeChallenge: checked.codeChallenge, scope: checked.scope, resource: MCP_RESOURCE_URL, expiresAt: Date.now() + CODE_TTL_MS, collaboratorOpenId: session.openId });
    const target = new URL(checked.redirectUri);
    target.searchParams.set("code", code);
    target.searchParams.set("iss", MCP_OAUTH_ISSUER);
    if (checked.state) target.searchParams.set("state", checked.state);
    res.redirect(302, target.toString());
  });
  app.post("/api/mcp/oauth/token", (req, res) => {
    const body = req.body ?? {};
    const grantType = body.grant_type;
    const code = typeof body.code === "string" ? body.code : "";
    const clientId = typeof body.client_id === "string" ? body.client_id : "";
    const redirectUri = typeof body.redirect_uri === "string" ? body.redirect_uri : "";
    const verifier = typeof body.code_verifier === "string" ? body.code_verifier : "";
    if (grantType !== "authorization_code" || !code || !clientId || !redirectUri || !verifier) { res.status(400).json({ error: "invalid_request" }); return; }
    const record = authorizationCodes.get(code);
    authorizationCodes.delete(code);
    if (!record || record.expiresAt < Date.now() || record.clientId !== clientId || record.redirectUri !== redirectUri) { res.status(400).json({ error: "invalid_grant" }); return; }
    const expectedChallenge = createHash("sha256").update(verifier).digest("base64url");
    if (expectedChallenge !== record.codeChallenge) { res.status(400).json({ error: "invalid_grant" }); return; }
    const now = Math.floor(Date.now() / 1000);
    const accessToken = signedToken({ sub: record.collaboratorOpenId, aud: record.resource, scope: record.scope, iat: now, exp: now + ACCESS_TOKEN_TTL_SECONDS, jti: randomBytes(16).toString("hex") });
    res.json({ access_token: accessToken, token_type: "Bearer", expires_in: ACCESS_TOKEN_TTL_SECONDS, scope: record.scope.join(" ") });
  });
}

export function handleMcpOAuthLoginCallback(req: Request, res: Response, state: string): boolean {
  const payload = decodeBase64Json<{ mcpResume?: string }>(state);
  if (!payload?.mcpResume) return false;
  const query = Buffer.from(payload.mcpResume, "base64url").toString("utf8");
  res.redirect(302, `${PUBLIC_BASE_URL}/api/mcp/oauth/authorize?${query}`);
  return true;
}
