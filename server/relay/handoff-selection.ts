export type RelayCoordinate = { lat: number; lng: number };
export type HandoffPointCandidate = RelayCoordinate & { id: number; name: string; address: string; area: string; safetyNotes: string | null };

function distanceKm(a: RelayCoordinate, b: RelayCoordinate) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function chooseHandoffLocation(currentCourier: RelayCoordinate, nextCourier: RelayCoordinate, points: HandoffPointCandidate[]) {
  const midpoint = { lat: (currentCourier.lat + nextCourier.lat) / 2, lng: (currentCourier.lng + nextCourier.lng) / 2 };
  const eligible = points
    .map((point) => ({ point, distanceKm: distanceKm(midpoint, point) }))
    .filter(({ distanceKm: distance }) => distance <= 15)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  const selected = eligible[0]?.point;
  if (selected) return { mode: "designated_point" as const, pointId: selected.id, address: selected.address, name: selected.name, area: selected.area, latitude: selected.lat, longitude: selected.lng, safetyNotes: selected.safetyNotes };
  return { mode: "courier_meeting" as const, pointId: null, address: "Safe meeting point to be agreed by both couriers", name: "Courier meeting point", area: "Between courier areas", latitude: midpoint.lat, longitude: midpoint.lng, safetyNotes: "Both couriers must agree on a public, well-lit location before handoff." };
}
