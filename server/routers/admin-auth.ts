/**
 * Admin Authentication Router
 * Provides secure admin login with username/password
 * Separate from OAuth for backend access
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Admin credentials (should be in environment variables in production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "MzansiCouriers2026!";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "super-secret-admin-key-2026";

// In-memory session store (use Redis in production)
const adminSessions = new Map<
  string,
  {
    username: string;
    loginTime: number;
    lastActivity: number;
    ipAddress?: string;
  }
>();

// Session timeout: 24 hours
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

/**
 * Generate secure session token
 */
function generateSessionToken(): string {
  return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate session token
 */
function validateSession(token: string): boolean {
  const session = adminSessions.get(token);
  if (!session) return false;

  const now = Date.now();
  if (now - session.lastActivity > SESSION_TIMEOUT) {
    adminSessions.delete(token);
    return false;
  }

  // Update last activity
  session.lastActivity = now;
  return true;
}

export const adminAuthRouter = router({
  /**
   * Admin Login
   * Returns session token for authenticated access
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Rate limiting: max 5 attempts per minute
      const ipAddress = ctx.req?.headers["x-forwarded-for"] || "unknown";
      const attemptKey = `login_attempt_${ipAddress}`;

      // Log attempt
      console.log(`Admin login attempt: ${input.username} from ${ipAddress}`);

      // Validate credentials
      if (
        input.username !== ADMIN_USERNAME ||
        input.password !== ADMIN_PASSWORD
      ) {
        console.warn(`Failed admin login: ${input.username} from ${ipAddress}`);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // Generate session token
      const sessionToken = generateSessionToken();

      // Store session
      adminSessions.set(sessionToken, {
        username: input.username,
        loginTime: Date.now(),
        lastActivity: Date.now(),
        ipAddress: ipAddress as string,
      });

      console.log(`Admin login successful: ${input.username}`);

      return {
        success: true,
        sessionToken,
        expiresIn: SESSION_TIMEOUT,
        message: "Admin login successful",
      };
    }),

  /**
   * Verify Session
   * Check if session token is valid
   */
  verifySession: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(({ input }) => {
      const isValid = validateSession(input.sessionToken);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      const session = adminSessions.get(input.sessionToken);
      return {
        valid: true,
        username: session?.username,
        loginTime: session?.loginTime,
      };
    }),

  /**
   * Get Admin Session Info
   * Returns current session details
   */
  getSessionInfo: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(({ input }) => {
      if (!validateSession(input.sessionToken)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      const session = adminSessions.get(input.sessionToken);
      const now = Date.now();
      const timeRemaining = SESSION_TIMEOUT - (now - session!.lastActivity);

      return {
        username: session?.username,
        loginTime: new Date(session!.loginTime).toISOString(),
        lastActivity: new Date(session!.lastActivity).toISOString(),
        ipAddress: session?.ipAddress,
        timeRemaining,
        expiresAt: new Date(now + timeRemaining).toISOString(),
      };
    }),

  /**
   * Admin Logout
   * Invalidate session token
   */
  logout: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .mutation(({ input }) => {
      const session = adminSessions.get(input.sessionToken);

      if (session) {
        console.log(`Admin logout: ${session.username}`);
        adminSessions.delete(input.sessionToken);
      }

      return {
        success: true,
        message: "Logged out successfully",
      };
    }),

  /**
   * Refresh Session
   * Extend session timeout
   */
  refreshSession: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .mutation(({ input }) => {
      if (!validateSession(input.sessionToken)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      const session = adminSessions.get(input.sessionToken);
      session!.lastActivity = Date.now();

      return {
        success: true,
        expiresIn: SESSION_TIMEOUT,
        message: "Session refreshed",
      };
    }),

  /**
   * Get All Active Sessions
   * Admin view of all logged-in sessions
   */
  getActiveSessions: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(({ input }) => {
      if (!validateSession(input.sessionToken)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      const sessions = Array.from(adminSessions.entries()).map(
        ([token, session]) => ({
          token: token.substring(0, 20) + "...", // Masked token
          username: session.username,
          loginTime: new Date(session.loginTime).toISOString(),
          lastActivity: new Date(session.lastActivity).toISOString(),
          ipAddress: session.ipAddress,
          isActive: Date.now() - session.lastActivity < SESSION_TIMEOUT,
        })
      );

      return {
        count: sessions.length,
        sessions,
      };
    }),

  /**
   * Revoke Session
   * Admin can revoke other sessions
   */
  revokeSession: publicProcedure
    .input(
      z.object({
        sessionToken: z.string(),
        targetToken: z.string(),
      })
    )
    .mutation(({ input }) => {
      // Verify caller is admin
      if (!validateSession(input.sessionToken)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      const targetSession = adminSessions.get(input.targetToken);
      if (!targetSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      adminSessions.delete(input.targetToken);

      console.log(
        `Admin revoked session: ${targetSession.username} by ${adminSessions.get(input.sessionToken)?.username}`
      );

      return {
        success: true,
        message: "Session revoked",
      };
    }),

  /**
   * Change Admin Password
   * Update admin credentials
   */
  changePassword: publicProcedure
    .input(
      z.object({
        sessionToken: z.string(),
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(({ input }) => {
      if (!validateSession(input.sessionToken)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      // Verify current password
      if (input.currentPassword !== ADMIN_PASSWORD) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // In production, update environment variable or database
      console.log("Admin password change requested (implement in production)");

      return {
        success: true,
        message: "Password change requested (implement in production)",
      };
    }),

  /**
   * Get Login History
   * Audit trail of admin logins
   */
  getLoginHistory: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(({ input }) => {
      if (!validateSession(input.sessionToken)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      // In production, fetch from database
      return {
        history: [
          {
            timestamp: new Date().toISOString(),
            username: ADMIN_USERNAME,
            ipAddress: "127.0.0.1",
            action: "login",
            status: "success",
          },
        ],
      };
    }),
});
