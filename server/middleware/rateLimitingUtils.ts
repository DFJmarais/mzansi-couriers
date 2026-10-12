/**
 * Rate Limiting Utilities
 * Prevent abuse and ensure fair resource allocation
 */

import { TRPCError } from '@trpc/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

// Store for rate limit tracking
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  rateLimitStore.forEach((value, key) => {
    if (value.resetTime < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}, 5 * 60 * 1000);

/**
 * Check if request is rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true; // Allow request
  }

  if (entry.count >= config.maxRequests) {
    return false; // Rate limited
  }

  entry.count++;
  return true; // Allow request
}

/**
 * Rate limit middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (key: string) => {
    if (!checkRateLimit(key, config)) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: config.message || 'Too many requests. Please try again later.',
      });
    }
  };
}

/**
 * Common rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict: 10 requests per minute
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },

  // Standard: 30 requests per minute
  standard: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },

  // Lenient: 100 requests per minute
  lenient: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },

  // Per hour: 1000 requests per hour
  hourly: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
  },

  // Per day: 10000 requests per day
  daily: {
    windowMs: 24 * 60 * 60 * 1000,
    maxRequests: 10000,
  },
};

/**
 * Get rate limiter for specific endpoint
 */
export function getRateLimiter(endpointType: 'auth' | 'delivery' | 'courier' | 'admin') {
  switch (endpointType) {
    case 'auth':
      // Strict for auth endpoints (prevent brute force)
      return createRateLimiter(rateLimitConfigs.strict);

    case 'delivery':
      // Standard for delivery endpoints
      return createRateLimiter(rateLimitConfigs.standard);

    case 'courier':
      // Standard for courier endpoints
      return createRateLimiter(rateLimitConfigs.standard);

    case 'admin':
      // Lenient for admin endpoints
      return createRateLimiter(rateLimitConfigs.lenient);

    default:
      return createRateLimiter(rateLimitConfigs.standard);
  }
}

/**
 * Get current rate limit status (for debugging)
 */
export function getRateLimitStatus(key: string): { remaining: number; resetTime: number } | null {
  const entry = rateLimitStore.get(key);
  if (!entry) return null;

  return {
    remaining: Math.max(0, 30 - entry.count), // Assuming standard limit of 30
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for a key (admin only)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (use with caution)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
