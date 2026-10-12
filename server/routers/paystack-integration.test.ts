import { describe, expect, it } from "vitest";

describe("Paystack Integration", () => {
  it("has a Paystack public key configured", () => {
    const publicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY;
    expect(publicKey).toBeDefined();
    expect(publicKey).toMatch(/^pk_(live|test)_[a-f0-9]{40}$/);
  });

  it("accepts the documented Paystack public-key format", () => {
    const publicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY;
    expect(publicKey).toMatch(/^pk_(live|test)_[a-f0-9]{40}$/);
  });

  it("uses the expected Paystack key length", () => {
    const publicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY;
    expect(publicKey).toHaveLength(48);
  });

  it("does not require a production key in non-production test environments", () => {
    const publicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY;
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
      expect(publicKey).toContain("pk_live_");
    } else {
      expect(publicKey).toMatch(/^pk_(live|test)_/);
    }
  });
});
