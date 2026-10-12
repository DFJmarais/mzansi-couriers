import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Zap, TrendingUp, Clock, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import CourierRunWorkflow from "@/components/CourierRunWorkflow";
import CourierRelayOffers from "@/components/CourierRelayOffers";
import CourierSmartStackPanel from "@/components/CourierSmartStackPanel";

export default function CourierDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const courierProfile = trpc.profile.getCourierProfile.useQuery(undefined, {
    enabled: user?.role === "courier",
    retry: false,
  });
  const weeklyEarnings = trpc.smsEarnings.getWeeklyEarnings.useQuery(undefined, {
    enabled: user?.role === "courier",
    retry: false,
  });
  const updateAvailability = trpc.profile.updateAvailability.useMutation({
    onSuccess: (_result, variables) => {
      setIsOnline(variables.isAvailable);
      toast.success(variables.isAvailable ? "You are ready to receive relay offers." : "Your availability is paused for now.");
    },
    onError: () => toast.info("Your availability is taking a moment to update. Please try again."),
  });

  useEffect(() => {
    if (courierProfile.data) setIsOnline(Boolean(courierProfile.data.isAvailable));
  }, [courierProfile.data]);

  const toggleAvailability = () => {
    if (updateAvailability.isPending) return;
    updateAvailability.mutate({ isAvailable: !isOnline });
  };
  // Language managed by LocalizationContext
  // const [currentLanguage, setCurrentLanguage] = useState('en');

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to access the courier dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Allow admin to view courier dashboard for testing/monitoring
  // Only courier and admin roles can access
  if (user?.role !== 'courier' && user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">This dashboard is available to approved courier accounts. Complete your application to get started.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Online Toggle and Language Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">On the road in Mzansi</p>
            <h1 className="text-3xl font-bold">Your delivery day</h1>
            <p className="text-muted-foreground">See paid parcels in your area, follow each route, capture proof, and keep track of your recorded earnings.</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === "courier" ? (
              <>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  isOnline
                    ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700'
                    : 'bg-muted border-border'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`}></div>
                  <span className="text-sm font-semibold">{isOnline ? 'Ready for parcels' : 'Ready when you are'}</span>
                </div>
                <Button
                  size="lg"
                  variant={isOnline ? "default" : "outline"}
                  onClick={toggleAvailability}
                  disabled={updateAvailability.isPending}
                  className="gap-2"
                >
                  {updateAvailability.isPending ? 'Updating…' : isOnline ? 'Pause parcel offers' : 'Start accepting parcels'}
                </Button>
              </>
            ) : (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">Admin preview</span>
            )}
          </div>
        </div>

        {/* Primary delivery workflow */}
        {user?.role === "courier" ? <CourierRunWorkflow /> : <Card><CardContent className="py-6 text-sm text-muted-foreground">Courier delivery actions appear here when signed in as a courier.</CardContent></Card>}
        {user?.role === "courier" && <CourierRelayOffers />}
        {user?.role === "courier" && <CourierSmartStackPanel />}

        <Card className="border-green-200 bg-green-50/70 dark:border-green-800 dark:bg-green-950/30">
          <CardContent className="py-4">
            <p className="font-semibold text-green-950 dark:text-green-100">Courier income is record-based</p>
            <p className="mt-1 text-sm text-green-900/80 dark:text-green-200/80">Your earnings are calculated from eligible completed deliveries and appear in the earnings dashboard after verification.</p>
          </CardContent>
        </Card>

        {/* Payout status */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950 dark:to-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Earnings and payouts
            </CardTitle>
            <CardDescription>Verified courier earnings are processed by Paystack once a week, normally on Thursday or Friday.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              Keep your banking details verified so your completed-delivery earnings can be included in the weekly payout review. Your available work and income depend on the parcels you accept.
            </p>
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={() => { window.location.href = "/courier/earnings"; }}>
              <Zap className="h-4 w-4" />
              View earnings and payout status
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: "Today's Earnings", value: "R0", subtext: "Your first delivery will appear here" },
            { icon: Clock, label: "Active Deliveries", value: "0", subtext: "Your active work will appear here" },
            { icon: Zap, label: "Total Deliveries", value: "0", subtext: "Complete eligible deliveries to grow your recorded earnings" }
          ].map((stat, i) => (
            <Card key={i} className="border-border/50 hover:border-accent/50 transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-2">{stat.subtext}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Relay network status */}
        <Card className="border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/30">
          <CardContent className="flex items-start gap-3 py-4">
            <Navigation className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div><p className="font-semibold text-blue-950 dark:text-blue-100">Relay network coordination</p><p className="mt-1 text-sm text-blue-900/80 dark:text-blue-200/80">Stay online and keep location access on. Parcel offers and relay handoffs appear in the route above when they match your working area and capacity.</p></div>
          </CardContent>
        </Card>

        {/* Earnings Summary */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recorded weekly earnings</h2>
          {user?.role !== "courier" ? (
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Weekly earnings are available to courier accounts.</p></CardContent></Card>
          ) : weeklyEarnings.isLoading ? (
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Loading your recorded earnings…</p></CardContent></Card>
          ) : weeklyEarnings.data?.weeks?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {weeklyEarnings.data.weeks.map((week) => (
                <Card key={week.periodDate} className="border-border/50">
                  <CardContent className="space-y-2 pt-6">
                    <p className="text-sm font-semibold text-muted-foreground">Week beginning {week.periodDate}</p>
                    <p className="text-2xl font-bold">R{Number(week.totalEarnings || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{week.completedDeliveries || 0} completed deliveries</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Your recorded earnings will grow here as eligible deliveries are completed and verified.</p></CardContent></Card>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
