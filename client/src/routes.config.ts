import { lazy } from "react";

/**
 * Route-based code splitting configuration for the active core product.
 * Nonessential referral, leaderboard, outreach, support-bot, automation,
 * and analytics-demo screens are intentionally not registered here.
 */

export const CoreRoutes = {
  Home: lazy(() => import("./pages/Home")),
  AdminLogin: lazy(() => import("./pages/AdminLogin")),
  Onboarding: lazy(() => import("./pages/Onboarding")),
  NotFound: lazy(() => import("./pages/NotFound")),
};

export const CustomerRoutes = {
  CustomerDashboard: lazy(() => import("./pages/CustomerDashboard")),
  DeliveryTracking: lazy(() => import("./pages/DeliveryTracking")),
  UserProfile: lazy(() => import("./pages/UserProfile")),
};

export const CourierRoutes = {
  CourierDashboard: lazy(() => import("./pages/CourierDashboard")),
  CourierOnboarding: lazy(() => import("./pages/CourierOnboarding")),
  CourierEarnings: lazy(() => import("./pages/CourierEarnings")),
};

export const AdminRoutes = {
  AdminDashboard: lazy(() => import("./pages/AdminDashboard")),
  AdminOnboarding: lazy(() => import("./pages/AdminOnboarding")),
  SurgePricingAdmin: lazy(() => import("./pages/SurgePricingAdmin")),
};
