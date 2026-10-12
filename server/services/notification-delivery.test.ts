import { describe, expect, it } from "vitest";
import { applyProviderResult, canRetry, mapTwilioStatus, redactRecipient, transitionNotification, verifyTwilioSignature } from "./notification-delivery";
import crypto from "node:crypto";

describe("notification delivery lifecycle", () => {
  const initial = { status: "queued" as const, attemptCount: 0 };
  it("does not call provider acceptance delivered", () => {
    const accepted = applyProviderResult(initial, { kind: "accepted", providerMessageId: "SM-test" });
    expect(accepted.status).toBe("provider_accepted");
    expect(transitionNotification(accepted, "delivered").status).toBe("delivered");
  });
  it("handles rejection, timeout/failure, and bounded retry", () => {
    const failed = applyProviderResult(initial, { kind: "failed", code: "timeout", message: "provider timeout" });
    expect(failed.status).toBe("failed");
    expect(canRetry(failed.status, failed.attemptCount)).toBe(true);
    expect(canRetry(failed.status, 3)).toBe(false);
    const rejected = applyProviderResult(initial, { kind: "rejected", code: "invalid_to", message: "invalid recipient" });
    expect(rejected.status).toBe("rejected");
  });
  it("prevents delivered-to-submitted status regression", () => {
    expect(transitionNotification({ status: "delivered", attemptCount: 1 }, "submitted").status).toBe("delivered");
  });
  it("maps provider statuses conservatively", () => {
    expect(mapTwilioStatus("sent")).toBe("submitted");
    expect(mapTwilioStatus("delivered")).toBe("delivered");
    expect(mapTwilioStatus("undelivered")).toBe("undeliverable");
    expect(mapTwilioStatus("unknown")).toBeNull();
  });
  it("validates signatures and rejects missing/invalid signatures", () => {
    const url = "https://example.test/webhooks/twilio/messages";
    const params = { MessageSid: "SM-test", MessageStatus: "delivered" };
    const raw = url + "MessageSidSM-testMessageStatusdelivered";
    const signature = crypto.createHmac("sha1", "test-token").update(raw).digest("base64");
    expect(verifyTwilioSignature(url, params, signature, "test-token")).toBe(true);
    expect(verifyTwilioSignature(url, params, "bad", "test-token")).toBe(false);
    expect(verifyTwilioSignature(url, params, signature, "")).toBe(false);
  });
  it("redacts recipient references in logs", () => {
    expect(redactRecipient("+27821234567")).toBe("***4567");
    expect(redactRecipient("person@example.com")).toBe("p***@example.com");
  });
});
