import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_SESSION_TIMEOUT,
  createAdminSession,
  createOwnerUser,
  getAdminSession,
  getAdminSessionTokenFromCookie,
  revokeAdminSession,
} from "./admin-session";

describe("owner admin sessions", () => {
  it("creates a cryptographically shaped session and an admin identity", () => {
    const { token, session } = createAdminSession("owner", "127.0.0.1");
    expect(token).toMatch(/^admin_[a-f0-9]{64}$/);
    expect(getAdminSession(token)?.username).toBe("owner");
    expect(createOwnerUser(session).role).toBe("admin");
    revokeAdminSession(token);
  });

  it("parses the HttpOnly cookie value without exposing other cookies", () => {
    expect(getAdminSessionTokenFromCookie("theme=light; mzansi_admin_session=admin_abc; mode=day")).toBe("admin_abc");
    expect(getAdminSessionTokenFromCookie(undefined)).toBeUndefined();
  });

  it("expires inactive sessions", () => {
    vi.useFakeTimers();
    const { token } = createAdminSession("owner");
    vi.advanceTimersByTime(ADMIN_SESSION_TIMEOUT + 1);
    expect(getAdminSession(token)).toBeNull();
    vi.useRealTimers();
  });
});
