import {
  calculateCustomerPricing,
  formatCourierPrice,
  type CustomerPricingInput,
  type CourierServiceLevel,
} from "./courier-pricing";

export type RelayPricingInput = CustomerPricingInput;

export function calculateRelayPrice(input: RelayPricingInput) {
  const pricing = calculateCustomerPricing(input);
  return {
    ...pricing,
    // Compatibility aliases retained for existing booking and admin consumers.
    pickupFee: pricing.tariffBase,
    legsCost: pricing.routeCharge,
    weightCost: pricing.weightCharge,
    finalPriceFormatted: formatPrice(pricing.finalPrice),
    legsCostFormatted: formatPrice(pricing.routeCharge),
    weightCostFormatted: formatPrice(pricing.weightCharge),
    surchargesFormatted: formatPrice(pricing.surcharges),
    subtotalFormatted: formatPrice(pricing.subtotal),
  };
}

export function formatPrice(price: number): string {
  return formatCourierPrice(price);
}

export function getPricingConfig() {
  return {
    model: "weight-volume-route-urgency-consolidation",
    serviceLevels: ["economy", "priority", "express"] as CourierServiceLevel[],
    chargeableMass: "max(actualWeightKg, volumetricWeightKg)",
  };
}
