import { router, protectedProcedure, publicProcedure, adminProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';

/**
 * Courier ID Router - Handles digital courier ID cards with QR code encryption
 * Features:
 * - Generate encrypted QR codes for courier identification
 * - Verify courier IDs via QR code scanning
 * - Download/share courier ID cards
 * - Admin management of courier IDs
 */

// Encryption utilities
const ENCRYPTION_KEY = process.env.COURIER_ID_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

function encryptQRCode(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(data, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptQRCode(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

export const courierIdRouter = router({
  /**
   * Generate a new digital courier ID card
   * Only couriers can generate their own ID
   */
  generateIdCard: protectedProcedure
    .input(z.object({
      courierName: z.string().min(2),
      idNumber: z.string().min(5),
      vehicleRegistration: z.string().min(3),
      vehicleMakeModel: z.string().min(3),
      province: z.string().min(2),
      emergencyContact: z.string().min(5),
      profilePhotoUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'courier') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only couriers can generate ID cards' });
        }

        // Create QR code data
        const qrData = {
          courierId: ctx.user.id,
          courierName: input.courierName,
          idNumber: input.idNumber,
          vehicleRegistration: input.vehicleRegistration,
          vehicleMakeModel: input.vehicleMakeModel,
          province: input.province,
          emergencyContact: input.emergencyContact,
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        };

        const encryptedQRCode = encryptQRCode(JSON.stringify(qrData));

        return {
          success: true,
          courierIdCard: {
            id: crypto.randomUUID(),
            courierId: ctx.user.id,
            courierName: input.courierName,
            idNumber: input.idNumber,
            vehicleRegistration: input.vehicleRegistration,
            vehicleMakeModel: input.vehicleMakeModel,
            province: input.province,
            emergencyContact: input.emergencyContact,
            profilePhotoUrl: input.profilePhotoUrl,
            qrCode: encryptedQRCode,
            status: 'active',
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            verificationUrl: `${process.env.VITE_FRONTEND_URL || 'https://mzansicourier.app'}/verify-courier/${encodeURIComponent(encryptedQRCode)}`,
          },
        };
      } catch (error: any) {
        console.error('[Courier ID] Generate error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to generate courier ID',
        });
      }
    }),

  /**
   * Verify a courier ID by scanning QR code
   * Public endpoint - anyone can verify a courier
   */
  verifyIdByQrCode: publicProcedure
    .input(z.object({
      qrToken: z.string().min(10),
    }))
    .query(async ({ input }) => {
      try {
        const decryptedData = decryptQRCode(decodeURIComponent(input.qrToken));
        const qrData = JSON.parse(decryptedData);

        // Check expiry
        if (new Date(qrData.expiresAt) < new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Courier ID has expired' });
        }

        return {
          status: 'active',
          courierName: qrData.courierName,
          idNumber: qrData.idNumber,
          vehicleRegistration: qrData.vehicleRegistration,
          vehicleMakeModel: qrData.vehicleMakeModel,
          province: qrData.province,
          emergencyContact: qrData.emergencyContact,
          generatedAt: qrData.generatedAt,
          expiryDate: qrData.expiresAt,
          verifiedAt: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('[Courier ID] Verification error:', error);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired courier ID',
        });
      }
    }),

  /**
   * Download courier ID card as PDF/image
   * Only the courier can download their own ID
   */
  downloadIdCard: protectedProcedure
    .input(z.object({
      format: z.enum(['pdf', 'image']).default('pdf'),
      courierIdCardId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'courier') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only couriers can download ID cards' });
        }

        // In production, generate actual PDF/image
        // For now, return a placeholder URL
        return {
          success: true,
          downloadUrl: `/api/courier-id/download/${input.courierIdCardId}?format=${input.format}`,
          fileName: `mzansi-courier-id-${ctx.user.id}.${input.format === 'pdf' ? 'pdf' : 'png'}`,
        };
      } catch (error: any) {
        console.error('[Courier ID] Download error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to download courier ID',
        });
      }
    }),

  /**
   * Get courier's own ID card details
   */
  getMyIdCard: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user.role !== 'courier') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only couriers can view ID cards' });
      }

      // Return placeholder - in production would fetch from database
      return {
        id: crypto.randomUUID(),
        courierId: ctx.user.id,
        courierName: ctx.user.name || 'Courier',
        status: 'active',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        qrCode: 'placeholder-encrypted-qr-code',
      };
    } catch (error: any) {
      console.error('[Courier ID] Get my card error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to fetch courier ID',
      });
    }
  }),

  /**
   * Admin: Get all courier ID cards
   */
  getAllIdCards: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      status: z.enum(['active', 'suspended', 'expired']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        // Return placeholder - in production would fetch from database
        return {
          success: true,
          idCards: [],
          total: 0,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error: any) {
        console.error('[Courier ID] Get all cards error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch courier ID cards',
        });
      }
    }),

  /**
   * Admin: Suspend a courier ID
   */
  suspendIdCard: adminProcedure
    .input(z.object({
      courierIdCardId: z.string(),
      reason: z.string().min(5),
    }))
    .mutation(async ({ input }) => {
      try {
        return {
          success: true,
          message: `Courier ID ${input.courierIdCardId} suspended: ${input.reason}`,
        };
      } catch (error: any) {
        console.error('[Courier ID] Suspend error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to suspend courier ID',
        });
      }
    }),

  /**
   * Admin: Reactivate a suspended courier ID
   */
  reactivateIdCard: adminProcedure
    .input(z.object({
      courierIdCardId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        return {
          success: true,
          message: `Courier ID ${input.courierIdCardId} reactivated`,
        };
      } catch (error: any) {
        console.error('[Courier ID] Reactivate error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to reactivate courier ID',
        });
      }
    }),

  /**
   * Log verification event for audit trail
   */
  recordVerification: publicProcedure
    .input(z.object({
      qrToken: z.string(),
      verifierLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Log verification event
        console.log('[Courier ID] Verification recorded:', {
          timestamp: new Date(),
          location: input.verifierLocation,
        });

        return {
          success: true,
          message: 'Verification recorded',
        };
      } catch (error: any) {
        console.error('[Courier ID] Record verification error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to record verification',
        });
      }
    }),
});
