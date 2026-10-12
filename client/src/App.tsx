import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocalizationProvider } from "./contexts/LocalizationContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import CourierOnboarding from "./pages/CourierOnboarding";
import AdminOnboarding from "./pages/AdminOnboarding";
import AdminCourierDashboard from "./pages/AdminCourierDashboard";
import AdminCourierProfile from "./pages/AdminCourierProfile";
import AdminCourierEnquiries from "./pages/AdminCourierEnquiries";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerMobileHome from "./pages/CustomerMobileHome";
import CourierDashboard from "./pages/CourierDashboard";
import CourierMobileHome from "./pages/CourierMobileHome";
import AdminDashboard from "./pages/AdminDashboard";
import CourierEarnings from "./pages/CourierEarnings";
import SurgePricingAdmin from "./pages/SurgePricingAdmin";
import AdminLogin from "./pages/AdminLogin";
import AdminPortal from "./pages/AdminPortal";
import AdminResetPassword from "./pages/AdminResetPassword";
import Legal from "./pages/Legal";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Refund from "./pages/Refund";
import Support from "./pages/Support";
import { BecomeDriver } from "./pages/BecomeDriver";
import CourierApplication from "./pages/CourierApplication";
import DeliveryTracking from "./pages/DeliveryTracking";
import DeliveryConfirmation from "./pages/DeliveryConfirmation";
import PackagingRequirements from "./pages/PackagingRequirements";
import FleetPartnerHome from "./pages/FleetPartnerHome";
import FleetOnboarding from "./pages/FleetOnboarding";
import FleetDashboard from "./pages/FleetDashboard";
import FleetCommandCentre from "./pages/FleetCommandCentre";
import { PaymentInitializer } from "./components/PaymentInitializer";
import AuthEntry from "./pages/AuthEntry";
import AccountSettings from "./pages/AccountSettings";
import Settings from "./pages/Settings";
import CourierSafetyCenter from "./pages/CourierSafetyCenter";
import AdminSafetyIncidents from "./pages/AdminSafetyIncidents";
import PublicFeatureGate from "./components/PublicFeatureGate";

function PublicBookingRoute() {
  return <PublicFeatureGate featureKey="customer_booking" title="Customer bookings are opening soon" description="We are currently focused on onboarding verified couriers and drivers. Customer package booking will be available when this feature is made public."><CustomerDashboard /></PublicFeatureGate>;
}

function PublicTrackingRoute() {
  return <PublicFeatureGate featureKey="package_tracking" title="Package tracking is opening soon" description="Tracking is being prepared for the public launch. Courier and driver onboarding remains available while we complete the delivery network."><DeliveryTracking /></PublicFeatureGate>;
}

function PublicFleetRoute() {
  return <PublicFeatureGate featureKey="fleet_registration" title="Fleet registration is opening soon" description="Fleet operations are being prepared for the public launch. Courier onboarding remains available for independent drivers."><FleetPartnerHome /></PublicFeatureGate>;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/auth" component={AuthEntry} />
      <Route path="/settings/account" component={AccountSettings} />
      <Route path="/settings" component={Settings} />
      <Route path="/courier/safety" component={CourierSafetyCenter} />
      <Route path="/admin/safety-incidents" component={AdminSafetyIncidents} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/reset-password" component={AdminResetPassword} />
      <Route path="/admin" component={AdminPortal} />
      <Route path="/admin/dispatch" component={AdminDashboard} />
      <Route path="/admin/relay-exceptions" component={AdminDashboard} />
      <Route path="/admin/couriers" component={AdminCourierDashboard} />
      <Route path="/admin/couriers/:userId" component={AdminCourierProfile} />
      <Route path="/admin/courier-enquiries" component={AdminCourierEnquiries} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path={"/courier/onboarding"} component={CourierOnboarding} />
      <Route path={"/courier-signup"} component={CourierOnboarding} />
      <Route path={"/admin/onboarding"} component={AdminOnboarding} />
      <Route path={"/customer/onboarding"} component={Onboarding} />
      <Route path={"/customer/dashboard"} component={CustomerDashboard} />
      <Route path={"/customer/mobile"} component={CustomerMobileHome} />
      <Route path={"/send"} component={PublicBookingRoute} />
      <Route path={"/customer/send-package"} component={PublicBookingRoute} />
      <Route path={"/courier/dashboard"} component={CourierDashboard} />
      <Route path={"/courier/mobile"} component={CourierMobileHome} />
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/courier/earnings"} component={CourierEarnings} />
      <Route path={"/admin/surge-pricing"} component={SurgePricingAdmin} />
      <Route path="/legal" component={Legal} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/refund" component={Refund} />
      <Route path="/support" component={Support} />
      <Route path="/become-driver" component={BecomeDriver} />
      <Route path="/courier/apply" component={CourierApplication} />
      <Route path="/track" component={PublicTrackingRoute} />
      <Route path="/delivery/confirm/:deliveryId" component={DeliveryConfirmation} />
      <Route path="/packaging-requirements" component={PackagingRequirements} />
      <Route path="/fleet" component={PublicFleetRoute} />
      <Route path="/fleet/onboarding" component={FleetOnboarding} />
      <Route path="/fleet/dashboard" component={FleetCommandCentre} />
      <Route path="/fleet/command-centre" component={FleetCommandCentre} />
      <Route path="/fleet/drivers" component={FleetCommandCentre} />
      <Route path="/fleet/deliveries" component={FleetCommandCentre} />
      <Route path="/fleet/settings" component={FleetCommandCentre} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <LocalizationProvider>
          <TooltipProvider>
            <PaymentInitializer />
            <Toaster />
            <Router />
          </TooltipProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
