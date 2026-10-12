/**
 * Input Validation Utilities
 * Comprehensive validation for all user inputs
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';

/**
 * Validate phone number (South African format)
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+27|0)[0-9]{9}$/, 'Invalid South African phone number');

/**
 * Validate email
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Validate delivery ID
 */
export const deliveryIdSchema = z.number().int().positive('Invalid delivery ID');

/**
 * Validate courier ID
 */
export const courierIdSchema = z.number().int().positive('Invalid courier ID');

/**
 * Validate user ID
 */
export const userIdSchema = z.number().int().positive('Invalid user ID');

/**
 * Validate delivery status
 */
export const deliveryStatusSchema = z.enum([
  'pending',
  'assigned',
  'in-transit',
  'delivered',
  'cancelled',
]);

/**
 * Validate package size
 */
export const packageSizeSchema = z.enum([
  'small',
  'medium',
  'large',
  'xlarge',
]);

/**
 * Validate price (in Rand)
 */
export const priceSchema = z
  .number()
  .positive('Price must be positive')
  .max(999999, 'Price too high');

/**
 * Validate distance (in km)
 */
export const distanceSchema = z
  .number()
  .positive('Distance must be positive')
  .max(10000, 'Distance too far');

/**
 * Validate rating (1-5 stars)
 */
export const ratingSchema = z
  .number()
  .int()
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5');

/**
 * Validate address
 */
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  province: z.string().min(1, 'Province is required').max(100),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

/**
 * Validate delivery creation input
 */
export const createDeliverySchema = z.object({
  pickupAddress: addressSchema,
  dropoffAddress: addressSchema,
  packageSize: packageSizeSchema,
  packageWeight: z.number().positive('Weight must be positive').max(100),
  description: z.string().max(500, 'Description too long').optional(),
  recipientName: z.string().min(1, 'Recipient name required').max(200),
  recipientPhone: phoneSchema,
  specialInstructions: z.string().max(500).optional(),
});

/**
 * Validate update delivery status input
 */
export const updateDeliveryStatusSchema = z.object({
  deliveryId: deliveryIdSchema,
  status: deliveryStatusSchema,
  notes: z.string().max(500).optional(),
});

/**
 * Validate rating submission
 */
export const submitRatingSchema = z.object({
  deliveryId: deliveryIdSchema,
  rating: ratingSchema,
  comment: z.string().max(500).optional(),
});

/**
 * Validate pricing calculation input
 */
export const calculatePriceSchema = z.object({
  distance: distanceSchema,
  packageSize: packageSizeSchema,
  packageWeight: z.number().positive().max(100),
  urgency: z.enum(['standard', 'express', 'same-day']).optional(),
});

/**
 * Safe validation wrapper
 * Returns validation error as TRPCError
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues
        .map((e: any) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Validation failed: ${message}`,
      });
    }
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Validation failed',
    });
  }
}
