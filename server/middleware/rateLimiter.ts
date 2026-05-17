/**
 * Rate Limiting Middleware for tRPC
 * Prevents abuse by limiting requests per user/IP
 */

import { TRPCError } from "@trpc/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

/**
 * Rate limiter configuration
 * Default: 100 requests per 15 minutes per user
 */
export interface RateLimitConfig {
  windowMs?: number; // Time window in milliseconds (default: 15 minutes)
  maxRequests?: number; // Max requests per window (default: 100)
  keyGenerator?: (userId: string | null) => string; // Custom key generator
}

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig = {}) {
  const windowMs = config.windowMs || 15 * 60 * 1000; // 15 minutes
  const maxRequests = config.maxRequests || 100;
  const keyGenerator = config.keyGenerator || ((userId) => userId || "anonymous");

  return async (userId: string | null) => {
    const key = keyGenerator(userId);
    const now = Date.now();

    // Initialize or get existing rate limit entry
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return; // First request, allow it
    }

    const entry = rateLimitStore[key];

    // Reset if window has expired
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
      return; // Allow request
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
      });
    }
  };
}

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per 5 minutes
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
});

/**
 * Standard rate limiter for normal operations
 * 100 requests per 15 minutes
 */
export const standardRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

/**
 * Lenient rate limiter for public endpoints
 * 500 requests per hour
 */
export const lenientRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 500,
});

/**
 * Clean up expired entries periodically
 */
export function startRateLimitCleanup(intervalMs: number = 60 * 1000) {
  setInterval(() => {
    const now = Date.now();
    for (const key in rateLimitStore) {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key];
      }
    }
  }, intervalMs);
}
