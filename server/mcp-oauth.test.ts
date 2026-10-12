import express from "express";
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sdk } from "./_core/sdk";
import { handleReadonlyMcp } from "./mcp-readonly";
import { registerMcpOAuthRoutes, MCP_PROJECT_READ_SCOPE, MCP_READ_SCOPE, MCP_RESOURCE_URL } from "./mcp-oauth";

const servers: Server[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

async function startApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  registerMcpOAuthRoutes(app);
  app.all("/api/mcp", async (req, res) => handleReadonlyMcp(req, res, req.body));
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("OAuth test server did not start");
  return `http://127.0.0.1:${address.port}`;
}

function pkceVerifier() { return "verifier-value-that-is-long-enough-for-pkce-s256-123456789"; }
async function sha256Base64Url(value: string) { return Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))).toString("base64url"); }

function readSseJson(raw: string) {
  const line = raw.split(/\r?\n/).find((item) => item.startsWith("data: "));
  if (!line) throw new Error(`No MCP SSE payload: ${raw}`);
  return JSON.parse(line.slice(6));
}

describe("MCP OAuth 2.1 ChatGPT compatibility", () => {
  it("publishes protected-resource and authorization-server discovery metadata", async () => {
    const base = await startApp();
    const resource = await fetch(`${base}/.well-known/oauth-protected-resource`).then((response) => response.json());
    const authorization = await fetch(`${base}/.well-known/oauth-authorization-server`).then((response) => response.json());
    expect(resource.resource).toBe(MCP_RESOURCE_URL);
    expect(resource.authorization_servers).toHaveLength(1);
    expect(resource.scopes_supported).toEqual(["manus:tasks.read", "manus:tasks.write", "mzansi:project.read"]);
    expect(authorization.authorization_endpoint).toContain("/api/mcp/oauth/authorize");
    expect(authorization.token_endpoint).toContain("/api/mcp/oauth/token");
    expect(authorization.code_challenge_methods_supported).toContain("S256");
    expect(authorization.token_endpoint_auth_methods_supported).toEqual(["none"]);
  });

  it("performs owner-only authorization-code PKCE and allows a read-only task call", async () => {
    const collaboratorOpenId = "collaborator-test-open-id";
    const originalAllowlist = process.env.MCP_COLLABORATOR_OPEN_IDS;
    process.env.MCP_COLLABORATOR_OPEN_IDS = collaboratorOpenId;
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue({ openId: collaboratorOpenId, name: "Verified collaborator" } as any);
    const realFetch = globalThis.fetch;
    const apiFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      if (!request.url.startsWith("https://api.manus.ai/")) return realFetch(input, init);
      expect(request.headers.get("x-manus-api-key")).toBeTruthy();
      expect(request.headers.get("authorization")).toBeNull();
      return new Response(JSON.stringify({ ok: true, task_id: "owner-task", status: "completed", messages: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", apiFetch);
    const base = await startApp();
    const redirectUri = "https://chat.openai.com/oauth/callback";
    const registration = await fetch(`${base}/api/mcp/oauth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_name: "ChatGPT", redirect_uris: [redirectUri], token_endpoint_auth_method: "none" }) }).then((response) => response.json());
    expect(registration.client_id).toMatch(/^c_/);
    const verifier = pkceVerifier();
    const challenge = await sha256Base64Url(verifier);
    const authorize = new URL(`${base}/api/mcp/oauth/authorize`);
    authorize.searchParams.set("client_id", registration.client_id);
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("code_challenge", challenge);
    authorize.searchParams.set("code_challenge_method", "S256");
    authorize.searchParams.set("resource", MCP_RESOURCE_URL);
    authorize.searchParams.set("scope", MCP_READ_SCOPE);
    authorize.searchParams.set("state", "chatgpt-state");
    const approval = await fetch(authorize);
    expect(approval.status).toBe(200);
    const form = await approval.text();
    expect(form).toContain("Authorize connection");
    const tokenParams = new URLSearchParams();
    tokenParams.set("client_id", registration.client_id);
    tokenParams.set("redirect_uri", redirectUri);
    tokenParams.set("grant_type", "authorization_code");
    tokenParams.set("code_verifier", verifier);
    const authorizePostParams = new URLSearchParams(authorize.search);
    const approved = await fetch(`${base}/api/mcp/oauth/authorize`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: authorizePostParams });
    expect(approved.status).toBe(302);
    const location = approved.headers.get("location");
    expect(location).toBeTruthy();
    tokenParams.set("code", new URL(location!).searchParams.get("code")!);
    const tokenResponse = await fetch(`${base}/api/mcp/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: tokenParams });
    expect(tokenResponse.status).toBe(200);
    const token = await tokenResponse.json();
    expect(token.token_type).toBe("Bearer");
    expect(token.scope).toBe(MCP_READ_SCOPE);
    const mcpResponse = await fetch(`${base}/api/mcp`, { method: "POST", headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_manus_task", arguments: { task_id: "owner-task" } } }) });
    expect(mcpResponse.status).toBe(200);
    const payload = readSseJson(await mcpResponse.text());
    expect(payload.result.content[0].text).toContain("owner-task");
    expect(apiFetch.mock.calls.filter(([input]) => String(input).startsWith("https://api.manus.ai/")).length).toBe(1);
    if (originalAllowlist === undefined) delete process.env.MCP_COLLABORATOR_OPEN_IDS;
    else process.env.MCP_COLLABORATOR_OPEN_IDS = originalAllowlist;
  });

  it("returns the MCP OAuth challenge without an access token", async () => {
    const base = await startApp();
    const response = await fetch(`${base}/api/mcp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }) });
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("resource_metadata=");
    expect(response.headers.get("www-authenticate")).toContain("scope=\"mzansi:project.read\"");
  });

  it("authorizes a verified collaborator for full project read-only MCP access", async () => {
    const collaboratorOpenId = "dieter-project-read-test";
    const originalAllowlist = process.env.MCP_COLLABORATOR_OPEN_IDS;
    process.env.MCP_COLLABORATOR_OPEN_IDS = collaboratorOpenId;
    vi.spyOn(sdk, "authenticateRequest").mockResolvedValue({ openId: collaboratorOpenId, name: "Dieter" } as any);
    const base = await startApp();
    const redirectUri = "https://chat.openai.com/oauth/callback";
    const registration = await fetch(`${base}/api/mcp/oauth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_name: "ChatGPT Dieter", redirect_uris: [redirectUri], token_endpoint_auth_method: "none" }) }).then((response) => response.json());
    const verifier = pkceVerifier();
    const challenge = await sha256Base64Url(verifier);
    const authorize = new URL(`${base}/api/mcp/oauth/authorize`);
    authorize.searchParams.set("client_id", registration.client_id);
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("code_challenge", challenge);
    authorize.searchParams.set("code_challenge_method", "S256");
    authorize.searchParams.set("resource", MCP_RESOURCE_URL);
    authorize.searchParams.set("scope", MCP_PROJECT_READ_SCOPE);
    authorize.searchParams.set("state", "dieter-project-state");
    expect((await fetch(authorize)).status).toBe(200);
    const tokenParams = new URLSearchParams({ client_id: registration.client_id, redirect_uri: redirectUri, grant_type: "authorization_code", code_verifier: verifier });
    const approved = await fetch(`${base}/api/mcp/oauth/authorize`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(authorize.search) });
    tokenParams.set("code", new URL(approved.headers.get("location")!).searchParams.get("code")!);
    const token = await fetch(`${base}/api/mcp/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: tokenParams }).then((response) => response.json());
    expect(token.scope).toBe(MCP_PROJECT_READ_SCOPE);
    const toolsResponse = await fetch(`${base}/api/mcp`, { method: "POST", headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }) });
    expect(toolsResponse.status).toBe(200);
    const payload = readSseJson(await toolsResponse.text());
    expect(payload.result.tools.map((tool: { name: string }) => tool.name)).toContain("read_project_file");
    expect(payload.result.tools).toHaveLength(7);
    if (originalAllowlist === undefined) delete process.env.MCP_COLLABORATOR_OPEN_IDS;
    else process.env.MCP_COLLABORATOR_OPEN_IDS = originalAllowlist;
  });

  it("redirects an unauthenticated authorization request to collaborator sign-in", async () => {
    const base = await startApp();
    const registration = await fetch(`${base}/api/mcp/oauth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redirect_uris: ["https://chat.openai.com/oauth/callback"] }) }).then((response) => response.json());
    const params = new URLSearchParams({ client_id: registration.client_id, redirect_uri: "https://chat.openai.com/oauth/callback", response_type: "code", code_challenge: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", code_challenge_method: "S256", resource: MCP_RESOURCE_URL, scope: MCP_READ_SCOPE });
    const response = await fetch(`${base}/api/mcp/oauth/authorize?${params}`, { redirect: "manual" });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("/app-auth");
  });
});
