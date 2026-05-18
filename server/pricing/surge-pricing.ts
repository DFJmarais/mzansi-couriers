/**
 * Surge Pricing Engine
 * Dynamic pricing based on demand and supply
 */

export interface SurgePricingConfig {
  baseFare: number; // Base fare in cents
  perKmRate: number; // Per km rate in cents
  minFare: number; // Minimum fare in cents
  maxSurgeMultiplier: number; // Max surge multiplier (e.g., 2.5x)
}

export interface SurgeMetrics {
  activeDeliveries: number;
  availableCouriers: number;
  demandLevel: 'low' | 'medium' | 'high' | 'extreme';
  surgeMultiplier: number;
  timestamp: Date;
}

/**
 * Calculate surge multiplier based on demand/supply ratio
 */
export function calculateSurgeMultiplier(
  activeDeliveries: number,
  availableCouriers: number,
  maxMultiplier: number = 2.5
): number {
  if (availableCouriers === 0) {
    return maxMultiplier; // Max surge if no couriers available
  }

  const ratio = activeDeliveries / availableCouriers;

  // Surge tiers:
  // 0-1: 1.0x (no surge)
  // 1-2: 1.2x (low surge)
  // 2-3: 1.5x (medium surge)
  // 3-4: 1.8x (high surge)
  // 4+: 2.5x (extreme surge)

  if (ratio < 1) return 1.0;
  if (ratio < 2) return 1.2;
  if (ratio < 3) return 1.5;
  if (ratio < 4) return 1.8;
  return maxMultiplier;
}

/**
 * Get demand level
 */
export function getDemandLevel(surgeMultiplier: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (surgeMultiplier < 1.1) return 'low';
  if (surgeMultiplier < 1.5) return 'medium';
  if (surgeMultiplier < 2.0) return 'high';
  return 'extreme';
}

/**
 * Calculate delivery price with surge pricing
 */
export function calculateDeliveryPrice(
  basePrice: number,
  surgeMultiplier: number,
  config: SurgePricingConfig
): number {
  const surgedPrice = Math.round(basePrice * surgeMultiplier);
  return Math.max(surgedPrice, config.minFare); // Ensure minimum fare
}

/**
 * Get current surge metrics
 */
export async function getSurgeMetrics(
  activeDeliveries: number,
  availableCouriers: number
): Promise<SurgeMetrics> {
  const surgeMultiplier = calculateSurgeMultiplier(activeDeliveries, availableCouriers);
  const demandLevel = getDemandLevel(surgeMultiplier);

  return {
    activeDeliveries,
    availableCouriers,
    demandLevel,
    surgeMultiplier,
    timestamp: new Date(),
  };
}

/**
 * Get surge pricing analytics
 */
export async function getSurgePricingAnalytics(): Promise<{
  averageSurgeMultiplier: number;
  peakHours: string[];
  totalSurgeRevenue: number;
  surgeEvents: number;
}> {
  return {
    averageSurgeMultiplier: 1.2,
    peakHours: ['08:00-09:00', '12:00-13:00', '17:00-19:00'],
    totalSurgeRevenue: 0,
    surgeEvents: 0,
  };
}

/**
 * Apply surge pricing rules
 */
export function applySurgePricingRules(
  basePrice: number,
  surgeMultiplier: number,
  rules: {
    minSurge?: number;
    maxSurge?: number;
    roundTo?: number; // Round to nearest amount (e.g., 50 cents)
  } = {}
): number {
  let finalPrice = basePrice * surgeMultiplier;

  // Apply min/max bounds
  if (rules.minSurge) {
    finalPrice = Math.max(finalPrice, basePrice * rules.minSurge);
  }
  if (rules.maxSurge) {
    finalPrice = Math.min(finalPrice, basePrice * rules.maxSurge);
  }

  // Round to nearest amount
  if (rules.roundTo) {
    finalPrice = Math.round(finalPrice / rules.roundTo) * rules.roundTo;
  }

  return finalPrice;
}
