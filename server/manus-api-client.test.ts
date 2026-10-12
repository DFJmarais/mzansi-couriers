import { describe, expect, it } from "vitest";
import { manusApiRequest } from "./manus-api-client";

describe("Manus API v2 credential validation", () => {
  it("calls the official task endpoint with the server-side API key without exposing it", async () => {
    expect(process.env.MANUS_API_KEY).toBeTruthy();
    try {
      const result = await manusApiRequest("/v2/task.listMessages?task_id=__mcp_credential_check__&limit=1");
      expect(result).toBeDefined();
      expect(JSON.stringify(result)).not.toContain(process.env.MANUS_API_KEY ?? "__missing__");
      expect(JSON.stringify(result)).not.toContain("x-manus-api-key");
    } catch (error) {
      // A synthetic task ID should be absent. `not_found` proves the API key
      // was accepted; `unauthenticated` would mean the credential is invalid.
      expect(error).toMatchObject({ message: expect.stringContaining("(not_found)") });
    }
  }, 30_000);
});
