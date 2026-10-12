/**
 * Zapier Webhook Service
 * Handles all webhook events that trigger Zapier automations
 * 6 Core Webhooks:
 * 1. Payment Success
 * 2. Delivery Status Changed
 * 3. Courier Assigned
 * 4. Daily Earnings Summary
 * 5. Support Ticket Created
 * 6. Weekly Payout Report
 */

// Environment variables are accessed via process.env

export type WebhookEventType =
  | "payment.success"
  | "delivery.status_changed"
  | "courier.assigned"
  | "earnings.daily_summary"
  | "support.ticket_created"
  | "payout.weekly_report";

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
  metadata: {
    source: string;
    version: string;
    environment: string;
  };
}

/**
 * Send webhook event to Zapier
 */
export async function sendZapierWebhook(
  eventType: WebhookEventType,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const webhookUrl = getWebhookUrl(eventType);
    if (!webhookUrl) {
      console.warn(`No webhook URL configured for event: ${eventType}`);
      return false;
    }

    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        source: "mzansi-couriers",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "production",
      },
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mzansi-Couriers/1.0",
        "X-Webhook-Event": eventType,
        "X-Webhook-Timestamp": payload.timestamp,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Zapier webhook failed for ${eventType}:`,
        response.status,
        await response.text()
      );
      return false;
    }

    console.info(`✓ Zapier webhook sent: ${eventType}`);
    return true;
  } catch (error) {
    console.error(`Error sending Zapier webhook for ${eventType}:`, error);
    return false;
  }
}

/**
 * Get webhook URL for specific event type
 */
function getWebhookUrl(eventType: WebhookEventType): string | null {
  const webhookUrls: Record<WebhookEventType, string | undefined> = {
    "payment.success": process.env.ZAPIER_PAYMENT_SUCCESS_URL,
    "delivery.status_changed": process.env.ZAPIER_DELIVERY_STATUS_URL,
    "courier.assigned": process.env.ZAPIER_COURIER_ASSIGNED_URL,
    "earnings.daily_summary": process.env.ZAPIER_EARNINGS_SUMMARY_URL,
    "support.ticket_created": process.env.ZAPIER_SUPPORT_TICKET_URL,
    "payout.weekly_report": process.env.ZAPIER_PAYOUT_REPORT_URL,
  };

  return webhookUrls[eventType] || null;
}

/**
 * Webhook Event: Payment Success
 * Triggered when Paystack payment is successful
 */
export async function triggerPaymentSuccess(paymentData: {
  paymentId: string;
  customerId: string;
  courierEmail: string;
  amount: number;
  currency: string;
  parcelId: string;
  pickupLocation: string;
  deliveryLocation: string;
  distance: number;
  estimatedDeliveryTime: string;
  customerEmail: string;
  customerPhone: string;
  courierPhone: string;
  courierName: string;
}) {
  return sendZapierWebhook("payment.success", {
    paymentId: paymentData.paymentId,
    customerId: paymentData.customerId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    parcelId: paymentData.parcelId,
    pickupLocation: paymentData.pickupLocation,
    deliveryLocation: paymentData.deliveryLocation,
    distance: paymentData.distance,
    estimatedDeliveryTime: paymentData.estimatedDeliveryTime,
    customerEmail: paymentData.customerEmail,
    customerPhone: paymentData.customerPhone,
    courierName: paymentData.courierName,
    courierEmail: paymentData.courierEmail,
    courierPhone: paymentData.courierPhone,
    totalPrice: paymentData.amount,
    platformCommission: paymentData.amount * 0.2,
    courierEarnings: paymentData.amount * 0.8,
  });
}

/**
 * Webhook Event: Delivery Status Changed
 * Triggered when delivery status changes (Pending → In Transit → Delivered)
 */
export async function triggerDeliveryStatusChanged(statusData: {
  parcelId: string;
  customerId: string;
  courierId: string;
  previousStatus: string;
  newStatus: string;
  location: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  estimatedArrival?: string;
  notes?: string;
}) {
  return sendZapierWebhook("delivery.status_changed", statusData);
}

/**
 * Webhook Event: Courier Assigned
 * Triggered when a courier is assigned to a delivery
 */
export async function triggerCourierAssigned(assignmentData: {
  parcelId: string;
  customerId: string;
  courierId: string;
  courierName: string;
  courierPhone: string;
  courierEmail: string;
  courierRating: number;
  pickupLocation: string;
  deliveryLocation: string;
  estimatedDeliveryTime: string;
  customerEmail: string;
  customerPhone: string;
  parcelWeight: number;
  parcelDimensions: string;
}) {
  return sendZapierWebhook("courier.assigned", assignmentData);
}

/**
 * Webhook Event: Daily Earnings Summary
 * Triggered at end of day for each courier
 */
export async function triggerDailyEarningsSummary(earningsData: {
  courierId: string;
  courierEmail: string;
  courierPhone: string;
  courierName: string;
  date: string;
  totalDeliveries: number;
  totalEarnings: number;
  totalDistance: number;
  averageRating: number;
  completionRate: number;
  bonusEarnings: number;
  totalWithBonus: number;
}) {
  return sendZapierWebhook("earnings.daily_summary", earningsData);
}

/**
 * Webhook Event: Support Ticket Created
 * Triggered when a customer creates a support ticket
 */
export async function triggerSupportTicketCreated(ticketData: {
  ticketId: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  parcelId?: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: string;
}) {
  return sendZapierWebhook("support.ticket_created", ticketData);
}

/**
 * Webhook Event: Weekly Payout Report
 * Triggered every Thursday for payout processing
 */
export async function triggerWeeklyPayoutReport(payoutData: {
  week: string;
  totalCouriers: number;
  totalPayouts: number;
  totalAmount: number;
  payoutDate: string;
  payoutMethod: string;
  couriers: Array<{
    courierId: string;
    courierName: string;
    courierEmail: string;
    courierPhone: string;
    weeklyEarnings: number;
    deliveries: number;
    rating: number;
  }>;
}) {
  return sendZapierWebhook("payout.weekly_report", payoutData);
}
