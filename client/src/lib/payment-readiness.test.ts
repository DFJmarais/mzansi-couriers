import { describe, expect, it } from "vitest";
import { getPaymentReadiness } from "./payment-readiness";

describe("payment readiness", () => {
  it("marks a verified paid parcel ready for pickup", () => {
    expect(getPaymentReadiness("paid")).toEqual({ label: "Paid · ready for pickup", shortLabel: "Paid", ready: true });
  });

  it.each(["pending", "failed", "cancelled", null, undefined] as const)("does not mark %s as ready", (status) => {
    expect(getPaymentReadiness(status).ready).toBe(false);
  });
});
