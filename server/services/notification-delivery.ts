import crypto from "node:crypto";

export type NotificationChannel = "in_app" | "email" | "sms" | "whatsapp" | "push";
export type NotificationStatus = "queued" | "submitted" | "provider_accepted" | "delivered" | "failed" | "rejected" | "undeliverable" | "expired";

const rank: Record<NotificationStatus, number> = {
  queued: 0,
  submitted: 1,
  provider_accepted: 2,
  delivered: 3,
  failed: 3,
  rejected: 3,
  undeliverable: 3,
  expired: 3,
};

export type NotificationLifecycle = {
  status: NotificationStatus;
  providerMessageId?: string;
  attemptCount: number;
  lastErrorCode?: string;
  lastErrorMessage?: string;
};

export type ProviderSendResult =
  | { kind: "accepted"; providerMessageId: string }
  | { kind: "rejected"; code: string; message: string }
  | { kind: "failed"; code: string; message: string };

export function transitionNotification(current: NotificationLifecycle, next: NotificationStatus): NotificationLifecycle {
  if (rank[next] < rank[current.status]) return current;
  if (current.status === "delivered" || current.status === "failed" || current.status === "rejected" || current.status === "undeliverable" || current.status === "expired") {
    return current;
  }
  return { ...current, status: next };
}

export function applyProviderResult(current: NotificationLifecycle, result: ProviderSendResult): NotificationLifecycle {
  const next = result.kind === "accepted" ? transitionNotification(current, "provider_accepted") : transitionNotification(current, result.kind);
  if (result.kind === "accepted") return { ...next, providerMessageId: result.providerMessageId, attemptCount: current.attemptCount + 1 };
  return { ...next, attemptCount: current.attemptCount + 1, lastErrorCode: result.code, lastErrorMessage: result.message.slice(0, 255) };
}

export function mapTwilioStatus(status: string): NotificationStatus | null {
  switch (status.toLowerCase()) {
    case "queued":
    case "accepted":
      return status.toLowerCase() === "queued" ? "queued" : "provider_accepted";
    case "sending":
    case "sent":
      return "submitted";
    case "delivered":
    case "read":
      return "delivered";
    case "failed":
      return "failed";
    case "undelivered":
      return "undeliverable";
    case "canceled":
    case "cancelled":
      return "rejected";
    default:
      return null;
  }
}

export function verifyTwilioSignature(url: string, params: Record<string, unknown>, signature: string, authToken: string): boolean {
  if (!authToken || !signature) return false;
  const data = url + Object.keys(params).sort().map((key) => `${key}${String(params[key] ?? "")}`).join("");
  const expected = crypto.createHmac("sha1", authToken).update(data).digest("base64");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function canRetry(status: NotificationStatus, attemptCount: number, maxAttempts = 3): boolean {
  return (status === "failed" || status === "undeliverable" || status === "rejected") && attemptCount < maxAttempts;
}

export function redactRecipient(recipient: string): string {
  if (recipient.includes("@")) return recipient.replace(/^(.).+(@.*)$/, "$1***$2");
  const digits = recipient.replace(/\D/g, "");
  return digits.length > 4 ? `***${digits.slice(-4)}` : "***";
}
