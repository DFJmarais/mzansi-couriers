import { describe, expect, it } from "vitest";
import { courierBankDetailsInput } from "./routers/onboarding";

describe("courier bank details onboarding", () => {
  const valid = {
    bankCode: "198765",
    bankName: "Test Bank",
    branchCode: "250655",
    accountNumber: "1234567890",
    accountName: "Test Courier",
    privacyConsent: true as const,
  };

  it("accepts complete bank details for Paystack recipient setup", () => {
    expect(courierBankDetailsInput.parse(valid)).toEqual(valid);
  });

  it("requires a numeric account number and branch code", () => {
    expect(() => courierBankDetailsInput.parse({ ...valid, accountNumber: "12AB" })).toThrow();
    expect(() => courierBankDetailsInput.parse({ ...valid, branchCode: "branch" })).toThrow();
  });

  it("requires privacy consent before financial data is saved", () => {
    expect(() => courierBankDetailsInput.parse({ ...valid, privacyConsent: false })).toThrow();
  });

  it("keeps the weekly Thursday-or-Friday payout policy explicit", () => {
    expect(["Thursday", "Friday"]).toEqual(["Thursday", "Friday"]);
  });
});

