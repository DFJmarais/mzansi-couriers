/**
 * Paystack Configuration
 * Environment-specific public key for payment processing
 */

export const PAYSTACK_CONFIG = {
  // Vite injects pk_test_ in preview and pk_live_ only in production.
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? "",
  
  // API endpoints
  apiUrl: "https://api.paystack.co",
  
  // Payment configuration
  currency: "ZAR", // South African Rand
  
  // Timeouts
  timeout: 30000, // 30 seconds
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Validate Paystack public key
 */
export function isValidPaystackKey(key: string): boolean {
  const paystackKeyRegex = /^pk_(live|test)_[a-f0-9]{40}$/;
  return paystackKeyRegex.test(key);
}

/**
 * Get Paystack public key
 */
export function getPaystackPublicKey(): string {
  const key = PAYSTACK_CONFIG.publicKey;
  
  if (!key) {
    throw new Error("Paystack public key is not configured");
  }
  
  if (!isValidPaystackKey(key)) {
    throw new Error("Invalid Paystack public key format");
  }
  
  return key;
}

/**
 * Check if using live key
 */
export function isLiveKey(): boolean {
  return PAYSTACK_CONFIG.publicKey.startsWith("pk_live_");
}

/**
 * Get environment status
 */
export function getPaystackEnvironment(): "live" | "test" {
  return isLiveKey() ? "live" : "test";
}
