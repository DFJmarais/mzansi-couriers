import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "../_core/context";

/**
 * Session timeout constants (in milliseconds)
 */
export const SESSION_TIMEOUTS = {
  DEFAULT: 24 * 60 * 60 * 1000, // 24 hours for general operations
  PAYMENT: 15 * 60 * 1000, // 15 minutes for payment operations
  ADMIN: 24 * 60 * 60 * 1000, // 24 hours for admin operations
  SENSITIVE: 30 * 60 * 1000, // 30 minutes for other sensitive operations
} as const;

/**
 * Store for tracking last activity per user
 * In production, this should be stored in Redis or database
 */
const userLastActivity = new Map<string, number>();

/**
 * Update user's last activity timestamp
 */
export function updateUserActivity(userId: string): void {
  userLastActivity.set(userId, Date.now());
}

/**
 * Get user's last activity timestamp
 */
export function getUserLastActivity(userId: string): number | undefined {
  return userLastActivity.get(userId);
}

/**
 * Check if user session has exceeded timeout for a specific operation
 */
export function isSessionExpired(
  userId: string,
  timeoutMs: number
): boolean {
  const lastActivity = getUserLastActivity(userId);
  if (!lastActivity) return false;
  
  const elapsed = Date.now() - lastActivity;
  return elapsed > timeoutMs;
}

/**
 * Middleware for operations with specific session timeout requirements
 */
export async function createSessionTimeoutMiddleware(
  timeoutMs: number,
  operationName: string
) {
  return async ({ ctx, next }: { ctx: TrpcContext; next: any }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required for this operation",
      });
    }

    // Check if session has expired for this operation type
    if (isSessionExpired(String(ctx.user.id), timeoutMs)) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `Session expired for ${operationName}. Please re-authenticate.`,
      });
    }

    // Update last activity timestamp
    updateUserActivity(String(ctx.user.id));

    return next({ ctx });
  };
}

/**
 * Cleanup function to remove old activity records (call periodically)
 * Keeps memory usage bounded by removing entries older than 24 hours
 */
export function cleanupOldActivityRecords(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  const entriesToDelete: string[] = [];
  userLastActivity.forEach((lastActivity, userId) => {
    if (now - lastActivity > maxAge) {
      entriesToDelete.push(userId);
    }
  });

  entriesToDelete.forEach(userId => userLastActivity.delete(userId));
}

// Run cleanup every hour
setInterval(cleanupOldActivityRecords, 60 * 60 * 1000);
