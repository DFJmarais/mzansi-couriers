/**
 * Courier Onboarding Database Functions
 * Handles all database operations for the onboarding process
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import {
  courierOnboarding,
  courierVerification,
  courierQuizResults,
  courierRequirementsCheck,
  courierAgreements,
  fraudDetectionFlags,
  users,
  courierProfiles,
  notifications,
  payoutSettings,
  InsertCourierOnboarding,
  InsertCourierVerification,
  InsertCourierQuizResults,
  InsertCourierRequirementsCheck,
  InsertCourierAgreements,
  InsertFraudDetectionFlag,
} from "../drizzle/schema";
import { getDb } from "./db";

// ============ ONBOARDING STATUS ============

export async function initializeOnboarding(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const existing = await db
      .select()
      .from(courierOnboarding)
      .where(eq(courierOnboarding.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(courierOnboarding).values({
        userId,
        status: "welcome",
        currentStep: 0,
        completedSteps: JSON.stringify([]),
      });
    }
    return true;
  } catch (error) {
    console.error("[Onboarding] Failed to initialize:", error);
    throw error;
  }
}

export async function getOnboardingStatus(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(courierOnboarding)
      .where(eq(courierOnboarding.userId, userId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Onboarding] Failed to get status:", error);
    throw error;
  }
}

export async function updateOnboardingStep(
  userId: number,
  step: string,
  status: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const current = await getOnboardingStatus(userId);
    if (!current) throw new Error("Onboarding not initialized");

    const completedSteps = JSON.parse(current.completedSteps as string || "[]");
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    await db
      .update(courierOnboarding)
      .set({
        status: status as any,
        currentStep: parseInt(step),
        completedSteps: JSON.stringify(completedSteps),
        updatedAt: new Date(),
      })
      .where(eq(courierOnboarding.userId, userId));

    return true;
  } catch (error) {
    console.error("[Onboarding] Failed to update step:", error);
    throw error;
  }
}

// ============ REQUIREMENTS CHECK ============

export async function saveRequirementsCheck(
  userId: number,
  data: InsertCourierRequirementsCheck
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const existing = await db
      .select()
      .from(courierRequirementsCheck)
      .where(eq(courierRequirementsCheck.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(courierRequirementsCheck)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(courierRequirementsCheck.userId, userId));
    } else {
      await db.insert(courierRequirementsCheck).values({
        ...data,
      });
    }
    return true;
  } catch (error) {
    console.error("[Requirements] Failed to save:", error);
    throw error;
  }
}

export async function saveVehicleDetails(userId: number, data: { vehicleType: "motorbike" | "car" | "van" | "bakkie"; vehicleRegistration: string; licenseNumber: string; province: string; region: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(courierOnboarding).set({ ...data, updatedAt: new Date() }).where(eq(courierOnboarding.userId, userId));
  return true;
}

export async function getRequirementsCheck(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(courierRequirementsCheck)
      .where(eq(courierRequirementsCheck.userId, userId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Requirements] Failed to get:", error);
    throw error;
  }
}

// ============ VERIFICATION DOCUMENTS ============

export async function saveVerificationDocument(
  userId: number,
  data: InsertCourierVerification
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Check if document of this type already exists
    const existing = await db
      .select()
      .from(courierVerification)
      .where(
        and(
          eq(courierVerification.userId, userId),
          eq(courierVerification.documentType, data.documentType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(courierVerification)
        .set(data)
        .where(
          and(
            eq(courierVerification.userId, userId),
            eq(courierVerification.documentType, data.documentType)
          )
        );
    } else {
      await db.insert(courierVerification).values({
        ...data,
      });
    }
    return true;
  } catch (error) {
    console.error("[Verification] Failed to save document:", error);
    throw error;
  }
}

export async function getVerificationDocuments(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(courierVerification)
      .where(eq(courierVerification.userId, userId));

    return result;
  } catch (error) {
    console.error("[Verification] Failed to get documents:", error);
    throw error;
  }
}

// ============ QUIZ RESULTS ============

export async function saveQuizResult(
  userId: number,
  data: InsertCourierQuizResults
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.insert(courierQuizResults).values({
      ...data,
    });

    // Update onboarding status
    const passed = data.score >= 70;
    await db
      .update(courierOnboarding)
      .set({
        quizAttempts: (await getOnboardingStatus(userId))?.quizAttempts || 0 + 1,
        quizPassed: passed,
        quizScore: data.score,
        updatedAt: new Date(),
      })
      .where(eq(courierOnboarding.userId, userId));

    return { success: true, passed };
  } catch (error) {
    console.error("[Quiz] Failed to save result:", error);
    throw error;
  }
}

export async function getQuizAttempts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(courierQuizResults)
      .where(eq(courierQuizResults.userId, userId));

    return result;
  } catch (error) {
    console.error("[Quiz] Failed to get attempts:", error);
    throw error;
  }
}

// ============ AGREEMENTS ============

export async function saveAgreements(
  userId: number,
  data: InsertCourierAgreements
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const existing = await db
      .select()
      .from(courierAgreements)
      .where(eq(courierAgreements.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(courierAgreements)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(courierAgreements.userId, userId));
    } else {
      await db.insert(courierAgreements).values({
        ...data,
      });
    }
    return true;
  } catch (error) {
    console.error("[Agreements] Failed to save:", error);
    throw error;
  }
}

export async function getAgreements(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(courierAgreements)
      .where(eq(courierAgreements.userId, userId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Agreements] Failed to get:", error);
    throw error;
  }
}

// ============ FRAUD DETECTION ============

export async function addFraudFlag(data: InsertFraudDetectionFlag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.insert(fraudDetectionFlags).values(data);
    return true;
  } catch (error) {
    console.error("[Fraud] Failed to add flag:", error);
    throw error;
  }
}

export async function getFraudFlags(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(fraudDetectionFlags)
      .where(eq(fraudDetectionFlags.userId, userId));

    return result;
  } catch (error) {
    console.error("[Fraud] Failed to get flags:", error);
    throw error;
  }
}

// ============ PAYOUT SETTINGS ============

export async function saveCourierPayoutSettings(userId: number, data: {
  bankName: string;
  branchCode: string;
  accountName: string;
  accountNumber: string;
  paystackRecipientCode: string;
  isVerified: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select({ id: payoutSettings.id })
    .from(payoutSettings)
    .where(eq(payoutSettings.courierId, userId))
    .limit(1);

  const values = {
    courierId: userId,
    bankName: data.bankName,
    branchCode: data.branchCode,
    accountName: data.accountName,
    accountNumber: data.accountNumber,
    paystackRecipientCode: data.paystackRecipientCode,
    isVerified: data.isVerified,
    payoutFrequency: "weekly" as const,
    payoutDay: 4,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(payoutSettings).set(values).where(eq(payoutSettings.id, existing[0].id));
  } else {
    await db.insert(payoutSettings).values(values);
  }

  return { success: true };
}

// ============ APPLICATION SUBMISSION ============

export async function submitApplication(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const current = await getOnboardingStatus(userId);
  if (!current) throw new Error("Onboarding not initialized");
  if (current.status !== "agreement") throw new Error("Complete the onboarding steps before submitting");

  const agreement = await getAgreements(userId);
  if (!agreement?.allAgreementsAccepted) throw new Error("All agreements must be accepted before submitting");

  await db.update(courierOnboarding).set({
    status: "pending_approval",
    currentStep: 8,
    updatedAt: new Date(),
  }).where(eq(courierOnboarding.userId, userId));

  return { success: true, status: "pending_approval" as const };
}

// ============ ADMIN OPERATIONS ============

export async function getPendingApplications() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .select()
      .from(courierOnboarding)
      .where(eq(courierOnboarding.status, "pending_approval"));

    return result;
  } catch (error) {
    console.error("[Admin] Failed to get pending applications:", error);
    throw error;
  }
}

export async function approveApplication(
  userId: number,
  adminId: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(courierOnboarding)
      .set({
        status: "approved",
        approvedBy: adminId,
        adminNotes: notes,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(courierOnboarding.userId, userId));

    await db.insert(notifications).values({
      userId,
      type: "system",
      title: "Courier application approved",
      message: "Your courier application was approved. Complete activation with the owner before accepting parcel routes.",
    });

    return true;
  } catch (error) {
    console.error("[Admin] Failed to approve application:", error);
    throw error;
  }
}

export async function rejectApplication(
  userId: number,
  adminId: number,
  reason: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(courierOnboarding)
      .set({
        status: "rejected",
        approvedBy: adminId,
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(courierOnboarding.userId, userId));

    return true;
  } catch (error) {
    console.error("[Admin] Failed to reject application:", error);
    throw error;
  }
}

export async function activateCourierAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const application = await db
      .select({ status: courierOnboarding.status, vehicleType: courierOnboarding.vehicleType, vehicleRegistration: courierOnboarding.vehicleRegistration, licenseNumber: courierOnboarding.licenseNumber, province: courierOnboarding.province, region: courierOnboarding.region })
      .from(courierOnboarding)
      .where(eq(courierOnboarding.userId, userId))
      .limit(1);
    const vehicle = application[0];
    if (!vehicle) throw new Error("Courier application not found");
    if (vehicle.status !== "approved") throw new Error("Only approved courier applications can be activated");
    if (!vehicle.vehicleType || !vehicle.vehicleRegistration || !vehicle.licenseNumber) {
      throw new Error("Vehicle details must be completed before activation");
    }

    const existingProfile = await db
      .select({ id: courierProfiles.id })
      .from(courierProfiles)
      .where(eq(courierProfiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      await db.update(courierProfiles).set({
        vehicleType: vehicle.vehicleType,
        vehicleRegistration: vehicle.vehicleRegistration,
        licenseNumber: vehicle.licenseNumber,
        province: vehicle.province,
        region: vehicle.region,
        updatedAt: new Date(),
      }).where(eq(courierProfiles.userId, userId));
    } else {
      await db.insert(courierProfiles).values({
        userId,
        vehicleType: vehicle.vehicleType,
        vehicleRegistration: vehicle.vehicleRegistration,
        licenseNumber: vehicle.licenseNumber,
        province: vehicle.province,
        region: vehicle.region,
      });
    }

    await db
      .update(courierOnboarding)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(courierOnboarding.userId, userId));

    await db
      .update(users)
      .set({ role: "courier", isVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return true;
  } catch (error) {
    console.error("[Onboarding] Failed to activate account:", error);
    throw error;
  }
}
