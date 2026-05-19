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
import CustomerDashboard from "./pages/CustomerDashboard";
import CourierDashboard from "./pages/CourierDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CourierEarnings from "./pages/CourierEarnings";
import CourierPerformance from "./pages/CourierPerformance";
import ReferralStars from "./pages/ReferralStars";
import SurgePricingPage from "./pages/SurgePricingInfo";
import SurgePricingAdmin from "./pages/SurgePricingAdmin";
import ReferralLeaderboard from "./pages/ReferralLeaderboard";
import AdminAnalyticsDashboard from "./pages/AdminAnalyticsDashboard";
import AdminLogin from "./pages/AdminLogin";
import AutomationMonitoring from "./pages/AutomationMonitoring";
import SupportBotDashboard from "./pages/SupportBotDashboard";
import OutreachCampaigns from "./pages/OutreachCampaigns";
import Legal from "./pages/Legal";

function Router() {
  return (
    <Switch>
      <Route path={""} component={Home} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/courier/onboarding"} component={CourierOnboarding} />
      <Route path={"/admin/onboarding"} component={AdminOnboarding} />
      <Route path={"/customer/dashboard"} component={CustomerDashboard} />
      <Route path={"/courier/dashboard"} component={CourierDashboard} />
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/courier/earnings"} component={CourierEarnings} />
      <Route path={"/courier/performance"} component={CourierPerformance} />
      <Route path={"/referral/stars"} component={ReferralStars} />
      <Route path={"/pricing/surge"} component={SurgePricingPage} />
      <Route path={"/admin/surge-pricing"} component={SurgePricingAdmin} />
      <Route path={"/referral/leaderboard"} component={ReferralLeaderboard} />
      <Route path="/admin/analytics" component={AdminAnalyticsDashboard} />
      <Route path="/admin/automation" component={AutomationMonitoring} />
      <Route path="/admin/support-bot" component={SupportBotDashboard} />
      <Route path="/admin/outreach" component={OutreachCampaigns} />
      <Route path="/legal" component={Legal} />
      <Route path="/terms" component={Legal} />
      <Route path="/privacy" component={Legal} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LocalizationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
