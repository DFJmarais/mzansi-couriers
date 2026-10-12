import { defaultCapacityUnits, defaultWeightCapacityKg, haversineKm, parcelUnits, type DispatchCourier, type DispatchParcel, type ParcelSize, type VehicleType } from "./assignment-engine";
import { calculateCourierRouteEconomics } from "../services/courier-pricing";

export type DeadlineRisk = "low" | "medium" | "high" | "critical";
export type SmartRouteNode = {
  parcelId: number;
  kind: "pickup" | "dropoff";
  lat: number;
  lng: number;
  area: string;
};

export type SmartParcel = DispatchParcel & {
  estimatedPriceZar?: number;
  deadlineAt?: number | null;
  pickupServiceMinutes?: number;
  deliveryServiceMinutes?: number;
};

export type SmartCourier = DispatchCourier & {
  reliabilityScore?: number;
  onTimeRate?: number;
  cancellationRate?: number;
  customerRating?: number;
  fuelLitresPer100Km?: number;
  fuelPricePerLitre?: number;
  preferredAreas?: string[];
  maxDetourPct?: number;
  maxAdditionalTimeMinutes?: number;
  minimumAdditionalPayout?: number;
  maxStackSize?: number;
};

export type SmartStackConfig = {
  matchWeights: {
    geography: number;
    routeCompatibility: number;
    deadlineReliability: number;
    vehicleCompatibility: number;
    courierReliability: number;
    courierEfficiency: number;
    earningsOpportunity: number;
  };
  stackWeights: {
    courierProfitPerHour: number;
    routeEfficiency: number;
    deadlineReliability: number;
    deliveryCount: number;
    vehicleUtilization: number;
    courierPreference: number;
  };
  maxDetourPct: number;
  maxDetourKm: number;
  maxAdditionalTimeMinutes: number;
  maxStackSize: number;
  safetyBufferMinutes: number;
  averageSpeedKph: number;
  defaultFuelPricePerLitre: number;
  defaultFuelLitresPer100Km: number;
  platformFeePct: number;
  minimumRevenueMarginPct: number;
  courierOfferBufferPct: number;
};

export const defaultSmartStackConfig: SmartStackConfig = {
  matchWeights: {
    geography: 20,
    routeCompatibility: 20,
    deadlineReliability: 15,
    vehicleCompatibility: 10,
    courierReliability: 15,
    courierEfficiency: 5,
    earningsOpportunity: 10,
  },
  stackWeights: {
    courierProfitPerHour: 25,
    routeEfficiency: 20,
    deadlineReliability: 20,
    deliveryCount: 15,
    vehicleUtilization: 10,
    courierPreference: 10,
  },
  maxDetourPct: 20,
  maxDetourKm: 25,
  maxAdditionalTimeMinutes: 30,
  maxStackSize: 10,
  safetyBufferMinutes: 15,
  averageSpeedKph: 45,
  defaultFuelPricePerLitre: 26,
  defaultFuelLitresPer100Km: 10,
  platformFeePct: 20,
  minimumRevenueMarginPct: 25,
  courierOfferBufferPct: 0,
};

export type MatchEvaluation = {
  eligible: boolean;
  score: number;
  geographyScore: number;
  routeCompatibilityScore: number;
  deadlineRisk: DeadlineRisk;
  deadlineScore: number;
  vehicleScore: number;
  reliabilityScore: number;
  efficiencyScore: number;
  earningsScore: number;
  distanceToPickupKm: number | null;
  reason: string;
};

export type StackMetrics = {
  stackScore: number;
  totalDistanceKm: number;
  totalTimeMinutes: number;
  grossEarnings: number;
  platformFee: number;
  customerRevenueZar: number;
  routeOperatingCostZar: number;
  minimumViableRevenueZar: number;
  courierOfferZar: number;
  requiredParcelCount: number;
  routeViable: boolean;
  dispatchDecision: "consolidating" | "route-viable" | "dedicated-express";
  estimatedFuel: number;
  estimatedCourierNet: number;
  capacityUsedUnits: number;
  capacityUnits: number;
  deadlineRisk: DeadlineRisk;
  emptyKilometres: number;
  routeDeviationPct: number;
  route: SmartRouteNode[];
  reason: string;
};

export type StackEvaluation = {
  feasible: boolean;
  metrics: StackMetrics;
  addedDistanceKm: number;
  addedTimeMinutes: number;
  reason: string;
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));
const normalise = (value: string) => value.trim().toLowerCase();

function serviceMinutes(parcel: SmartParcel) {
  return (parcel.pickupServiceMinutes ?? 5) + (parcel.deliveryServiceMinutes ?? 5);
}

function routeDistance(route: SmartRouteNode[], start: { lat: number; lng: number } | null) {
  let total = 0;
  let current = start;
  for (const node of route) {
    if (current) total += haversineKm(current, node);
    current = { lat: node.lat, lng: node.lng };
  }
  return total;
}

function routeForStack(stack: SmartParcel[], start: { lat: number; lng: number } | null) {
  const remaining = stack.map((parcel) => ({ parcel, pickedUp: false }));
  const route: SmartRouteNode[] = [];
  let current = start;
  while (remaining.some((item) => !item.pickedUp)) {
    const candidates = remaining.filter((item) => !item.pickedUp).sort((a, b) => {
      const aDistance = current ? haversineKm(current, a.parcel.pickup) : 0;
      const bDistance = current ? haversineKm(current, b.parcel.pickup) : 0;
      return aDistance - bDistance || b.parcel.priority - a.parcel.priority;
    });
    const next = candidates[0];
    if (!next) break;
    route.push({ parcelId: next.parcel.id, kind: "pickup", ...next.parcel.pickup });
    route.push({ parcelId: next.parcel.id, kind: "dropoff", ...next.parcel.dropoff });
    next.pickedUp = true;
    current = next.parcel.dropoff;
  }
  return route;
}

function isDeadlineRisk(parcel: SmartParcel, arrivalMinutes: number, config: SmartStackConfig): DeadlineRisk {
  if (!parcel.deadlineAt) return "low";
  const availableMinutes = (parcel.deadlineAt - Date.now()) / 60_000;
  const margin = availableMinutes - arrivalMinutes;
  if (margin < 0) return "critical";
  if (margin <= config.safetyBufferMinutes) return "high";
  if (margin <= config.safetyBufferMinutes * 2) return "medium";
  return "low";
}

function worstRisk(risks: DeadlineRisk[]): DeadlineRisk {
  const rank: Record<DeadlineRisk, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  return risks.reduce<DeadlineRisk>((worst, risk) => rank[risk] > rank[worst] ? risk : worst, "low");
}

function riskScore(risk: DeadlineRisk) {
  return { low: 100, medium: 70, high: 35, critical: 0 }[risk];
}

function directionScore(courier: SmartCourier, parcel: SmartParcel) {
  if (!courier.currentLocation) return 60;
  const approach = { lat: parcel.pickup.lat - courier.currentLocation.lat, lng: parcel.pickup.lng - courier.currentLocation.lng };
  const onward = { lat: parcel.dropoff.lat - parcel.pickup.lat, lng: parcel.dropoff.lng - parcel.pickup.lng };
  const approachLength = Math.hypot(approach.lat, approach.lng);
  const onwardLength = Math.hypot(onward.lat, onward.lng);
  if (!approachLength || !onwardLength) return 60;
  const dot = (approach.lat * onward.lat + approach.lng * onward.lng) / (approachLength * onwardLength);
  return clamp(50 + dot * 50);
}

function capacityFor(courier: SmartCourier) {
  return courier.capacityUnits || defaultCapacityUnits[courier.vehicleType];
}

function weightFor(courier: SmartCourier) {
  return courier.maxWeightKg || defaultWeightCapacityKg[courier.vehicleType];
}

function preferredAreaScore(courier: SmartCourier, parcel: SmartParcel) {
  const areas = [...(courier.preferredAreas ?? []), ...courier.workingAreas].map(normalise);
  if (!areas.length) return 60;
  return areas.some((area) => area === normalise(parcel.pickup.area) || area === normalise(parcel.dropoff.area)) ? 100 : 20;
}

export function evaluateMatch(parcel: SmartParcel, courier: SmartCourier, usedUnits = 0, usedWeightKg = 0, config = defaultSmartStackConfig): MatchEvaluation {
  const requiredUnits = parcelUnits[parcel.packageSize];
  const capacityUnits = capacityFor(courier);
  const weightLimit = weightFor(courier);
  const distance = courier.currentLocation ? haversineKm(courier.currentLocation, parcel.pickup) : null;
  const areaMatch = courier.workingAreas.length === 0 || courier.workingAreas.some((area) => normalise(area) === normalise(parcel.pickup.area) || normalise(area) === normalise(parcel.dropoff.area));
  const weightOkay = usedWeightKg + parcel.packageWeightKg <= weightLimit;
  const capacityOkay = usedUnits + requiredUnits <= capacityUnits;
  const radiusOkay = distance === null || distance <= 120;
  const available = courier.isAvailable;
  const arrivalMinutes = distance === null ? 20 : (distance / config.averageSpeedKph) * 60;
  const deadlineRisk = isDeadlineRisk(parcel, arrivalMinutes + serviceMinutes(parcel), config);
  const eligible = available && areaMatch && weightOkay && capacityOkay && radiusOkay && deadlineRisk !== "critical";
  const geographyScore = distance === null ? 60 : clamp(100 - distance / 1.5);
  const routeCompatibilityScore = clamp((directionScore(courier, parcel) + (areaMatch ? 100 : 20)) / 2);
  const vehicleScore = clamp(capacityOkay && weightOkay ? 100 - ((usedUnits + requiredUnits) / capacityUnits) * 25 : 0);
  const reliabilityScore = clamp(courier.reliabilityScore ?? ((courier.onTimeRate ?? 0.85) * 70 + (courier.customerRating ?? 4) * 6 - (courier.cancellationRate ?? 0.05) * 100));
  const efficiencyScore = clamp(50 + (courier.currentLocation ? Math.max(0, 30 - (distance ?? 30) / 5) : 0));
  const earningsScore = clamp(((parcel.estimatedPriceZar ?? 0) / Math.max(1, distance ?? 20)) * 10 + preferredAreaScore(courier, parcel) * 0.25);
  const weighted = geographyScore * config.matchWeights.geography / 100 + routeCompatibilityScore * config.matchWeights.routeCompatibility / 100 + riskScore(deadlineRisk) * config.matchWeights.deadlineReliability / 100 + vehicleScore * config.matchWeights.vehicleCompatibility / 100 + reliabilityScore * config.matchWeights.courierReliability / 100 + efficiencyScore * config.matchWeights.courierEfficiency / 100 + earningsScore * config.matchWeights.earningsOpportunity / 100;
  const reasons = [
    !available ? "courier is offline" : null,
    !areaMatch ? "outside the configured working area" : null,
    !capacityOkay ? "vehicle capacity would be exceeded" : null,
    !weightOkay ? "vehicle weight limit would be exceeded" : null,
    !radiusOkay ? "pickup is outside the operating radius" : null,
    deadlineRisk === "critical" ? "deadline cannot be protected" : null,
  ].filter(Boolean) as string[];
  return { eligible, score: round(clamp(weighted)), geographyScore: round(geographyScore), routeCompatibilityScore: round(routeCompatibilityScore), deadlineRisk, deadlineScore: riskScore(deadlineRisk), vehicleScore: round(vehicleScore), reliabilityScore: round(reliabilityScore), efficiencyScore: round(efficiencyScore), earningsScore: round(earningsScore), distanceToPickupKm: distance === null ? null : round(distance), reason: eligible ? `Eligible: ${Math.round(weighted)}% SmartMatch score with ${deadlineRisk} deadline risk.` : `Not eligible because ${reasons.join(", ") || "the current constraints are not satisfied"}.` };
}

function insertCandidateRoute(baseRoute: SmartRouteNode[], parcel: SmartParcel, start: { lat: number; lng: number } | null) {
  const candidates: SmartRouteNode[][] = [];
  const pickup = { parcelId: parcel.id, kind: "pickup" as const, ...parcel.pickup };
  const dropoff = { parcelId: parcel.id, kind: "dropoff" as const, ...parcel.dropoff };
  for (let pickupIndex = 0; pickupIndex <= baseRoute.length; pickupIndex += 1) {
    const withPickup = [...baseRoute.slice(0, pickupIndex), pickup, ...baseRoute.slice(pickupIndex)];
    for (let dropoffIndex = pickupIndex + 1; dropoffIndex <= withPickup.length; dropoffIndex += 1) {
      const route = [...withPickup.slice(0, dropoffIndex), dropoff, ...withPickup.slice(dropoffIndex)];
      candidates.push(route);
    }
  }
  return candidates.sort((a, b) => routeDistance(a, start) - routeDistance(b, start))[0] ?? [...baseRoute, pickup, dropoff];
}

function metricsForStack(stack: SmartParcel[], courier: SmartCourier, config: SmartStackConfig, forcedRoute?: SmartRouteNode[]): StackMetrics {
  const route = forcedRoute ?? routeForStack(stack, courier.currentLocation);
  const totalDistanceKm = routeDistance(route, courier.currentLocation);
  const totalTimeMinutes = Math.round((totalDistanceKm / config.averageSpeedKph) * 60 + stack.reduce((sum, parcel) => sum + serviceMinutes(parcel), 0));
  const grossEarnings = stack.reduce((sum, parcel) => sum + (parcel.estimatedPriceZar ?? 0), 0);
  const averageCustomerRevenueZar = stack.length > 0 ? grossEarnings / stack.length : 0;
  const routeEconomics = calculateCourierRouteEconomics({
    distanceKm: totalDistanceKm,
    parcelCount: stack.length,
    averageCustomerRevenueZar,
    fuelPricePerLitre: courier.fuelPricePerLitre ?? config.defaultFuelPricePerLitre,
    fuelLitresPer100Km: courier.fuelLitresPer100Km ?? config.defaultFuelLitresPer100Km,
    minimumRevenueMarginPct: config.minimumRevenueMarginPct,
    courierOfferBufferPct: config.courierOfferBufferPct,
  });
  const platformFee = routeEconomics.platformContributionZar;
  const fuelPrice = courier.fuelPricePerLitre ?? config.defaultFuelPricePerLitre;
  const fuelLitres = totalDistanceKm * (courier.fuelLitresPer100Km ?? config.defaultFuelLitresPer100Km) / 100;
  const estimatedFuel = fuelLitres * fuelPrice;
  const estimatedCourierNet = routeEconomics.courierOfferZar - estimatedFuel;
  const capacityUsedUnits = stack.reduce((sum, parcel) => sum + parcelUnits[parcel.packageSize], 0);
  const capacityUnits = capacityFor(courier);
  const arrivalByParcel = new Map<number, number>();
  let elapsed = 0;
  for (const node of route) {
    elapsed += (node === route[0] ? (courier.currentLocation ? haversineKm(courier.currentLocation, node) : 0) : haversineKm(route[route.indexOf(node) - 1]!, node)) / config.averageSpeedKph * 60;
    if (node.kind === "dropoff") arrivalByParcel.set(node.parcelId, elapsed);
  }
  const deadlineRisks = stack.map((parcel) => isDeadlineRisk(parcel, arrivalByParcel.get(parcel.id) ?? totalTimeMinutes, config));
  const deadlineRisk = worstRisk(deadlineRisks);
  const baseDistance = stack.length ? routeDistance(routeForStack([stack[0]], courier.currentLocation), courier.currentLocation) : 0;
  const routeDeviationPct = baseDistance > 0 ? Math.max(0, (totalDistanceKm - baseDistance) / baseDistance * 100) : 0;
  const routeEfficiency = totalDistanceKm > 0 ? clamp(stack.length / totalDistanceKm * 1000) : 0;
  const netPerHour = totalTimeMinutes > 0 ? estimatedCourierNet / (totalTimeMinutes / 60) : 0;
  const stackScore = clamp(netPerHour * 0.25 + routeEfficiency * 0.2 + riskScore(deadlineRisk) * 0.2 + clamp(stack.length / Math.max(1, config.maxStackSize) * 100) * 0.15 + clamp(capacityUsedUnits / Math.max(1, capacityUnits) * 100) * 0.1 + preferredAreaScore(courier, stack[0] ?? { pickup: { area: "", lat: 0, lng: 0 }, dropoff: { area: "", lat: 0, lng: 0 } } as SmartParcel) * 0.1);
  return {
    stackScore: round(stackScore),
    totalDistanceKm: round(totalDistanceKm),
    totalTimeMinutes,
    grossEarnings: round(grossEarnings),
    platformFee: round(platformFee),
    customerRevenueZar: routeEconomics.customerRevenueZar,
    routeOperatingCostZar: routeEconomics.routeOperatingCostZar,
    minimumViableRevenueZar: routeEconomics.minimumViableRevenueZar,
    courierOfferZar: routeEconomics.courierOfferZar,
    requiredParcelCount: routeEconomics.requiredParcelCount,
    routeViable: routeEconomics.routeViable,
    dispatchDecision: routeEconomics.dispatchDecision,
    estimatedFuel: round(estimatedFuel),
    estimatedCourierNet: round(estimatedCourierNet),
    capacityUsedUnits,
    capacityUnits,
    deadlineRisk,
    emptyKilometres: courier.currentLocation ? 0 : totalDistanceKm,
    routeDeviationPct: round(routeDeviationPct),
    route,
    reason: `${routeEconomics.reason} Courier offer: R${routeEconomics.courierOfferZar.toFixed(2)}; customer prices remain separate from this route offer.`,
  };
}

export function evaluateStackAddition(stack: SmartParcel[], candidate: SmartParcel, courier: SmartCourier, config = defaultSmartStackConfig): StackEvaluation {
  const baseline = metricsForStack(stack, courier, config);
  const match = evaluateMatch(candidate, courier, baseline.capacityUsedUnits, stack.reduce((sum, parcel) => sum + parcel.packageWeightKg, 0), config);
  const candidateRoute = insertCandidateRoute(baseline.route, candidate, courier.currentLocation);
  const candidateMetrics = metricsForStack([...stack, candidate], courier, config, candidateRoute);
  const addedDistanceKm = Math.max(0, candidateMetrics.totalDistanceKm - baseline.totalDistanceKm);
  const addedTimeMinutes = Math.max(0, candidateMetrics.totalTimeMinutes - baseline.totalTimeMinutes);
  const detourPct = baseline.totalDistanceKm > 0 ? addedDistanceKm / baseline.totalDistanceKm * 100 : 0;
  const feasible = match.eligible && stack.length < Math.min(config.maxStackSize, courier.maxStackSize ?? config.maxStackSize) && detourPct <= Math.min(config.maxDetourPct, courier.maxDetourPct ?? config.maxDetourPct) && addedDistanceKm <= config.maxDetourKm && addedTimeMinutes <= Math.min(config.maxAdditionalTimeMinutes, courier.maxAdditionalTimeMinutes ?? config.maxAdditionalTimeMinutes) && candidateMetrics.deadlineRisk !== "critical";
  return { feasible, metrics: candidateMetrics, addedDistanceKm: round(addedDistanceKm), addedTimeMinutes, reason: feasible ? `Fits the current route with +${round(addedDistanceKm)} km and +${addedTimeMinutes} minutes.` : `Not added because ${candidateMetrics.deadlineRisk === "critical" ? "deadline risk is critical" : detourPct > config.maxDetourPct || addedDistanceKm > config.maxDetourKm ? "the detour is too large" : addedTimeMinutes > config.maxAdditionalTimeMinutes ? "the extra time is too high" : match.reason}.` };
}

export function buildSmartStack(parcels: SmartParcel[], courier: SmartCourier, config = defaultSmartStackConfig) {
  const eligible = parcels.map((parcel) => ({ parcel, match: evaluateMatch(parcel, courier) })).filter(({ match }) => match.eligible).sort((a, b) => b.match.score - a.match.score);
  const stack: SmartParcel[] = [];
  const additions: Array<{ parcel: SmartParcel; evaluation: StackEvaluation }> = [];
  for (const { parcel } of eligible) {
    if (!stack.length) {
      stack.push(parcel);
      continue;
    }
    const evaluation = evaluateStackAddition(stack, parcel, courier, config);
    if (evaluation.feasible) {
      stack.push(parcel);
      additions.push({ parcel, evaluation });
    }
  }
  const metrics = metricsForStack(stack, courier, config);
  return { stack, metrics, additions, considered: parcels.length, rejected: parcels.filter((parcel) => !stack.some((selected) => selected.id === parcel.id)) };
}

export function evaluateAddOn(stack: SmartParcel[], candidate: SmartParcel, courier: SmartCourier, config = defaultSmartStackConfig) {
  const evaluation = evaluateStackAddition(stack, candidate, courier, config);
  const minimumPayout = courier.minimumAdditionalPayout ?? 0;
  const payout = candidate.estimatedPriceZar ?? 0;
  return { ...evaluation, acceptedByRules: evaluation.feasible && payout >= minimumPayout && evaluation.metrics.deadlineRisk !== "critical", additionalPayout: round(payout), reason: evaluation.feasible && payout >= minimumPayout ? evaluation.reason : payout < minimumPayout ? `The add-on payout is below your R${minimumPayout.toFixed(2)} minimum.` : evaluation.reason };
}

export type SmartAllocation = {
  assignments: Array<{ parcelId: number; courierId: number; sequence: number; score: number; distanceToPickupKm: number | null; areaMatch: string; reasoning: string }>;
  unassigned: Array<{ parcelId: number; trackingCode: string; reason: string }>;
  stacks: Array<{ courierId: number; parcelIds: number[]; metrics: StackMetrics }>;
};

export function allocateSmartParcels(parcels: SmartParcel[], couriers: SmartCourier[], config = defaultSmartStackConfig): SmartAllocation {
  const usage = new Map<number, { units: number; weightKg: number }>();
  const assignments: SmartAllocation["assignments"] = [];
  const unassigned: SmartAllocation["unassigned"] = [];
  const ordered = [...parcels].sort((a, b) => b.priority - a.priority || a.id - b.id);
  for (const parcel of ordered) {
    const eligible = couriers.map((courier) => {
      const current = usage.get(courier.id) ?? { units: 0, weightKg: 0 };
      const match = evaluateMatch(parcel, courier, current.units, current.weightKg, config);
      return { courier, current, match };
    }).filter((entry) => entry.match.eligible).sort((a, b) => b.match.score - a.match.score);
    const best = eligible[0];
    if (!best) {
      unassigned.push({ parcelId: parcel.id, trackingCode: parcel.trackingCode, reason: "No eligible SmartMatch satisfies availability, geography, capacity, weight, and deadline rules." });
      continue;
    }
    const used = { units: best.current.units + parcelUnits[parcel.packageSize], weightKg: best.current.weightKg + parcel.packageWeightKg };
    usage.set(best.courier.id, used);
    const previous = assignments.filter((assignment) => assignment.courierId === best.courier.id).length;
    assignments.push({ parcelId: parcel.id, courierId: best.courier.id, sequence: previous + 1, score: best.match.score, distanceToPickupKm: best.match.distanceToPickupKm, areaMatch: parcel.pickup.area, reasoning: best.match.reason });
  }
  const stacks = couriers.map((courier) => {
    const courierParcels = assignments.filter((assignment) => assignment.courierId === courier.id).map((assignment) => parcels.find((parcel) => parcel.id === assignment.parcelId)).filter((parcel): parcel is SmartParcel => Boolean(parcel));
    const built = buildSmartStack(courierParcels, courier, config);
    return { courierId: courier.id, parcelIds: built.stack.map((parcel) => parcel.id), metrics: built.metrics };
  }).filter((stack) => stack.parcelIds.length > 0);
  return { assignments, unassigned, stacks };
}

export const smartStackVehicleDefaults: Record<VehicleType, { capacityUnits: number; maxWeightKg: number }> = Object.fromEntries(Object.entries(defaultCapacityUnits).map(([vehicleType, capacityUnits]) => { const type = vehicleType as VehicleType; return [type, { capacityUnits, maxWeightKg: defaultWeightCapacityKg[type] }]; })) as Record<VehicleType, { capacityUnits: number; maxWeightKg: number }>;

export const smartStackParcelSizeUnits: Record<ParcelSize, number> = parcelUnits;
