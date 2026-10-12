import { describe, expect, it } from "vitest";
import { calculateExpectedDeliveryAmount, validateCustomerParcelEvidence } from "../routers/customer-payments";

describe("customer Paystack booking quote", () => {
  it("matches the customer pricing formula for a small parcel", () => {
    expect(calculateExpectedDeliveryAmount({ distance: 10, packageSize: "small", packageWeight: 1 })).toBe(79);
  });

  it("applies the medium and weight surcharge rules", () => {
    expect(calculateExpectedDeliveryAmount({ distance: 20, packageSize: "medium", packageWeight: 8 })).toBe(139);
  });

  it("applies the large-package multiplier", () => {
    expect(calculateExpectedDeliveryAmount({ distance: 5, packageSize: "large", packageWeight: 20 })).toBe(229);
  });
});

describe("mandatory customer parcel evidence", () => {
  const valid = {
    trackingCode: "#MZ-ABC123-XYZ",
    packageLabelPhotoKey: "package-label/42/parcel.jpg",
    packageLabelConfirmed: true as const,
  };

  it("accepts a valid code, confirmed label, and customer-owned photo key", () => {
    expect(validateCustomerParcelEvidence(valid, 42)).toBe(true);
  });

  it("rejects missing confirmation or a photo key belonging to another customer", () => {
    expect(validateCustomerParcelEvidence({ ...valid, packageLabelConfirmed: false as never }, 42)).toBe(false);
    expect(validateCustomerParcelEvidence({ ...valid, packageLabelPhotoKey: "package-label/7/parcel.jpg" }, 42)).toBe(false);
  });

  it("rejects a malformed parcel identification code", () => {
    expect(validateCustomerParcelEvidence({ ...valid, trackingCode: "not-a-code" }, 42)).toBe(false);
  });
});
