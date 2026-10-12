import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { initializePayment, verifyPayment, createTransferRecipient, initiateTransfer, verifyTransfer, verifyAccountDetails, getBanks } from './paystack';
import { createSessionTimeoutMiddleware, SESSION_TIMEOUTS, updateUserActivity, isSessionExpired } from '../middleware/sessionTimeout';
import { TRPCError } from '@trpc/server';

/**
 * Payment router for Paystack integration
 */
export const paymentRouter = router({
  /**
   * Initialize a payment for a delivery
   */
  initializeDeliveryPayment: protectedProcedure
    .use(({ ctx, next }) => {
      if (isSessionExpired(String(ctx.user.id), SESSION_TIMEOUTS.PAYMENT)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Session expired for payment operations. Please re-authenticate.',
        });
      }
      updateUserActivity(String(ctx.user.id));
      return next({ ctx });
    })
    .input(
      z.object({
        delivery_id: z.string(),
        amount: z.number().positive('Amount must be greater than 0'),
        customer_email: z.string().email(),
        customer_name: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Initialize payment with Paystack
        const paystackResult = await initializePayment({
          email: input.customer_email,
          amount: input.amount,
          reference: `delivery-${input.delivery_id}-${Date.now()}`,
          metadata: {
            delivery_id: input.delivery_id,
            customer_id: ctx.user.id,
            customer_name: input.customer_name,
            type: 'delivery_payment',
          },
        });

        if (!paystackResult.success) {
          return {
            success: false,
            error: paystackResult.error,
          };
        }

        return {
          success: true,
          authorization_url: paystackResult.authorization_url,
          access_code: paystackResult.access_code,
          reference: paystackResult.reference,
        };
      } catch (error: any) {
        console.error('[Payment Router] Initialize payment error:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Verify a payment transaction
   */
  verifyPaymentTransaction: protectedProcedure
    .use(({ ctx, next }) => {
      if (isSessionExpired(String(ctx.user.id), SESSION_TIMEOUTS.PAYMENT)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Session expired for payment operations. Please re-authenticate.',
        });
      }
      updateUserActivity(String(ctx.user.id));
      return next({ ctx });
    })
    .input(
      z.object({
        reference: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify with Paystack
        const verifyResult = await verifyPayment(input.reference);

        if (!verifyResult.success) {
          return {
            success: false,
            error: verifyResult.error,
            isPaid: false,
          };
        }

        return {
          success: true,
          isPaid: verifyResult.isPaid,
          data: verifyResult.data,
        };
      } catch (error: any) {
        console.error('[Payment Router] Verify payment error:', error);
        return {
          success: false,
          error: error.message,
          isPaid: false,
        };
      }
    }),

  /**
   * Get banks for transfer recipient setup
   */
  getBankList: publicProcedure.query(async () => {
    try {
      const result = await getBanks();
      return {
        success: result.success,
        data: result.data,
      };
    } catch (error: any) {
      console.error('[Payment Router] Get banks error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }),

  /**
   * Verify account details before creating transfer recipient
   */
  verifyAccountDetails: publicProcedure
    .input(
      z.object({
        account_number: z.string(),
        bank_code: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await verifyAccountDetails(input);
        return {
          success: result.success,
          account_name: result.account_name,
          error: result.error,
        };
      } catch (error: any) {
        console.error('[Payment Router] Verify account error:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Create transfer recipient for courier payouts
   */
  createTransferRecipient: protectedProcedure
    .use(({ ctx, next }) => {
      if (isSessionExpired(String(ctx.user.id), SESSION_TIMEOUTS.PAYMENT)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Session expired for payment operations. Please re-authenticate.',
        });
      }
      updateUserActivity(String(ctx.user.id));
      return next({ ctx });
    })
    .input(
      z.object({
        type: z.enum(['nuban', 'mobile_money', 'ghipss']),
        name: z.string(),
        account_number: z.string(),
        bank_code: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await createTransferRecipient(input);

        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          recipient_code: result.recipient_code,
        };
      } catch (error: any) {
        console.error('[Payment Router] Create transfer recipient error:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Initiate a payout transfer to courier
   */
  initiateCourierPayout: protectedProcedure
    .use(({ ctx, next }) => {
      if (isSessionExpired(String(ctx.user.id), SESSION_TIMEOUTS.PAYMENT)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Session expired for payment operations. Please re-authenticate.',
        });
      }
      updateUserActivity(String(ctx.user.id));
      return next({ ctx });
    })
    .input(
      z.object({
        recipient_code: z.string(),
        amount: z.number().positive('Amount must be greater than 0'),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await initiateTransfer({
          source: 'balance',
          recipient_code: input.recipient_code,
          amount: input.amount,
          reason: input.reason || `Payout to courier ${ctx.user.id}`,
          reference: `payout-${ctx.user.id}-${Date.now()}`,
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transfer_code: result.transfer_code,
          reference: result.reference,
          status: result.status,
        };
      } catch (error: any) {
        console.error('[Payment Router] Initiate payout error:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Verify a transfer
   */
  verifyTransferStatus: protectedProcedure
    .input(
      z.object({
        reference: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await verifyTransfer(input.reference);

        if (!result.success) {
          return {
            success: false,
            error: result.error,
            isSuccessful: false,
          };
        }

        return {
          success: true,
          isSuccessful: result.isSuccessful,
          data: result.data,
        };
      } catch (error: any) {
        console.error('[Payment Router] Verify transfer error:', error);
        return {
          success: false,
          error: error.message,
          isSuccessful: false,
        };
      }
    }),
});
