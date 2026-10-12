import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { adminPasswordResetTokens, users } from "../../drizzle/schema";
import { sendDeliveryEmail } from "../_core/email";
import { TRPCError } from "@trpc/server";

const scrypt = promisify(scryptCallback);
const RESET_TTL_MS = 30 * 60 * 1000;
const GENERIC_MESSAGE = "If an administrator account matches that email, a reset link has been sent.";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyAdminPassword(password: string, storedHash: string) {
  const [, salt, encoded] = storedHash.split("$");
  if (!salt || !encoded) return false;
  const expected = Buffer.from(encoded, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const adminPasswordResetRouter = router({
  request: publicProcedure
    .input(z.object({ email: z.string().email(), origin: z.string().url().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true, message: GENERIC_MESSAGE };
      const email = normalizeEmail(input.email);
      const [account] = await db.select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(and(eq(users.email, email), eq(users.role, "admin")))
        .limit(1);

      if (account?.email) {
        const token = randomBytes(32).toString("base64url");
        await db.insert(adminPasswordResetTokens).values({
          userId: account.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        });
        const origin = input.origin || process.env.PUBLIC_APP_URL || "https://mzansicourier-nsebzqbt.manus.space";
        const resetUrl = `${origin}/admin/reset-password?token=${encodeURIComponent(token)}`;
        await sendDeliveryEmail(
          account.email,
          "Reset your Mzansi Couriers administrator password",
          `Hello ${account.name || "administrator"},\n\nUse this link within 30 minutes to create a new administrator password:\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
        );
      }
      return { success: true, message: GENERIC_MESSAGE };
    }),

  reset: publicProcedure
    .input(z.object({ token: z.string().min(40), password: z.string().min(12).max(128) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Password recovery is temporarily unavailable." });
      const tokenHash = hashToken(input.token);
      const [record] = await db.select({ id: adminPasswordResetTokens.id, userId: adminPasswordResetTokens.userId })
        .from(adminPasswordResetTokens)
        .where(and(
          eq(adminPasswordResetTokens.tokenHash, tokenHash),
          isNull(adminPasswordResetTokens.usedAt),
          gt(adminPasswordResetTokens.expiresAt, new Date()),
        ))
        .limit(1);
      if (!record) throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link is invalid or has expired. Request a new link." });

      const passwordHash = await hashAdminPassword(input.password);
      await db.update(users).set({ passwordHash, passwordUpdatedAt: new Date() }).where(and(eq(users.id, record.userId), eq(users.role, "admin")));
      await db.update(adminPasswordResetTokens).set({ usedAt: new Date() }).where(eq(adminPasswordResetTokens.id, record.id));
      return { success: true, message: "Your administrator password has been updated. You can now sign in." };
    }),
});
