import { calculateSharedRelayPool, type RelayPoolLegInput, type SharedRelayPoolOutput } from "./relay-pool-pricing";

export type LaunchDecision = "DISPATCH" | "CONSOLIDATE" | "REPRICE" | "REJECT";
export type DispatchReadinessInput = {
  customerChargeZar: number; parcelCount: number; totalWeightKg: number; totalVolumeM3: number;
  courierPoolAvailableZar?: number; requiredReserveZar?: number; minimumCourierNetZar?: number;
  legs: RelayPoolLegInput[];
};
export type DispatchReadinessResult = { decision: LaunchDecision; reasons: string[]; pool: SharedRelayPoolOutput; minimumParcelDensity: number; minimumCustomerTariff: number; maximumViableCapacity: number; };

export function validateDispatchReadiness(input: DispatchReadinessInput): DispatchReadinessResult {
  if (!input.legs.length) throw new Error("At least one validated relay leg is required before dispatch");
  const pool = calculateSharedRelayPool({ customerChargeZar: input.customerChargeZar, parcelCount: input.parcelCount, totalCourierPoolAvailableZar: input.courierPoolAvailableZar, legs: input.legs });
  const reasons: string[] = [];
  const reserve = Math.max(0, input.requiredReserveZar ?? 0);
  const minNet = input.minimumCourierNetZar ?? 150;
  if (!pool.capacityFeasible || input.parcelCount <= 0 || input.totalWeightKg < 0 || input.totalVolumeM3 < 0) reasons.push("Vehicle capacity, parcel count, weight, or volume is not feasible");
  if (!pool.minimumPayoutsFunded) reasons.push("Courier pool cannot fund minimum payouts");
  if (pool.totalCourierPoolAvailableZar + 0.01 < pool.totalCourierCostFloorZar + reserve) reasons.push("Courier pool does not cover operating cost plus disruption reserve");
  if (pool.couriers.some((courier) => courier.estimatedNetZar < minNet)) reasons.push(`At least one courier is below the R${minNet.toFixed(2)} net acceptance floor`);
  const decision: LaunchDecision = !pool.capacityFeasible ? "CONSOLIDATE" : reasons.some((reason) => reason.includes("tariff") || reason.includes("pool")) ? "REPRICE" : reasons.length ? "REJECT" : "DISPATCH";
  const perParcelPool = Math.max(0.01, input.customerChargeZar * 0.8 / Math.max(1, input.parcelCount));
  const minimumCustomerTariff = Math.ceil(((pool.totalCourierCostFloorZar + reserve) / 0.8 / Math.max(1, input.parcelCount)) * 100) / 100;
  const minimumParcelDensity = Math.ceil((pool.totalCourierCostFloorZar + reserve) / perParcelPool);
  const maximumViableCapacity = Math.min(...input.legs.map((leg) => leg.vehicleCapacityUnits ?? Number.MAX_SAFE_INTEGER));
  return { decision, reasons, pool, minimumParcelDensity, minimumCustomerTariff, maximumViableCapacity };
}

export type Wave = { waveNumber: number; parcelCount: number; courierIds: string[]; totalWeightKg: number; totalVolumeM3: number; departureOffsetMinutes: number; routeCostZar: number; courierPoolZar: number; courierGrossZar: number; courierNetZar: number; platformContributionZar: number; };
export function planParallelWaves(input: { parcelCount: number; parcelWeightKg: number; parcelVolumeM3: number; maxParcelsPerVehicle: number; maxWeightKg: number; maxVolumeM3: number; courierIds: string[]; departureGapMinutes?: number; routeFactory: (waveNumber: number, parcelCount: number) => DispatchReadinessInput; }): { decision: LaunchDecision; waves: Wave[]; reasons: string[] } {
  if (input.parcelCount < 1 || input.maxParcelsPerVehicle < 1 || input.courierIds.length < 1) return { decision: "REJECT", waves: [], reasons: ["No usable parcel or courier capacity"] };
  const waveCapacity = Math.max(1, Math.min(input.maxParcelsPerVehicle, Math.floor(input.maxWeightKg / Math.max(input.parcelWeightKg, 0.01)), Math.floor(input.maxVolumeM3 / Math.max(input.parcelVolumeM3, 0.0001))));
  const waveCount = Math.ceil(input.parcelCount / waveCapacity);
  const waves: Wave[] = []; const reasons: string[] = [];
  for (let i = 0; i < waveCount; i++) {
    const count = Math.min(waveCapacity, input.parcelCount - i * waveCapacity); const check = validateDispatchReadiness(input.routeFactory(i + 1, count));
    if (check.decision !== "DISPATCH") reasons.push(`Wave ${i + 1}: ${check.decision} — ${check.reasons.join("; ") || "capacity or economics"}`);
    waves.push({ waveNumber: i + 1, parcelCount: count, courierIds: input.courierIds.slice(0, Math.max(1, Math.min(input.courierIds.length, check.pool.couriers.length))), totalWeightKg: count * input.parcelWeightKg, totalVolumeM3: count * input.parcelVolumeM3, departureOffsetMinutes: i * (input.departureGapMinutes ?? 45), routeCostZar: check.pool.totalCourierCostFloorZar, courierPoolZar: check.pool.courierPoolZar, courierGrossZar: check.pool.courierPoolZar, courierNetZar: check.pool.couriers.reduce((sum, courier) => sum + courier.estimatedNetZar, 0), platformContributionZar: check.pool.estimatedPlatformNetZar });
  }
  return { decision: reasons.length ? (waves.length > 1 ? "CONSOLIDATE" : "REPRICE") : "DISPATCH", waves, reasons };
}
