import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { handleReadonlyMcp, READONLY_MCP_TOOL_NAMES } from "./mcp-readonly";

type TestServer = ReturnType<typeof createServer>;
const servers: TestServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

async function startTestEndpoint() {
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", async () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      let body: unknown;
      try {
        body = raw ? JSON.parse(raw) : undefined;
      } catch {
        res.statusCode = 400;
        res.end("Invalid JSON");
        return;
      }
      await handleReadonlyMcp(req, res, body);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
  return `http://127.0.0.1:${address.port}/api/mcp`;
}

async function postMcp(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MCP_READ_ONLY_TOKEN ?? ""}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });
}

describe("read-only MCP endpoint", () => {
  it("requires the configured secret and exposes only read-only tools", async () => {
    expect(process.env.MCP_READ_ONLY_TOKEN).toBeTruthy();
    const url = await startTestEndpoint();
    const response = await postMcp(url, {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    });
    expect(response.status).toBe(200);
    const responseText = await response.text();
    const dataLine = responseText.split(/\r?\n/).find((line) => line.startsWith("data: "));
    expect(dataLine).toBeTruthy();
    const payload = JSON.parse(dataLine!.slice("data: ".length)) as { result?: { tools?: Array<{ name: string; annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean } }> } };
    const tools = payload.result?.tools ?? [];
    expect(tools.map((tool) => tool.name).sort()).toEqual([...READONLY_MCP_TOOL_NAMES].sort());
    expect(tools.every((tool) => tool.annotations?.readOnlyHint === true && tool.annotations?.destructiveHint === false)).toBe(true);
    expect(tools.some((tool) => /write|update|delete|create|assign|approve|send/i.test(tool.name))).toBe(false);
  });

  it("rejects a wrong bearer token", async () => {
    expect(process.env.MCP_READ_ONLY_TOKEN).toBeTruthy();
    const url = await startTestEndpoint();
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer definitely-not-the-configured-token", "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });
    expect(response.status).toBe(401);
  });
});
