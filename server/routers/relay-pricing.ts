import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { calculateRelayPrice, formatPrice } from "../services/relay-pricing";
import { calculateCourierRouteEconomics } from "../services/courier-pricing";
import { calculateSharedRelayPool } from "../services/relay-pool-pricing";

const serviceLevelSchema = z.enum(["economy", "priority", "express", "localSameDay"]);
const parcelPricingInput = z.object({
  distanceKm: z.number().nonnegative("Distance must be non-negative"),
  weight: z.number().nonnegative("Weight must be non-negative").default(1),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  serviceLevel: serviceLevelSchema.default("economy"),
  isFragile: z.boolean().default(false),
  hasInsurance: z.boolean().default(false),
  isRemoteArea: z.boolean().default(false),
  isOversized: z.boolean().default(false),
  needsManualHandling: z.boolean().default(false),
  consolidationDiscountPct: z.number().min(0).max(20).optional(),
});

function toCustomerInput(input: z.infer<typeof parcelPricingInput>) {
  return {
    distanceKm: input.distanceKm,
    actualWeightKg: input.weight,
    lengthCm: input.length,
    widthCm: input.width,
    heightCm: input.height,
    serviceLevel: input.serviceLevel,
    isFragile: input.isFragile,
    hasInsurance: input.hasInsurance,
    isRemoteArea: input.isRemoteArea,
    isOversized: input.isOversized,
    needsManualHandling: input.needsManualHandling,
    consolidationDiscountPct: input.consolidationDiscountPct,
  };
}

export const relayPricingRouter = router({
  calculateSharedRelayPool: adminProcedure
    .input(z.object({
      parcelCount: z.number().int().positive().optional(),
      customerChargeZar: z.number().nonnegative(),
      platformFeePct: z.number().min(0).max(100).optional(),
      paymentProcessingFeePct: z.number().min(0).max(100).optional(),
      paymentProcessingFixedZar: z.number().nonnegative().optional(),
      platformReserveZar: z.number().nonnegative().optional(),
      legs: z.array(z.object({
        legId: z.string().min(1),
        sequence: z.number().int().positive(),
        courierId: z.string().min(1),
        origin: z.string().min(1),
        destination: z.string().min(1),
        distanceKm: z.number().nonnegative(),
        deadheadKm: z.number().nonnegative().optional(),
        returnKm: z.number().nonnegative().optional(),
        legValueMultiplier: z.number().nonnegative().optional(),
        fuelPricePerLitre: z.number().nonnegative().optional(),
        fuelLitresPer100Km: z.number().nonnegative().optional(),
        driverCompensationPerKm: z.number().nonnegative().optional(),
        vehicleAllowancePerKm: z.number().nonnegative().optional(),
        routeOverheadPerKm: z.number().nonnegative().optional(),
        handoverFeeZar: z.number().nonnegative().optional(),
        minimumPayoutZar: z.number().nonnegative().optional(),
      })).min(1),
    }))
    .query(({ input }) => calculateSharedRelayPool(input)),

  getCourierRouteOffer: protectedProcedure
    .input(z.object({
      distanceKm: z.number().nonnegative(),
      parcelCount: z.number().int().nonnegative(),
      averageCustomerRevenueZar: z.number().nonnegative(),
      fuelPricePerLitre: z.number().positive().optional(),
      fuelLitresPer100Km: z.number().positive().optional(),
    }))
    .query(({ input }) => calculateCourierRouteEconomics(input)),

  calculatePrice: publicProcedure.input(parcelPricingInput).query(({ input }) => {
    return calculateRelayPrice(toCustomerInput(input));
  }),

  getPricingBreakdown: publicProcedure
    .input(parcelPricingInput.pick({ distanceKm: true, weight: true, length: true, width: true, height: true, serviceLevel: true, isFragile: true, hasInsurance: true, isRemoteArea: true, isOversized: true, needsManualHandling: true, consolidationDiscountPct: true }))
    .query(({ input }) => {
      const pricing = calculateRelayPrice(toCustomerInput(input));
      return {
        estimatedLegs: pricing.estimatedLegs,
        routeBand: pricing.routeBand,
        weightBand: pricing.weightBand,
        volumeBand: pricing.volumeBand,
        billableWeightKg: pricing.billableWeightKg,
        components: [
          { label: "Tariff base", amount: pricing.tariffBase, formatted: formatPrice(pricing.tariffBase), description: `${pricing.weightBand} customer tariff` },
          { label: "Route adjustment", amount: pricing.routeCharge, formatted: formatPrice(pricing.routeCharge), description: `${pricing.routeBand} route multiplier` },
          { label: "Urgency", amount: pricing.urgencyPremium, formatted: formatPrice(pricing.urgencyPremium), description: `${pricing.serviceLevel} service` },
          ...(pricing.surcharges > 0 ? [{ label: "Surcharges", amount: pricing.surcharges, formatted: formatPrice(pricing.surcharges), description: "Optional parcel and handling fees" }] : []),
          ...(pricing.consolidationDiscount > 0 ? [{ label: "Consolidation discount", amount: -pricing.consolidationDiscount, formatted: `-${formatPrice(pricing.consolidationDiscount)}`, description: "Applied when the route is consolidated" }] : []),
        ],
        subtotal: pricing.subtotal,
        subtotalFormatted: formatPrice(pricing.subtotal),
        finalPrice: pricing.finalPrice,
        finalPriceFormatted: formatPrice(pricing.finalPrice),
        serviceLevel: pricing.serviceLevel,
        serviceMultiplier: pricing.serviceMultiplier,
      };
    }),

  comparePrices: publicProcedure
    .input(z.object({ distanceKm: z.number().nonnegative(), weight: z.number().nonnegative().default(1) }))
    .query(({ input }) => {
      const levels = ["economy", "priority", "express"] as const;
      const economy = calculateRelayPrice({ distanceKm: input.distanceKm, actualWeightKg: input.weight, serviceLevel: "economy" });
      return levels.map((serviceLevel) => {
        const pricing = calculateRelayPrice({ distanceKm: input.distanceKm, actualWeightKg: input.weight, serviceLevel });
        return {
          serviceLevel,
          finalPrice: pricing.finalPrice,
          finalPriceFormatted: formatPrice(pricing.finalPrice),
          multiplier: pricing.serviceMultiplier,
          savings: pricing.finalPrice - economy.finalPrice,
          routeBand: pricing.routeBand,
        };
      });
    }),

  estimateDelivery: publicProcedure
    .input(z.object({
      pickupLat: z.number(),
      pickupLng: z.number(),
      dropoffLat: z.number(),
      dropoffLng: z.number(),
      weight: z.number().nonnegative().default(1),
      serviceLevel: serviceLevelSchema.default("economy"),
    }))
    .query(({ input }) => {
      const R = 6371;
      const dLat = ((input.dropoffLat - input.pickupLat) * Math.PI) / 180;
      const dLng = ((input.dropoffLng - input.pickupLng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((input.pickupLat * Math.PI) / 180) * Math.cos((input.dropoffLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const pricing = calculateRelayPrice({ distanceKm, actualWeightKg: input.weight, serviceLevel: input.serviceLevel });
      return { distanceKm: Math.round(distanceKm * 100) / 100, ...pricing };
    }),
});
