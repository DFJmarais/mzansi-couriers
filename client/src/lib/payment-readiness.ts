export type PaymentReadiness = "pending" | "paid" | "failed" | "cancelled" | null | undefined;

export function getPaymentReadiness(status: PaymentReadiness) {
  if (status === "paid") return { label: "Paid · ready for pickup", shortLabel: "Paid", ready: true as const };
  if (status === "pending") return { label: "Payment pending", shortLabel: "Payment pending", ready: false as const };
  if (status === "failed") return { label: "Payment failed", shortLabel: "Payment failed", ready: false as const };
  if (status === "cancelled") return { label: "Payment cancelled", shortLabel: "Payment cancelled", ready: false as const };
  return { label: "Payment status unavailable", shortLabel: "Payment unavailable", ready: false as const };
}
