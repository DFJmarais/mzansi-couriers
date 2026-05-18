import { lazy } from "react";

/**
 * Route-based code splitting configuration
 * Each route is loaded dynamically to reduce initial bundle size
 */

// Core routes (loaded immediately)
export const CoreRoutes = {
  Home: lazy(() => import("./pages/Home")),
  AdminLogin: lazy(() => import("./pages/AdminLogin")),
  Onboarding: lazy(() => import("./pages/Onboarding")),
  NotFound: lazy(() => import("./pages/NotFound")),
};

// Customer routes (lazy loaded)
export const CustomerRoutes = {
  CustomerDashboard: lazy(() => import("./pages/CustomerDashboard")),
  DeliveryTracking: lazy(() => import("./pages/DeliveryTracking")),
  UserProfile: lazy(() => import("./pages/UserProfile")),
};

// Courier routes (lazy loaded)
export const CourierRoutes = {
  CourierDashboard: lazy(() => import("./pages/CourierDashboard")),
  CourierOnboarding: lazy(() => import("./pages/CourierOnboarding")),
  CourierPerformance: lazy(() => import("./pages/CourierPerformance")),
  CourierEarnings: lazy(() => import("./pages/CourierEarnings")),
};

// Admin routes (lazy loaded)
export const AdminRoutes = {
  AdminDashboard: lazy(() => import("./pages/AdminDashboard")),
  AdminOnboarding: lazy(() => import("./pages/AdminOnboarding")),
  AdminAnalyticsDashboard: lazy(() => import("./pages/AdminAnalyticsDashboard")),
  SurgePricingAdmin: lazy(() => import("./pages/SurgePricingAdmin")),
};

// Feature routes (lazy loaded)
export const FeatureRoutes = {
  ReferralLeaderboard: lazy(() => import("./pages/ReferralLeaderboard")),
  ReferralStars: lazy(() => import("./pages/ReferralStars")),
  SupportBotDashboard: lazy(() => import("./pages/SupportBotDashboard")),
  OutreachCampaigns: lazy(() => import("./pages/OutreachCampaigns")),
  AutomationMonitoring: lazy(() => import("./pages/AutomationMonitoring")),
  SurgePricingInfo: lazy(() => import("./pages/SurgePricingInfo")),
};
