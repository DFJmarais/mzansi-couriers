import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, date, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Supports three roles: customer, courier, admin
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["customer", "courier", "admin"]).default("customer").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  passwordUpdatedAt: timestamp("passwordUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Public courier application contact details and explicit email consent. */
export const courierInterestLeads = mysqlTable("courier_interest_leads", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  age: int("age"),
  province: varchar("province", { length: 80 }),
  vehicleType: varchar("vehicleType", { length: 40 }),
  vehicleMakeModel: varchar("vehicleMakeModel", { length: 120 }),
  vehicleYear: int("vehicleYear"),
  vehicleOwnership: varchar("vehicleOwnership", { length: 40 }),
  hasValidLicense: boolean("hasValidLicense").default(false),
  hasVehicleInsurance: boolean("hasVehicleInsurance").default(false),
  wantsFleet: boolean("wantsFleet").default(false),
  fleetSize: int("fleetSize"),
  fleetDetails: varchar("fleetDetails", { length: 240 }),
  licenseDocumentUrl: varchar("licenseDocumentUrl", { length: 500 }),
  licenseDocumentKey: varchar("licenseDocumentKey", { length: 255 }),
  licenseExpiryDate: date("licenseExpiryDate"),
  licenseVerificationStatus: mysqlEnum("licenseVerificationStatus", ["pending", "approved", "replacement_required"]).default("pending").notNull(),
  idDocumentUrl: varchar("idDocumentUrl", { length: 500 }),
  idDocumentKey: varchar("idDocumentKey", { length: 255 }),
  idVerificationStatus: mysqlEnum("idVerificationStatus", ["pending", "approved", "replacement_required"]).default("pending").notNull(),
  insuranceDocumentUrl: varchar("insuranceDocumentUrl", { length: 500 }),
  insuranceDocumentKey: varchar("insuranceDocumentKey", { length: 255 }),
  insuranceExpiryDate: date("insuranceExpiryDate"),
  insuranceVerificationStatus: mysqlEnum("insuranceVerificationStatus", ["pending", "approved", "replacement_required"]).default("pending").notNull(),
  reviewNote: varchar("reviewNote", { length: 1000 }),
  reviewStatus: mysqlEnum("reviewStatus", ["new", "reviewed"]).default("new").notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"),
  emailConsent: boolean("emailConsent").notNull().default(false),
  source: varchar("source", { length: 80 }).notNull().default("become-driver"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Append-only admin activity history for each courier application. */
export const courierApplicationActivity = mysqlTable("courier_application_activity", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().references(() => courierInterestLeads.id),
  eventType: varchar("eventType", { length: 60 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  detail: text("detail"),
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CourierApplicationActivity = typeof courierApplicationActivity.$inferSelect;
export type InsertCourierApplicationActivity = typeof courierApplicationActivity.$inferInsert;

/** One-time, hashed administrator password-reset tokens. */
export const adminPasswordResetTokens = mysqlTable("admin_password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminPasswordResetToken = typeof adminPasswordResetTokens.$inferSelect;
export type InsertAdminPasswordResetToken = typeof adminPasswordResetTokens.$inferInsert;

/** Verified Manus collaborator requests for MCP access. */
export const mcpCollaboratorApprovals = mysqlTable("mcp_collaborator_approvals", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  displayName: text("displayName"),
  accountEmail: varchar("accountEmail", { length: 320 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: varchar("reviewedBy", { length: 128 }),
});

export type McpCollaboratorApproval = typeof mcpCollaboratorApprovals.$inferSelect;
export type InsertMcpCollaboratorApproval = typeof mcpCollaboratorApprovals.$inferInsert;

/** Dynamic MCP public-client registrations that must survive deployments. */
export const mcpOAuthClients = mysqlTable("mcp_oauth_clients", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("clientId", { length: 128 }).notNull().unique(),
  redirectUris: json("redirectUris").notNull(),
  clientName: varchar("clientName", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type McpOAuthClient = typeof mcpOAuthClients.$inferSelect;
export type InsertMcpOAuthClient = typeof mcpOAuthClients.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Admin-controlled visibility for public feature entry points. */
export const publicFeatureVisibility = mysqlTable("public_feature_visibility", {
  id: int("id").autoincrement().primaryKey(),
  featureKey: varchar("featureKey", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 160 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  updatedBy: int("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PublicFeatureVisibility = typeof publicFeatureVisibility.$inferSelect;
export type InsertPublicFeatureVisibility = typeof publicFeatureVisibility.$inferInsert;

/**
 * Privacy-preserving aggregate counters for anonymous public-assistant usage.
 * No question text, IP address, cookie, user agent, account ID, or session ID
 * is stored. Each row is only a daily event counter.
 */
export const publicAssistantAnalytics = mysqlTable("public_assistant_analytics", {
  id: int("id").autoincrement().primaryKey(),
  eventDate: date("eventDate").notNull(),
  eventType: varchar("eventType", { length: 48 }).notNull(),
  eventCount: int("eventCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  eventDateTypeUnique: uniqueIndex("public_assistant_analytics_date_type_unique").on(table.eventDate, table.eventType),
}));

export type PublicAssistantAnalytics = typeof publicAssistantAnalytics.$inferSelect;
export type InsertPublicAssistantAnalytics = typeof publicAssistantAnalytics.$inferInsert;

/**
 * Courier profiles - extended information for courier role users
 */
export const courierProfiles = mysqlTable("courier_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  vehicleType: mysqlEnum("vehicleType", ["motorbike", "car", "van", "bakkie"]).notNull(),
  vehicleRegistration: varchar("vehicleRegistration", { length: 50 }).notNull(),
  licenseNumber: varchar("licenseNumber", { length: 50 }).notNull(),
  province: varchar("province", { length: 80 }),
  region: varchar("region", { length: 120 }),
  isAvailable: boolean("isAvailable").default(false).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  totalDeliveries: int("totalDeliveries").default(0),
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierProfile = typeof courierProfiles.$inferSelect;
export type InsertCourierProfile = typeof courierProfiles.$inferInsert;

/**
 * Customer saved addresses
 */
export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 50 }), // e.g., "Home", "Work"
  street: text("street").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  postalCode: varchar("postalCode", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;

/**
 * Deliveries - core delivery records
 * Status lifecycle: pending → assigned → in-transit → delivered
 */
export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  recipientName: varchar("recipientName", { length: 160 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPhone: varchar("recipientPhone", { length: 20 }),
  courierId: int("courierId"),
  pickupAddressId: int("pickupAddressId").notNull(),
  dropoffAddressId: int("dropoffAddressId").notNull(),
  pickupLatitude: decimal("pickupLatitude", { precision: 10, scale: 8 }).notNull(),
  pickupLongitude: decimal("pickupLongitude", { precision: 11, scale: 8 }).notNull(),
  dropoffLatitude: decimal("dropoffLatitude", { precision: 10, scale: 8 }).notNull(),
  dropoffLongitude: decimal("dropoffLongitude", { precision: 11, scale: 8 }).notNull(),
  status: mysqlEnum("status", ["pending", "assigned", "in-transit", "delivered"]).default("pending").notNull(),
  packageSize: mysqlEnum("packageSize", ["small", "medium", "large"]).notNull(),
  packageType: mysqlEnum("packageType", ["envelope", "box", "soft_parcel"]).default("box").notNull(),
  lengthCm: decimal("lengthCm", { precision: 8, scale: 1 }).default("0.0").notNull(),
  widthCm: decimal("widthCm", { precision: 8, scale: 1 }).default("0.0").notNull(),
  heightCm: decimal("heightCm", { precision: 8, scale: 1 }).default("0.0").notNull(),
  fragile: boolean("fragile").default(false).notNull(),
  livestock: boolean("livestock").default(false).notNull(),
  packageWeight: decimal("packageWeight", { precision: 8, scale: 2 }).notNull(), // in kg
  packageDescription: text("packageDescription"),
  trackingCode: varchar("trackingCode", { length: 20 }).notNull().unique(),
  estimatedPrice: decimal("estimatedPrice", { precision: 12, scale: 2 }).notNull(),
  finalPrice: decimal("finalPrice", { precision: 12, scale: 2 }),
  distance: decimal("distance", { precision: 8, scale: 2 }), // in km
  estimatedDeliveryTime: int("estimatedDeliveryTime"), // in minutes
  actualDeliveryTime: timestamp("actualDeliveryTime"),
  proofOfDelivery: json("proofOfDelivery"), // { type: 'photo' | 'signature' | 'otp', data: string }
  packageLabelPhotoUrl: varchar("packageLabelPhotoUrl", { length: 500 }), // Customer photo showing the parcel and its identification code
  packageLabelPhotoKey: varchar("packageLabelPhotoKey", { length: 255 }), // S3 key for authorized retrieval/audit
  packageLabelConfirmedAt: timestamp("packageLabelConfirmedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;

export const parcelCustodyScans = mysqlTable("parcel_custody_scans", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  relayLegId: int("relayLegId"),
  scannedByUserId: int("scannedByUserId").notNull(),
  scanType: mysqlEnum("scanType", ["pickup", "delivery", "relay_receive"]).notNull(),
  scannedCode: varchar("scannedCode", { length: 64 }).notNull(),
  accepted: boolean("accepted").default(true).notNull(),
  scannedAt: timestamp("scannedAt").defaultNow().notNull(),
});
export type ParcelCustodyScan = typeof parcelCustodyScans.$inferSelect;
export type InsertParcelCustodyScan = typeof parcelCustodyScans.$inferInsert;

export const relayHandoffInspections = mysqlTable("relay_handoff_inspections", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  relayLegId: int("relayLegId").notNull(),
  inspectorCourierId: int("inspectorCourierId").notNull(),
  conditionAccepted: boolean("conditionAccepted").notNull(),
  checklist: json("checklist").notNull(),
  defectNote: text("defectNote"),
  defectPhotoUrls: json("defectPhotoUrls"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RelayHandoffInspection = typeof relayHandoffInspections.$inferSelect;
export type InsertRelayHandoffInspection = typeof relayHandoffInspections.$inferInsert;

export const deliveryReviews = mysqlTable("delivery_reviews", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  reviewerUserId: int("reviewerUserId").notNull(),
  score: int("score").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DeliveryReview = typeof deliveryReviews.$inferSelect;
export type InsertDeliveryReview = typeof deliveryReviews.$inferInsert;

/**
 * Delivery tracking - real-time location updates
 */
export const deliveryTracking = mysqlTable("delivery_tracking", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  courierId: int("courierId").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  heading: decimal("heading", { precision: 6, scale: 2 }),
  altitude: decimal("altitude", { precision: 8, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliveryTracking = typeof deliveryTracking.$inferSelect;
export type InsertDeliveryTracking = typeof deliveryTracking.$inferInsert;

/**
 * Pricing Configuration - Relay-based pricing rules (editable from admin dashboard)
 */
export const pricingConfig = mysqlTable("pricing_config", {
  id: int("id").autoincrement().primaryKey(),
  
  // Base pickup fees
  pickupStandard: decimal("pickupStandard", { precision: 8, scale: 2 }).default("45.00"),
  pickupPriority: decimal("pickupPriority", { precision: 8, scale: 2 }).default("65.00"),
  pickupExpress: decimal("pickupExpress", { precision: 8, scale: 2 }).default("95.00"),
  
  // Per-leg costs
  legShort: decimal("legShort", { precision: 8, scale: 2 }).default("18.00"), // 0-40 km
  legMedium: decimal("legMedium", { precision: 8, scale: 2 }).default("28.00"), // 40-80 km
  legLong: decimal("legLong", { precision: 8, scale: 2 }).default("38.00"), // 80-120 km
  
  // Weight pricing
  weight0_2: decimal("weight0_2", { precision: 8, scale: 2 }).default("0.00"),
  weight2_5: decimal("weight2_5", { precision: 8, scale: 2 }).default("15.00"),
  weight5_10: decimal("weight5_10", { precision: 8, scale: 2 }).default("30.00"),
  weight10_20: decimal("weight10_20", { precision: 8, scale: 2 }).default("60.00"),
  weight20_50: decimal("weight20_50", { precision: 8, scale: 2 }).default("120.00"),
  
  // Service multipliers
  serviceEconomy: decimal("serviceEconomy", { precision: 3, scale: 2 }).default("1.00"),
  serviceExpress: decimal("serviceExpress", { precision: 3, scale: 2 }).default("1.25"),
  serviceOvernight: decimal("serviceOvernight", { precision: 3, scale: 2 }).default("1.50"),
  serviceSameDay: decimal("serviceSameDay", { precision: 3, scale: 2 }).default("2.00"),
  
  // Surcharges
  surchargeFragile: decimal("surchargeFragile", { precision: 8, scale: 2 }).default("25.00"),
  surchargeInsurance: decimal("surchargeInsurance", { precision: 8, scale: 2 }).default("50.00"),
  surchargeRemote: decimal("surchargeRemote", { precision: 8, scale: 2 }).default("75.00"),
  surchargeOversized: decimal("surchargeOversized", { precision: 8, scale: 2 }).default("100.00"),
  surchargeManualHandling: decimal("surchargeManualHandling", { precision: 8, scale: 2 }).default("80.00"),
  
  // Volumetric weight divisor
  volumetricDivisor: int("volumetricDivisor").default(5000),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingConfig = typeof pricingConfig.$inferSelect;
export type InsertPricingConfig = typeof pricingConfig.$inferInsert;

/**
 * Ratings and reviews
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  ratedByUserId: int("ratedByUserId").notNull(),
  ratedUserId: int("ratedUserId").notNull(),
  score: int("score").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["job_available", "delivery_assigned", "delivery_status", "payment", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedDeliveryId: int("relatedDeliveryId"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Authoritative outbound notification attempts. Provider acceptance is not
 * treated as delivery; delivery is confirmed only by a verified webhook.
 */
export const notificationDeliveries = mysqlTable("notification_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  deliveryId: int("deliveryId"),
  runId: int("runId"),
  channel: mysqlEnum("channel", ["in_app", "email", "sms", "whatsapp", "push"]).notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 180 }),
  recipientRef: varchar("recipientRef", { length: 160 }).notNull(),
  provider: varchar("provider", { length: 40 }).notNull(),
  providerMessageId: varchar("providerMessageId", { length: 160 }),
  status: mysqlEnum("status", ["queued", "submitted", "provider_accepted", "delivered", "failed", "rejected", "undeliverable", "expired"]).default("queued").notNull(),
  attemptCount: int("attemptCount").default(0).notNull(),
  lastErrorCode: varchar("lastErrorCode", { length: 80 }),
  lastErrorMessage: varchar("lastErrorMessage", { length: 255 }),
  queuedAt: timestamp("queuedAt").defaultNow().notNull(),
  submittedAt: timestamp("submittedAt"),
  acceptedAt: timestamp("acceptedAt"),
  deliveredAt: timestamp("deliveredAt"),
  failedAt: timestamp("failedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type InsertNotificationDelivery = typeof notificationDeliveries.$inferInsert;

/** Append-only provider callback history used for idempotency and audits. */
export const notificationDeliveryEvents = mysqlTable("notification_delivery_events", {
  id: int("id").autoincrement().primaryKey(),
  notificationDeliveryId: int("notificationDeliveryId").notNull(),
  providerEventId: varchar("providerEventId", { length: 160 }).notNull(),
  providerStatus: varchar("providerStatus", { length: 40 }).notNull(),
  mappedStatus: varchar("mappedStatus", { length: 40 }).notNull(),
  signatureVerified: boolean("signatureVerified").default(false).notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
});

export type NotificationDeliveryEvent = typeof notificationDeliveryEvents.$inferSelect;
export type InsertNotificationDeliveryEvent = typeof notificationDeliveryEvents.$inferInsert;

/**
 * Delivery Zones - Regional areas with specific pricing
 */
export const deliveryZones = mysqlTable("delivery_zones", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Johannesburg", "Cape Town"
  region: varchar("region", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  basePricePerKm: decimal("basePricePerKm", { precision: 8, scale: 2 }).notNull(),
  minimumCharge: decimal("minimumCharge", { precision: 8, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type InsertDeliveryZone = typeof deliveryZones.$inferInsert;

/**
 * Regional Pricing - Zone-specific pricing rules
 */
export const regionalPricing = mysqlTable("regional_pricing", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId").notNull(),
  packageSize: mysqlEnum("packageSize", ["small", "medium", "large"]).notNull(),
  baseFee: decimal("baseFee", { precision: 8, scale: 2 }).notNull(),
  peakHourMultiplier: decimal("peakHourMultiplier", { precision: 4, scale: 2 }).default("1.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RegionalPricing = typeof regionalPricing.$inferSelect;
export type InsertRegionalPricing = typeof regionalPricing.$inferInsert;

/**
 * Payment Methods - Supported SA payment options
 */
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["eft", "capitec", "card", "wallet"]).notNull(),
  accountName: varchar("accountName", { length: 100 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  bankName: varchar("bankName", { length: 100 }),
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

/**
 * User Preferences - Language, notifications, etc.
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  language: mysqlEnum("language", ["en", "zu", "xh"]).default("en").notNull(),
  notificationMethod: mysqlEnum("notificationMethod", ["in_app", "sms", "whatsapp"]).default("in_app").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  whatsappNumber: varchar("whatsappNumber", { length: 20 }),
  preferredZone: int("preferredZone"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

/**
 * Community Metrics - Track local impact
 */
export const communityMetrics = mysqlTable("community_metrics", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId").notNull(),
  totalDeliveries: int("totalDeliveries").default(0),
  totalEarningsDistributed: decimal("totalEarningsDistributed", { precision: 12, scale: 2 }).default("0.00"),
  activeCouriers: int("activeCouriers").default(0),
  communityRating: decimal("communityRating", { precision: 3, scale: 2 }).default("5.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityMetrics = typeof communityMetrics.$inferSelect;
export type InsertCommunityMetrics = typeof communityMetrics.$inferInsert;


/**
 * Courier Onboarding - Track onboarding progress and status
 * Status: pending → requirements_check → verification → training → quiz → approved → active
 */
export const courierOnboarding = mysqlTable("courier_onboarding", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  status: mysqlEnum("status", [
    "not_started",
    "welcome",
    "requirements_check",
    "verification",
    "training",
    "quiz",
    "agreement",
    "pending_approval",
    "approved",
    "rejected",
    "active"
  ]).default("not_started").notNull(),
  currentStep: int("currentStep").default(0),
  completedSteps: json("completedSteps").default("[]"), // Array of completed step numbers
  requirementsMet: boolean("requirementsMet").default(false),
  vehicleType: mysqlEnum("vehicleType", ["motorbike", "car", "van", "bakkie"]),
  vehicleRegistration: varchar("vehicleRegistration", { length: 50 }),
  licenseNumber: varchar("licenseNumber", { length: 50 }),
  province: varchar("province", { length: 80 }),
  region: varchar("region", { length: 120 }),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending"),
  trainingCompleted: boolean("trainingCompleted").default(false),
  quizAttempts: int("quizAttempts").default(0),
  quizPassed: boolean("quizPassed").default(false),
  quizScore: int("quizScore"),
  agreementsAccepted: boolean("agreementsAccepted").default(false),
  fraudFlags: json("fraudFlags").default("[]"), // Array of fraud detection flags
  adminNotes: text("adminNotes"),
  approvedBy: int("approvedBy"), // Admin user ID who approved
  rejectionReason: text("rejectionReason"),
  startedAt: timestamp("startedAt").defaultNow(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierOnboarding = typeof courierOnboarding.$inferSelect;
export type InsertCourierOnboarding = typeof courierOnboarding.$inferInsert;

/**
 * Courier Verification Documents - Store uploaded verification files
 */
export const courierVerification = mysqlTable("courier_verification", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentType: mysqlEnum("documentType", [
    "sa_id",
    "selfie",
    "driver_license",
    "vehicle_registration",
    "vehicle_photo_front",
    "vehicle_photo_side",
    "vehicle_photo_interior"
  ]).notNull(),
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 key for reference
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending"),
  verifiedBy: int("verifiedBy"), // Admin user ID
  verificationNotes: text("verificationNotes"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CourierVerification = typeof courierVerification.$inferSelect;
export type InsertCourierVerification = typeof courierVerification.$inferInsert;

/**
 * Courier Quiz Results - Track quiz attempts and scores
 */
export const courierQuizResults = mysqlTable("courier_quiz_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  attemptNumber: int("attemptNumber").notNull(),
  totalQuestions: int("totalQuestions").notNull(),
  correctAnswers: int("correctAnswers").notNull(),
  score: int("score").notNull(), // Percentage 0-100
  passed: boolean("passed").notNull(),
  answers: json("answers").notNull(), // Array of { questionId, selectedAnswer, correct }
  timeSpent: int("timeSpent"), // in seconds
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CourierQuizResults = typeof courierQuizResults.$inferSelect;
export type InsertCourierQuizResults = typeof courierQuizResults.$inferInsert;

/**
 * Courier Requirements Check - Track which requirements user confirmed
 */
export const courierRequirementsCheck = mysqlTable("courier_requirements_check", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  hasSADriversLicense: boolean("hasSADriversLicense").default(false),
  hasVehicleAccess: boolean("hasVehicleAccess").default(false),
  hasWorkingSmartphone: boolean("hasWorkingSmartphone").default(false),
  noSeriousCriminalRecord: boolean("noSeriousCriminalRecord").default(false),
  agreeBackgroundVerification: boolean("agreeBackgroundVerification").default(false),
  agreeIdVerification: boolean("agreeIdVerification").default(false),
  agreeVehicleVerification: boolean("agreeVehicleVerification").default(false),
  allRequirementsMet: boolean("allRequirementsMet").default(false),
  confirmedAt: timestamp("confirmedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierRequirementsCheck = typeof courierRequirementsCheck.$inferSelect;
export type InsertCourierRequirementsCheck = typeof courierRequirementsCheck.$inferInsert;

/**
 * Courier Agreements - Track which agreements user accepted
 */
export const courierAgreements = mysqlTable("courier_agreements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  termsAndConditionsAccepted: boolean("termsAndConditionsAccepted").default(false),
  courierRulesAccepted: boolean("courierRulesAccepted").default(false),
  safetyPoliciesAccepted: boolean("safetyPoliciesAccepted").default(false),
  independentContractorAgreementAccepted: boolean("independentContractorAgreementAccepted").default(false),
  allAgreementsAccepted: boolean("allAgreementsAccepted").default(false),
  acceptedAt: timestamp("acceptedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierAgreements = typeof courierAgreements.$inferSelect;
export type InsertCourierAgreements = typeof courierAgreements.$inferInsert;

/**
 * Courier safety controls and signed operational declarations.
 * Vehicle insurance remains the courier's responsibility; the platform records
 * only the acknowledgement and package-in-transit policy acknowledgement.
 */
export const courierSafetyProfiles = mysqlTable("courier_safety_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  trustedContactName: varchar("trustedContactName", { length: 160 }),
  trustedContactPhone: varchar("trustedContactPhone", { length: 30 }),
  emergencyPreference: mysqlEnum("emergencyPreference", ["saps_10111", "emergency_112", "trusted_contact"]).default("saps_10111").notNull(),
  vehicleInsuranceAcknowledged: boolean("vehicleInsuranceAcknowledged").default(false).notNull(),
  goodsInTransitPolicyAcknowledged: boolean("goodsInTransitPolicyAcknowledged").default(false).notNull(),
  prohibitedItemsAcknowledged: boolean("prohibitedItemsAcknowledged").default(false).notNull(),
  safetyTrainingAcknowledged: boolean("safetyTrainingAcknowledged").default(false).notNull(),
  serviceRadiusKm: int("serviceRadiusKm").default(120).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CourierSafetyProfile = typeof courierSafetyProfiles.$inferSelect;
export type InsertCourierSafetyProfile = typeof courierSafetyProfiles.$inferInsert;

/** Urgent and non-urgent courier safety events requiring an auditable response. */
export const courierSafetyIncidents = mysqlTable("courier_safety_incidents", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  deliveryId: int("deliveryId"),
  type: mysqlEnum("type", ["sos", "accident", "threat", "medical", "vehicle_breakdown", "parcel_security", "roadside_hazard", "other"]).notNull(),
  urgency: mysqlEnum("urgency", ["urgent", "high", "normal"]).default("normal").notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "in_review", "resolved", "cancelled"]).default("open").notNull(),
  description: varchar("description", { length: 1000 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  emergencyNumber: varchar("emergencyNumber", { length: 20 }),
  customerNotifiedAt: timestamp("customerNotifiedAt"),
  acknowledgedBy: int("acknowledgedBy"),
  resolutionNote: text("resolutionNote"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CourierSafetyIncident = typeof courierSafetyIncidents.$inferSelect;
export type InsertCourierSafetyIncident = typeof courierSafetyIncidents.$inferInsert;

/** Time-bounded lone-worker check-ins for long or unusual routes. */
export const courierSafetyCheckins = mysqlTable("courier_safety_checkins", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  deliveryRunId: int("deliveryRunId"),
  status: mysqlEnum("status", ["active", "completed", "overdue", "cancelled"]).default("active").notNull(),
  expectedBy: timestamp("expectedBy").notNull(),
  checkedInAt: timestamp("checkedInAt"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CourierSafetyCheckin = typeof courierSafetyCheckins.$inferSelect;
export type InsertCourierSafetyCheckin = typeof courierSafetyCheckins.$inferInsert;

/**
 * Fraud Detection Flags - Track suspicious activity during onboarding
 */
export const fraudDetectionFlags = mysqlTable("fraud_detection_flags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  flagType: mysqlEnum("flagType", [
    "duplicate_account",
    "fake_id",
    "expired_license",
    "suspicious_selfie",
    "multiple_attempts",
    "rapid_submission",
    "gps_spoofing_detected",
    "manual_flag"
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  description: text("description"),
  flaggedBy: int("flaggedBy"), // Admin user ID
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FraudDetectionFlag = typeof fraudDetectionFlags.$inferSelect;
export type InsertFraudDetectionFlag = typeof fraudDetectionFlags.$inferInsert;




/**
 * Earnings Summary - Daily/Weekly/Monthly earnings aggregates for couriers
 */
export const earningsSummary = mysqlTable("earnings_summary", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  period: mysqlEnum("period", ["daily", "weekly", "monthly"]).notNull(),
  periodDate: varchar("periodDate", { length: 20 }).notNull(), // YYYY-MM-DD for daily, YYYY-W## for weekly, YYYY-MM for monthly
  totalDeliveries: int("totalDeliveries").default(0),
  completedDeliveries: int("completedDeliveries").default(0),
  cancelledDeliveries: int("cancelledDeliveries").default(0),
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0.00"),
  baseFeeEarnings: decimal("baseFeeEarnings", { precision: 12, scale: 2 }).default("0.00"),
  distanceFeeEarnings: decimal("distanceFeeEarnings", { precision: 12, scale: 2 }).default("0.00"),
  bonusEarnings: decimal("bonusEarnings", { precision: 12, scale: 2 }).default("0.00"),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("5.00"),
  completionRate: decimal("completionRate", { precision: 5, scale: 2 }).default("100.00"), // Percentage
  totalDistance: decimal("totalDistance", { precision: 10, scale: 2 }).default("0.00"), // km
  totalTime: int("totalTime").default(0), // seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EarningsSummary = typeof earningsSummary.$inferSelect;
export type InsertEarningsSummary = typeof earningsSummary.$inferInsert;

/**
 * SMS Notifications - Track SMS messages sent to users
 */
export const smsNotifications = mysqlTable("sms_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deliveryId: int("deliveryId"),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  messageType: mysqlEnum("messageType", [
    "delivery_confirmed",
    "courier_assigned",
    "pickup_started",
    "in_transit",
    "delivery_completed",
    "delivery_failed",
    "courier_job_available",
    "earnings_summary",
    "verification_reminder"
  ]).notNull(),
  messageContent: text("messageContent").notNull(),
  twilioSid: varchar("twilioSid", { length: 100 }), // Twilio message SID for tracking
  status: mysqlEnum("status", ["pending", "sent", "delivered", "failed"]).default("pending"),
  failureReason: text("failureReason"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmsNotification = typeof smsNotifications.$inferSelect;
export type InsertSmsNotification = typeof smsNotifications.$inferInsert;


/**
 * Courier ratings and reviews from customers
 */
export const courierRatings = mysqlTable("courier_ratings", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  customerId: int("customerId").notNull(),
  deliveryId: int("deliveryId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  review: text("review"),
  categories: varchar("categories", { length: 500 }), // JSON: {professionalism, speed, communication, packaging}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierRating = typeof courierRatings.$inferSelect;
export type InsertCourierRating = typeof courierRatings.$inferInsert;

/**
 * Courier performance metrics
 */
export const courierMetrics = mysqlTable("courier_metrics", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  totalDeliveries: int("totalDeliveries").default(0),
  completedDeliveries: int("completedDeliveries").default(0),
  cancelledDeliveries: int("cancelledDeliveries").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("5.00"),
  totalRatings: int("totalRatings").default(0),
  responseTime: int("responseTime"), // Average response time in seconds
  completionRate: decimal("completionRate", { precision: 5, scale: 2 }).default("100.00"), // Percentage
  cancellationRate: decimal("cancellationRate", { precision: 5, scale: 2 }).default("0.00"), // Percentage
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0.00"),
  lastDeliveryAt: timestamp("lastDeliveryAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierMetrics = typeof courierMetrics.$inferSelect;
export type InsertCourierMetrics = typeof courierMetrics.$inferInsert;

/**
 * WhatsApp message tracking
 */
export const whatsappMessages = mysqlTable("whatsapp_messages", {
  id: int("id").autoincrement().primaryKey(),
  recipientId: int("recipientId").notNull(),
  deliveryId: int("deliveryId"),
  messageType: mysqlEnum("messageType", [
    "delivery_confirmed",
    "courier_assigned",
    "in_transit",
    "delivery_completed",
    "delivery_failed",
    "courier_job_available",
    "earnings_summary"
  ]).notNull(),
  messageContent: text("messageContent").notNull(),
  mediaUrl: varchar("mediaUrl", { length: 500 }), // For delivery photos
  twilioSid: varchar("twilioSid", { length: 100 }), // Twilio message SID
  status: mysqlEnum("status", ["pending", "sent", "delivered", "read", "failed"]).default("pending"),
  failureReason: text("failureReason"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;


/**
 * Real-time GPS Location Tracking
 */
export const gpsLocations = mysqlTable("gps_locations", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull().references(() => users.id),
  deliveryId: int("deliveryId").notNull().references(() => deliveries.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  accuracy: int("accuracy"), // GPS accuracy in meters
  altitude: decimal("altitude", { precision: 8, scale: 2 }), // Altitude in meters
  speed: decimal("speed", { precision: 5, scale: 2 }), // Speed in km/h
  heading: int("heading"), // Direction in degrees (0-360)
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GPSLocation = typeof gpsLocations.$inferSelect;
export type InsertGPSLocation = typeof gpsLocations.$inferInsert;

/**
 * Dispute Resolution System
 */
export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull().references(() => deliveries.id),
  customerId: int("customerId").notNull().references(() => users.id),
  courierId: int("courierId").notNull().references(() => users.id),
  reason: mysqlEnum("reason", [
    "wrong_address",
    "damaged_package",
    "missing_items",
    "late_delivery",
    "courier_behavior",
    "lost_package",
    "other"
  ]).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "under_review", "resolved", "rejected"]).default("open"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium"),
  resolution: text("resolution"), // Admin's resolution notes
  refundAmount: decimal("refundAmount", { precision: 10, scale: 2 }), // If applicable
  customerRating: int("customerRating"), // 1-5 star rating of dispute resolution
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

/**
 * Dispute Evidence (photos, documents, etc.)
 */
export const disputeEvidence = mysqlTable("dispute_evidence", {
  id: int("id").autoincrement().primaryKey(),
  disputeId: int("disputeId").notNull().references(() => disputes.id),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id), // Customer or Courier
  evidenceType: mysqlEnum("evidenceType", ["photo", "document", "video", "other"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DisputeEvidence = typeof disputeEvidence.$inferSelect;
export type InsertDisputeEvidence = typeof disputeEvidence.$inferInsert;

/**
 * Dispute Comments/Timeline
 */
export const disputeComments = mysqlTable("dispute_comments", {
  id: int("id").autoincrement().primaryKey(),
  disputeId: int("disputeId").notNull().references(() => disputes.id),
  userId: int("userId").notNull().references(() => users.id),
  userRole: mysqlEnum("userRole", ["customer", "courier", "admin"]).notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DisputeComment = typeof disputeComments.$inferSelect;
export type InsertDisputeComment = typeof disputeComments.$inferInsert;


/**
 * Referral Codes (for fun star rewards)
 */
export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  code: varchar("code", { length: 50 }).notNull().unique(),
  isActive: boolean("isActive").default(true),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

/**
 * User Stars (fun reward system)
 */
export const userStars = mysqlTable("user_stars", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  starCount: int("starCount").default(0),
  totalReferred: int("totalReferred").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserStars = typeof userStars.$inferSelect;
export type InsertUserStars = typeof userStars.$inferInsert;

/**
 * Star History (track star awards)
 */
export const starHistory = mysqlTable("star_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  referrerId: int("referrerId").notNull().references(() => users.id),
  reason: varchar("reason", { length: 255 }).notNull(),
  starsAwarded: int("starsAwarded").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StarHistory = typeof starHistory.$inferSelect;
export type InsertStarHistory = typeof starHistory.$inferInsert;

/**
 * Surge Pricing Configuration
 */
export const surgePricingConfig = mysqlTable("surge_pricing_config", {
  id: int("id").autoincrement().primaryKey(),
  timeSlot: varchar("timeSlot", { length: 50 }).notNull(),
  startHour: int("startHour").notNull(),
  endHour: int("endHour").notNull(),
  dayOfWeek: varchar("dayOfWeek", { length: 20 }),
  multiplier: decimal("multiplier", { precision: 3, scale: 2 }).default("1.0"),
  demandThreshold: int("demandThreshold").default(5),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SurgePricingConfig = typeof surgePricingConfig.$inferSelect;
export type InsertSurgePricingConfig = typeof surgePricingConfig.$inferInsert;

/**
 * Surge Pricing History
 */
export const surgePricingHistory = mysqlTable("surge_pricing_history", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull().references(() => deliveries.id),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  surgeMultiplier: decimal("surgeMultiplier", { precision: 3, scale: 2 }).notNull(),
  finalPrice: decimal("finalPrice", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SurgePricingHistory = typeof surgePricingHistory.$inferSelect;
export type InsertSurgePricingHistory = typeof surgePricingHistory.$inferInsert;

// Courier-to-Courier Referral Bonuses
export const courierReferrals = mysqlTable("courier_referrals", {
  id: int("id").primaryKey().autoincrement(),
  referrerCourierId: varchar("referrer_courier_id", { length: 255 }).notNull(),
  referredCourierId: varchar("referred_courier_id", { length: 255 }).notNull(),
  referralCode: varchar("referral_code", { length: 50 }).notNull().unique(),
  bonusAmount: decimal("bonus_amount", { precision: 8, scale: 2 }).notNull().default("50.00"), // R50-R100
  bonusStatus: varchar("bonus_status", { length: 20 }).notNull().default("pending"), // pending, earned, paid
  referredCourierDeliveries: int("referred_courier_deliveries").notNull().default(0), // Track deliveries
  deliveryThreshold: int("delivery_threshold").notNull().default(10), // Bonus after 10 deliveries
  createdAt: timestamp("created_at").defaultNow(),
  bonusEarnedAt: timestamp("bonus_earned_at"),
  bonusPaidAt: timestamp("bonus_paid_at"),
});

export type CourierReferral = typeof courierReferrals.$inferSelect;
export type InsertCourierReferral = typeof courierReferrals.$inferInsert;


/**
 * Achievements - Gamification system for couriers and customers
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "First Delivery", "100 Deliveries"
  description: varchar("description", { length: 255 }),
  badge: varchar("badge", { length: 50 }).notNull(), // e.g., "bronze", "silver", "gold", "platinum"
  category: mysqlEnum("category", ["courier", "customer", "both"]).default("both"),
  triggerType: mysqlEnum("triggerType", [
    "delivery_count",
    "rating",
    "referral_count",
    "earnings",
    "completion_rate",
    "response_time",
    "customer_satisfaction",
    "milestone",
  ]).notNull(),
  triggerValue: int("triggerValue").notNull(), // e.g., 100 for 100 deliveries
  reward: int("reward").default(0), // Bonus points or currency
  icon: varchar("icon", { length: 255 }), // SVG or emoji
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

/**
 * User Achievements - Track which achievements each user has unlocked
 */
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  notificationSent: boolean("notificationSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * Advanced Leaderboards - Track rankings across multiple categories
 */
export const leaderboards = mysqlTable("leaderboards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", [
    "total_deliveries",
    "total_earnings",
    "average_rating",
    "referrals",
    "completion_rate",
    "response_time",
    "customer_satisfaction",
    "weekly_earnings",
    "monthly_earnings",
  ]).notNull(),
  rank: int("rank").notNull(),
  score: decimal("score", { precision: 12, scale: 2 }).notNull(),
  period: mysqlEnum("period", ["all_time", "monthly", "weekly"]).default("all_time"),
  zone: varchar("zone", { length: 100 }), // Optional: zone-specific leaderboards
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Leaderboard = typeof leaderboards.$inferSelect;
export type InsertLeaderboard = typeof leaderboards.$inferInsert;

/**
 * Seasonal Competitions - Monthly/weekly competitions with prizes
 */
export const seasonalCompetitions = mysqlTable("seasonal_competitions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  category: mysqlEnum("category", [
    "deliveries",
    "earnings",
    "ratings",
    "referrals",
    "customer_satisfaction",
  ]).notNull(),
  period: mysqlEnum("period", ["weekly", "monthly", "quarterly"]).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  prizePool: decimal("prizePool", { precision: 12, scale: 2 }).notNull(),
  firstPrize: decimal("firstPrize", { precision: 12, scale: 2 }),
  secondPrize: decimal("secondPrize", { precision: 12, scale: 2 }),
  thirdPrize: decimal("thirdPrize", { precision: 12, scale: 2 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeasonalCompetition = typeof seasonalCompetitions.$inferSelect;
export type InsertSeasonalCompetition = typeof seasonalCompetitions.$inferInsert;

/**
 * Competition Results - Track winners and scores for each competition
 */
export const competitionResults = mysqlTable("competition_results", {
  id: int("id").autoincrement().primaryKey(),
  competitionId: int("competitionId").notNull(),
  userId: int("userId").notNull(),
  rank: int("rank").notNull(),
  score: decimal("score", { precision: 12, scale: 2 }).notNull(),
  prizeAwarded: decimal("prizeAwarded", { precision: 12, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompetitionResult = typeof competitionResults.$inferSelect;
export type InsertCompetitionResult = typeof competitionResults.$inferInsert;


/**
 * Courier Payouts - Track weekly payouts to couriers via Paystack
 */
export const courierPayouts = mysqlTable("courier_payouts", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  payoutDate: timestamp("payoutDate").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending"),
  paystackTransferId: varchar("paystackTransferId", { length: 255 }), // Paystack transfer ID
  bankAccount: varchar("bankAccount", { length: 255 }), // Encrypted bank account
  recipientCode: varchar("recipientCode", { length: 255 }), // Paystack recipient code
  failureReason: varchar("failureReason", { length: 255 }), // Reason if payout failed
  deliveryCount: int("deliveryCount").default(0), // Number of deliveries in this payout period
  platformCommission: decimal("platformCommission", { precision: 12, scale: 2 }).default("0.00"),
  netAmount: decimal("netAmount", { precision: 12, scale: 2 }), // Amount after commission
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierPayout = typeof courierPayouts.$inferSelect;
export type InsertCourierPayout = typeof courierPayouts.$inferInsert;

/**
 * Admin-verified operating-cost profile used for settlement calculations.
 * A courier must have a verified profile before a live relay payout can be
 * generated; the values are copied into settlement rows for auditability.
 */
export const vehicleCostProfiles = mysqlTable("vehicle_cost_profiles", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  vehicleType: varchar("vehicleType", { length: 40 }).notNull(),
  makeModel: varchar("makeModel", { length: 120 }),
  modelYear: int("modelYear"),
  fuelType: varchar("fuelType", { length: 30 }).default("petrol").notNull(),
  fuelPricePerLitre: decimal("fuelPricePerLitre", { precision: 8, scale: 2 }).notNull(),
  fuelLitresPer100Km: decimal("fuelLitresPer100Km", { precision: 6, scale: 2 }).notNull(),
  driverCompensationPerKm: decimal("driverCompensationPerKm", { precision: 8, scale: 2 }).notNull(),
  vehicleAllowancePerKm: decimal("vehicleAllowancePerKm", { precision: 8, scale: 2 }).notNull(),
  routeOverheadPerKm: decimal("routeOverheadPerKm", { precision: 8, scale: 2 }).notNull(),
  capacityUnits: int("capacityUnits"),
  capacityWeightKg: decimal("capacityWeightKg", { precision: 10, scale: 2 }),
  capacityVolumeM3: decimal("capacityVolumeM3", { precision: 10, scale: 4 }),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending").notNull(),
  evidenceNote: text("evidenceNote"),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VehicleCostProfile = typeof vehicleCostProfiles.$inferSelect;
export type InsertVehicleCostProfile = typeof vehicleCostProfiles.$inferInsert;

/** Immutable per-parcel/per-relay-leg settlement allocations. */
export const relaySettlementAllocations = mysqlTable("relay_settlement_allocations", {
  id: int("id").autoincrement().primaryKey(),
  settlementKey: varchar("settlementKey", { length: 160 }).notNull().unique(),
  deliveryId: int("deliveryId").notNull(),
  relayLegId: int("relayLegId"),
  courierId: int("courierId").notNull(),
  vehicleCostProfileId: int("vehicleCostProfileId"),
  weekStart: date("weekStart").notNull(),
  customerCharge: decimal("customerCharge", { precision: 12, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 12, scale: 2 }).notNull(),
  courierPool: decimal("courierPool", { precision: 12, scale: 2 }).notNull(),
  linehaulDistanceKm: decimal("linehaulDistanceKm", { precision: 10, scale: 2 }).notNull(),
  deadheadKm: decimal("deadheadKm", { precision: 10, scale: 2 }).notNull(),
  returnKm: decimal("returnKm", { precision: 10, scale: 2 }).notNull(),
  totalDrivenKm: decimal("totalDrivenKm", { precision: 10, scale: 2 }).notNull(),
  operatingCost: decimal("operatingCost", { precision: 12, scale: 2 }).notNull(),
  handoverFee: decimal("handoverFee", { precision: 12, scale: 2 }).notNull(),
  grossEarnings: decimal("grossEarnings", { precision: 12, scale: 2 }).notNull(),
  estimatedNet: decimal("estimatedNet", { precision: 12, scale: 2 }).notNull(),
  minimumPayout: decimal("minimumPayout", { precision: 12, scale: 2 }).notNull().default("0.00"),
  parcelCountOnLeg: int("parcelCountOnLeg").notNull().default(1),
  parcelWeightKg: decimal("parcelWeightKg", { precision: 10, scale: 2 }).notNull().default("0.00"),
  parcelVolumeM3: decimal("parcelVolumeM3", { precision: 10, scale: 4 }).notNull().default("0.0000"),
  vehicleCapacityUnits: int("vehicleCapacityUnits"),
  vehicleCapacityWeightKg: decimal("vehicleCapacityWeightKg", { precision: 10, scale: 2 }),
  vehicleCapacityVolumeM3: decimal("vehicleCapacityVolumeM3", { precision: 10, scale: 4 }),
  tolls: decimal("tolls", { precision: 12, scale: 2 }).notNull().default("0.00"),
  handoverTimeMinutes: int("handoverTimeMinutes").notNull().default(0),
  availableBackhaul: boolean("availableBackhaul").notNull().default(false),
  backhaulRevenue: decimal("backhaulRevenue", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalCourierPoolAvailable: decimal("totalCourierPoolAvailable", { precision: 12, scale: 2 }).notNull().default("0.00"),
  status: mysqlEnum("status", ["calculated", "approved", "paid", "void"]).default("calculated").notNull(),
  payoutId: int("payoutId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RelaySettlementAllocation = typeof relaySettlementAllocations.$inferSelect;
export type InsertRelaySettlementAllocation = typeof relaySettlementAllocations.$inferInsert;

/**
 * One financial control record per parcel. Amounts are snapshots of the
 * append-only event ledger and are never reused as a payout source directly.
 */
export const parcelFinancialLedgers = mysqlTable("parcel_financial_ledgers", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull().unique(),
  currency: varchar("currency", { length: 3 }).notNull().default("ZAR"),
  customerPayment: decimal("customerPayment", { precision: 12, scale: 2 }).notNull().default("0.00"),
  platformAllocation: decimal("platformAllocation", { precision: 12, scale: 2 }).notNull().default("0.00"),
  courierPoolAllocation: decimal("courierPoolAllocation", { precision: 12, scale: 2 }).notNull().default("0.00"),
  reservedAmount: decimal("reservedAmount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  allocatedToCouriers: decimal("allocatedToCouriers", { precision: 12, scale: 2 }).notNull().default("0.00"),
  refunds: decimal("refunds", { precision: 12, scale: 2 }).notNull().default("0.00"),
  platformReversals: decimal("platformReversals", { precision: 12, scale: 2 }).notNull().default("0.00"),
  courierPoolReversals: decimal("courierPoolReversals", { precision: 12, scale: 2 }).notNull().default("0.00"),
  cancellationAdjustments: decimal("cancellationAdjustments", { precision: 12, scale: 2 }).notNull().default("0.00"),
  replacementLegCosts: decimal("replacementLegCosts", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paymentCosts: decimal("paymentCosts", { precision: 12, scale: 2 }).notNull().default("0.00"),
  payoutCosts: decimal("payoutCosts", { precision: 12, scale: 2 }).notNull().default("0.00"),
  finalPlatformContribution: decimal("finalPlatformContribution", { precision: 12, scale: 2 }).notNull().default("0.00"),
  finalCourierEarnings: decimal("finalCourierEarnings", { precision: 12, scale: 2 }).notNull().default("0.00"),
  status: mysqlEnum("status", ["open", "settled", "void"]).notNull().default("open"),
  version: int("version").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ParcelFinancialLedger = typeof parcelFinancialLedgers.$inferSelect;
export type InsertParcelFinancialLedger = typeof parcelFinancialLedgers.$inferInsert;

/** Append-only financial events. No update or delete path is exposed. */
export const parcelFinancialLedgerEntries = mysqlTable("parcel_financial_ledger_entries", {
  id: int("id").autoincrement().primaryKey(),
  ledgerId: int("ledgerId").notNull(),
  deliveryId: int("deliveryId").notNull(),
  eventKey: varchar("eventKey", { length: 180 }).notNull().unique(),
  eventType: mysqlEnum("eventType", ["customer_payment", "platform_allocation", "courier_pool", "reserve", "leg_allocation", "refund", "refund_requested", "refund_approved", "refund_pending", "refund_processing", "refund_processed", "refund_failed", "platform_reversal", "courier_pool_reversal", "cancellation", "replacement_leg", "payment_cost", "payout_cost", "settlement"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  courierId: int("courierId"),
  relayLegId: int("relayLegId"),
  reference: varchar("reference", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ParcelFinancialLedgerEntry = typeof parcelFinancialLedgerEntries.$inferSelect;
export type InsertParcelFinancialLedgerEntry = typeof parcelFinancialLedgerEntries.$inferInsert;

/** Manual administrator-controlled Paystack refund workflow. */
export const refundRequests = mysqlTable("refund_requests", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  customerId: int("customerId").notNull(),
  paymentSessionId: int("paymentSessionId").notNull(),
  transactionReference: varchar("transactionReference", { length: 120 }).notNull(),
  requestedAmount: decimal("requestedAmount", { precision: 12, scale: 2 }).notNull(),
  approvedAmount: decimal("approvedAmount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("ZAR"),
  reason: text("reason").notNull(),
  adminNote: text("adminNote"),
  status: mysqlEnum("status", ["requested", "under_review", "approved", "rejected", "pending", "processing", "processed", "failed", "needs_attention"]).notNull().default("requested"),
  requestedByUserId: int("requestedByUserId").notNull(),
  reviewedByAdminId: int("reviewedByAdminId"),
  reviewedAt: timestamp("reviewedAt"),
  paystackRefundId: varchar("paystackRefundId", { length: 120 }).unique(),
  paystackEventId: varchar("paystackEventId", { length: 180 }).unique(),
  paystackStatus: varchar("paystackStatus", { length: 40 }),
  failureReason: text("failureReason"),
  initiatedAt: timestamp("initiatedAt"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RefundRequest = typeof refundRequests.$inferSelect;
export type InsertRefundRequest = typeof refundRequests.$inferInsert;

/**
 * Payout History - Audit trail for all payouts
 */
export const payoutHistory = mysqlTable("payout_history", {
  id: int("id").autoincrement().primaryKey(),
  payoutId: int("payoutId").notNull(),
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  notes: varchar("notes", { length: 255 }),
  changedBy: varchar("changedBy", { length: 255 }), // Admin or system
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PayoutHistory = typeof payoutHistory.$inferSelect;
export type InsertPayoutHistory = typeof payoutHistory.$inferInsert;

/**
 * Payout Settings - Courier bank account and payout preferences
 */
export const payoutSettings = mysqlTable("payout_settings", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  bankName: varchar("bankName", { length: 100 }).notNull(),
  branchCode: varchar("branchCode", { length: 20 }),
  accountName: varchar("accountName", { length: 100 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 50 }).notNull(), // Encrypted
  accountType: mysqlEnum("accountType", ["savings", "cheque"]).default("savings"),
  paystackRecipientCode: varchar("paystackRecipientCode", { length: 255 }), // Paystack recipient code
  isVerified: boolean("isVerified").default(false),
  payoutFrequency: mysqlEnum("payoutFrequency", ["weekly", "biweekly", "monthly"]).default("weekly"),
  payoutDay: int("payoutDay").default(4), // 0=Monday, 4=Friday
  minimumPayoutAmount: decimal("minimumPayoutAmount", { precision: 12, scale: 2 }).default("100.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayoutSettings = typeof payoutSettings.$inferSelect;
export type InsertPayoutSettings = typeof payoutSettings.$inferInsert;


/**
 * Analytics Events - Track all platform events for analytics
 */
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 50 }).notNull(), // delivery_completed, user_signup, payout_processed, etc
  userId: int("userId"),
  courierId: int("courierId"),
  customerId: int("customerId"),
  metadata: varchar("metadata", { length: 1000 }), // JSON string with event details
  zone: varchar("zone", { length: 100 }),
  value: decimal("value", { precision: 12, scale: 2 }), // For monetary events
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Daily Metrics - Aggregated daily statistics
 */
export const dailyMetrics = mysqlTable("daily_metrics", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  zone: varchar("zone", { length: 100 }),
  totalDeliveries: int("totalDeliveries").default(0),
  completedDeliveries: int("completedDeliveries").default(0),
  cancelledDeliveries: int("cancelledDeliveries").default(0),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0.00"),
  courierEarnings: decimal("courierEarnings", { precision: 12, scale: 2 }).default("0.00"),
  platformCommission: decimal("platformCommission", { precision: 12, scale: 2 }).default("0.00"),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00"),
  newCouriers: int("newCouriers").default(0),
  newCustomers: int("newCustomers").default(0),
  activeCouriers: int("activeCouriers").default(0),
  activeCustomers: int("activeCustomers").default(0),
  averageDeliveryTime: int("averageDeliveryTime").default(0), // in minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyMetric = typeof dailyMetrics.$inferSelect;
export type InsertDailyMetric = typeof dailyMetrics.$inferInsert;

/**
 * Hourly Metrics - Hourly statistics for surge pricing and demand analysis
 */
export const hourlyMetrics = mysqlTable("hourly_metrics", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  hour: int("hour").notNull(), // 0-23
  zone: varchar("zone", { length: 100 }),
  deliveryRequests: int("deliveryRequests").default(0),
  completedDeliveries: int("completedDeliveries").default(0),
  availableCouriers: int("availableCouriers").default(0),
  demandMultiplier: decimal("demandMultiplier", { precision: 3, scale: 2 }).default("1.00"),
  averageWaitTime: int("averageWaitTime").default(0), // in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HourlyMetric = typeof hourlyMetrics.$inferSelect;
export type InsertHourlyMetric = typeof hourlyMetrics.$inferInsert;

/**
 * Courier Performance - Monthly performance metrics for each courier
 */
export const courierPerformance = mysqlTable("courier_performance", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  month: varchar("month", { length: 10 }).notNull(), // YYYY-MM-DD (first day of month)
  deliveriesCompleted: int("deliveriesCompleted").default(0),
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0.00"),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00"),
  cancellationRate: decimal("cancellationRate", { precision: 5, scale: 2 }).default("0.00"), // percentage
  onTimeDeliveryRate: decimal("onTimeDeliveryRate", { precision: 5, scale: 2 }).default("100.00"), // percentage
  customerSatisfaction: decimal("customerSatisfaction", { precision: 5, scale: 2 }).default("0.00"), // percentage
  referralsGenerated: int("referralsGenerated").default(0),
  starsEarned: int("starsEarned").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierPerformance = typeof courierPerformance.$inferSelect;
export type InsertCourierPerformance = typeof courierPerformance.$inferInsert;

/**
 * Customer Behavior - Track customer usage patterns
 */
export const customerBehavior = mysqlTable("customer_behavior", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  totalDeliveries: int("totalDeliveries").default(0),
  totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }).default("0.00"),
  averageOrderValue: decimal("averageOrderValue", { precision: 12, scale: 2 }).default("0.00"),
  lastDeliveryDate: timestamp("lastDeliveryDate"),
  preferredZone: varchar("preferredZone", { length: 100 }),
  preferredTimeWindow: varchar("preferredTimeWindow", { length: 50 }), // morning, afternoon, evening, night
  repeatCustomer: boolean("repeatCustomer").default(false),
  churnRisk: boolean("churnRisk").default(false), // No delivery in 30 days
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerBehavior = typeof customerBehavior.$inferSelect;
export type InsertCustomerBehavior = typeof customerBehavior.$inferInsert;


/**
 * Address Cache - Global cache for frequently searched addresses
 * Used to avoid repeated API calls to Photon/Nominatim
 */
export const addressCache = mysqlTable("address_cache", {
  id: int("id").autoincrement().primaryKey(),
  queryText: varchar("queryText", { length: 255 }).notNull().unique(),
  fullAddress: varchar("fullAddress", { length: 500 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  province: varchar("province", { length: 50 }),
  city: varchar("city", { length: 100 }),
  suburb: varchar("suburb", { length: 100 }),
  postalCode: varchar("postalCode", { length: 10 }),
  addressType: varchar("addressType", { length: 50 }), // formal, informal, estate, complex, township
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  source: varchar("source", { length: 20 }).notNull(), // photon, nominatim, google
  usageCount: int("usageCount").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type AddressCache = typeof addressCache.$inferSelect;
export type InsertAddressCache = typeof addressCache.$inferInsert;

/**
 * Recent Searches - User-specific recent address searches
 * Used to show quick access to previously searched addresses
 */
export const recentSearches = mysqlTable("recent_searches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  addressText: varchar("addressText", { length: 500 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  searchType: varchar("searchType", { length: 20 }).notNull(), // pickup, dropoff
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RecentSearch = typeof recentSearches.$inferSelect;
export type InsertRecentSearch = typeof recentSearches.$inferInsert;

/**
 * Route Cache - Cache for frequently used routes
 * Stores distance and duration calculations to avoid repeated API calls
 */
export const routeCache = mysqlTable("route_cache", {
  id: int("id").autoincrement().primaryKey(),
  originLat: decimal("originLat", { precision: 10, scale: 8 }).notNull(),
  originLng: decimal("originLng", { precision: 11, scale: 8 }).notNull(),
  destLat: decimal("destLat", { precision: 10, scale: 8 }).notNull(),
  destLng: decimal("destLng", { precision: 11, scale: 8 }).notNull(),
  distanceKm: decimal("distanceKm", { precision: 8, scale: 2 }).notNull(),
  durationMinutes: int("durationMinutes"),
  source: varchar("source", { length: 20 }).notNull(), // haversine, osrm, google
  usageCount: int("usageCount").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type RouteCache = typeof routeCache.$inferSelect;
export type InsertRouteCache = typeof routeCache.$inferInsert;

/**
 * Courier Zones - Geographic zones for relay network
 * Each zone covers 100-120 km radius
 */
export const courierZones = mysqlTable("courier_zones", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Cape Town Central"
  centerLat: decimal("centerLat", { precision: 10, scale: 8 }).notNull(),
  centerLng: decimal("centerLng", { precision: 11, scale: 8 }).notNull(),
  radiusKm: int("radiusKm").default(110).notNull(), // 100-120 km
  province: varchar("province", { length: 50 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  courierCount: int("courierCount").default(0), // Number of couriers in zone
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierZone = typeof courierZones.$inferSelect;
export type InsertCourierZone = typeof courierZones.$inferInsert;



/**
 * Route Segments - Breakdown of a delivery into relay legs
 */
export const routeSegments = mysqlTable("route_segments", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  legNumber: int("legNumber").notNull(), // 1, 2, 3, etc.
  fromZoneId: int("fromZoneId"),
  toZoneId: int("toZoneId"),
  fromLat: decimal("fromLat", { precision: 10, scale: 8 }).notNull(),
  fromLng: decimal("fromLng", { precision: 11, scale: 8 }).notNull(),
  toLat: decimal("toLat", { precision: 10, scale: 8 }).notNull(),
  toLng: decimal("toLng", { precision: 11, scale: 8 }).notNull(),
  distanceKm: decimal("distanceKm", { precision: 8, scale: 2 }).notNull(),
  legType: varchar("legType", { length: 20 }).notNull(), // short, medium, long
  legCost: decimal("legCost", { precision: 8, scale: 2 }).notNull(),
  courierAssigned: int("courierAssigned"), // User ID of assigned courier
  status: varchar("status", { length: 20 }).default("pending"), // pending, in_transit, completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RouteSegment = typeof routeSegments.$inferSelect;
export type InsertRouteSegment = typeof routeSegments.$inferInsert;

/**
 * Relay Pricing Quotes - Store calculated prices for deliveries
 */
export const relayPricingQuotes = mysqlTable("relay_pricing_quotes", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  pickupLat: decimal("pickupLat", { precision: 10, scale: 8 }).notNull(),
  pickupLng: decimal("pickupLng", { precision: 11, scale: 8 }).notNull(),
  dropoffLat: decimal("dropoffLat", { precision: 10, scale: 8 }).notNull(),
  dropoffLng: decimal("dropoffLng", { precision: 11, scale: 8 }).notNull(),
  totalDistanceKm: decimal("totalDistanceKm", { precision: 8, scale: 2 }).notNull(),
  estimatedLegs: int("estimatedLegs").notNull(),
  
  // Pricing breakdown
  pickupFee: decimal("pickupFee", { precision: 8, scale: 2 }).notNull(),
  legsCost: decimal("legsCost", { precision: 8, scale: 2 }).notNull(),
  weightCost: decimal("weightCost", { precision: 8, scale: 2 }).notNull(),
  surcharges: decimal("surcharges", { precision: 8, scale: 2 }).default("0.00"),
  subtotal: decimal("subtotal", { precision: 8, scale: 2 }).notNull(),
  serviceMultiplier: decimal("serviceMultiplier", { precision: 3, scale: 2 }).default("1.00"),
  finalPrice: decimal("finalPrice", { precision: 8, scale: 2 }).notNull(),
  
  // Package details
  weight: decimal("weight", { precision: 8, scale: 2 }),
  volumetricWeight: decimal("volumetricWeight", { precision: 8, scale: 2 }),
  serviceLevel: varchar("serviceLevel", { length: 20 }).default("economy"), // economy, express, overnight, sameday
  
  // Surcharges applied
  isFragile: boolean("isFragile").default(false),
  hasInsurance: boolean("hasInsurance").default(false),
  isRemoteArea: boolean("isRemoteArea").default(false),
  isOversized: boolean("isOversized").default(false),
  needsManualHandling: boolean("needsManualHandling").default(false),
  
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RelayPricingQuote = typeof relayPricingQuotes.$inferSelect;
export type InsertRelayPricingQuote = typeof relayPricingQuotes.$inferInsert;


/**
 * SMART LOGISTICS NETWORK - Courier Tier System
 */

/**
 * Courier Tiers - Local, Regional, Long Haul
 */
export const courierTiers = mysqlTable("courier_tiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // 'local', 'regional', 'long_haul'
  displayName: varchar("displayName", { length: 100 }).notNull(),
  operatingRadiusMin: int("operatingRadiusMin").notNull(), // km
  operatingRadiusMax: int("operatingRadiusMax").notNull(), // km
  platformFeePercentage: int("platformFeePercentage").notNull(), // 20 or 25
  courierPayoutPercentage: int("courierPayoutPercentage").notNull(), // 80 or 75
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierTier = typeof courierTiers.$inferSelect;
export type InsertCourierTier = typeof courierTiers.$inferInsert;

/**
 * Courier Tier Assignments
 */
export const courierTierAssignments = mysqlTable("courier_tier_assignments", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  tierId: int("tierId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  requestedTierId: int("requestedTierId"), // Pending tier change
  requestedAt: timestamp("requestedAt"),
  approvedAt: timestamp("approvedAt"),
  rejectedAt: timestamp("rejectedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CourierTierAssignment = typeof courierTierAssignments.$inferSelect;
export type InsertCourierTierAssignment = typeof courierTierAssignments.$inferInsert;

/**
 * Vehicle Types
 */
export const vehicleTypes = mysqlTable("vehicle_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // 'motorcycle', 'small_car', 'sedan', etc.
  displayName: varchar("displayName", { length: 100 }).notNull(),
  defaultCapacityUnits: int("defaultCapacityUnits").notNull(), // 1-500
  suitableForTiers: varchar("suitableForTiers", { length: 255 }).notNull(), // JSON array: ['local', 'regional', 'long_haul']
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VehicleType = typeof vehicleTypes.$inferSelect;
export type InsertVehicleType = typeof vehicleTypes.$inferInsert;

/**
 * Courier Vehicles
 */
export const courierVehicles = mysqlTable("courier_vehicles", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  vehicleTypeId: int("vehicleTypeId").notNull(),
  registrationNumber: varchar("registrationNumber", { length: 50 }).notNull(),
  makeModel: varchar("makeModel", { length: 100 }).notNull(),
  year: int("year"),
  color: varchar("color", { length: 50 }),
  capacityUnits: int("capacityUnits").notNull(), // Custom capacity
  isPrimary: boolean("isPrimary").default(false),
  verified: boolean("verified").default(false),
  verificationDate: timestamp("verificationDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourierVehicle = typeof courierVehicles.$inferSelect;
export type InsertCourierVehicle = typeof courierVehicles.$inferInsert;

/**
 * Parcel Size Classifications
 */
export const parcelSizes = mysqlTable("parcel_sizes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull(), // 'XS', 'S', 'M', 'L', 'XL'
  displayName: varchar("displayName", { length: 100 }).notNull(),
  capacityUnits: int("capacityUnits").notNull(), // 1, 2, 5, 10, 20
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParcelSize = typeof parcelSizes.$inferSelect;
export type InsertParcelSize = typeof parcelSizes.$inferInsert;

/**
 * Published Routes (for Regional & Long Haul)
 */
export const publishedRoutes = mysqlTable("published_routes", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  vehicleId: int("vehicleId").notNull(),
  departureCity: varchar("departureCity", { length: 100 }).notNull(),
  destinationCity: varchar("destinationCity", { length: 100 }).notNull(),
  departureTime: timestamp("departureTime").notNull(),
  estimatedArrival: timestamp("estimatedArrival"),
  estimatedDistanceKm: int("estimatedDistanceKm"),
  availableCapacityUnits: int("availableCapacityUnits").notNull(),
  status: mysqlEnum("status", ["published", "loading", "departed", "completed", "cancelled"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PublishedRoute = typeof publishedRoutes.$inferSelect;
export type InsertPublishedRoute = typeof publishedRoutes.$inferInsert;

/**
 * Route Assignments (parcels assigned to routes)
 */
export const routeAssignments = mysqlTable("route_assignments", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  routeId: int("routeId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  pickupOrder: int("pickupOrder"),
  dropoffOrder: int("dropoffOrder"),
});

export type RouteAssignment = typeof routeAssignments.$inferSelect;
export type InsertRouteAssignment = typeof routeAssignments.$inferInsert;

/**
 * MZANSI PARTNER PROGRAMME
 */

/**
 * Partner Levels
 */
export const partnerLevels = mysqlTable("partner_levels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  displayName: varchar("displayName", { length: 100 }).notNull(),
  minCompletedDeliveries: int("minCompletedDeliveries").notNull(),
  minRating: decimal("minRating", { precision: 3, scale: 2 }).notNull(),
  minAcceptanceRate: decimal("minAcceptanceRate", { precision: 5, scale: 2 }).notNull(), // Percentage
  benefits: text("benefits").notNull(), // JSON array of benefits
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartnerLevel = typeof partnerLevels.$inferSelect;
export type InsertPartnerLevel = typeof partnerLevels.$inferInsert;

/**
 * Partner Level Assignments
 */
export const partnerLevelAssignments = mysqlTable("partner_level_assignments", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  levelId: int("levelId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartnerLevelAssignment = typeof partnerLevelAssignments.$inferSelect;
export type InsertPartnerLevelAssignment = typeof partnerLevelAssignments.$inferInsert;


/**
 * ============================================
 * FLEET PARTNER SYSTEM - PHASE 1
 * ============================================
 */

/**
 * Fleet Accounts - Main fleet entity
 * Represents a logistics business with multiple vehicles and drivers
 */
export const fleetAccounts = mysqlTable("fleet_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Fleet Owner user ID
  businessName: varchar("businessName", { length: 255 }).notNull(),
  ownerName: varchar("ownerName", { length: 255 }).notNull(),
  businessRegistrationNumber: varchar("businessRegistrationNumber", { length: 100 }),
  vatNumber: varchar("vatNumber", { length: 50 }),
  saIdNumber: varchar("saIdNumber", { length: 20 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(),
  physicalAddress: text("physicalAddress").notNull(),
  operatingProvinces: json("operatingProvinces"), // Array of provinces
  areasServed: json("areasServed"), // Array of service areas
  status: mysqlEnum("status", ["pending", "approved", "suspended", "rejected"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvalNotes: text("approvalNotes"),
  trustScore: decimal("trustScore", { precision: 5, scale: 2 }).default("0.00"),
  level: mysqlEnum("level", ["bronze", "silver", "gold", "platinum", "diamond", "titanium"]).default("bronze").notNull(),
  totalVehicles: int("totalVehicles").default(0),
  totalDrivers: int("totalDrivers").default(0),
  totalDeliveries: int("totalDeliveries").default(0),
  totalEarnings: decimal("totalEarnings", { precision: 15, scale: 2 }).default("0.00"),
  monthlyRevenue: decimal("monthlyRevenue", { precision: 15, scale: 2 }).default("0.00"),
  acceptanceRate: decimal("acceptanceRate", { precision: 5, scale: 2 }).default("0.00"),
  completionRate: decimal("completionRate", { precision: 5, scale: 2 }).default("0.00"),
  cancellationRate: decimal("cancellationRate", { precision: 5, scale: 2 }).default("0.00"),
  customerRating: decimal("customerRating", { precision: 3, scale: 2 }).default("5.00"),
  dispatchMode: mysqlEnum("dispatchMode", ["automatic", "manual"]).default("automatic").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FleetAccount = typeof fleetAccounts.$inferSelect;
export type InsertFleetAccount = typeof fleetAccounts.$inferInsert;

/**
 * Fleet Documents - Document tracking for compliance
 */
export const fleetDocuments = mysqlTable("fleet_documents", {
  id: int("id").autoincrement().primaryKey(),
  fleetId: int("fleetId").notNull(),
  documentType: mysqlEnum("documentType", ["id", "business_registration", "vat_certificate", "proof_of_address", "insurance", "operating_permit"]).notNull(),
  documentUrl: text("documentUrl").notNull(),
  documentHash: varchar("documentHash", { length: 255 }).notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  expiryDate: timestamp("expiryDate"),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected", "expired"]).default("pending").notNull(),
  verifiedBy: int("verifiedBy"), // Admin user ID
  verificationNotes: text("verificationNotes"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FleetDocument = typeof fleetDocuments.$inferSelect;
export type InsertFleetDocument = typeof fleetDocuments.$inferInsert;

/**
 * Fleet Vehicles - Individual vehicle profiles
 */
export const fleetVehicles = mysqlTable("fleet_vehicles", {
  id: int("id").autoincrement().primaryKey(),
  fleetId: int("fleetId").notNull(),
  registrationNumber: varchar("registrationNumber", { length: 50 }).notNull().unique(),
  vehicleType: mysqlEnum("vehicleType", ["bicycle", "scooter", "motorcycle", "car", "bakkie", "small_van", "large_van", "truck", "refrigerated", "flatbed"]).notNull(),
  vehiclePhoto: text("vehiclePhoto"),
  maxParcelCapacity: int("maxParcelCapacity"), // in units
  weightCapacity: decimal("weightCapacity", { precision: 8, scale: 2 }), // in kg
  assignedDriver: int("assignedDriver"), // Driver user ID
  gpsStatus: mysqlEnum("gpsStatus", ["online", "offline", "inactive"]).default("offline").notNull(),
  availability: mysqlEnum("availability", ["available", "in_use", "maintenance", "offline"]).default("offline").notNull(),
  trustScore: decimal("trustScore", { precision: 5, scale: 2 }).default("5.00"),
  insuranceStatus: mysqlEnum("insuranceStatus", ["active", "expired", "pending"]).default("pending").notNull(),
  insuranceExpiryDate: timestamp("insuranceExpiryDate"),
  roadworthyExpiryDate: timestamp("roadworthyExpiryDate"),
  lastServiceDate: timestamp("lastServiceDate"),
  nextServiceDate: timestamp("nextServiceDate"),
  currentDeliveries: int("currentDeliveries").default(0),
  totalDeliveries: int("totalDeliveries").default(0),
  totalEarnings: decimal("totalEarnings", { precision: 15, scale: 2 }).default("0.00"),
  monthlyEarnings: decimal("monthlyEarnings", { precision: 15, scale: 2 }).default("0.00"),
  lastLocationLatitude: decimal("lastLocationLatitude", { precision: 10, scale: 8 }),
  lastLocationLongitude: decimal("lastLocationLongitude", { precision: 11, scale: 8 }),
  lastLocationUpdate: timestamp("lastLocationUpdate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FleetVehicle = typeof fleetVehicles.$inferSelect;
export type InsertFleetVehicle = typeof fleetVehicles.$inferInsert;

/**
 * Fleet Drivers - Driver management for fleet
 */
export const fleetDrivers = mysqlTable("fleet_drivers", {
  id: int("id").autoincrement().primaryKey(),
  fleetId: int("fleetId").notNull(),
  userId: int("userId").notNull(), // Driver user ID
  driverName: varchar("driverName", { length: 255 }).notNull(),
  licenseNumber: varchar("licenseNumber", { length: 50 }).notNull().unique(),
  licenseExpiryDate: timestamp("licenseExpiryDate").notNull(),
  saIdNumber: varchar("saIdNumber", { length: 20 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended", "removed"]).default("active").notNull(),
  trustScore: decimal("trustScore", { precision: 5, scale: 2 }).default("5.00"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  totalDeliveries: int("totalDeliveries").default(0),
  completedDeliveries: int("completedDeliveries").default(0),
  cancelledDeliveries: int("cancelledDeliveries").default(0),
  totalEarnings: decimal("totalEarnings", { precision: 15, scale: 2 }).default("0.00"),
  monthlyEarnings: decimal("monthlyEarnings", { precision: 15, scale: 2 }).default("0.00"),
  acceptanceRate: decimal("acceptanceRate", { precision: 5, scale: 2 }).default("0.00"),
  completionRate: decimal("completionRate", { precision: 5, scale: 2 }).default("0.00"),
  currentStatus: mysqlEnum("currentStatus", ["offline", "online", "on_delivery", "on_break"]).default("offline").notNull(),
  lastLocationLatitude: decimal("lastLocationLatitude", { precision: 10, scale: 8 }),
  lastLocationLongitude: decimal("lastLocationLongitude", { precision: 11, scale: 8 }),
  lastLocationUpdate: timestamp("lastLocationUpdate"),
  backgroundCheckStatus: mysqlEnum("backgroundCheckStatus", ["pending", "verified", "failed"]).default("pending").notNull(),
  backgroundCheckDate: timestamp("backgroundCheckDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FleetDriver = typeof fleetDrivers.$inferSelect;
export type InsertFleetDriver = typeof fleetDrivers.$inferInsert;

/**
 * Fleet Deliveries - Delivery assignments for fleet vehicles
 */
export const fleetDeliveries = mysqlTable("fleet_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  fleetId: int("fleetId").notNull(),
  vehicleId: int("vehicleId").notNull(),
  driverId: int("driverId").notNull(),
  deliveryId: int("deliveryId").notNull(), // Reference to main deliveries table
  assignmentMode: mysqlEnum("assignmentMode", ["automatic", "manual"]).notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  completedAt: timestamp("completedAt"),
  aiMatchScore: decimal("aiMatchScore", { precision: 5, scale: 2 }), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FleetDelivery = typeof fleetDeliveries.$inferSelect;
export type InsertFleetDelivery = typeof fleetDeliveries.$inferInsert;

/**
 * Fleet Trust Score History - Track trust score changes over time
 */
export const fleetTrustScoreHistory = mysqlTable("fleet_trust_score_history", {
  id: int("id").autoincrement().primaryKey(),
  fleetId: int("fleetId").notNull(),
  previousScore: decimal("previousScore", { precision: 5, scale: 2 }).notNull(),
  newScore: decimal("newScore", { precision: 5, scale: 2 }).notNull(),
  changeReason: varchar("changeReason", { length: 255 }).notNull(),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FleetTrustScoreHistory = typeof fleetTrustScoreHistory.$inferSelect;
export type InsertFleetTrustScoreHistory = typeof fleetTrustScoreHistory.$inferInsert;

/**
 * Fleet Performance Metrics - Daily/Weekly/Monthly metrics
 */
export const fleetPerformanceMetrics = mysqlTable("fleet_performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  fleetId: int("fleetId").notNull(),
  metricDate: date("metricDate").notNull(),
  deliveriesCompleted: int("deliveriesCompleted").default(0),
  deliveriesCancelled: int("deliveriesCancelled").default(0),
  deliveriesPending: int("deliveriesPending").default(0),
  totalRevenue: decimal("totalRevenue", { precision: 15, scale: 2 }).default("0.00"),
  platformFees: decimal("platformFees", { precision: 15, scale: 2 }).default("0.00"),
  netRevenue: decimal("netRevenue", { precision: 15, scale: 2 }).default("0.00"),
  averageDeliveryTime: int("averageDeliveryTime"), // in minutes
  vehicleUtilization: decimal("vehicleUtilization", { precision: 5, scale: 2 }).default("0.00"), // percentage
  driverUtilization: decimal("driverUtilization", { precision: 5, scale: 2 }).default("0.00"), // percentage
  customerSatisfaction: decimal("customerSatisfaction", { precision: 5, scale: 2 }).default("5.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FleetPerformanceMetrics = typeof fleetPerformanceMetrics.$inferSelect;
export type InsertFleetPerformanceMetrics = typeof fleetPerformanceMetrics.$inferInsert;

/**
 * Fleet Earnings - Detailed earnings breakdown
 */
export const fleetEarnings = mysqlTable("fleet_earnings", {
  id: int("id").autoincrement().primaryKey(),
  fleetId: int("fleetId").notNull(),
  deliveryId: int("deliveryId").notNull(),
  grossAmount: decimal("grossAmount", { precision: 12, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 12, scale: 2 }).notNull(),
  netAmount: decimal("netAmount", { precision: 12, scale: 2 }).notNull(),
  earningDate: date("earningDate").notNull(),
  payoutStatus: mysqlEnum("payoutStatus", ["pending", "processed", "failed"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FleetEarning = typeof fleetEarnings.$inferSelect;
export type InsertFleetEarning = typeof fleetEarnings.$inferInsert;

/**
 * Fleet Notifications - Notification tracking for fleet owners
 */
export const fleetNotifications = mysqlTable("fleet_notifications", {
  id: int("id").autoincrement().primaryKey(),
  fleetId: int("fleetId").notNull(),
  notificationType: mysqlEnum("notificationType", ["delivery_available", "delivery_completed", "customer_review", "document_expiring", "maintenance_due", "driver_offline", "payout_processed", "system_alert"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedEntityId: int("relatedEntityId"), // Vehicle ID, Driver ID, Delivery ID, etc.
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FleetNotification = typeof fleetNotifications.$inferSelect;
export type InsertFleetNotification = typeof fleetNotifications.$inferInsert;

/**
 * Fleet AI Recommendations - AI Business Coach suggestions
 */
export const fleetAiRecommendations = mysqlTable("fleet_ai_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  fleetId: int("fleetId").notNull(),
  recommendationType: varchar("recommendationType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  estimatedImpact: varchar("estimatedImpact", { length: 255 }),
  actionItems: json("actionItems"), // Array of action items
  isImplemented: boolean("isImplemented").default(false).notNull(),
  implementedAt: timestamp("implementedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FleetAiRecommendation = typeof fleetAiRecommendations.$inferSelect;
export type InsertFleetAiRecommendation = typeof fleetAiRecommendations.$inferInsert;

/**
 * Fleet Referrals - Referral program for fleet growth
 */
export const fleetReferrals = mysqlTable("fleet_referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerFleetId: int("referrerFleetId").notNull(),
  referralType: mysqlEnum("referralType", ["fleet_partner", "individual_partner", "business_customer", "regular_customer"]).notNull(),
  refereeId: int("refereeId"), // User ID of referred person
  refereeEmail: varchar("refereeEmail", { length: 320 }),
  referralCode: varchar("referralCode", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "completed", "failed"]).default("pending").notNull(),
  rewardAmount: decimal("rewardAmount", { precision: 12, scale: 2 }).default("0.00"),
  rewardType: mysqlEnum("rewardType", ["credit", "cash", "recognition"]).default("credit").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FleetReferral = typeof fleetReferrals.$inferSelect;
export type InsertFleetReferral = typeof fleetReferrals.$inferInsert;


/**
 * Delivery Runs - an ordered route for one courier and multiple parcels.
 */
export const deliveryRuns = mysqlTable("delivery_runs", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  status: mysqlEnum("status", ["planned", "active", "completed", "cancelled"]).default("planned").notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliveryRun = typeof deliveryRuns.$inferSelect;
export type InsertDeliveryRun = typeof deliveryRuns.$inferInsert;

/**
 * Delivery Run Stops - one ordered parcel stop in a delivery run.
 * The delivery's trackingCode is the barcode printed on the parcel.
 */
export const deliveryRunStops = mysqlTable("delivery_run_stops", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").notNull(),
  deliveryId: int("deliveryId").notNull(),
  sequence: int("sequence").notNull(),
  status: mysqlEnum("status", ["queued", "navigating", "arrived", "awaiting_customer_confirmation", "completed", "failed"]).default("queued").notNull(),
  courierAcceptedAt: timestamp("courierAcceptedAt"),
  courierDeclinedAt: timestamp("courierDeclinedAt"),
  declineReason: varchar("declineReason", { length: 500 }),
  courierArrivedAt: timestamp("courierArrivedAt"),
  pickupCompletedAt: timestamp("pickupCompletedAt"),
  courierCompletedAt: timestamp("courierCompletedAt"),
  customerConfirmedAt: timestamp("customerConfirmedAt"),
  proofPhotoUrl: text("proofPhotoUrl"),
  proofPhotoKey: varchar("proofPhotoKey", { length: 500 }),
  proofPhotoName: varchar("proofPhotoName", { length: 255 }),
  courierNote: text("courierNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliveryRunStop = typeof deliveryRunStops.$inferSelect;
export type InsertDeliveryRunStop = typeof deliveryRunStops.$inferInsert;

/**
 * Courier working zones and AI dispatch allocations.
 */
export const courierWorkZones = mysqlTable("courier_work_zones", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  zoneId: int("zoneId").notNull(),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CourierWorkZone = typeof courierWorkZones.$inferSelect;
export type InsertCourierWorkZone = typeof courierWorkZones.$inferInsert;

export const dispatchRuns = mysqlTable("dispatch_runs", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["draft", "recommended", "committed", "cancelled"]).default("draft").notNull(),
  requestedBy: int("requestedBy").notNull(),
  parcelCount: int("parcelCount").default(0).notNull(),
  assignedCount: int("assignedCount").default(0).notNull(),
  unassignedCount: int("unassignedCount").default(0).notNull(),
  aiSummary: text("aiSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DispatchRun = typeof dispatchRuns.$inferSelect;
export type InsertDispatchRun = typeof dispatchRuns.$inferInsert;

/**
 * Admin-only acceptance harness catalog. Every synthetic record is recorded
 * by exact table/id under a unique namespace so reset never relies on dates,
 * names, or broad production queries.
 */
export const syntheticWaveHarnessRuns = mysqlTable("synthetic_wave_harness_runs", {
  id: int("id").autoincrement().primaryKey(),
  namespace: varchar("namespace", { length: 120 }).notNull().unique(),
  createdBy: int("createdBy").notNull(),
  recordIds: json("recordIds").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SyntheticWaveHarnessRun = typeof syntheticWaveHarnessRuns.$inferSelect;
export type InsertSyntheticWaveHarnessRun = typeof syntheticWaveHarnessRuns.$inferInsert;

export const dispatchAssignments = mysqlTable("dispatch_assignments", {
  id: int("id").autoincrement().primaryKey(),
  dispatchRunId: int("dispatchRunId").notNull(),
  deliveryId: int("deliveryId").notNull(),
  courierId: int("courierId").notNull(),
  sequence: int("sequence").notNull(),
  score: decimal("score", { precision: 7, scale: 2 }).notNull(),
  distanceToPickupKm: decimal("distanceToPickupKm", { precision: 8, scale: 2 }),
  areaMatch: varchar("areaMatch", { length: 100 }),
  reasoning: text("reasoning"),
  status: mysqlEnum("status", ["recommended", "assigned", "rejected", "reassigned"]).default("recommended").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DispatchAssignment = typeof dispatchAssignments.$inferSelect;
export type InsertDispatchAssignment = typeof dispatchAssignments.$inferInsert;

/**
 * Durable operational waves generated from one dispatch recommendation.
 * Financial fields are snapshots only; the parcel ledger remains authoritative.
 */
export const dispatchWaves = mysqlTable("dispatch_waves", {
  id: int("id").autoincrement().primaryKey(),
  dispatchRunId: int("dispatchRunId").notNull(),
  waveNumber: int("waveNumber").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 180 }).notNull().unique(),
  status: mysqlEnum("status", ["planned", "assigned", "ready", "departed", "handover", "in_progress", "completed", "failed", "recovery", "settled", "cancelled"]).default("planned").notNull(),
  parcelCount: int("parcelCount").notNull().default(0),
  courierCount: int("courierCount").notNull().default(0),
  totalWeightKg: decimal("totalWeightKg", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalVolumeM3: decimal("totalVolumeM3", { precision: 12, scale: 4 }).notNull().default("0.0000"),
  capacityUnits: int("capacityUnits"),
  capacityWeightKg: decimal("capacityWeightKg", { precision: 12, scale: 2 }),
  capacityVolumeM3: decimal("capacityVolumeM3", { precision: 12, scale: 4 }),
  routeDistanceKm: decimal("routeDistanceKm", { precision: 12, scale: 2 }).notNull().default("0.00"),
  routeDurationMinutes: int("routeDurationMinutes").notNull().default(0),
  departureSequence: int("departureSequence").notNull().default(1),
  departureOffsetMinutes: int("departureOffsetMinutes").notNull().default(0),
  customerCharge: decimal("customerCharge", { precision: 12, scale: 2 }).notNull().default("0.00"),
  platformAllocation: decimal("platformAllocation", { precision: 12, scale: 2 }).notNull().default("0.00"),
  courierPoolAllocation: decimal("courierPoolAllocation", { precision: 12, scale: 2 }).notNull().default("0.00"),
  reservedAmount: decimal("reservedAmount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  estimatedCost: decimal("estimatedCost", { precision: 12, scale: 2 }).notNull().default("0.00"),
  estimatedCourierGross: decimal("estimatedCourierGross", { precision: 12, scale: 2 }).notNull().default("0.00"),
  estimatedCourierNet: decimal("estimatedCourierNet", { precision: 12, scale: 2 }).notNull().default("0.00"),
  routeSnapshot: json("routeSnapshot"),
  failureReason: text("failureReason"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  settledAt: timestamp("settledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DispatchWave = typeof dispatchWaves.$inferSelect;
export type InsertDispatchWave = typeof dispatchWaves.$inferInsert;

export const dispatchWaveParcels = mysqlTable("dispatch_wave_parcels", {
  id: int("id").autoincrement().primaryKey(),
  waveId: int("waveId").notNull(),
  deliveryId: int("deliveryId").notNull(),
  sequence: int("sequence").notNull(),
  status: mysqlEnum("status", ["planned", "assigned", "in_progress", "completed", "failed", "recovery", "settled"]).default("planned").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 180 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DispatchWaveParcel = typeof dispatchWaveParcels.$inferSelect;
export type InsertDispatchWaveParcel = typeof dispatchWaveParcels.$inferInsert;

export const dispatchWaveCouriers = mysqlTable("dispatch_wave_couriers", {
  id: int("id").autoincrement().primaryKey(),
  waveId: int("waveId").notNull(),
  courierId: int("courierId").notNull(),
  role: mysqlEnum("role", ["primary", "relay", "replacement"]).default("primary").notNull(),
  status: mysqlEnum("status", ["assigned", "accepted", "cancelled", "failed", "completed"]).default("assigned").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 180 }).notNull().unique(),
  acceptedAt: timestamp("acceptedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DispatchWaveCourier = typeof dispatchWaveCouriers.$inferSelect;
export type InsertDispatchWaveCourier = typeof dispatchWaveCouriers.$inferInsert;

export const dispatchWaveRelayLegs = mysqlTable("dispatch_wave_relay_legs", {
  id: int("id").autoincrement().primaryKey(),
  waveId: int("waveId").notNull(),
  relayLegId: int("relayLegId").notNull(),
  sequence: int("sequence").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 180 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DispatchWaveRelayLeg = typeof dispatchWaveRelayLegs.$inferSelect;
export type InsertDispatchWaveRelayLeg = typeof dispatchWaveRelayLegs.$inferInsert;

export const dispatchWaveRunLinks = mysqlTable("dispatch_wave_run_links", {
  id: int("id").autoincrement().primaryKey(),
  waveId: int("waveId").notNull(),
  deliveryRunId: int("deliveryRunId").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 180 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DispatchWaveRunLink = typeof dispatchWaveRunLinks.$inferSelect;
export type InsertDispatchWaveRunLink = typeof dispatchWaveRunLinks.$inferInsert;

export const dispatchWaveSettlementLinks = mysqlTable("dispatch_wave_settlement_links", {
  id: int("id").autoincrement().primaryKey(),
  waveId: int("waveId").notNull(),
  settlementAllocationId: int("settlementAllocationId").notNull(),
  deliveryId: int("deliveryId").notNull(),
  courierId: int("courierId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  idempotencyKey: varchar("idempotencyKey", { length: 180 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DispatchWaveSettlementLink = typeof dispatchWaveSettlementLinks.$inferSelect;
export type InsertDispatchWaveSettlementLink = typeof dispatchWaveSettlementLinks.$inferInsert;

export const dispatchWaveEvents = mysqlTable("dispatch_wave_events", {
  id: int("id").autoincrement().primaryKey(),
  waveId: int("waveId").notNull(),
  eventKey: varchar("eventKey", { length: 200 }).notNull().unique(),
  fromStatus: varchar("fromStatus", { length: 30 }),
  toStatus: varchar("toStatus", { length: 30 }).notNull(),
  actorUserId: int("actorUserId"),
  reason: text("reason"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DispatchWaveEvent = typeof dispatchWaveEvents.$inferSelect;
export type InsertDispatchWaveEvent = typeof dispatchWaveEvents.$inferInsert;

export const dispatchWaveRecoveryActions = mysqlTable("dispatch_wave_recovery_actions", {
  id: int("id").autoincrement().primaryKey(),
  waveId: int("waveId").notNull(),
  exceptionId: int("exceptionId"),
  originalCourierId: int("originalCourierId"),
  replacementCourierId: int("replacementCourierId"),
  status: mysqlEnum("status", ["requested", "offered", "accepted", "completed", "failed", "cancelled"]).default("requested").notNull(),
  reason: text("reason").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 200 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DispatchWaveRecoveryAction = typeof dispatchWaveRecoveryActions.$inferSelect;
export type InsertDispatchWaveRecoveryAction = typeof dispatchWaveRecoveryActions.$inferInsert;

export const dispatchRunReconciliations = mysqlTable("dispatch_run_reconciliations", {
  id: int("id").autoincrement().primaryKey(),
  dispatchRunId: int("dispatchRunId").notNull().unique(),
  expectedWaves: int("expectedWaves").notNull().default(0),
  completedWaves: int("completedWaves").notNull().default(0),
  settledWaves: int("settledWaves").notNull().default(0),
  customerCharge: decimal("customerCharge", { precision: 12, scale: 2 }).notNull().default("0.00"),
  platformAllocation: decimal("platformAllocation", { precision: 12, scale: 2 }).notNull().default("0.00"),
  courierPoolAllocation: decimal("courierPoolAllocation", { precision: 12, scale: 2 }).notNull().default("0.00"),
  linkedCourierAllocations: decimal("linkedCourierAllocations", { precision: 12, scale: 2 }).notNull().default("0.00"),
  status: mysqlEnum("status", ["open", "blocked", "complete"]).default("open").notNull(),
  blockingReason: text("blockingReason"),
  reconciledAt: timestamp("reconciledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DispatchRunReconciliation = typeof dispatchRunReconciliations.$inferSelect;
export type InsertDispatchRunReconciliation = typeof dispatchRunReconciliations.$inferInsert;


/**
 * Peer-to-peer relay legs. A parcel may travel through multiple couriers before final delivery.
 */
export const deliveryRelayLegs = mysqlTable("delivery_relay_legs", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  sequence: int("sequence").notNull(),
  originArea: varchar("originArea", { length: 120 }).notNull(),
  destinationArea: varchar("destinationArea", { length: 120 }).notNull(),
  handoffPointId: int("handoffPointId"),
  handoffMode: mysqlEnum("handoffMode", ["designated_point", "courier_meeting"]).default("courier_meeting").notNull(),
  meetingAddress: varchar("meetingAddress", { length: 500 }),
  meetingLatitude: decimal("meetingLatitude", { precision: 10, scale: 7 }),
  meetingLongitude: decimal("meetingLongitude", { precision: 10, scale: 7 }),
  roadDistanceKm: decimal("roadDistanceKm", { precision: 10, scale: 2 }),
  routeDurationMinutes: int("routeDurationMinutes"),
  routePolyline: text("routePolyline"),
  tollsZar: decimal("tollsZar", { precision: 12, scale: 2 }).default("0.00"),
  handoverTimeMinutes: int("handoverTimeMinutes").default(0),
  deadheadKm: decimal("deadheadKm", { precision: 10, scale: 2 }).default("0.00"),
  returnKm: decimal("returnKm", { precision: 10, scale: 2 }).default("0.00"),
  availableBackhaul: boolean("availableBackhaul").default(false),
  backhaulRevenueZar: decimal("backhaulRevenueZar", { precision: 12, scale: 2 }).default("0.00"),
  handoffConfirmedByFrom: timestamp("handoffConfirmedByFrom"),
  handoffConfirmedByTo: timestamp("handoffConfirmedByTo"),
  fromCourierId: int("fromCourierId"),
  toCourierId: int("toCourierId"),
  status: mysqlEnum("status", ["planned", "offered", "accepted", "in_transit", "handoff_pending", "handed_off", "final_delivery", "completed", "declined", "failed"]).default("planned").notNull(),
  currentCustodianId: int("currentCustodianId"),
  acceptedAt: timestamp("acceptedAt"),
  pickupAt: timestamp("pickupAt"),
  handedOffAt: timestamp("handedOffAt"),
  completedAt: timestamp("completedAt"),
  pickupProofPhotoUrl: text("pickupProofPhotoUrl"),
  handoffProofPhotoUrl: text("handoffProofPhotoUrl"),
  completionProofPhotoUrl: text("completionProofPhotoUrl"),
  proofPhotoKey: varchar("proofPhotoKey", { length: 500 }),
  courierNote: text("courierNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DeliveryRelayLeg = typeof deliveryRelayLegs.$inferSelect;
export type InsertDeliveryRelayLeg = typeof deliveryRelayLegs.$inferInsert;

/**
 * Offers used to transfer custody to the next area-compatible courier.
 */
export const courierHandoffOffers = mysqlTable("courier_handoff_offers", {
  id: int("id").autoincrement().primaryKey(),
  relayLegId: int("relayLegId").notNull(),
  offeredByCourierId: int("offeredByCourierId").notNull(),
  offeredToCourierId: int("offeredToCourierId").notNull(),
  status: mysqlEnum("status", ["offered", "accepted", "declined", "expired", "cancelled"]).default("offered").notNull(),
  reason: varchar("reason", { length: 500 }),
  expiresAt: timestamp("expiresAt"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CourierHandoffOffer = typeof courierHandoffOffers.$inferSelect;
export type InsertCourierHandoffOffer = typeof courierHandoffOffers.$inferInsert;


/**
 * Approved public locations used for safe courier-to-courier parcel handoffs.
 */
export const relayHandoffPoints = mysqlTable("relay_handoff_points", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  area: varchar("area", { length: 120 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  safetyNotes: text("safetyNotes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RelayHandoffPoint = typeof relayHandoffPoints.$inferSelect;
export type InsertRelayHandoffPoint = typeof relayHandoffPoints.$inferInsert;

/**
 * Operational exception events for relay delays, failed handoffs, custody reviews,
 * and recovery requests. A shipment remains auditable from the original leg
 * through any replacement leg.
 */
export const relayExceptionEvents = mysqlTable("relay_exception_events", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull().references(() => deliveries.id),
  relayLegId: int("relayLegId").references(() => deliveryRelayLegs.id),
  reportedByUserId: int("reportedByUserId").notNull().references(() => users.id),
  currentCustodianId: int("currentCustodianId").references(() => users.id),
  type: mysqlEnum("type", [
    "courier_delayed",
    "receiving_courier_delayed",
    "handoff_failed",
    "address_clarification",
    "recipient_unavailable",
    "connectivity_concern",
    "custody_review",
  ]).notNull(),
  status: mysqlEnum("status", ["open", "recovery_requested", "resolved", "cancelled"]).default("open").notNull(),
  recoveryAction: mysqlEnum("recoveryAction", ["wait_and_retry", "safe_hold", "request_replacement", "operations_review"]),
  reason: varchar("reason", { length: 500 }).notNull(),
  note: text("note"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 11, scale: 7 }),
  evidencePhotoUrl: text("evidencePhotoUrl"),
  evidencePhotoKey: varchar("evidencePhotoKey", { length: 500 }),
  customerNotifiedAt: timestamp("customerNotifiedAt"),
  resolvedByUserId: int("resolvedByUserId").references(() => users.id),
  resolutionNote: text("resolutionNote"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RelayExceptionEvent = typeof relayExceptionEvents.$inferSelect;
export type InsertRelayExceptionEvent = typeof relayExceptionEvents.$inferInsert;


/**
 * Backend-authoritative SmartStack recommendation snapshots. The route and
 * economics are stored so the courier sees the same decision the optimizer made.
 */
export const smartStackRecommendations = mysqlTable("smart_stack_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["recommended", "accepted", "declined", "expired", "replaced"]).default("recommended").notNull(),
  stackScore: decimal("stackScore", { precision: 7, scale: 2 }).notNull(),
  totalDistanceKm: decimal("totalDistanceKm", { precision: 10, scale: 2 }).notNull(),
  totalTimeMinutes: int("totalTimeMinutes").notNull(),
  grossEarnings: decimal("grossEarnings", { precision: 12, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 12, scale: 2 }).notNull(),
  estimatedFuel: decimal("estimatedFuel", { precision: 12, scale: 2 }).notNull(),
  estimatedCourierNet: decimal("estimatedCourierNet", { precision: 12, scale: 2 }).notNull(),
  capacityUsedUnits: int("capacityUsedUnits").notNull(),
  capacityUnits: int("capacityUnits").notNull(),
  deadlineRisk: mysqlEnum("deadlineRisk", ["low", "medium", "high", "critical"]).notNull(),
  emptyKilometres: decimal("emptyKilometres", { precision: 10, scale: 2 }).default("0.00").notNull(),
  routeStops: json("routeStops").notNull(),
  selectionReason: text("selectionReason"),
  expiresAt: timestamp("expiresAt"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SmartStackRecommendation = typeof smartStackRecommendations.$inferSelect;
export type InsertSmartStackRecommendation = typeof smartStackRecommendations.$inferInsert;

/**
 * Optional, event-driven additions that can be accepted without penalising a decline.
 */
export const smartAddonOpportunities = mysqlTable("smart_addon_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  recommendationId: int("recommendationId"),
  courierId: int("courierId").notNull().references(() => users.id),
  deliveryId: int("deliveryId").notNull().references(() => deliveries.id),
  status: mysqlEnum("status", ["offered", "accepted", "declined", "expired", "cancelled"]).default("offered").notNull(),
  additionalDistanceKm: decimal("additionalDistanceKm", { precision: 10, scale: 2 }).notNull(),
  additionalTimeMinutes: int("additionalTimeMinutes").notNull(),
  additionalPayout: decimal("additionalPayout", { precision: 12, scale: 2 }).notNull(),
  deadlineRisk: mysqlEnum("deadlineRisk", ["low", "medium", "high", "critical"]).notNull(),
  score: decimal("score", { precision: 7, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  expiresAt: timestamp("expiresAt"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SmartAddonOpportunity = typeof smartAddonOpportunities.$inferSelect;
export type InsertSmartAddonOpportunity = typeof smartAddonOpportunities.$inferInsert;

/**
 * Auditable SmartMatch decisions and outcomes for operations and future model training.
 */
export const smartMatchAudits = mysqlTable("smart_match_audits", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull().references(() => users.id),
  deliveryId: int("deliveryId").notNull().references(() => deliveries.id),
  recommendationId: int("recommendationId"),
  matchScore: decimal("matchScore", { precision: 7, scale: 2 }).notNull(),
  routeCompatibilityScore: decimal("routeCompatibilityScore", { precision: 7, scale: 2 }).notNull(),
  deadlineRisk: mysqlEnum("deadlineRisk", ["low", "medium", "high", "critical"]).notNull(),
  decision: mysqlEnum("decision", ["recommended", "accepted", "declined", "rejected", "completed", "cancelled"]).default("recommended").notNull(),
  routeConsidered: json("routeConsidered"),
  reason: text("reason").notNull(),
  outcomeNote: text("outcomeNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SmartMatchAudit = typeof smartMatchAudits.$inferSelect;
export type InsertSmartMatchAudit = typeof smartMatchAudits.$inferInsert;

/**
 * Customer delivery payment sessions. A delivery is created only after
 * Paystack confirms the matching reference as paid.
 */
export const deliveryPaymentSessions = mysqlTable("delivery_payment_sessions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  reference: varchar("reference", { length: 120 }).notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ZAR").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "cancelled"]).default("pending").notNull(),
  bookingData: json("bookingData").notNull(),
  deliveryId: int("deliveryId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  paidAt: timestamp("paidAt"),
});

export type DeliveryPaymentSession = typeof deliveryPaymentSessions.$inferSelect;
export type InsertDeliveryPaymentSession = typeof deliveryPaymentSessions.$inferInsert;
