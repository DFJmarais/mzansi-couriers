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
  code: varchar("code", { length: 20 }).notNull().unique(),
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
