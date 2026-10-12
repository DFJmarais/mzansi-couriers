import { describe, expect, it } from "vitest";
import { ACCOUNT_DELETION_CONFIRMATION } from "./account-deletion";

describe("account deletion", () => {
  it("requires the exact Apple-compliant confirmation phrase", () => {
    expect(ACCOUNT_DELETION_CONFIRMATION).toBe("DELETE MY ACCOUNT");
  });
});
