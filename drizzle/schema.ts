import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Courier profiles - extended information for courier role users
 */
export const courierProfiles = mysqlTable("courier_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  vehicleType: mysqlEnum("vehicleType", ["motorbike", "car", "van", "bakkie"]).notNull(),
  vehicleRegistration: varchar("vehicleRegistration", { length: 50 }).notNull(),
  licenseNumber: varchar("licenseNumber", { length: 50 }).notNull(),
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
  courierId: int("courierId"),
  pickupAddressId: int("pickupAddressId").notNull(),
  dropoffAddressId: int("dropoffAddressId").notNull(),
  pickupLatitude: decimal("pickupLatitude", { precision: 10, scale: 8 }).notNull(),
  pickupLongitude: decimal("pickupLongitude", { precision: 11, scale: 8 }).notNull(),
  dropoffLatitude: decimal("dropoffLatitude", { precision: 10, scale: 8 }).notNull(),
  dropoffLongitude: decimal("dropoffLongitude", { precision: 11, scale: 8 }).notNull(),
  status: mysqlEnum("status", ["pending", "assigned", "in-transit", "delivered"]).default("pending").notNull(),
  packageSize: mysqlEnum("packageSize", ["small", "medium", "large"]).notNull(),
  packageWeight: decimal("packageWeight", { precision: 8, scale: 2 }).notNull(), // in kg
  packageDescription: text("packageDescription"),
  estimatedPrice: decimal("estimatedPrice", { precision: 12, scale: 2 }).notNull(),
  finalPrice: decimal("finalPrice", { precision: 12, scale: 2 }),
  distance: decimal("distance", { precision: 8, scale: 2 }), // in km
  estimatedDeliveryTime: int("estimatedDeliveryTime"), // in minutes
  actualDeliveryTime: timestamp("actualDeliveryTime"),
  proofOfDelivery: json("proofOfDelivery"), // { type: 'photo' | 'signature' | 'otp', data: string }
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;

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
 * Pricing configuration - dynamic pricing based on distance, size, demand
 */
export const pricingConfig = mysqlTable("pricing_config", {
  id: int("id").autoincrement().primaryKey(),
  basePrice: decimal("basePrice", { precision: 12, scale: 2 }).notNull(),
  pricePerKm: decimal("pricePerKm", { precision: 12, scale: 2 }).notNull(),
  smallPackageMultiplier: decimal("smallPackageMultiplier", { precision: 3, scale: 2 }).default("1.00"),
  mediumPackageMultiplier: decimal("mediumPackageMultiplier", { precision: 3, scale: 2 }).default("1.50"),
  largePackageMultiplier: decimal("largePackageMultiplier", { precision: 3, scale: 2 }).default("2.00"),
  peakHourMultiplier: decimal("peakHourMultiplier", { precision: 3, scale: 2 }).default("1.25"),
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
