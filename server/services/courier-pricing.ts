export type CourierServiceLevel = "economy" | "priority" | "express" | "localSameDay";
export type RouteBand = "local" | "regional" | "longDistance" | "intercity" | "dynamic";
export type WeightBand = "0-2kg" | "2-5kg" | "5-10kg" | "10-15kg" | "15-20kg" | "20-30kg" | "manual-quote";

export type CustomerPricingInput = {
  distanceKm: number;
  actualWeightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  serviceLevel?: CourierServiceLevel;
  isFragile?: boolean;
  hasInsurance?: boolean;
  isRemoteArea?: boolean;
  isOversized?: boolean;
  needsManualHandling?: boolean;
  consolidationDiscountPct?: number;
};

export type CustomerPricingOutput = {
  serviceLevel: CourierServiceLevel;
  routeBand: RouteBand;
  routeMultiplier: number;
  estimatedLegs: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  billableWeightKg: number;
  weightBand: WeightBand;
  volumeBand: "small" | "medium" | "large" | "oversized";
  tariffBase: number;
  urgencyPremium: number;
  routeCharge: number;
  weightCharge: number;
  surcharges: number;
  consolidationDiscount: number;
  subtotal: number;
  finalPrice: number;
  serviceMultiplier: number;
  breakdown: {
    tariffBase: number;
    routeCharge: number;
    weightCharge: number;
    urgencyPremium: number;
    surcharges: number;
    consolidationDiscount: number;
  };
};

export type CourierRouteInput = {
  distanceKm: number;
  parcelCount: number;
  averageCustomerRevenueZar: number;
  serviceLevel?: CourierServiceLevel;
  fuelPricePerLitre?: number;
  fuelLitresPer100Km?: number;
  driverCompensationPerKm?: number;
  vehicleAllowancePerKm?: number;
  routeOverheadPerKm?: number;
  minimumRevenueMarginPct?: number;
  courierOfferBufferPct?: number;
  platformFeePct?: number;
};

export type CourierRouteEconomics = {
  routeBand: RouteBand;
  parcelCount: number;
  averageCustomerRevenueZar: number;
  customerRevenueZar: number;
  fuelCostZar: number;
  driverCompensationZar: number;
  vehicleAllowanceZar: number;
  routeOverheadZar: number;
  routeOperatingCostZar: number;
  minimumViableRevenueZar: number;
  courierOfferZar: number;
  platformFeeZar: number;
  platformFeePct: number;
  platformContributionZar: number;
  requiredParcelCount: number;
  routeViable: boolean;
  dispatchDecision: "consolidating" | "route-viable" | "dedicated-express";
  reason: string;
};

/** Public tariff starting point. Prices are deliberately simple for customers. */
export const CUSTOMER_TARIFF_ZAR = {
  economy: { "0-2kg": 79, "2-5kg": 99, "5-10kg": 139, "10-15kg": 179, "15-20kg": 229, "20-30kg": 299 },
  express: { "0-2kg": 119, "2-5kg": 149, "5-10kg": 199, "10-15kg": 249, "15-20kg": 299, "20-30kg": 399 },
} as const;

/** Route multipliers preserve lower long-distance per-km economics without exposing per-km pricing. */
export const ROUTE_MULTIPLIERS: Record<RouteBand, number> = {
  local: 1,
  regional: 1.15,
  longDistance: 1.35,
  intercity: 1.6,
  dynamic: 1.85,
};

const SURCHARGES = {
  fragile: 25,
  insurance: 50,
  remote: 75,
  oversized: 100,
  manualHandling: 80,
} as const;

const PRIORITY_MULTIPLIER = 1.2;
const LOCAL_SAME_DAY_MULTIPLIER = 1.5;
export const PLATFORM_FEE_PCT = 20;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getRouteBand(distanceKm: number): RouteBand {
  if (distanceKm <= 30) return "local";
  if (distanceKm <= 100) return "regional";
  if (distanceKm <= 300) return "longDistance";
  if (distanceKm <= 600) return "intercity";
  return "dynamic";
}

export function calculateVolumetricWeight(lengthCm?: number, widthCm?: number, heightCm?: number): number {
  if (!lengthCm || !widthCm || !heightCm) return 0;
  return (lengthCm * widthCm * heightCm) / 5000;
}

export function getWeightBand(weightKg: number): WeightBand {
  if (weightKg <= 2) return "0-2kg";
  if (weightKg <= 5) return "2-5kg";
  if (weightKg <= 10) return "5-10kg";
  if (weightKg <= 15) return "10-15kg";
  if (weightKg <= 20) return "15-20kg";
  if (weightKg <= 30) return "20-30kg";
  return "manual-quote";
}

export function getVolumeBand(lengthCm?: number, widthCm?: number, heightCm?: number): "small" | "medium" | "large" | "oversized" {
  if (!lengthCm || !widthCm || !heightCm) return "small";
  const volume = lengthCm * widthCm * heightCm;
  if (volume <= 20_000) return "small";
  if (volume <= 60_000) return "medium";
  if (volume <= 150_000) return "large";
  return "oversized";
}

export function estimateRelayLegs(distanceKm: number): number {
  if (distanceKm <= 120) return 1;
  return Math.ceil(distanceKm / 80);
}

function serviceMultiplier(serviceLevel: CourierServiceLevel): number {
  if (serviceLevel === "priority") return PRIORITY_MULTIPLIER;
  if (serviceLevel === "express" || serviceLevel === "localSameDay") return LOCAL_SAME_DAY_MULTIPLIER;
  return 1;
}

function tariffBase(weightBand: WeightBand, serviceLevel: CourierServiceLevel): number {
  if (weightBand === "manual-quote") throw new Error("Packages over 30kg require a manual quote");
  const economy = CUSTOMER_TARIFF_ZAR.economy[weightBand];
  const express = CUSTOMER_TARIFF_ZAR.express[weightBand];
  if (serviceLevel === "economy") return economy;
  if (serviceLevel === "express" || serviceLevel === "localSameDay") return express;
  return Math.round((economy + express) / 2);
}

export function calculateCustomerPricing(input: CustomerPricingInput): CustomerPricingOutput {
  if (input.distanceKm < 0) throw new Error("Distance must be positive");
  if (input.actualWeightKg < 0) throw new Error("Weight must be positive");
  const serviceLevel = input.serviceLevel ?? "economy";
  if (serviceLevel === "localSameDay" && input.distanceKm > 100) {
    throw new Error("Local Same Day service only available for deliveries within 100km");
  }

  const volumetricWeightKg = calculateVolumetricWeight(input.lengthCm, input.widthCm, input.heightCm);
  const billableWeightKg = Math.max(input.actualWeightKg, volumetricWeightKg);
  const weightBand = getWeightBand(billableWeightKg);
  const volumeBand = getVolumeBand(input.lengthCm, input.widthCm, input.heightCm);
  const routeBand = getRouteBand(input.distanceKm);
  const routeMultiplier = ROUTE_MULTIPLIERS[routeBand];
  const base = tariffBase(weightBand, serviceLevel);
  const multiplier = serviceMultiplier(serviceLevel);
  const routeAdjustedBase = base * routeMultiplier;
  const urgencyPremium = routeAdjustedBase * Math.max(0, multiplier - 1);
  const routeCharge = routeAdjustedBase - base;
  const weightCharge = 0;
  const surcharges = (input.isFragile ? SURCHARGES.fragile : 0)
    + (input.hasInsurance ? SURCHARGES.insurance : 0)
    + (input.isRemoteArea ? SURCHARGES.remote : 0)
    + (input.isOversized || volumeBand === "oversized" ? SURCHARGES.oversized : 0)
    + (input.needsManualHandling ? SURCHARGES.manualHandling : 0);
  const requestedDiscount = Math.min(20, Math.max(0, input.consolidationDiscountPct ?? 0));
  const consolidationDiscount = (routeAdjustedBase + urgencyPremium + surcharges) * requestedDiscount / 100;
  const subtotal = routeAdjustedBase + urgencyPremium + surcharges;
  const finalPrice = Math.max(0, subtotal - consolidationDiscount);

  return {
    serviceLevel,
    routeBand,
    routeMultiplier,
    estimatedLegs: estimateRelayLegs(input.distanceKm),
    actualWeightKg: round(input.actualWeightKg),
    volumetricWeightKg: round(volumetricWeightKg),
    billableWeightKg: round(billableWeightKg),
    weightBand,
    volumeBand,
    tariffBase: round(base),
    urgencyPremium: round(urgencyPremium),
    routeCharge: round(routeCharge),
    weightCharge,
    surcharges: round(surcharges),
    consolidationDiscount: round(consolidationDiscount),
    subtotal: round(subtotal),
    finalPrice: round(finalPrice),
    serviceMultiplier: multiplier,
    breakdown: {
      tariffBase: round(base),
      routeCharge: round(routeCharge),
      weightCharge,
      urgencyPremium: round(urgencyPremium),
      surcharges: round(surcharges),
      consolidationDiscount: round(consolidationDiscount),
    },
  };
}

export function calculateCourierRouteEconomics(input: CourierRouteInput): CourierRouteEconomics {
  if (input.distanceKm < 0) throw new Error("Distance must be positive");
  if (input.parcelCount < 0) throw new Error("Parcel count cannot be negative");
  if (input.averageCustomerRevenueZar < 0) throw new Error("Average customer revenue cannot be negative");

  const parcelCount = Math.floor(input.parcelCount);
  const routeBand = getRouteBand(input.distanceKm);
  const fuelPrice = input.fuelPricePerLitre ?? 26;
  const fuelLitresPer100Km = input.fuelLitresPer100Km ?? 10;
  const driverCompensationPerKm = input.driverCompensationPerKm ?? 2.5;
  const vehicleAllowancePerKm = input.vehicleAllowancePerKm ?? 1;
  const routeOverheadPerKm = input.routeOverheadPerKm ?? 0.5;
  const marginPct = input.minimumRevenueMarginPct ?? 25;
  const offerBufferPct = input.courierOfferBufferPct ?? 0;
  const platformFeePct = input.platformFeePct ?? PLATFORM_FEE_PCT;
  const fuelCostZar = input.distanceKm * fuelLitresPer100Km / 100 * fuelPrice;
  const driverCompensationZar = input.distanceKm * driverCompensationPerKm;
  const vehicleAllowanceZar = input.distanceKm * vehicleAllowancePerKm;
  const routeOverheadZar = input.distanceKm * routeOverheadPerKm;
  const routeOperatingCostZar = fuelCostZar + driverCompensationZar + vehicleAllowanceZar + routeOverheadZar;
  const minimumViableRevenueZar = routeOperatingCostZar * (1 + marginPct / 100);
  const customerRevenueZar = parcelCount * input.averageCustomerRevenueZar;
  const platformFeeZar = customerRevenueZar * platformFeePct / 100;
  // The courier allocation is a contractual share of each parcel charge.
  // Route costs remain visible for dispatch viability, but do not alter the 20% platform fee.
  const courierOfferZar = (customerRevenueZar - platformFeeZar) * (1 + offerBufferPct / 100);
  const requiredParcelCount = input.averageCustomerRevenueZar > 0 ? Math.ceil(minimumViableRevenueZar / input.averageCustomerRevenueZar) : Number.POSITIVE_INFINITY;
  const routeViable = customerRevenueZar >= minimumViableRevenueZar;
  const serviceLevel = input.serviceLevel ?? "economy";
  const dedicatedExpress = serviceLevel === "express" || serviceLevel === "localSameDay";
  const dispatchDecision = dedicatedExpress ? "dedicated-express" : routeViable ? "route-viable" : "consolidating";
  const platformContributionZar = platformFeeZar;

  return {
    routeBand,
    parcelCount,
    averageCustomerRevenueZar: round(input.averageCustomerRevenueZar),
    customerRevenueZar: round(customerRevenueZar),
    fuelCostZar: round(fuelCostZar),
    driverCompensationZar: round(driverCompensationZar),
    vehicleAllowanceZar: round(vehicleAllowanceZar),
    routeOverheadZar: round(routeOverheadZar),
    routeOperatingCostZar: round(routeOperatingCostZar),
    minimumViableRevenueZar: round(minimumViableRevenueZar),
    courierOfferZar: round(courierOfferZar),
    platformFeeZar: round(platformFeeZar),
    platformFeePct,
    platformContributionZar: round(platformContributionZar),
    requiredParcelCount,
    routeViable,
    dispatchDecision,
    reason: routeViable
      ? `Route viable with ${parcelCount} parcel${parcelCount === 1 ? "" : "s"}: customer revenue covers route cost and the minimum margin.`
      : dedicatedExpress
        ? "Express service requests dedicated or next-available capacity; normal consolidation rules are bypassed."
        : `Consolidating: ${parcelCount}/${requiredParcelCount} parcels required before this economy route should dispatch.`,
  };
}

export function formatCourierPrice(amount: number): string {
  return `R${amount.toFixed(2)}`;
}
