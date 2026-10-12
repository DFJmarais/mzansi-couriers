export const PUBLIC_FEATURES = [
  {
    key: "customer_booking",
    label: "Customer package booking",
    description: "The public Send a package flow and booking form.",
  },
  {
    key: "package_tracking",
    label: "Package tracking",
    description: "Public tracking lookup and tracking calls to action.",
  },
  {
    key: "courier_onboarding",
    label: "Courier onboarding",
    description: "The public courier requirements and application journey.",
  },
  {
    key: "fleet_registration",
    label: "Fleet registration",
    description: "The public fleet partner registration journey.",
  },
] as const;

export type PublicFeatureKey = (typeof PUBLIC_FEATURES)[number]["key"];

export const DEFAULT_PUBLIC_FEATURE_VISIBILITY: Record<PublicFeatureKey, boolean> = {
  customer_booking: false,
  package_tracking: false,
  courier_onboarding: true,
  fleet_registration: false,
};
