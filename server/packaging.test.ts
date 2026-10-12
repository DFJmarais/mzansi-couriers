import { describe, it, expect } from 'vitest';

/**
 * Packaging validation utilities for Mzansi Couriers
 * These tests verify the business logic for packaging requirements
 */

// Packaging validation functions
export const validateParcelIdentificationCode = (code: string): boolean => {
  if (!code || code.trim().length === 0 || code.trim().length > 50) {
    return false;
  }
  return true;
};

export const validatePackageWeight = (weight: number): boolean => {
  return weight > 0 && weight <= 20;
};

export const validatePackageDimensions = (length: number, width: number, height: number): boolean => {
  return length > 0 && width > 0 && height > 0 && (length + width + height) <= 300;
};

export const validateProhibitedItems = (items: string[]): boolean => {
  const prohibitedList = [
    'illegal substances',
    'firearms',
    'ammunition',
    'explosives',
    'hazardous chemicals',
    'flammable materials',
    'gas cylinders',
    'toxic substances',
    'live animals',
    'human remains',
    'counterfeit goods',
    'stolen property'
  ];

  if (items.length === 0) {
    return true;
  }

  const hasProhibited = items.some(item =>
    prohibitedList.some(prohibited =>
      item.toLowerCase().includes(prohibited)
    )
  );

  return !hasProhibited;
};

export interface SenderDeclaration {
  isSecurelyPackaged: boolean;
  isProperlyProtected: boolean;
  isSealed: boolean;
  hasIdentificationCode: boolean;
  codeMatchesBooking: boolean;
  noProhibitedItems: boolean;
  accurateDimensions: boolean;
  acceptsPolicy: boolean;
}

export const validateSenderDeclaration = (declaration: SenderDeclaration): boolean => {
  return (
    declaration.isSecurelyPackaged &&
    declaration.isProperlyProtected &&
    declaration.isSealed &&
    declaration.hasIdentificationCode &&
    declaration.codeMatchesBooking &&
    declaration.noProhibitedItems &&
    declaration.accurateDimensions &&
    declaration.acceptsPolicy
  );
};

export const calculateDeclarationProgress = (declaration: SenderDeclaration): number => {
  const items = Object.values(declaration);
  const completed = items.filter(v => v === true).length;
  return Math.round((completed / items.length) * 100);
};

// Test suite
describe('Packaging Requirements Validation', () => {
  describe('Parcel Identification Code Validation', () => {
    it('should accept valid identification codes', () => {
      expect(validateParcelIdentificationCode('MC-2026-001')).toBe(true);
      expect(validateParcelIdentificationCode('ABC123XYZ')).toBe(true);
      expect(validateParcelIdentificationCode('A')).toBe(true);
    });

    it('should reject empty or invalid codes', () => {
      expect(validateParcelIdentificationCode('')).toBe(false);
      expect(validateParcelIdentificationCode('   ')).toBe(false);
      expect(validateParcelIdentificationCode('a'.repeat(51))).toBe(false);
    });
  });

  describe('Package Weight Validation', () => {
    it('should accept valid weights', () => {
      expect(validatePackageWeight(0.5)).toBe(true);
      expect(validatePackageWeight(5)).toBe(true);
      expect(validatePackageWeight(20)).toBe(true);
    });

    it('should reject invalid weights', () => {
      expect(validatePackageWeight(0)).toBe(false);
      expect(validatePackageWeight(-1)).toBe(false);
      expect(validatePackageWeight(21)).toBe(false);
    });
  });

  describe('Package Dimensions Validation', () => {
    it('should accept valid dimensions', () => {
      expect(validatePackageDimensions(10, 10, 10)).toBe(true);
      expect(validatePackageDimensions(50, 40, 30)).toBe(true);
      expect(validatePackageDimensions(100, 100, 100)).toBe(true);
    });

    it('should reject invalid dimensions', () => {
      expect(validatePackageDimensions(0, 10, 10)).toBe(false);
      expect(validatePackageDimensions(10, -5, 10)).toBe(false);
      expect(validatePackageDimensions(150, 150, 150)).toBe(false); // Sum > 300
    });
  });

  describe('Prohibited Items Validation', () => {
    it('should accept packages without prohibited items', () => {
      expect(validateProhibitedItems(['books', 'clothing'])).toBe(true);
      expect(validateProhibitedItems(['electronics', 'documents'])).toBe(true);
      expect(validateProhibitedItems([])).toBe(true);
    });

    it('should reject packages with prohibited items', () => {
      expect(validateProhibitedItems(['firearms'])).toBe(false);
      expect(validateProhibitedItems(['books', 'explosives'])).toBe(false);
      expect(validateProhibitedItems(['ILLEGAL SUBSTANCES'])).toBe(false);
      expect(validateProhibitedItems(['live animals'])).toBe(false);
    });

    it('should handle case-insensitive matching', () => {
      expect(validateProhibitedItems(['FIREARMS'])).toBe(false);
      expect(validateProhibitedItems(['Ammunition'])).toBe(false);
      expect(validateProhibitedItems(['HAZARDOUS CHEMICALS'])).toBe(false);
    });
  });

  describe('Sender Declaration Validation', () => {
    it('should accept complete declarations', () => {
      const declaration: SenderDeclaration = {
        isSecurelyPackaged: true,
        isProperlyProtected: true,
        isSealed: true,
        hasIdentificationCode: true,
        codeMatchesBooking: true,
        noProhibitedItems: true,
        accurateDimensions: true,
        acceptsPolicy: true,
      };
      expect(validateSenderDeclaration(declaration)).toBe(true);
    });

    it('should reject incomplete declarations', () => {
      const declaration: SenderDeclaration = {
        isSecurelyPackaged: true,
        isProperlyProtected: true,
        isSealed: false,
        hasIdentificationCode: true,
        codeMatchesBooking: true,
        noProhibitedItems: true,
        accurateDimensions: true,
        acceptsPolicy: true,
      };
      expect(validateSenderDeclaration(declaration)).toBe(false);
    });

    it('should reject declarations with missing policy acceptance', () => {
      const declaration: SenderDeclaration = {
        isSecurelyPackaged: true,
        isProperlyProtected: true,
        isSealed: true,
        hasIdentificationCode: true,
        codeMatchesBooking: true,
        noProhibitedItems: true,
        accurateDimensions: true,
        acceptsPolicy: false,
      };
      expect(validateSenderDeclaration(declaration)).toBe(false);
    });
  });

  describe('Declaration Progress Calculation', () => {
    it('should calculate 0% for empty declaration', () => {
      const declaration: SenderDeclaration = {
        isSecurelyPackaged: false,
        isProperlyProtected: false,
        isSealed: false,
        hasIdentificationCode: false,
        codeMatchesBooking: false,
        noProhibitedItems: false,
        accurateDimensions: false,
        acceptsPolicy: false,
      };
      expect(calculateDeclarationProgress(declaration)).toBe(0);
    });

    it('should calculate 50% for half-completed declaration', () => {
      const declaration: SenderDeclaration = {
        isSecurelyPackaged: true,
        isProperlyProtected: true,
        isSealed: true,
        hasIdentificationCode: true,
        codeMatchesBooking: false,
        noProhibitedItems: false,
        accurateDimensions: false,
        acceptsPolicy: false,
      };
      expect(calculateDeclarationProgress(declaration)).toBe(50);
    });

    it('should calculate 100% for complete declaration', () => {
      const declaration: SenderDeclaration = {
        isSecurelyPackaged: true,
        isProperlyProtected: true,
        isSealed: true,
        hasIdentificationCode: true,
        codeMatchesBooking: true,
        noProhibitedItems: true,
        accurateDimensions: true,
        acceptsPolicy: true,
      };
      expect(calculateDeclarationProgress(declaration)).toBe(100);
    });

    it('should calculate 75% for 6 out of 8 items', () => {
      const declaration: SenderDeclaration = {
        isSecurelyPackaged: true,
        isProperlyProtected: true,
        isSealed: true,
        hasIdentificationCode: true,
        codeMatchesBooking: true,
        noProhibitedItems: true,
        accurateDimensions: false,
        acceptsPolicy: false,
      };
      expect(calculateDeclarationProgress(declaration)).toBe(75);
    });
  });

  describe('Integration Tests', () => {
    it('should validate a complete packaging workflow', () => {
      // Step 1: Validate identification code
      const code = 'MC-2026-001';
      expect(validateParcelIdentificationCode(code)).toBe(true);

      // Step 2: Validate package dimensions
      expect(validatePackageDimensions(30, 20, 15)).toBe(true);

      // Step 3: Validate weight
      expect(validatePackageWeight(2.5)).toBe(true);

      // Step 4: Validate no prohibited items
      expect(validateProhibitedItems(['books', 'clothing'])).toBe(true);

      // Step 5: Validate sender declaration
      const declaration: SenderDeclaration = {
        isSecurelyPackaged: true,
        isProperlyProtected: true,
        isSealed: true,
        hasIdentificationCode: true,
        codeMatchesBooking: true,
        noProhibitedItems: true,
        accurateDimensions: true,
        acceptsPolicy: true,
      };
      expect(validateSenderDeclaration(declaration)).toBe(true);

      // Step 6: Verify 100% progress
      expect(calculateDeclarationProgress(declaration)).toBe(100);
    });

    it('should reject workflow with prohibited items', () => {
      const code = 'MC-2026-001';
      expect(validateParcelIdentificationCode(code)).toBe(true);

      expect(validatePackageDimensions(30, 20, 15)).toBe(true);
      expect(validatePackageWeight(2.5)).toBe(true);

      // Contains prohibited items
      expect(validateProhibitedItems(['firearms', 'ammunition'])).toBe(false);
    });

    it('should reject workflow with invalid dimensions', () => {
      const code = 'MC-2026-001';
      expect(validateParcelIdentificationCode(code)).toBe(true);

      // Invalid dimensions - exceeds maximum sum
      expect(validatePackageDimensions(150, 150, 150)).toBe(false);

      expect(validatePackageWeight(2.5)).toBe(true);
      expect(validateProhibitedItems(['books'])).toBe(true);
    });

    it('should reject workflow with incomplete declaration', () => {
      const code = 'MC-2026-001';
      expect(validateParcelIdentificationCode(code)).toBe(true);

      expect(validatePackageDimensions(30, 20, 15)).toBe(true);
      expect(validatePackageWeight(2.5)).toBe(true);
      expect(validateProhibitedItems(['books'])).toBe(true);

      // Incomplete declaration
      const declaration: SenderDeclaration = {
        isSecurelyPackaged: true,
        isProperlyProtected: true,
        isSealed: false, // Missing
        hasIdentificationCode: true,
        codeMatchesBooking: true,
        noProhibitedItems: true,
        accurateDimensions: true,
        acceptsPolicy: true,
      };
      expect(validateSenderDeclaration(declaration)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small packages', () => {
      expect(validatePackageWeight(0.1)).toBe(true);
      expect(validatePackageDimensions(1, 1, 1)).toBe(true);
    });

    it('should handle maximum allowed packages', () => {
      expect(validatePackageWeight(20)).toBe(true);
      expect(validatePackageDimensions(100, 100, 100)).toBe(true);
    });

    it('should handle edge case dimension sums', () => {
      expect(validatePackageDimensions(100, 100, 100)).toBe(true); // Sum = 300
      expect(validatePackageDimensions(100, 100, 101)).toBe(false); // Sum = 301
    });

    it('should handle special characters in identification codes', () => {
      expect(validateParcelIdentificationCode('MC-2026-001')).toBe(true);
      expect(validateParcelIdentificationCode('ABC@123#XYZ')).toBe(true);
      expect(validateParcelIdentificationCode('测试代码')).toBe(true);
    });
  });
});
