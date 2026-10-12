import { createServer } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleReadonlyMcp } from "./mcp-readonly";
import { MANUS_MCP_TOOL_NAMES } from "./mcp-manus";

type TestServer = ReturnType<typeof createServer>;
const servers: TestServer[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

async function startEndpoint() {
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", async () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      const body = raw ? JSON.parse(raw) : undefined;
      await handleReadonlyMcp(req, res, body);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
  return `http://127.0.0.1:${address.port}/api/mcp`;
}

async function callMcp(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MCP_MANUS_TOKEN ?? ""}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });
}

function readSseJson(raw: string) {
  const line = raw.split(/\r?\n/).find((item) => item.startsWith("data: "));
  if (!line) throw new Error(`No SSE data line in ${raw}`);
  return JSON.parse(line.slice("data: ".length));
}

describe("Manus API MCP bridge", () => {
  it("exposes exactly the four requested Manus tools under the separate token", async () => {
    expect(process.env.MCP_MANUS_TOKEN).toBeTruthy();
    expect(process.env.MANUS_API_KEY).toBeTruthy();
    const url = await startEndpoint();
    const response = await callMcp(url, { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
    expect(response.status).toBe(200);
    const payload = readSseJson(await response.text());
    expect(payload.result.tools.map((tool: { name: string }) => tool.name)).toEqual([...MANUS_MCP_TOOL_NAMES]);
    expect(payload.result.tools.every((tool: { annotations?: { destructiveHint?: boolean } }) => tool.annotations?.destructiveHint === false)).toBe(true);
  });

  it("forwards create_manus_task only through the server-side API-key header", async () => {
    const realFetch = globalThis.fetch;
    const apiFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      if (!request.url.startsWith("https://api.manus.ai/")) return realFetch(input, init);
      expect(request.headers.get("x-manus-api-key")).toBeTruthy();
      expect(request.headers.get("authorization")).toBeNull();
      expect(request.url).toBe("https://api.manus.ai/v2/task.create");
      return new Response(JSON.stringify({ ok: true, request_id: "req_test", task_id: "task_test", task_url: "https://manus.im/task/task_test" }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", apiFetch);
    const url = await startEndpoint();
    const response = await callMcp(url, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "create_manus_task", arguments: { content: "Return the word ready.", share_visibility: "private" } },
    });
    expect(response.status).toBe(200);
    const payload = readSseJson(await response.text());
    expect(payload.result.isError).not.toBe(true);
    expect(payload.result.content[0].text).toContain("task_test");
    const upstreamCalls = apiFetch.mock.calls.filter(([input]) => String(input).startsWith("https://api.manus.ai/"));
    expect(upstreamCalls).toHaveLength(1);
  });
});
