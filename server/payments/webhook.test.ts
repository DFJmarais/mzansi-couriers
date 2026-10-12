import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { calculateRefundReversals, verifyPaystackWebhook } from "./webhook";

describe("Paystack webhook signature", () => {
  it("rejects an empty or invalid signature", () => {
    expect(verifyPaystackWebhook("{}", "")).toBe(false);
    expect(verifyPaystackWebhook("{}", "invalid")).toBe(false);
  });

  it("accepts the exact body signature when a test secret is configured", () => {
    const secret = process.env.PAYSTACK_SECRET_KEY || "";
    const body = JSON.stringify({ event: "charge.success", data: { reference: "test" } });
    const signature = crypto.createHmac("sha512", secret).update(body).digest("hex");
    expect(verifyPaystackWebhook(body, signature)).toBe(true);
  });

  it("does not reverse an unallocated courier pool and create negative earnings", () => {
    expect(calculateRefundReversals(10, 5, 0)).toEqual({ platformReversal: 1, courierPoolReversal: 0, payoutLoss: 0 });
  });

  it("reverses only paid courier earnings when a refund follows payout", () => {
    expect(calculateRefundReversals(10, 5, 3)).toEqual({ platformReversal: 1, courierPoolReversal: 3, payoutLoss: 3 });
  });
});
