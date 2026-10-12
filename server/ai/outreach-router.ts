import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  generateRecruitmentMessage,
  identifyProspects as identifyRecruitmentProspects,
  analyzeCampaignPerformance as analyzeRecruitmentCampaign,
  generateFollowUpMessage,
  type CourierProspect,
  type RecruitmentCampaign,
} from './courier-recruitment';
import {
  generateAwarenessMessage,
  identifyProspects as identifyAwarenessProspects,
  createAwarenessSegments,
  analyzeCampaignPerformance as analyzeAwarenessCampaign,
  type CustomerProspect,
} from './customer-awareness';

/**
 * Outreach Router
 * 
 * tRPC procedures for AI-powered outreach:
 * - Courier Recruitment
 * - Customer Awareness
 */

export const outreachRouter = router({
  // ============ COURIER RECRUITMENT ============

  /**
   * Generate personalized recruitment message
   */
  generateRecruitmentMessage: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        prospectName: z.string(),
        phone: z.string(),
        email: z.string().optional(),
        currentOccupation: z.string().optional(),
        location: z.string(),
        vehicleType: z.string().optional(),
        yearsExperience: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const prospect: CourierProspect = {
          id: input.prospectId,
          name: input.prospectName,
          phone: input.phone,
          email: input.email,
          currentOccupation: input.currentOccupation,
          location: input.location,
          vehicleType: input.vehicleType,
          yearsExperience: input.yearsExperience,
        };

        const message = await generateRecruitmentMessage(prospect);

        return {
          success: true,
          data: message,
        };
      } catch (error) {
        throw new Error(`Failed to generate recruitment message: ${error}`);
      }
    }),

  /**
   * Identify courier recruitment prospects
   */
  identifyRecruitmentProspects: protectedProcedure
    .input(
      z.object({
        location: z.string(),
        vehicleTypes: z.array(z.string()).optional(),
        occupation: z.string().optional(),
        minExperience: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await identifyRecruitmentProspects({
          location: input.location,
          vehicleTypes: input.vehicleTypes,
          occupation: input.occupation,
          minExperience: input.minExperience,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        throw new Error(`Failed to identify prospects: ${error}`);
      }
    }),

  /**
   * Analyze recruitment campaign performance
   */
  analyzeRecruitmentCampaign: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        campaignName: z.string(),
        messageCount: z.number(),
        responseCount: z.number(),
        conversionCount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const campaign: RecruitmentCampaign = {
          id: input.campaignId,
          name: input.campaignName,
          targetLocation: '',
          vehicleTypes: [],
          messageCount: input.messageCount,
          sentCount: input.messageCount,
          responseCount: input.responseCount,
          conversionCount: input.conversionCount,
          createdAt: Date.now(),
        };

        const analysis = await analyzeRecruitmentCampaign(campaign);

        return {
          success: true,
          data: analysis,
        };
      } catch (error) {
        throw new Error(`Failed to analyze campaign: ${error}`);
      }
    }),

  /**
   * Generate follow-up recruitment message
   */
  generateRecruitmentFollowUp: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        prospectName: z.string(),
        location: z.string(),
        vehicleType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const prospect: CourierProspect = {
          id: input.prospectId,
          name: input.prospectName,
          phone: '',
          location: input.location,
          vehicleType: input.vehicleType,
        };

        const followUp = await generateFollowUpMessage(prospect);

        return {
          success: true,
          data: followUp,
        };
      } catch (error) {
        throw new Error(`Failed to generate follow-up: ${error}`);
      }
    }),

  // ============ CUSTOMER AWARENESS ============

  /**
   * Generate personalized awareness message
   */
  generateAwarenessMessage: protectedProcedure
    .input(
      z.object({
        prospectId: z.string(),
        prospectName: z.string(),
        phone: z.string(),
        email: z.string().optional(),
        businessType: z.string().optional(),
        location: z.string(),
        businessSize: z.enum(['small', 'medium', 'large']).optional(),
        yearsInBusiness: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const prospect: CustomerProspect = {
          id: input.prospectId,
          name: input.prospectName,
          phone: input.phone,
          email: input.email,
          businessType: input.businessType,
          location: input.location,
          businessSize: input.businessSize,
          yearsInBusiness: input.yearsInBusiness,
        };

        const message = await generateAwarenessMessage(prospect);

        return {
          success: true,
          data: message,
        };
      } catch (error) {
        throw new Error(`Failed to generate awareness message: ${error}`);
      }
    }),

  /**
   * Identify customer awareness prospects
   */
  identifyAwarenessProspects: protectedProcedure
    .input(
      z.object({
        location: z.string(),
        businessTypes: z.array(z.string()).optional(),
        businessSize: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await identifyAwarenessProspects({
          location: input.location,
          businessTypes: input.businessTypes,
          businessSize: input.businessSize,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        throw new Error(`Failed to identify prospects: ${error}`);
      }
    }),

  /**
   * Get awareness segments
   */
  getAwarenessSegments: protectedProcedure.query(async () => {
    try {
      const segments = await createAwarenessSegments();

      return {
        success: true,
        data: segments,
      };
    } catch (error) {
      throw new Error(`Failed to get segments: ${error}`);
    }
  }),

  /**
   * Analyze awareness campaign performance
   */
  analyzeAwarenessCampaign: protectedProcedure
    .input(
      z.object({
        campaignName: z.string(),
        messagesSent: z.number(),
        messagesOpened: z.number(),
        clicksReceived: z.number(),
        conversions: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await analyzeAwarenessCampaign({
          name: input.campaignName,
          messagesSent: input.messagesSent,
          messagesOpened: input.messagesOpened,
          clicksReceived: input.clicksReceived,
          conversions: input.conversions,
        });

        return {
          success: true,
          data: analysis,
        };
      } catch (error) {
        throw new Error(`Failed to analyze campaign: ${error}`);
      }
    }),
});

export default outreachRouter;
