export type OfflineParcelSearchRecord = {
  stop: { id: number; sequence: number; status: string };
  delivery: {
    trackingCode: string;
    packageDescription?: string | null;
    packageSize?: string | null;
    packageWeight?: string | number | null;
  };
  pickupAddress?: { street: string; city: string; postalCode?: string | null } | null;
  dropoffAddress?: { street: string; city: string; postalCode?: string | null } | null;
};

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getOfflineParcelSearchText(parcel: OfflineParcelSearchRecord): string {
  const fields = [
    parcel.delivery.trackingCode,
    parcel.delivery.packageDescription,
    parcel.delivery.packageSize,
    parcel.delivery.packageWeight,
    parcel.stop.sequence,
    parcel.stop.status.replaceAll("_", " "),
    parcel.pickupAddress?.street,
    parcel.pickupAddress?.city,
    parcel.pickupAddress?.postalCode,
    parcel.dropoffAddress?.street,
    parcel.dropoffAddress?.city,
    parcel.dropoffAddress?.postalCode,
  ];
  return normalize(fields.join(" "));
}

/** Search only the already-loaded route snapshot; this function never performs I/O. */
export function searchOfflineParcels<T extends OfflineParcelSearchRecord>(parcels: T[], query: string): T[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return parcels;
  return parcels.filter((parcel) => getOfflineParcelSearchText(parcel).includes(normalizedQuery));
}
