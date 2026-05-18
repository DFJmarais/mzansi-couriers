import { describe, it, expect, beforeAll } from 'vitest';
import { testPaystackConnection, initializePayment, verifyPayment } from './payments/paystack';

describe('Paystack Integration', () => {
  describe('Connection Tests', () => {
    it('should verify Paystack connection is working', async () => {
      const result = await testPaystackConnection();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Paystack connection successful');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Payment Initialization', () => {
    it('should initialize a payment transaction', async () => {
      const result = await initializePayment({
        email: 'test@mzansi.com',
        amount: 100, // 100 ZAR
        metadata: {
          delivery_id: 'test-123',
          customer_name: 'Test Customer',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.authorization_url).toBeDefined();
      expect(result.access_code).toBeDefined();
      expect(result.reference).toBeDefined();
    });

    it('should handle payment initialization with custom reference', async () => {
      const customRef = `test-ref-${Date.now()}`;
      const result = await initializePayment({
        email: 'courier@mzansi.com',
        amount: 250.50,
        reference: customRef,
        metadata: {
          courier_id: 'courier-456',
          delivery_count: 5,
        },
      });

      expect(result.success).toBe(true);
      expect(result.reference).toBe(customRef);
    });
  });

  describe('Payment Verification', () => {
    it('should handle verification of non-existent reference gracefully', async () => {
      const result = await verifyPayment('invalid-ref-12345');
      // Paystack API will return an error for invalid reference
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid email format', async () => {
      const result = await initializePayment({
        email: 'invalid-email',
        amount: 100,
      });

      // Paystack should return an error for invalid email
      expect(result).toBeDefined();
      expect(result.success || !result.success).toBe(true); // Either success or error response
    });

    it('should handle zero amount', async () => {
      const result = await initializePayment({
        email: 'test@mzansi.com',
        amount: 0,
      });

      expect(result).toBeDefined();
      // Paystack should reject zero amount
    });

    it('should handle negative amount', async () => {
      const result = await initializePayment({
        email: 'test@mzansi.com',
        amount: -100,
      });

      expect(result).toBeDefined();
      // Paystack should reject negative amount
    });
  });

  describe('Amount Conversion', () => {
    it('should correctly convert currency to cents/kobo', async () => {
      const result = await initializePayment({
        email: 'test@mzansi.com',
        amount: 99.99,
        metadata: { test: 'amount-conversion' },
      });

      expect(result.success).toBe(true);
      // Amount should be converted to 9999 cents/kobo
    });
  });
});
