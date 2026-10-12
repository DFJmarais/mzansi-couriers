export type VehicleType = "motorbike" | "car" | "van" | "bakkie";
export type ParcelSize = "small" | "medium" | "large";

export type DispatchParcel = {
  id: number;
  trackingCode: string;
  pickup: { lat: number; lng: number; area: string };
  dropoff: { lat: number; lng: number; area: string };
  packageSize: ParcelSize;
  packageWeightKg: number;
  priority: number;
};

export type DispatchCourier = {
  id: number;
  name: string;
  vehicleType: VehicleType;
  capacityUnits: number;
  maxWeightKg: number;
  isAvailable: boolean;
  currentLocation: { lat: number; lng: number } | null;
  workingAreas: string[];
};

export type DispatchAssignment = {
  parcelId: number;
  courierId: number;
  sequence: number;
  score: number;
  distanceToPickupKm: number | null;
  areaMatch: string;
  reasoning: string;
};

export const parcelUnits: Record<ParcelSize, number> = { small: 1, medium: 2, large: 5 };
export const defaultCapacityUnits: Record<VehicleType, number> = { motorbike: 6, car: 12, van: 30, bakkie: 20 };
export const defaultWeightCapacityKg: Record<VehicleType, number> = { motorbike: 30, car: 150, van: 800, bakkie: 600 };

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function normaliseArea(area: string) {
  return area.trim().toLowerCase();
}

export function isAreaMatch(parcel: DispatchParcel, courier: DispatchCourier) {
  const areas = courier.workingAreas.map(normaliseArea);
  return areas.length > 0 && (areas.includes(normaliseArea(parcel.pickup.area)) || areas.includes(normaliseArea(parcel.dropoff.area)));
}

export function validateParcelForCourier(parcel: DispatchParcel, courier: DispatchCourier, usedUnits: number, usedWeightKg: number) {
  const requiredUnits = parcelUnits[parcel.packageSize];
  const capacityUnits = courier.capacityUnits || defaultCapacityUnits[courier.vehicleType];
  const weightLimit = courier.maxWeightKg || defaultWeightCapacityKg[courier.vehicleType];
  if (!courier.isAvailable) return { ok: false, reason: "Courier is not available" };
  if (usedUnits + requiredUnits > capacityUnits) return { ok: false, reason: "Vehicle capacity would be exceeded" };
  if (usedWeightKg + parcel.packageWeightKg > weightLimit) return { ok: false, reason: "Vehicle weight capacity would be exceeded" };
  if (courier.workingAreas.length > 0 && !isAreaMatch(parcel, courier)) return { ok: false, reason: "Parcel is outside the courier’s configured working zone" };
  if (courier.currentLocation && haversineKm(courier.currentLocation, parcel.pickup) > 120) return { ok: false, reason: "Pickup is outside the courier’s 120 km operating radius" };
  return { ok: true, reason: "Eligible" };
}

export function sequenceAssignmentsForCourier<T extends { parcelId: number; sequence: number }>(assignments: T[], parcels: Pick<DispatchParcel, "id" | "pickup" | "dropoff">[], start: { lat: number; lng: number } | null = null) {
  const parcelById = new Map(parcels.map((parcel) => [parcel.id, parcel]));
  const remaining = assignments.map((assignment) => ({ assignment, parcel: parcelById.get(assignment.parcelId) })).filter((item): item is { assignment: T; parcel: Pick<DispatchParcel, "id" | "pickup" | "dropoff"> } => Boolean(item.parcel));
  const ordered: T[] = [];
  let current = start;
  let currentArea: string | null = null;

  while (remaining.length > 0) {
    remaining.sort((a, b) => {
      const cost = (item: typeof a) => {
        const areaPenalty = currentArea && normaliseArea(item.parcel.pickup.area) !== currentArea ? 35 : 0;
        const approach = current ? haversineKm(current, item.parcel.pickup) : 0;
        const leg = haversineKm(item.parcel.pickup, item.parcel.dropoff);
        return areaPenalty + approach + leg * 0.25;
      };
      return cost(a) - cost(b) || a.assignment.parcelId - b.assignment.parcelId;
    });
    const next = remaining.shift();
    if (!next) break;
    ordered.push({ ...next.assignment, sequence: ordered.length + 1 });
    current = next.parcel.dropoff;
    currentArea = normaliseArea(next.parcel.pickup.area);
  }
  return ordered;
}

export function allocateParcels(parcels: DispatchParcel[], couriers: DispatchCourier[]) {
  const assignments: DispatchAssignment[] = [];
  const usage = new Map<number, { units: number; weightKg: number; sequence: number }>();
  const unassigned: Array<{ parcelId: number; trackingCode: string; reason: string }> = [];

  const orderedParcels = [...parcels].sort((a, b) => b.priority - a.priority || a.pickup.area.localeCompare(b.pickup.area) || a.id - b.id);
  for (const parcel of orderedParcels) {
    const rejectionReasons: string[] = [];
    const eligible = couriers.map((courier) => {
      const current = usage.get(courier.id) ?? { units: 0, weightKg: 0, sequence: 0 };
      const validation = validateParcelForCourier(parcel, courier, current.units, current.weightKg);
      if (!validation.ok) { rejectionReasons.push(validation.reason); return null; }
      const distance = courier.currentLocation ? haversineKm(courier.currentLocation, parcel.pickup) : null;
      const areaMatch = isAreaMatch(parcel, courier);
      const loadRatio = (current.units + parcelUnits[parcel.packageSize]) / (courier.capacityUnits || defaultCapacityUnits[courier.vehicleType]);
      const score = Math.max(0, Math.min(100, (areaMatch ? 45 : 10) + (distance === null ? 15 : Math.max(0, 30 - distance / 5)) + (100 - loadRatio * 100) * 0.25 + parcel.priority * 2));
      return { courier, current, distance, areaMatch, score };
    }).filter(Boolean) as Array<{ courier: DispatchCourier; current: { units: number; weightKg: number; sequence: number }; distance: number | null; areaMatch: boolean; score: number }>;

    if (eligible.length === 0) {
      const reasons = Array.from(new Set(rejectionReasons));
      unassigned.push({ parcelId: parcel.id, trackingCode: parcel.trackingCode, reason: reasons.length ? reasons.join("; ") : "No available courier satisfies area, distance, or capacity constraints" });
      continue;
    }
    const best = eligible.sort((a, b) => b.score - a.score || (a.distance ?? 9999) - (b.distance ?? 9999))[0];
    const next = { units: best.current.units + parcelUnits[parcel.packageSize], weightKg: best.current.weightKg + parcel.packageWeightKg, sequence: best.current.sequence + 1 };
    usage.set(best.courier.id, next);
    assignments.push({ parcelId: parcel.id, courierId: best.courier.id, sequence: next.sequence, score: Math.round(best.score * 100) / 100, distanceToPickupKm: best.distance === null ? null : Math.round(best.distance * 100) / 100, areaMatch: best.areaMatch ? parcel.pickup.area : "capacity/distance match", reasoning: best.areaMatch ? `Matched to ${best.courier.name} because the parcel area matches the courier work zone.` : `Assigned to ${best.courier.name} after capacity and distance checks.` });
  }
  return { assignments, unassigned };
}
