import { describe, expect, it } from "vitest";
import { hashAdminPassword, verifyAdminPassword } from "./routers/admin-password-reset";

describe("administrator password recovery", () => {
  it("hashes passwords with a salted non-reversible representation", async () => {
    const first = await hashAdminPassword("A-strong-admin-password-2026!");
    const second = await hashAdminPassword("A-strong-admin-password-2026!");
    expect(first).toMatch(/^scrypt\$[^$]+\$[0-9a-f]+$/);
    expect(second).not.toBe(first);
    expect(await verifyAdminPassword("A-strong-admin-password-2026!", first)).toBe(true);
    expect(await verifyAdminPassword("wrong-password", first)).toBe(false);
  });

  it("rejects malformed stored hashes safely", async () => {
    expect(await verifyAdminPassword("anything", "not-a-password-hash")).toBe(false);
  });
});
