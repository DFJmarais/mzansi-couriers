import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { createOwnerUser, getAdminSession, getAdminSessionTokenFromRequest } from "./admin-session";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  if (!user) {
    const adminToken = getAdminSessionTokenFromRequest(opts.req);
    const adminSession = getAdminSession(adminToken);
    if (adminSession) user = createOwnerUser(adminSession);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
