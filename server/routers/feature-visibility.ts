import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicFeatureVisibility } from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  DEFAULT_PUBLIC_FEATURE_VISIBILITY,
  PUBLIC_FEATURES,
  type PublicFeatureKey,
} from "../../shared/feature-visibility";

const featureKey = z.enum(PUBLIC_FEATURES.map(feature => feature.key) as [PublicFeatureKey, ...PublicFeatureKey[]]);

function defaultsAsRows() {
  return PUBLIC_FEATURES.map(feature => ({
    featureKey: feature.key,
    ...feature,
    isPublic: DEFAULT_PUBLIC_FEATURE_VISIBILITY[feature.key],
    updatedBy: null,
    updatedAt: null,
  }));
}

export const featureVisibilityRouter = router({
  public: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return DEFAULT_PUBLIC_FEATURE_VISIBILITY;
    const rows = await db.select().from(publicFeatureVisibility);
    const visibility = { ...DEFAULT_PUBLIC_FEATURE_VISIBILITY };
    for (const row of rows) visibility[row.featureKey as PublicFeatureKey] = Boolean(row.isPublic);
    return visibility;
  }),

  admin: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return defaultsAsRows();
    const rows = await db.select().from(publicFeatureVisibility);
    const byKey = new Map(rows.map(row => [row.featureKey, row]));
    return PUBLIC_FEATURES.map(feature => byKey.get(feature.key) ?? {
      featureKey: feature.key,
      ...feature,
      isPublic: DEFAULT_PUBLIC_FEATURE_VISIBILITY[feature.key],
      updatedBy: null,
      updatedAt: null,
    });
  }),

  update: adminProcedure
    .input(z.object({ featureKey, isPublic: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(publicFeatureVisibility)
        .set({ isPublic: input.isPublic, updatedBy: ctx.user.id })
        .where(eq(publicFeatureVisibility.featureKey, input.featureKey));
      return { success: true, ...input };
    }),
});
