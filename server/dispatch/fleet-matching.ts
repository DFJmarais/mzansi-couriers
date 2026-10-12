export function capacityUnits(size: string) {
  return size === "large" ? 3 : size === "medium" ? 2 : 1;
}

export function isVehicleFit(
  vehicle: { maxParcelCapacity: number | null; weightCapacity: string | number | null },
  packageSize: string,
  packageWeight: number,
) {
  const requiredUnits = capacityUnits(packageSize);
  const hasKnownCapacity = vehicle.maxParcelCapacity != null;
  const fitsUnits = hasKnownCapacity ? vehicle.maxParcelCapacity! >= requiredUnits : requiredUnits <= 1;
  const fitsWeight = vehicle.weightCapacity == null || Number(vehicle.weightCapacity) >= packageWeight;
  return fitsUnits && fitsWeight;
}
