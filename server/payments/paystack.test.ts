import { describe, it, expect, beforeAll } from 'vitest';
import { getBanks } from './paystack';

describe('Paystack Integration', () => {
  beforeAll(() => {
    // Verify environment variable is set
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY environment variable is not set');
    }
  });

  it('should validate Paystack API connection with the configured secret key', async () => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY ?? '';
    // Network validation is explicitly opt-in so normal CI remains deterministic.
    if (process.env.RUN_PAYSTACK_API_TESTS !== 'true') {
      return;
    }
    expect(secretKey).toMatch(/^sk_(live|test)_/);
    try {
      // Call getBanks which is a lightweight API call to validate the secret key
      const result = await getBanks();
      
      // If we get here without error, the API key is valid
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      // Should return a list of banks
      if (result.success && result.data) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
      }
    } catch (error: any) {
      // If it's an auth error, the secret key is invalid
      if (error.response?.status === 401 || error.message?.includes('Unauthorized')) {
        throw new Error('PAYSTACK_SECRET_KEY is invalid or expired. Please check your Paystack dashboard.');
      }
      throw error;
    }
  }, 15000);

  it('should have valid Paystack configuration', () => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    
    // Secret key should start with sk_live_ or sk_test_
    expect(secretKey).toBeDefined();
    expect(secretKey).toMatch(/^sk_(live|test)_/);
  });
});
