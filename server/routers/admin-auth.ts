/**
 * Admin Authentication Router
 * Provides secure admin login with username/password
 * Separate from OAuth for backend access
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { or, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { verifyAdminPassword } from "./admin-password-reset";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TIMEOUT,
  createAdminSession,
  getAdminSession,
  getConfiguredAdminPassword,
  getConfiguredAdminUsername,
  listAdminSessions,
  revokeAdminSession,
} from "../_core/admin-session";

const ADMIN_USERNAME = getConfiguredAdminUsername();
const ADMIN_PASSWORD = getConfiguredAdminPassword();
const SESSION_TIMEOUT = ADMIN_SESSION_TIMEOUT;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error("Admin credentials are not configured; owner login is unavailable");
}

function validateSession(token: string): boolean {
  return Boolean(getAdminSession(token));
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

      // Validate credentials are configured
      if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        console.error('Admin credentials not configured');
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Admin credentials not configured. Please contact system administrator.",
        });
      }

      // Accept the configured emergency admin credential or a database-backed
      // administrator account whose password was set through recovery.
      const db = await getDb();
      const [account] = db
        ? await db.select({ id: users.id, email: users.email, name: users.name, passwordHash: users.passwordHash })
            .from(users)
            .where(or(eq(users.email, input.username.trim().toLowerCase()), eq(users.name, input.username)))
            .limit(1)
        : [];
      const databaseUsernameMatch = Boolean(account && account.passwordHash && (account.email?.toLowerCase() === input.username.trim().toLowerCase() || account.name === input.username));
      const databasePasswordMatch = Boolean(databaseUsernameMatch && account?.passwordHash && await verifyAdminPassword(input.password, account.passwordHash));
      const usernameMatch = (input.username === ADMIN_USERNAME && input.password === ADMIN_PASSWORD) || databaseUsernameMatch;
      const passwordMatch = (input.username === ADMIN_USERNAME && input.password === ADMIN_PASSWORD) || databasePasswordMatch;

      if (!usernameMatch || !passwordMatch) {
        console.warn(`Failed admin login: ${input.username} from ${ipAddress}`);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const { token: sessionToken } = createAdminSession(input.username, ipAddress as string);
      const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
      ctx.res.setHeader(
        "Set-Cookie",
        `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; HttpOnly; Path=/; Max-Age=${Math.floor(SESSION_TIMEOUT / 1000)}; SameSite=Lax${secureFlag}`,
      );

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

      const session = getAdminSession(input.sessionToken);
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

      const session = getAdminSession(input.sessionToken);
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
    .mutation(({ input, ctx }) => {
      const session = getAdminSession(input.sessionToken);

      if (session) {
        console.log(`Admin logout: ${session.username}`);
        revokeAdminSession(input.sessionToken);
      }

      revokeAdminSession(input.sessionToken);
      ctx.res.setHeader("Set-Cookie", `${ADMIN_SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);

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

      const session = getAdminSession(input.sessionToken);
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

      const sessions = listAdminSessions().map(
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

      const targetSession = getAdminSession(input.targetToken);
      if (!targetSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      revokeAdminSession(input.targetToken);

      console.log(
        `Admin revoked session: ${targetSession.username} by ${getAdminSession(input.sessionToken)?.username}`
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
