import { describe, it, expect, beforeEach } from "vitest";
import {
  encryptQrToken,
  decryptQrToken,
  generateCourierIdNumber,
  hashVerificationToken,
} from "./_core/courierIdEncryption";

describe("Courier ID Encryption", () => {
  describe("encryptQrToken", () => {
    it("should generate a valid encrypted token", () => {
      const courierId = 123;
      const token = encryptQrToken(courierId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token).toContain(":"); // Should have IV:encrypted format
    });

    it("should generate different tokens for same courier (due to random IV)", () => {
      const courierId = 123;
      const token1 = encryptQrToken(courierId);
      const token2 = encryptQrToken(courierId);

      expect(token1).not.toBe(token2);
    });
  });

  describe("decryptQrToken", () => {
    it("should decrypt a valid token", () => {
      const courierId = 123;
      const token = encryptQrToken(courierId);
      const decrypted = decryptQrToken(token);

      expect(decrypted).not.toBeNull();
      expect(decrypted?.courierId).toBe(courierId);
      expect(decrypted?.timestamp).toBeDefined();
    });

    it("should return null for invalid token", () => {
      const invalidToken = "invalid:token:format";
      const decrypted = decryptQrToken(invalidToken);

      expect(decrypted).toBeNull();
    });

    it("should return null for expired token", async () => {
      const courierId = 123;
      const token = encryptQrToken(courierId);

      // Wait a bit and test with very short max age
      await new Promise((resolve) => setTimeout(resolve, 100));
      const decrypted = decryptQrToken(token, 50); // 50ms max age

      expect(decrypted).toBeNull();
    });

    it("should accept token within max age", () => {
      const courierId = 123;
      const token = encryptQrToken(courierId);
      const decrypted = decryptQrToken(token, 60000); // 60 seconds

      expect(decrypted).not.toBeNull();
      expect(decrypted?.courierId).toBe(courierId);
    });

    it("should handle 24-hour default expiry", () => {
      const courierId = 456;
      const token = encryptQrToken(courierId);
      const decrypted = decryptQrToken(token); // Default 24 hours

      expect(decrypted).not.toBeNull();
      expect(decrypted?.courierId).toBe(courierId);
    });
  });

  describe("generateCourierIdNumber", () => {
    it("should generate correctly formatted ID numbers", () => {
      expect(generateCourierIdNumber(1)).toBe("MC-000001");
      expect(generateCourierIdNumber(10)).toBe("MC-000010");
      expect(generateCourierIdNumber(100)).toBe("MC-000100");
      expect(generateCourierIdNumber(1000)).toBe("MC-001000");
      expect(generateCourierIdNumber(10000)).toBe("MC-010000");
      expect(generateCourierIdNumber(100000)).toBe("MC-100000");
      expect(generateCourierIdNumber(999999)).toBe("MC-999999");
    });

    it("should always have MC- prefix", () => {
      for (let i = 1; i <= 1000; i += 100) {
        const id = generateCourierIdNumber(i);
        expect(id.startsWith("MC-")).toBe(true);
      }
    });

    it("should always have 6-digit number", () => {
      for (let i = 1; i <= 1000; i += 100) {
        const id = generateCourierIdNumber(i);
        const number = id.split("-")[1];
        expect(number).toHaveLength(6);
      }
    });
  });

  describe("hashVerificationToken", () => {
    it("should generate a hash", () => {
      const token = "test-token-123";
      const hash = hashVerificationToken(token);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBe(64); // SHA256 produces 64 hex characters
    });

    it("should generate same hash for same token", () => {
      const token = "test-token-123";
      const hash1 = hashVerificationToken(token);
      const hash2 = hashVerificationToken(token);

      expect(hash1).toBe(hash2);
    });

    it("should generate different hash for different tokens", () => {
      const hash1 = hashVerificationToken("token-1");
      const hash2 = hashVerificationToken("token-2");

      expect(hash1).not.toBe(hash2);
    });

    it("should be deterministic", () => {
      const token = "deterministic-test";
      const hashes = Array.from({ length: 5 }, () =>
        hashVerificationToken(token)
      );

      const allSame = hashes.every((h) => h === hashes[0]);
      expect(allSame).toBe(true);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete QR code lifecycle", () => {
      const courierId = 789;

      // 1. Generate ID number
      const idNumber = generateCourierIdNumber(courierId);
      expect(idNumber).toBe("MC-000789");

      // 2. Encrypt QR token
      const qrToken = encryptQrToken(courierId);
      expect(qrToken).toBeDefined();

      // 3. Verify token can be decrypted
      const decrypted = decryptQrToken(qrToken);
      expect(decrypted?.courierId).toBe(courierId);

      // 4. Hash verification token
      const hash = hashVerificationToken(qrToken);
      expect(hash).toBeDefined();
    });

    it("should handle multiple couriers", () => {
      const courierIds = [1, 100, 999, 5000, 999999];

      courierIds.forEach((cid) => {
        const idNumber = generateCourierIdNumber(cid);
        const qrToken = encryptQrToken(cid);
        const decrypted = decryptQrToken(qrToken);

        expect(idNumber).toContain("MC-");
        expect(decrypted?.courierId).toBe(cid);
      });
    });

    it("should maintain security across operations", () => {
      const courierId = 555;
      const token1 = encryptQrToken(courierId);
      const token2 = encryptQrToken(courierId);

      // Tokens should be different (random IV)
      expect(token1).not.toBe(token2);

      // But both should decrypt to same courier
      expect(decryptQrToken(token1)?.courierId).toBe(courierId);
      expect(decryptQrToken(token2)?.courierId).toBe(courierId);

      // Hashes should be different
      expect(hashVerificationToken(token1)).not.toBe(
        hashVerificationToken(token2)
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle courier ID 0", () => {
      const idNumber = generateCourierIdNumber(0);
      expect(idNumber).toBe("MC-000000");
    });

    it("should handle very large courier IDs", () => {
      const largeId = 999999999;
      // Should still work, though ID number will be truncated
      const token = encryptQrToken(largeId);
      const decrypted = decryptQrToken(token);

      expect(decrypted?.courierId).toBe(largeId);
    });

    it("should handle empty token gracefully", () => {
      const decrypted = decryptQrToken("");
      expect(decrypted).toBeNull();
    });

    it("should handle malformed token gracefully", () => {
      const malformedTokens = [
        "no-colon",
        ":",
        "::",
        "invalid:hex:format",
        "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      ];

      malformedTokens.forEach((token) => {
        const decrypted = decryptQrToken(token);
        expect(decrypted).toBeNull();
      });
    });
  });

  describe("Performance", () => {
    it("should encrypt tokens quickly", () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        encryptQrToken(i);
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete 100 encryptions in less than 1 second
      expect(duration).toBeLessThan(1000);
    });

    it("should decrypt tokens quickly", () => {
      const tokens = Array.from({ length: 100 }, (_, i) =>
        encryptQrToken(i)
      );

      const start = performance.now();

      tokens.forEach((token) => {
        decryptQrToken(token);
      });

      const end = performance.now();
      const duration = end - start;

      // Should complete 100 decryptions in less than 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
