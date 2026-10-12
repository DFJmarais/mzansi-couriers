const MANUS_API_BASE_URL = "https://api.manus.ai";

export type ManusApiResponse = {
  ok?: boolean;
  request_id?: string;
  [key: string]: unknown;
};

function requireManusApiKey(): string {
  const key = process.env.MANUS_API_KEY?.trim();
  if (!key) throw new Error("MANUS_API_KEY is not configured on the server.");
  return key;
}

export async function manusApiRequest<T extends ManusApiResponse = ManusApiResponse>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const key = requireManusApiKey();
  const url = new URL(endpoint, MANUS_API_BASE_URL);
  const headers = new Headers(init.headers);
  headers.set("x-manus-api-key", key);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });
  const raw = await response.text();
  let payload: T;
  try {
    payload = (raw ? JSON.parse(raw) : {}) as T;
  } catch {
    throw new Error(`Manus API returned a non-JSON response (${response.status}).`);
  }
  if (!response.ok || payload.ok === false) {
    const error = payload.error as { code?: string; message?: string } | undefined;
    throw new Error(`Manus API request failed${error?.code ? ` (${error.code})` : ""}: ${error?.message ?? `HTTP ${response.status}`}`);
  }
  return payload;
}

export async function createManusTask(input: Record<string, unknown>) {
  return manusApiRequest("/v2/task.create", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getManusTask(taskId: string) {
  return manusApiRequest(`/v2/task.detail?task_id=${encodeURIComponent(taskId)}`);
}

export async function getManusTaskResults(input: {
  taskId: string;
  limit?: number;
  cursor?: string;
  order?: "asc" | "desc";
  verbose?: boolean;
}) {
  const params = new URLSearchParams({
    task_id: input.taskId,
    limit: String(input.limit ?? 50),
    order: input.order ?? "desc",
    verbose: String(input.verbose ?? false),
  });
  if (input.cursor) params.set("cursor", input.cursor);
  return manusApiRequest(`/v2/task.listMessages?${params.toString()}`);
}

export async function sendManusFollowup(input: Record<string, unknown>) {
  return manusApiRequest("/v2/task.sendMessage", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
