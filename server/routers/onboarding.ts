/**
 * Courier Onboarding tRPC Router
 * Handles all onboarding procedures
 */

import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import * as onboardingDb from "../db.onboarding";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

export const onboardingRouter = router({
  // ============ INITIALIZATION ============
  
  /**
   * Initialize onboarding for a new courier
   */
  init: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await onboardingDb.initializeOnboarding(ctx.user.id);
      const status = await onboardingDb.getOnboardingStatus(ctx.user.id);
      return { success: true, status };
    } catch (error) {
      console.error("[Onboarding] Init failed:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to initialize onboarding" });
    }
  }),

  /**
   * Get current onboarding status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const status = await onboardingDb.getOnboardingStatus(ctx.user.id);
      if (!status) {
        // Auto-initialize if not exists
        await onboardingDb.initializeOnboarding(ctx.user.id);
        return await onboardingDb.getOnboardingStatus(ctx.user.id);
      }
      return status;
    } catch (error) {
      console.error("[Onboarding] Get status failed:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get onboarding status" });
    }
  }),

  // ============ REQUIREMENTS CHECK ============

  /**
   * Save requirements check
   */
  saveRequirements: protectedProcedure
    .input(
      z.object({
        hasSADriversLicense: z.boolean(),
        hasVehicleAccess: z.boolean(),
        hasWorkingSmartphone: z.boolean(),
        noSeriousCriminalRecord: z.boolean(),
        agreeBackgroundVerification: z.boolean(),
        agreeIdVerification: z.boolean(),
        agreeVehicleVerification: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const allMet = Object.values(input).every((v) => v);
        await onboardingDb.saveRequirementsCheck(ctx.user.id, {
          ...input,
          allRequirementsMet: allMet,
          userId: ctx.user.id,
        });
        await onboardingDb.updateOnboardingStep(ctx.user.id, "2", "requirements_check");
        return { success: true, allMet };
      } catch (error) {
        console.error("[Onboarding] Save requirements failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save requirements" });
      }
    }),

  /**
   * Get requirements check
   */
  getRequirements: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await onboardingDb.getRequirementsCheck(ctx.user.id);
    } catch (error) {
      console.error("[Onboarding] Get requirements failed:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get requirements" });
    }
  }),

  // ============ VERIFICATION DOCUMENTS ============

  /**
   * Upload verification document
   */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["sa_id", "selfie", "driver_license", "vehicle_registration", "vehicle_photo_front", "vehicle_photo_side", "vehicle_photo_interior"]),
        fileData: z.string(), // base64 encoded file
        fileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(input.fileData, "base64");

        // Upload to S3
        const fileKey = `courier-verification/${ctx.user.id}/${input.documentType}/${Date.now()}-${input.fileName}`;
        const { url, key } = await storagePut(fileKey, buffer, "image/jpeg");

        // Save to database
        await onboardingDb.saveVerificationDocument(ctx.user.id, {
          documentType: input.documentType,
          fileUrl: url,
          fileKey: key,
          userId: ctx.user.id,
          verificationStatus: "pending",
        });

        return { success: true, url, key };
      } catch (error) {
        console.error("[Onboarding] Upload document failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to upload document" });
      }
    }),

  /**
   * Get verification documents
   */
  getDocuments: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await onboardingDb.getVerificationDocuments(ctx.user.id);
    } catch (error) {
      console.error("[Onboarding] Get documents failed:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get documents" });
    }
  }),

  // ============ QUIZ ============

  /**
   * Submit quiz answers
   */
  submitQuiz: protectedProcedure
    .input(
      z.object({
        answers: z.array(
          z.object({
            questionId: z.number(),
            selectedAnswer: z.number(),
            correct: z.boolean(),
          })
        ),
        timeSpent: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const correctCount = input.answers.filter((a) => a.correct).length;
        const score = Math.round((correctCount / input.answers.length) * 100);
        const passed = score >= 70;

        // Check attempt count
        const attempts = await onboardingDb.getQuizAttempts(ctx.user.id);
        const attemptNumber = attempts.length + 1;

        if (attemptNumber > 3) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum quiz attempts exceeded" });
        }

        // Save result
        await onboardingDb.saveQuizResult(ctx.user.id, {
          attemptNumber,
          totalQuestions: input.answers.length,
          correctAnswers: correctCount,
          score,
          passed,
          answers: JSON.stringify(input.answers),
          timeSpent: input.timeSpent,
          userId: ctx.user.id,
        });

        if (passed) {
          await onboardingDb.updateOnboardingStep(ctx.user.id, "6", "quiz");
        }

        return { success: true, passed, score, attemptNumber };
      } catch (error) {
        console.error("[Onboarding] Submit quiz failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to submit quiz" });
      }
    }),

  /**
   * Get quiz attempts
   */
  getQuizAttempts: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await onboardingDb.getQuizAttempts(ctx.user.id);
    } catch (error) {
      console.error("[Onboarding] Get quiz attempts failed:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get quiz attempts" });
    }
  }),

  // ============ AGREEMENTS ============

  /**
   * Accept agreements
   */
  acceptAgreements: protectedProcedure
    .input(
      z.object({
        termsAndConditionsAccepted: z.boolean(),
        courierRulesAccepted: z.boolean(),
        safetyPoliciesAccepted: z.boolean(),
        independentContractorAgreementAccepted: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const allAccepted = Object.values(input).every((v) => v);

        if (!allAccepted) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "All agreements must be accepted" });
        }

        await onboardingDb.saveAgreements(ctx.user.id, {
          ...input,
          allAgreementsAccepted: true,
          userId: ctx.user.id,
        });

        await onboardingDb.updateOnboardingStep(ctx.user.id, "7", "agreement");

        return { success: true };
      } catch (error) {
        console.error("[Onboarding] Accept agreements failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to accept agreements" });
      }
    }),

  /**
   * Get agreements
   */
  getAgreements: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await onboardingDb.getAgreements(ctx.user.id);
    } catch (error) {
      console.error("[Onboarding] Get agreements failed:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get agreements" });
    }
  }),

  // ============ ADMIN OPERATIONS ============

  /**
   * Get pending applications (admin only)
   */
  getPendingApplications: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    try {
      return await onboardingDb.getPendingApplications();
    } catch (error) {
      console.error("[Onboarding] Get pending applications failed:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get pending applications" });
    }
  }),

  /**
   * Approve application (admin only)
   */
  approveApplication: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      try {
        await onboardingDb.approveApplication(input.userId, ctx.user.id, input.notes);
        return { success: true };
      } catch (error) {
        console.error("[Onboarding] Approve application failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to approve application" });
      }
    }),

  /**
   * Reject application (admin only)
   */
  rejectApplication: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      try {
        await onboardingDb.rejectApplication(input.userId, ctx.user.id, input.reason);
        return { success: true };
      } catch (error) {
        console.error("[Onboarding] Reject application failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to reject application" });
      }
    }),

  /**
   * Activate courier account (admin only)
   */
  activateAccount: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      try {
        await onboardingDb.activateCourierAccount(input.userId);
        return { success: true };
      } catch (error) {
        console.error("[Onboarding] Activate account failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to activate account" });
      }
    }),
});
