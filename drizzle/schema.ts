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
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }),
  speed: decimal("speed", { precision: 8, scale: 2 }), // in km/h
  heading: int("heading"), // 0-360 degrees
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