/**
 * Zapier Integration Service
 * Sends webhooks to Zapier for automation workflows
 * Supports: Parcel status, earnings, delayed deliveries, support tickets, driver onboarding, weekly payouts
 */

interface ZapierWebhooks {
  PARCEL_STATUS?: string;
  DAILY_EARNINGS?: string;
  DELAYED_DELIVERY?: string;
  SUPPORT_TICKET?: string;
  DRIVER_ONBOARD?: string;
  WEEKLY_PAYOUT?: string;
}

const ZAPIER_WEBHOOKS: ZapierWebhooks = {
  PARCEL_STATUS: process.env.ZAPIER_PARCEL_STATUS_URL,
  DAILY_EARNINGS: process.env.ZAPIER_DAILY_EARNINGS_URL,
  DELAYED_DELIVERY: process.env.ZAPIER_DELAYED_DELIVERY_URL,
  SUPPORT_TICKET: process.env.ZAPIER_SUPPORT_TICKET_URL,
  DRIVER_ONBOARD: process.env.ZAPIER_DRIVER_ONBOARD_URL,
  WEEKLY_PAYOUT: process.env.ZAPIER_WEEKLY_PAYOUT_URL,
};

/**
 * Send payload to Zapier webhook
 * @param webhookType - Type of webhook (PARCEL_STATUS, DAILY_EARNINGS, etc.)
 * @param payload - JSON payload to send
 */
export async function sendToZapier(
  webhookType: keyof typeof ZAPIER_WEBHOOKS,
  payload: Record<string, any>
): Promise<boolean> {
  const url = ZAPIER_WEBHOOKS[webhookType];

  if (!url) {
    console.warn(`Zapier webhook not configured for: ${webhookType}`);
    return false;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MzansiCouriers/1.0",
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(
        `Zapier error (${webhookType}):`,
        response.status,
        response.statusText
      );
      return false;
    }

    console.log(`Zapier webhook sent successfully: ${webhookType}`);
    return true;
  } catch (error) {
    console.error(`Failed to send to Zapier (${webhookType}):`, error);
    // Implement retry logic here if needed
    return false;
  }
}

/**
 * Parcel Status Changed Event
 * Triggered when delivery status changes (COLLECTED, IN_TRANSIT, DELIVERED, FAILED, RETURNED)
 */
export async function sendParcelStatusEvent(payload: {
  parcelId: string;
  customerId: string;
  driverId: string;
  status: string;
  customerPhone: string;
  customerName: string;
  driverPhone: string;
  driverName: string;
  deliveryArea: string;
  deliveryTimeMinutes: number;
  amountCharged: number;
  currency?: string;
}): Promise<boolean> {
  return sendToZapier("PARCEL_STATUS", {
    event: "parcel_status_changed",
    parcel_id: payload.parcelId,
    customer_id: payload.customerId,
    driver_id: payload.driverId,
    status: payload.status,
    status_code: payload.status.toUpperCase(),
    customer_phone: payload.customerPhone,
    customer_name: payload.customerName,
    driver_phone: payload.driverPhone,
    driver_name: payload.driverName,
    delivery_area: payload.deliveryArea,
    delivery_time_minutes: payload.deliveryTimeMinutes,
    amount_charged: payload.amountCharged,
    currency: payload.currency || "ZAR",
  });
}

/**
 * Daily Driver Earnings Summary
 * Sent daily at 6 PM to each active driver
 */
export async function sendDailyEarningsEvent(payload: {
  driverId: string;
  driverPhone: string;
  driverName: string;
  driverEmail: string;
  earningsToday: number;
  deliveriesCount: number;
  averageDeliveryTime: number;
  area: string;
  totalKm: number;
  commissionPercentage?: number;
  payoutStatus?: string;
  currency?: string;
}): Promise<boolean> {
  return sendToZapier("DAILY_EARNINGS", {
    event: "daily_earnings_summary",
    driver_id: payload.driverId,
    driver_phone: payload.driverPhone,
    driver_name: payload.driverName,
    driver_email: payload.driverEmail,
    earnings_today: payload.earningsToday,
    deliveries_count: payload.deliveriesCount,
    average_delivery_time: payload.averageDeliveryTime,
    area: payload.area,
    total_km: payload.totalKm,
    commission_percentage: payload.commissionPercentage || 0,
    payout_status: payload.payoutStatus || "pending",
    currency: payload.currency || "ZAR",
  });
}

/**
 * Delayed Delivery Alert
 * Triggered when delivery exceeds time threshold
 */
export async function sendDelayedDeliveryEvent(payload: {
  parcelId: string;
  customerId: string;
  driverId: string;
  driverPhone: string;
  driverName: string;
  customerPhone: string;
  customerName: string;
  minsElapsed: number;
  thresholdMins: number;
  area: string;
  severity: "low" | "medium" | "high";
}): Promise<boolean> {
  return sendToZapier("DELAYED_DELIVERY", {
    event: "delivery_delayed",
    parcel_id: payload.parcelId,
    customer_id: payload.customerId,
    driver_id: payload.driverId,
    driver_phone: payload.driverPhone,
    driver_name: payload.driverName,
    customer_phone: payload.customerPhone,
    customer_name: payload.customerName,
    mins_elapsed: payload.minsElapsed,
    threshold_mins: payload.thresholdMins,
    area: payload.area,
    severity: payload.severity,
  });
}

/**
 * Support Ticket Created
 * Triggered when customer creates support ticket
 */
export async function sendSupportTicketEvent(payload: {
  ticketId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  message: string;
  severity: "low" | "medium" | "high";
  parcelId?: string;
  category?: string;
}): Promise<boolean> {
  return sendToZapier("SUPPORT_TICKET", {
    event: "support_ticket_created",
    ticket_id: payload.ticketId,
    customer_id: payload.customerId,
    customer_name: payload.customerName,
    customer_phone: payload.customerPhone,
    subject: payload.subject,
    message: payload.message,
    severity: payload.severity,
    parcel_id: payload.parcelId,
    category: payload.category,
  });
}

/**
 * Driver Onboarded
 * Triggered when new driver completes registration
 */
export async function sendDriverOnboardedEvent(payload: {
  driverId: string;
  driverPhone: string;
  driverName: string;
  driverEmail: string;
  area: string;
  vehicleType: string;
  registrationNumber: string;
}): Promise<boolean> {
  return sendToZapier("DRIVER_ONBOARD", {
    event: "driver_onboarded",
    driver_id: payload.driverId,
    driver_phone: payload.driverPhone,
    driver_name: payload.driverName,
    driver_email: payload.driverEmail,
    area: payload.area,
    vehicle_type: payload.vehicleType,
    registration_number: payload.registrationNumber,
  });
}

/**
 * Weekly Payout Report
 * Sent Friday 6 PM with all driver payouts for the week
 */
export async function sendWeeklyPayoutEvent(payload: {
  weekEnding: string;
  totalDrivers: number;
  totalDeliveries: number;
  totalRevenue: number;
  companyCommission20pct: number;
  totalPayoutsDue: number;
  drivers: Array<{
    driverId: string;
    driverName: string;
    driverPhone: string;
    driverEmail: string;
    deliveries: number;
    earnings: number;
    commission20pct: number;
    payoutAmount: number;
    status: string;
  }>;
  currency?: string;
}): Promise<boolean> {
  return sendToZapier("WEEKLY_PAYOUT", {
    event: "weekly_payout_report",
    week_ending: payload.weekEnding,
    total_drivers: payload.totalDrivers,
    total_deliveries: payload.totalDeliveries,
    total_revenue: payload.totalRevenue,
    company_commission_20pct: payload.companyCommission20pct,
    total_payouts_due: payload.totalPayoutsDue,
    drivers: payload.drivers.map((d) => ({
      driver_id: d.driverId,
      driver_name: d.driverName,
      driver_phone: d.driverPhone,
      driver_email: d.driverEmail,
      deliveries: d.deliveries,
      earnings: d.earnings,
      commission_20pct: d.commission20pct,
      payout_amount: d.payoutAmount,
      status: d.status,
    })),
    currency: payload.currency || "ZAR",
  });
}

/**
 * Get Zapier webhook configuration status
 */
export function getZapierStatus(): Record<string, boolean> {
  return Object.entries(ZAPIER_WEBHOOKS).reduce(
    (acc, [key, value]) => {
      acc[key] = !!value;
      return acc;
    },
    {} as Record<string, boolean>
  );
}

/**
 * Check if all required webhooks are configured
 */
export function isZapierConfigured(): boolean {
  const status = getZapierStatus();
  return Object.values(status).every((v) => v === true);
}
