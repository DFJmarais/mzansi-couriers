import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  parseAddressWithAI,
  correctAddressTypos,
  matchInformalAddress,
  enhanceAddressWithAI
} from "../services/ai-address-parser";

/**
 * AI Address Router
 * Provides AI-powered address parsing and matching
 */

export const aiAddressRouter = router({
  /**
   * Parse natural language address using AI
   */
  parseAddress: publicProcedure
    .input(z.object({
      input: z.string().min(3).max(500)
    }))
    .query(async ({ input }) => {
      const parsed = await parseAddressWithAI(input.input);
      
      if (!parsed) {
        return {
          success: false,
          error: "Could not parse address"
        };
      }

      return {
        success: true,
        data: parsed
      };
    }),

  /**
   * Correct address typos
   */
  correctTypos: publicProcedure
    .input(z.object({
      input: z.string().min(3).max(500)
    }))
    .query(async ({ input }) => {
      const corrections = await correctAddressTypos(input.input);
      
      return {
        success: true,
        corrections
      };
    }),

  /**
   * Match informal address to formal address
   */
  matchInformal: publicProcedure
    .input(z.object({
      input: z.string().min(3).max(500),
      city: z.string().optional(),
      province: z.string().optional()
    }))
    .query(async ({ input }) => {
      const formalAddress = await matchInformalAddress(input.input, {
        city: input.city,
        province: input.province
      });

      if (!formalAddress) {
        return {
          success: false,
          error: "Could not match informal address"
        };
      }

      return {
        success: true,
        formalAddress
      };
    }),

  /**
   * Enhance partial address with AI
   */
  enhanceAddress: publicProcedure
    .input(z.object({
      input: z.string().min(3).max(500)
    }))
    .query(async ({ input }) => {
      const enhanced = await enhanceAddressWithAI(input.input);

      if (!enhanced) {
        return {
          success: false,
          error: "Could not enhance address"
        };
      }

      return {
        success: true,
        data: enhanced
      };
    })
});
