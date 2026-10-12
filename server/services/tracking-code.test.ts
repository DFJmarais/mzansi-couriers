import { describe, expect, it } from "vitest";
import { generateTrackingCode, validateTrackingCode } from "./tracking-code";

describe("tracking-code service", () => {
  describe("generateTrackingCode", () => {
    it("generates a tracking code in correct format", () => {
      const code = generateTrackingCode();
      expect(code).toMatch(/^#MZ-[A-Z]{3}\d{3}-[A-Z]{3}$/);
    });

    it("generates codes with correct prefix", () => {
      const code = generateTrackingCode();
      expect(code.substring(0, 4)).toBe("#MZ-");
    });

    it("generates codes with 14 characters total", () => {
      const code = generateTrackingCode();
      expect(code).toHaveLength(14);
    });

    it("generates unique codes", () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateTrackingCode());
      }
      // Should have 100 unique codes (very high probability)
      expect(codes.size).toBeGreaterThan(95);
    });

    it("generates codes with uppercase letters", () => {
      const code = generateTrackingCode();
      const letters = code.match(/[A-Z]/g);
      expect(letters).toBeDefined();
      expect(letters!.length).toBe(8); // MZ + 3 + 3 letters
    });

    it("generates codes with exactly 3 digits", () => {
      const code = generateTrackingCode();
      const digits = code.match(/\d/g);
      expect(digits).toBeDefined();
      expect(digits!.length).toBe(3);
    });

    it("generates codes with correct structure: #MZ-ABC123-XYZ", () => {
      const code = generateTrackingCode();
      const parts = code.split("-");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("#MZ");
      expect(parts[1]).toMatch(/^[A-Z]{3}\d{3}$/);
      expect(parts[2]).toMatch(/^[A-Z]{3}$/);
    });
  });

  describe("validateTrackingCode", () => {
    it("validates a correctly formatted code", () => {
      const code = "#MZ-ABC123-XYZ";
      expect(validateTrackingCode(code)).toBe(true);
    });

    it("validates generated codes", () => {
      for (let i = 0; i < 50; i++) {
        const code = generateTrackingCode();
        expect(validateTrackingCode(code)).toBe(true);
      }
    });

    it("rejects codes without prefix", () => {
      expect(validateTrackingCode("ABC123-XYZ")).toBe(false);
    });

    it("rejects codes with wrong prefix", () => {
      expect(validateTrackingCode("#ZA-ABC123-XYZ")).toBe(false);
    });

    it("rejects codes with lowercase letters", () => {
      expect(validateTrackingCode("#MZ-abc123-xyz")).toBe(false);
    });

    it("rejects codes with missing digits", () => {
      expect(validateTrackingCode("#MZ-ABC12-XYZ")).toBe(false);
    });

    it("rejects codes with too many digits", () => {
      expect(validateTrackingCode("#MZ-ABC1234-XYZ")).toBe(false);
    });

    it("rejects codes with missing letters", () => {
      expect(validateTrackingCode("#MZ-AB123-XY")).toBe(false);
    });

    it("rejects codes with too many letters", () => {
      expect(validateTrackingCode("#MZ-ABCD123-XYZW")).toBe(false);
    });

    it("rejects codes with special characters", () => {
      expect(validateTrackingCode("#MZ-AB@123-XYZ")).toBe(false);
    });

    it("rejects codes with spaces", () => {
      expect(validateTrackingCode("#MZ-ABC 123-XYZ")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(validateTrackingCode("")).toBe(false);
    });

    it("rejects null-like strings", () => {
      expect(validateTrackingCode("null")).toBe(false);
      expect(validateTrackingCode("undefined")).toBe(false);
    });

    it("rejects codes with wrong separator", () => {
      expect(validateTrackingCode("#MZ_ABC123_XYZ")).toBe(false);
    });

    it("rejects codes with missing separator", () => {
      expect(validateTrackingCode("#MZABC123XYZ")).toBe(false);
    });

    it("rejects codes with extra separators", () => {
      expect(validateTrackingCode("#MZ-ABC-123-XYZ")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles codes with all same letters", () => {
      const code = "#MZ-AAA123-ZZZ";
      expect(validateTrackingCode(code)).toBe(true);
    });

    it("handles codes with all same digits", () => {
      const code = "#MZ-ABC000-XYZ";
      expect(validateTrackingCode(code)).toBe(true);
    });

    it("handles codes with all same digits (999)", () => {
      const code = "#MZ-ABC999-XYZ";
      expect(validateTrackingCode(code)).toBe(true);
    });

    it("rejects codes that are too short", () => {
      expect(validateTrackingCode("#MZ-ABC123-XY")).toBe(false);
    });

    it("rejects codes that are too long", () => {
      expect(validateTrackingCode("#MZ-ABC123-XYZW")).toBe(false);
    });

    it("rejects codes with leading/trailing spaces", () => {
      expect(validateTrackingCode(" #MZ-ABC123-XYZ")).toBe(false);
      expect(validateTrackingCode("#MZ-ABC123-XYZ ")).toBe(false);
    });
  });

  describe("real-world scenarios", () => {
    it("generates codes for multiple deliveries without collision", () => {
      const codes = new Set<string>();
      const deliveryCount = 1000;

      for (let i = 0; i < deliveryCount; i++) {
        const code = generateTrackingCode();
        expect(validateTrackingCode(code)).toBe(true);
        codes.add(code);
      }

      // Should have very few collisions (statistically impossible to have many)
      expect(codes.size).toBeGreaterThan(990);
    });

    it("validates codes from customer perspective", () => {
      // Customer receives code from confirmation email
      const code = generateTrackingCode();

      // Customer enters code on tracking page
      const isValid = validateTrackingCode(code);
      expect(isValid).toBe(true);
    });

    it("validates codes from courier perspective", () => {
      // Courier scans code at pickup
      const code = generateTrackingCode();

      // System validates code
      const isValid = validateTrackingCode(code);
      expect(isValid).toBe(true);
    });
  });
});
