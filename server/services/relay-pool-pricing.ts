import { PLATFORM_FEE_PCT } from "./courier-pricing";

export type RelayLegCostProfile = {
  fuelPricePerLitre?: number;
  fuelLitresPer100Km?: number;
  driverCompensationPerKm?: number;
  vehicleAllowancePerKm?: number;
  routeOverheadPerKm?: number;
  handoverFeeZar?: number;
  minimumPayoutZar?: number;
  tollsZar?: number;
  handoverTimeMinutes?: number;
  handoverCostPerMinuteZar?: number;
  availableBackhaul?: boolean;
  backhaulRevenueZar?: number;
  parcelCountOnLeg?: number;
  parcelWeightKg?: number;
  parcelVolumeM3?: number;
  vehicleCapacityUnits?: number;
  vehicleCapacityWeightKg?: number;
  vehicleCapacityVolumeM3?: number;
};

export type RelayPoolLegInput = RelayLegCostProfile & {
  legId: string;
  sequence: number;
  courierId: string;
  origin: string;
  destination: string;
  distanceKm: number;
  deadheadKm?: number;
  returnKm?: number;
  /** Optional weighting for specialist, time-critical, or difficult legs. */
  legValueMultiplier?: number;
};

export type SharedRelayPoolInput = {
  /** Number of parcels sharing this corridor's courier pool and route costs. */
  parcelCount?: number;
  customerChargeZar: number;
  platformFeePct?: number;
  paymentProcessingFeePct?: number;
  paymentProcessingFixedZar?: number;
  platformReserveZar?: number;
  /** Optional hard cap when a corridor has a limited funded pool. */
  totalCourierPoolAvailableZar?: number;
  legs: RelayPoolLegInput[];
};

export type RelayLegAllocation = {
  legId: string;
  sequence: number;
  courierId: string;
  origin: string;
  destination: string;
  distanceKm: number;
  deadheadKm: number;
  returnKm: number;
  totalDrivenKm: number;
  operatingCostZar: number;
  handoverFeeZar: number;
  costFloorZar: number;
  valueScore: number;
  grossAllocationZar: number;
  estimatedNetZar: number;
};

export type RelayCourierAllocation = {
  courierId: string;
  legIds: string[];
  distanceKm: number;
  totalDrivenKm: number;
  operatingCostZar: number;
  handoverFeesZar: number;
  minimumPayoutZar: number;
  grossEarningsZar: number;
  grossEarningsPerParcelZar: number;
  estimatedNetZar: number;
  estimatedNetPerParcelZar: number;
  grossEarningsPerDrivenKmZar: number;
  minimumPayoutMet: boolean;
};

export type SharedRelayPoolOutput = {
  parcelCount: number;
  customerChargeZar: number;
  customerChargePerParcelZar: number;
  platformFeePct: number;
  platformFeeZar: number;
  platformFeePerParcelZar: number;
  courierPoolPct: number;
  courierPoolZar: number;
  courierPoolPerParcelZar: number;
  paymentProcessingFeeZar: number;
  platformReserveZar: number;
  estimatedPlatformNetZar: number;
  routeDistanceKm: number;
  totalDrivenKm: number;
  totalOperatingCostZar: number;
  totalHandoverFeesZar: number;
  totalCourierCostFloorZar: number;
  minimumPayoutRequirementZar: number;
  totalCourierPoolAvailableZar: number;
  totalTollsZar: number;
  totalHandoverTimeMinutes: number;
  totalParcelWeightKg: number;
  totalParcelVolumeM3: number;
  capacityFeasible: boolean;
  poolSurplusAfterCostZar: number;
  routeViable: boolean;
  minimumPayoutsFunded: boolean;
  allocationMethod: "shared-pool-cost-and-value-weighted";
  legs: RelayLegAllocation[];
  couriers: RelayCourierAllocation[];
  warnings: string[];
};

const DEFAULT_FUEL_PRICE = 26;
const DEFAULT_FUEL_LITRES_PER_100_KM = 10;
const DEFAULT_DRIVER_COMPENSATION_PER_KM = 2.5;
const DEFAULT_VEHICLE_ALLOWANCE_PER_KM = 1;
const DEFAULT_ROUTE_OVERHEAD_PER_KM = 0.5;
const DEFAULT_HANDOVER_FEE = 35;
const DEFAULT_MINIMUM_PAYOUT = 100;
const DEFAULT_HANDOVER_COST_PER_MINUTE = 1;
const EPSILON = 0.000001;
type PreparedRelayLeg = ReturnType<typeof legCost> & {
  leg: RelayPoolLegInput;
  minimumPayoutZar: number;
  rawValue: number;
  parcelCountOnLeg: number;
  parcelWeightKg: number;
  parcelVolumeM3: number;
  capacityFeasible: boolean;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function positiveOrDefault(value: number | undefined, fallback: number): number {
  return value === undefined ? fallback : Math.max(0, value);
}

function assertFiniteNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a finite non-negative number`);
}

function legCost(leg: RelayPoolLegInput): {
  deadheadKm: number;
  returnKm: number;
  totalDrivenKm: number;
  operatingCostZar: number;
  handoverFeeZar: number;
  costFloorZar: number;
} {
  assertFiniteNonNegative("Leg distance", leg.distanceKm);
  const deadheadKm = positiveOrDefault(leg.deadheadKm, 0);
  const returnKm = positiveOrDefault(leg.returnKm, 0);
  const totalDrivenKm = leg.distanceKm + deadheadKm + returnKm;
  const fuelPrice = positiveOrDefault(leg.fuelPricePerLitre, DEFAULT_FUEL_PRICE);
  const fuelLitresPer100Km = positiveOrDefault(leg.fuelLitresPer100Km, DEFAULT_FUEL_LITRES_PER_100_KM);
  const driverCompensationPerKm = positiveOrDefault(leg.driverCompensationPerKm, DEFAULT_DRIVER_COMPENSATION_PER_KM);
  const vehicleAllowancePerKm = positiveOrDefault(leg.vehicleAllowancePerKm, DEFAULT_VEHICLE_ALLOWANCE_PER_KM);
  const routeOverheadPerKm = positiveOrDefault(leg.routeOverheadPerKm, DEFAULT_ROUTE_OVERHEAD_PER_KM);
  const handoverFeeZar = positiveOrDefault(leg.handoverFeeZar, leg.sequence > 1 ? DEFAULT_HANDOVER_FEE : 0);
  const tollsZar = positiveOrDefault(leg.tollsZar, 0);
  const handoverTimeMinutes = positiveOrDefault(leg.handoverTimeMinutes, 0);
  const handoverCostPerMinuteZar = positiveOrDefault(leg.handoverCostPerMinuteZar, DEFAULT_HANDOVER_COST_PER_MINUTE);
  const backhaulRevenueZar = leg.availableBackhaul ? positiveOrDefault(leg.backhaulRevenueZar, 0) : 0;
  const operatingCostZar = totalDrivenKm * (
    fuelLitresPer100Km / 100 * fuelPrice
    + driverCompensationPerKm
    + vehicleAllowancePerKm
    + routeOverheadPerKm
  ) + tollsZar + handoverTimeMinutes * handoverCostPerMinuteZar - backhaulRevenueZar;
  return {
    deadheadKm,
    returnKm,
    totalDrivenKm,
    operatingCostZar: round(Math.max(0, operatingCostZar)),
    handoverFeeZar: round(handoverFeeZar),
    costFloorZar: round(Math.max(0, operatingCostZar) + handoverFeeZar),
  };
}

/**
 * Allocates one customer-funded 80% courier pool across all relay couriers.
 *
 * The algorithm first protects each courier's minimum payout when the pool can
 * support it. The remaining pool is allocated by a normalized leg-value score:
 * 55% paid linehaul distance, 35% cost exposure including deadhead/return km,
 * and 10% handover/complexity value. A courier with multiple legs receives the
 * sum of those leg values, and each courier's amount is then split back to legs.
 *
 * This prevents 80% being paid once per leg. The sum of all leg and courier
 * gross allocations is exactly the one shared courier pool, subject to cents.
 */
export function calculateSharedRelayPool(input: SharedRelayPoolInput): SharedRelayPoolOutput {
  assertFiniteNonNegative("Customer charge", input.customerChargeZar);
  if (!input.legs.length) throw new Error("At least one relay leg is required");
  const parcelCount = Math.max(1, Math.floor(input.parcelCount ?? 1));

  const platformFeePct = input.platformFeePct ?? PLATFORM_FEE_PCT;
  if (platformFeePct < 0 || platformFeePct > 100) throw new Error("Platform fee percentage must be between 0 and 100");
  const paymentProcessingFeePct = input.paymentProcessingFeePct ?? 0;
  const paymentProcessingFixedZar = Math.max(0, input.paymentProcessingFixedZar ?? 0);
  const platformReserveZar = Math.max(0, input.platformReserveZar ?? 0);
  const platformFeeZar = round(input.customerChargeZar * platformFeePct / 100);
  const calculatedCourierPoolZar = round(input.customerChargeZar - platformFeeZar);
  const totalCourierPoolAvailableZar = round(Math.max(0, input.totalCourierPoolAvailableZar ?? calculatedCourierPoolZar));
  const courierPoolZar = round(Math.min(calculatedCourierPoolZar, totalCourierPoolAvailableZar));
  const paymentProcessingFeeZar = round(input.customerChargeZar * paymentProcessingFeePct / 100 + paymentProcessingFixedZar);

  const prepared: PreparedRelayLeg[] = input.legs.map((leg) => {
    if (!leg.legId || !leg.courierId) throw new Error("Every relay leg needs a legId and courierId");
    const cost = legCost(leg);
    const parcelCountOnLeg = Math.max(1, Math.floor(leg.parcelCountOnLeg ?? parcelCount));
    const parcelWeightKg = positiveOrDefault(leg.parcelWeightKg, 0);
    const parcelVolumeM3 = positiveOrDefault(leg.parcelVolumeM3, 0);
    const capacityFeasible = (leg.vehicleCapacityUnits === undefined || parcelCountOnLeg <= leg.vehicleCapacityUnits)
      && (leg.vehicleCapacityWeightKg === undefined || parcelWeightKg <= leg.vehicleCapacityWeightKg)
      && (leg.vehicleCapacityVolumeM3 === undefined || parcelVolumeM3 <= leg.vehicleCapacityVolumeM3);
    const legValueMultiplier = positiveOrDefault(leg.legValueMultiplier, 1);
    const paidDistanceValue = leg.distanceKm * 0.55;
    const costExposureValue = cost.costFloorZar * 0.35;
    const complexityValue = cost.handoverFeeZar * 0.1;
    return {
      leg,
      ...cost,
      minimumPayoutZar: positiveOrDefault(leg.minimumPayoutZar, DEFAULT_MINIMUM_PAYOUT),
      parcelCountOnLeg,
      parcelWeightKg,
      parcelVolumeM3,
      capacityFeasible,
      rawValue: (paidDistanceValue + costExposureValue + complexityValue) * legValueMultiplier,
    };
  });

  const routeDistanceKm = prepared.reduce((sum, item) => sum + item.leg.distanceKm, 0);
  const totalDrivenKm = prepared.reduce((sum, item) => sum + item.totalDrivenKm, 0);
  const totalOperatingCostZar = round(prepared.reduce((sum, item) => sum + item.operatingCostZar, 0));
  const totalHandoverFeesZar = round(prepared.reduce((sum, item) => sum + item.handoverFeeZar, 0));
  const totalCourierCostFloorZar = round(prepared.reduce((sum, item) => sum + item.costFloorZar, 0));
  const totalTollsZar = round(prepared.reduce((sum, item) => sum + positiveOrDefault(item.leg.tollsZar, 0), 0));
  const totalHandoverTimeMinutes = round(prepared.reduce((sum, item) => sum + positiveOrDefault(item.leg.handoverTimeMinutes, 0), 0));
  const totalParcelWeightKg = round(prepared.reduce((sum, item) => sum + item.parcelWeightKg, 0));
  const totalParcelVolumeM3 = round(prepared.reduce((sum, item) => sum + item.parcelVolumeM3, 0));
  const capacityFeasible = prepared.every((item) => item.capacityFeasible);

  const courierGroups = new Map<string, typeof prepared>();
  for (const item of prepared) {
    const current = courierGroups.get(item.leg.courierId) ?? [];
    current.push(item);
    courierGroups.set(item.leg.courierId, current);
  }
  const minimumPayoutRequirementZar = round(Array.from(courierGroups.values()).reduce((sum, group) => sum + Math.max(...group.map((item) => item.minimumPayoutZar)), 0));
  const minimumPayoutsFunded = courierPoolZar + EPSILON >= minimumPayoutRequirementZar;
  const totalRawValue = prepared.reduce((sum, item) => sum + item.rawValue, 0);
  const courierRawValues = new Map<string, number>();
  courierGroups.forEach((group, courierId) => {
    courierRawValues.set(courierId, group.reduce((sum, item) => sum + item.rawValue, 0));
  });

  // If the pool cannot fund all minimums, pro-rate the minimums rather than
  // silently overpaying. This marks the route non-viable for operations review.
  const minimumFactor = minimumPayoutsFunded ? 1 : (minimumPayoutRequirementZar > 0 ? courierPoolZar / minimumPayoutRequirementZar : 0);
  const remainingPool = minimumPayoutsFunded ? round(courierPoolZar - minimumPayoutRequirementZar) : 0;
  const courierGross = new Map<string, number>();
  courierGroups.forEach((group, courierId) => {
    const minimum = Math.max(...group.map((item) => item.minimumPayoutZar));
    const valueShare = totalRawValue > 0 ? (courierRawValues.get(courierId) ?? 0) / totalRawValue : 1 / courierGroups.size;
    courierGross.set(courierId, round(minimum * minimumFactor + remainingPool * valueShare));
  });

  // Correct any rounding drift on the final courier so the pool is conserved.
  const grossBeforeCorrection = Array.from(courierGross.values()).reduce((sum, value) => sum + value, 0);
  const correctionCourier = Array.from(courierGross.keys()).at(-1)!;
  courierGross.set(correctionCourier, round((courierGross.get(correctionCourier) ?? 0) + courierPoolZar - grossBeforeCorrection));

  const legs: RelayLegAllocation[] = prepared.map((item) => {
    const group = courierGroups.get(item.leg.courierId)!;
    const groupValue = group.reduce((sum, groupItem) => sum + groupItem.rawValue, 0);
    const grossForCourier = courierGross.get(item.leg.courierId) ?? 0;
    const grossAllocationZar = round(grossForCourier * (groupValue > 0 ? item.rawValue / groupValue : 1 / group.length));
    return {
      legId: item.leg.legId,
      sequence: item.leg.sequence,
      courierId: item.leg.courierId,
      origin: item.leg.origin,
      destination: item.leg.destination,
      distanceKm: round(item.leg.distanceKm),
      deadheadKm: round(item.deadheadKm),
      returnKm: round(item.returnKm),
      totalDrivenKm: round(item.totalDrivenKm),
      operatingCostZar: item.operatingCostZar,
      handoverFeeZar: item.handoverFeeZar,
      costFloorZar: item.costFloorZar,
      valueScore: round(totalRawValue > 0 ? item.rawValue / totalRawValue : 1 / prepared.length),
      grossAllocationZar,
      estimatedNetZar: round(grossAllocationZar - item.costFloorZar),
    };
  });

  // Preserve the courier-level amount after leg rounding by applying any small
  // correction to the courier's last leg.
  courierGroups.forEach((_group, courierId) => {
    const courierLegs = legs.filter((leg) => leg.courierId === courierId);
    const drift = round((courierGross.get(courierId) ?? 0) - courierLegs.reduce((sum, leg) => sum + leg.grossAllocationZar, 0));
    if (courierLegs.length) {
      const last = courierLegs.at(-1)!;
      last.grossAllocationZar = round(last.grossAllocationZar + drift);
      last.estimatedNetZar = round(last.grossAllocationZar - last.costFloorZar);
    }
  });

  const couriers: RelayCourierAllocation[] = Array.from(courierGroups.entries()).map(([courierId, group]) => {
    const courierLegs = legs.filter((leg) => leg.courierId === courierId);
    const grossEarningsZar = round(courierLegs.reduce((sum, leg) => sum + leg.grossAllocationZar, 0));
    const operatingCostZar = round(courierLegs.reduce((sum, leg) => sum + leg.operatingCostZar, 0));
    const handoverFeesZar = round(courierLegs.reduce((sum, leg) => sum + leg.handoverFeeZar, 0));
    const totalDrivenKmForCourier = round(courierLegs.reduce((sum, leg) => sum + leg.totalDrivenKm, 0));
    const minimumPayoutZar = round(Math.max(...group.map((item) => item.minimumPayoutZar)) * minimumFactor);
    return {
      courierId,
      legIds: courierLegs.map((leg) => leg.legId),
      distanceKm: round(courierLegs.reduce((sum, leg) => sum + leg.distanceKm, 0)),
      totalDrivenKm: totalDrivenKmForCourier,
      operatingCostZar,
      handoverFeesZar,
      minimumPayoutZar,
      grossEarningsZar,
      grossEarningsPerParcelZar: round(grossEarningsZar / parcelCount),
      estimatedNetZar: round(grossEarningsZar - operatingCostZar - handoverFeesZar),
      estimatedNetPerParcelZar: round((grossEarningsZar - operatingCostZar - handoverFeesZar) / parcelCount),
      grossEarningsPerDrivenKmZar: totalDrivenKmForCourier > 0 ? round(grossEarningsZar / totalDrivenKmForCourier) : 0,
      minimumPayoutMet: grossEarningsZar + EPSILON >= minimumPayoutZar,
    };
  });

  const poolSurplusAfterCostZar = round(courierPoolZar - totalCourierCostFloorZar);
  const estimatedPlatformNetZar = round(platformFeeZar - paymentProcessingFeeZar - platformReserveZar);
  const warnings: string[] = [];
  if (!minimumPayoutsFunded) warnings.push("The shared courier pool cannot fund all minimum courier payouts; route requires repricing, more parcels, or an operating subsidy.");
  if (!capacityFeasible) warnings.push("One or more relay legs exceed the vehicle's verified parcel, weight, or volume capacity.");
  if (totalCourierPoolAvailableZar < calculatedCourierPoolZar) warnings.push("The available courier pool was lower than the contractual 80% pool and the route was capped at the available amount.");
  if (poolSurplusAfterCostZar < 0) warnings.push(`Courier pool is R${Math.abs(poolSurplusAfterCostZar).toFixed(2)} below the combined operating-cost floor after deadhead, return, and handover costs.`);
  if (estimatedPlatformNetZar <= 0) warnings.push("Platform fee is not positive after configured payment-processing costs and reserve.");

  return {
    parcelCount,
    customerChargeZar: round(input.customerChargeZar),
    customerChargePerParcelZar: round(input.customerChargeZar / parcelCount),
    platformFeePct,
    platformFeeZar,
    platformFeePerParcelZar: round(platformFeeZar / parcelCount),
    courierPoolPct: round(100 - platformFeePct),
    courierPoolZar,
    courierPoolPerParcelZar: round(courierPoolZar / parcelCount),
    paymentProcessingFeeZar,
    platformReserveZar: round(platformReserveZar),
    estimatedPlatformNetZar,
    routeDistanceKm: round(routeDistanceKm),
    totalDrivenKm: round(totalDrivenKm),
    totalOperatingCostZar,
    totalHandoverFeesZar,
    totalCourierCostFloorZar,
    minimumPayoutRequirementZar,
    poolSurplusAfterCostZar,
    totalCourierPoolAvailableZar,
    totalTollsZar,
    totalHandoverTimeMinutes,
    totalParcelWeightKg,
    totalParcelVolumeM3,
    capacityFeasible,
    routeViable: minimumPayoutsFunded && capacityFeasible && poolSurplusAfterCostZar >= 0,
    minimumPayoutsFunded,
    allocationMethod: "shared-pool-cost-and-value-weighted",
    legs,
    couriers,
    warnings,
  };
}
