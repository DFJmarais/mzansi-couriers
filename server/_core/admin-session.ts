import { randomBytes } from "node:crypto";

export type AdminSession = {
  username: string;
  loginTime: number;
  lastActivity: number;
  ipAddress?: string;
};

const sessions = new Map<string, AdminSession>();
export const ADMIN_SESSION_COOKIE = "mzansi_admin_session";
export const ADMIN_SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

export function createAdminSession(username: string, ipAddress?: string) {
  const token = `admin_${randomBytes(32).toString("hex")}`;
  const now = Date.now();
  sessions.set(token, { username, loginTime: now, lastActivity: now, ipAddress });
  return { token, session: sessions.get(token)! };
}

export function getAdminSession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.lastActivity > ADMIN_SESSION_TIMEOUT) {
    sessions.delete(token);
    return null;
  }
  session.lastActivity = Date.now();
  return session;
}

export function revokeAdminSession(token: string | undefined) {
  if (token) sessions.delete(token);
}

export function getAdminSessionCount() {
  return sessions.size;
}

export function listAdminSessions() {
  return Array.from(sessions.entries());
}

export function isAdminCredentialsConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

export function getConfiguredAdminUsername() {
  return process.env.ADMIN_USERNAME;
}

export function getConfiguredAdminPassword() {
  return process.env.ADMIN_PASSWORD;
}

export function getAdminSessionTokenFromCookie(cookieHeader: string | undefined) {
  const match = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${ADMIN_SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getAdminSessionTokenFromRequest(req: { headers?: { cookie?: string } }) {
  return getAdminSessionTokenFromCookie(req.headers?.cookie);
}

export function createOwnerUser(session: AdminSession) {
  const now = new Date();
  return {
    id: 0,
    openId: `admin:${session.username}`,
    name: "Owner Admin",
    email: null,
    phone: null,
    loginMethod: "admin-password",
    role: "admin" as const,
    isVerified: true,
    passwordHash: null,
    passwordUpdatedAt: null,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}
