import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { lenientRateLimiter } from "../middleware/rateLimiter";
import { createCourierInterestLead } from "../db";
import { sendDeliveryEmail } from "../_core/email";
import { storagePut } from "../storage";

const DOCUMENT_TYPES = ["license", "id", "insurance"] as const;
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

export const courierInterestRouter = router({
  uploadDocument: publicProcedure
    .input(z.object({
      documentType: z.enum(DOCUMENT_TYPES),
      fileName: z.string().trim().min(1).max(160),
      mimeType: z.enum(ALLOWED_DOCUMENT_TYPES),
      base64: z.string().min(1).max(12_000_000),
    }))
    .mutation(async ({ input }) => {
      const cleanBase64 = input.base64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      if (!buffer.length || buffer.length > MAX_DOCUMENT_BYTES) {
        throw new Error("Document must be smaller than 8 MB.");
      }
      await lenientRateLimiter(`courier-document:${input.documentType}`);
      const extension = input.mimeType === "application/pdf" ? "pdf" : input.mimeType === "image/png" ? "png" : "jpg";
      const stored = await storagePut(
        `courier-applications/${input.documentType}/${crypto.randomUUID()}.${extension}`,
        buffer,
        input.mimeType,
      );
      return { ...stored, documentType: input.documentType };
    }),
  submit: publicProcedure
    .input(z.object({
      fullName: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(320),
      phone: z.string().trim().min(7).max(30),
      age: z.number().int().min(18).max(85),
      province: z.string().trim().min(2).max(80),
      vehicleType: z.enum(["car", "bakkie", "van", "motorcycle", "truck", "other"]),
      vehicleMakeModel: z.string().trim().min(2).max(120),
      vehicleYear: z.number().int().min(1950).max(new Date().getFullYear() + 1),
      vehicleOwnership: z.enum(["own", "financed", "lease", "borrowed"]),
      hasValidLicense: z.literal(true),
      hasVehicleInsurance: z.literal(true),
      wantsFleet: z.boolean(),
      fleetSize: z.number().int().min(1).max(1000).nullable(),
      fleetDetails: z.string().trim().max(240).nullable(),
      licenseDocumentUrl: z.string().regex(/^\/manus-storage\/.+/).max(500),
      licenseDocumentKey: z.string().min(1).max(255),
      licenseExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      idDocumentUrl: z.string().regex(/^\/manus-storage\/.+/).max(500),
      idDocumentKey: z.string().min(1).max(255),
      insuranceDocumentUrl: z.string().regex(/^\/manus-storage\/.+/).max(500),
      insuranceDocumentKey: z.string().min(1).max(255),
      insuranceExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      emailConsent: z.literal(true),
    }))
    .mutation(async ({ ctx, input }) => {
      await lenientRateLimiter(`courier-interest:${input.email.toLowerCase()}`);
      const lead = await createCourierInterestLead({
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone,
        age: input.age,
        province: input.province,
        vehicleType: input.vehicleType,
        vehicleMakeModel: input.vehicleMakeModel,
        vehicleYear: input.vehicleYear,
        vehicleOwnership: input.vehicleOwnership,
        hasValidLicense: input.hasValidLicense,
        hasVehicleInsurance: input.hasVehicleInsurance,
        wantsFleet: input.wantsFleet,
        fleetSize: input.wantsFleet ? input.fleetSize : null,
        fleetDetails: input.wantsFleet ? input.fleetDetails : null,
        licenseDocumentUrl: input.licenseDocumentUrl,
        licenseDocumentKey: input.licenseDocumentKey,
        licenseExpiryDate: new Date(`${input.licenseExpiryDate}T00:00:00.000Z`),
        idDocumentUrl: input.idDocumentUrl,
        idDocumentKey: input.idDocumentKey,
        insuranceDocumentUrl: input.insuranceDocumentUrl,
        insuranceDocumentKey: input.insuranceDocumentKey,
        insuranceExpiryDate: new Date(`${input.insuranceExpiryDate}T00:00:00.000Z`),
        emailConsent: true,
        source: "become-driver",
      });
      const emailResult = await sendDeliveryEmail(
        input.email.toLowerCase(),
        "We received your Mzansi Couriers enquiry",
        `Hi ${input.fullName},\n\nThank you for your interest in becoming a Mzansi Couriers courier. We have received your enquiry and will review your details. Our team will get back to you soon with the next steps.\n\nPlease keep this email for your records.\n\nMzansi Couriers\nmzansicouriers@yahoo.com`,
      );
      return { success: true, leadId: lead.id, emailSent: emailResult.sent };
    }),
});
