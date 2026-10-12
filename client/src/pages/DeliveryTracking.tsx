import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Route,
  Share2,
  Package,
  Phone,
  Search,
  Receipt,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const TRACKING_CODE_PATTERN = /^#MZ-[A-Z]{3}\d{3}-[A-Z]{3}$/;

type DeliveryStatus = "pending" | "assigned" | "in-transit" | "delivered";

type TrackingResult = {
  id: number;
  trackingCode: string;
  status: DeliveryStatus;
  pickup: {
    street: string | null;
    city: string | null;
    postalCode: string | null;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    street: string | null;
    city: string | null;
    postalCode: string | null;
    latitude: number;
    longitude: number;
  };
  courier: {
    name: string;
    phone: string | null;
    vehicleType: string | null;
    rating: number | null;
  } | null;
  latestLocation: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: Date;
  } | null;
  packageSize: "small" | "medium" | "large";
  packageWeight: number;
  packageDescription: string | null;
  estimatedDeliveryTime: number | null;
  actualDeliveryTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
  relay: {
    totalLegs: number;
    currentLeg: number | null;
    activeCustodianId: number | null;
    legs: Array<{ sequence: number; originArea: string; destinationArea: string; status: string; handoffMode: string; meetingAddress: string | null; currentCustodianId: number | null }>;
  } | null;
  exceptions: Array<{ type: string; status: string; recoveryAction: string | null; createdAt: Date }>;
};

function getInitialCode() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase() ?? "";
}

function formatAddress(address: TrackingResult["pickup"]) {
  return [address.street, address.city, address.postalCode].filter(Boolean).join(", ") || "Address unavailable";
}

function formatStatus(status: DeliveryStatus) {
  return status.replace("-", " ");
}

function formatVehicleType(vehicleType: string | null) {
  if (!vehicleType) return "Vehicle details unavailable";
  return vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);
}

export default function DeliveryTracking() {
  const [trackingCode, setTrackingCode] = useState(getInitialCode);
  const [submittedCode, setSubmittedCode] = useState(() => {
    const initial = getInitialCode();
    return TRACKING_CODE_PATTERN.test(initial) ? initial : "";
  });
  const [lookupMessage, setLookupMessage] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [mapRetryKey, setMapRetryKey] = useState(0);
  const [routeSummary, setRouteSummary] = useState<{ distanceKm: number; durationMinutes: number } | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundMessage, setRefundMessage] = useState("");

  const trackingQuery = trpc.tracking.getByCode.useQuery(
    { code: submittedCode },
    {
      enabled: Boolean(submittedCode),
      retry: false,
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    },
  );
  const delivery = trackingQuery.data as TrackingResult | undefined;
  const currentUser = trpc.auth.me.useQuery();
  const refundEligibilityInput = useMemo(() => ({ deliveryId: delivery?.id ?? 0 }), [delivery?.id]);
  const refundEligibility = trpc.refunds.eligibility.useQuery(refundEligibilityInput, { enabled: currentUser.data?.role === "customer" && Boolean(delivery?.id), retry: false });
  const requestRefund = trpc.refunds.request.useMutation({
    onSuccess: (result) => { setRefundMessage(`Refund request #${result.requestId} was sent to the Mzansi admin team for review.`); setRefundAmount(""); setRefundReason(""); },
    onError: (error) => setRefundMessage(error.message),
  });

  const routeOrigin = useMemo(
    () => delivery?.latestLocation ?? delivery?.pickup ?? null,
    [delivery?.latestLocation, delivery?.pickup],
  );
  const routeInput = useMemo(
    () => ({
      originLat: routeOrigin?.latitude ?? 0,
      originLng: routeOrigin?.longitude ?? 0,
      destLat: delivery?.dropoff.latitude ?? 0,
      destLng: delivery?.dropoff.longitude ?? 0,
    }),
    [delivery?.dropoff.latitude, delivery?.dropoff.longitude, routeOrigin?.latitude, routeOrigin?.longitude],
  );
  const routeQuery = trpc.routing.calculateRoute.useQuery(routeInput, {
    enabled: Boolean(delivery && routeOrigin),
    retry: false,
    refetchInterval: delivery?.latestLocation ? 15000 : false,
  });

  useEffect(() => {
    if (routeQuery.data) {
      setRouteSummary({ distanceKm: routeQuery.data.distanceKm, durationMinutes: routeQuery.data.durationMinutes });
      setRouteError(false);
    }
    if (routeQuery.error) {
      setRouteError(true);
    }
  }, [routeQuery.data, routeQuery.error]);

  const handleLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = trackingCode.trim().toUpperCase();
    if (!TRACKING_CODE_PATTERN.test(normalized)) {
      setLookupMessage("Enter a tracking code in the format #MZ-ABC123-XYZ.");
      return;
    }
    setLookupMessage("");
    setRouteSummary(null);
    setRouteError(false);
    setMapError(false);
    setMapReady(false);
    setMapRetryKey((key) => key + 1);
    setSubmittedCode(normalized);
    window.history.replaceState({}, document.title, `${window.location.pathname}?code=${encodeURIComponent(normalized)}`);
  };

  const submitRefundRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!delivery || !refundAmount || !refundReason.trim()) return;
    requestRefund.mutate({ deliveryId: delivery.id, requestedAmount: Number(refundAmount), reason: refundReason.trim() });
  };

  const retryMap = () => {
    setMapError(false);
    setRouteError(false);
    setMapReady(false);
    setMapRetryKey((key) => key + 1);
  };

  if (!submittedCode) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur">
          <div className="container py-4">
            <a href="/" className="text-lg font-bold text-foreground hover:text-primary">
              ← Back to Home
            </a>
          </div>
        </header>
        <main className="container flex min-h-[calc(100vh-73px)] items-center justify-center py-12">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Search className="h-6 w-6 text-primary" />
                Track your delivery
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the tracking code from your booking confirmation or delivery notification.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="space-y-4">
                <label htmlFor="tracking-code" className="text-sm font-semibold">
                  Tracking code
                </label>
                <input
                  id="tracking-code"
                  value={trackingCode}
                  onChange={(event) => setTrackingCode(event.target.value.toUpperCase())}
                  placeholder="#MZ-ABC123-XYZ"
                  autoComplete="off"
                  className="h-12 w-full rounded-lg border border-input bg-background px-4 font-mono text-base outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
                {lookupMessage ? <p className="text-sm text-destructive" role="alert">{lookupMessage}</p> : null}
                <Button type="submit" className="w-full gap-2">
                  <Search className="h-4 w-4" />
                  Find delivery
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (trackingQuery.isLoading || trackingQuery.isFetching && !delivery) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur">
          <div className="container py-4">
            <a href="/" className="text-lg font-bold text-foreground hover:text-primary">
              ← Back to Home
            </a>
          </div>
        </header>
        <main className="container flex min-h-[calc(100vh-73px)] items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground" role="status" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading delivery details…
          </div>
        </main>
      </div>
    );
  }

  if (trackingQuery.error || !delivery) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur">
          <div className="container py-4">
            <a href="/" className="text-lg font-bold text-foreground hover:text-primary">
              ← Back to Home
            </a>
          </div>
        </header>
        <main className="container flex min-h-[calc(100vh-73px)] items-center justify-center py-12">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertCircle className="h-6 w-6 text-destructive" />
                Delivery not found
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                We could not find a delivery for <span className="font-mono font-semibold">{submittedCode}</span>. Check the code and try again.
              </p>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => { setSubmittedCode(""); setLookupMessage(""); setTrackingCode(""); window.history.replaceState({}, document.title, window.location.pathname); }}>
                Search again
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const statusSteps: Array<{ label: DeliveryStatus; description: string }> = [
    { label: "pending", description: "Delivery request created" },
    { label: "assigned", description: "A courier accepted the parcel" },
    { label: "in-transit", description: "Courier is moving toward the drop-off" },
    { label: "delivered", description: "Delivery completed" },
  ];
  const currentIndex = statusSteps.findIndex((step) => step.label === delivery.status);
  const visibleCourierLocation = delivery.latestLocation
    ? { lat: delivery.latestLocation.latitude, lng: delivery.latestLocation.longitude }
    : delivery.pickup
      ? { lat: delivery.pickup.latitude, lng: delivery.pickup.longitude }
      : undefined;
  const mapUnavailable = mapError || routeError;
  const displayDistance = routeSummary ? `${routeSummary.distanceKm.toFixed(1)} km` : "Calculating…";
  const displayEta = routeSummary
    ? `${routeSummary.durationMinutes} minutes`
    : delivery.estimatedDeliveryTime
      ? `${delivery.estimatedDeliveryTime} minutes`
      : "Calculating…";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tracking code</p>
            <h1 className="truncate font-mono text-xl font-bold">{delivery.trackingCode}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-semibold capitalize text-primary">{formatStatus(delivery.status)}</p>
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-8">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-bold">Delivery progress</h2>
            <p className="text-sm text-muted-foreground">Updates refresh automatically while the delivery is active.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={async () => { const url = window.location.href; try { if (navigator.share) await navigator.share({ title: `Mzansi Couriers ${delivery.trackingCode}`, text: "Follow this delivery on its Mzansi route.", url }); else { await navigator.clipboard.writeText(url); setShareMessage("Tracking link copied. You can send it to anyone following this delivery."); } } catch { setShareMessage("Your tracking link is ready to share from this page."); } }}><Share2 className="mr-2 h-4 w-4" />Share tracking</Button><Button variant="outline" size="sm" onClick={() => { setSubmittedCode(""); setTrackingCode(""); window.history.replaceState({}, document.title, window.location.pathname); }}>
            Track another parcel
          </Button></div>
        </div>
        {shareMessage ? <p className="text-sm text-primary" role="status">{shareMessage}</p> : null}

        {currentUser.data?.role === "customer" && refundEligibility.data?.allowed ? <Card className="border-red-200 dark:border-red-900"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Receipt className="h-5 w-5 text-red-700" />Request a refund</CardTitle><p className="text-sm text-muted-foreground">Up to {refundEligibility.data.availableToRefund.toFixed(2)} ZAR remains refundable. Refunds are manually reviewed; Paystack confirms the final outcome.</p></CardHeader><CardContent><form onSubmit={submitRefundRequest} className="grid gap-3 sm:grid-cols-[10rem_1fr_auto]"><label className="text-sm font-medium">Amount (ZAR)<input type="number" min="0.01" max={refundEligibility.data.availableToRefund} step="0.01" required value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} className="mt-1 h-11 w-full rounded-md border bg-background px-3" /></label><label className="text-sm font-medium">Reason<input required minLength={5} maxLength={1000} value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Tell us what went wrong" className="mt-1 h-11 w-full rounded-md border bg-background px-3" /></label><Button type="submit" className="mt-6 bg-red-700 hover:bg-red-800" disabled={requestRefund.isPending}>{requestRefund.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{requestRefund.isPending ? "Sending…" : "Request refund"}</Button></form>{refundMessage ? <p role="status" className="mt-3 text-sm text-muted-foreground">{refundMessage}</p> : null}</CardContent></Card> : null}

        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {statusSteps.map((step, index) => {
                const completed = currentIndex >= index;
                return (
                  <div key={step.label} className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {completed ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                    </div>
                    <div>
                      <p className="font-semibold capitalize">{formatStatus(step.label)}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {delivery.relay ? <Card className="border-blue-200 bg-blue-50/70"><CardHeader><CardTitle className="flex items-center gap-2 text-blue-950"><Route className="h-5 w-5 text-blue-700" />Relay journey</CardTitle><p className="text-sm text-blue-900/80">Your parcel can move through more than one courier while it travels between areas. Each handoff is recorded before the next leg begins.</p></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 sm:grid-cols-3"><div className="rounded-lg bg-white/80 p-3"><p className="text-xs text-blue-800">Route legs</p><p className="text-xl font-bold text-blue-950">{delivery.relay.totalLegs}</p></div><div className="rounded-lg bg-white/80 p-3"><p className="text-xs text-blue-800">Current leg</p><p className="text-xl font-bold text-blue-950">{delivery.relay.currentLeg ? `${delivery.relay.currentLeg} of ${delivery.relay.totalLegs}` : "Updating"}</p></div><div className="rounded-lg bg-white/80 p-3"><p className="text-xs text-blue-800">Custody check</p><p className="text-sm font-semibold text-blue-950">{delivery.relay.activeCustodianId ? "Courier custody recorded" : "Next custody step preparing"}</p></div></div><div className="space-y-2">{delivery.relay.legs.map((leg) => <div key={leg.sequence} className="flex items-start gap-3 rounded-lg border border-blue-200 bg-white/70 p-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">{leg.sequence}</div><div className="min-w-0"><p className="font-semibold text-blue-950">{leg.originArea} → {leg.destinationArea}</p><p className="text-xs capitalize text-blue-900/70">{leg.status.replaceAll("_", " ")}{leg.meetingAddress ? ` · Handoff: ${leg.meetingAddress}` : ""}</p></div></div>)}</div></CardContent></Card> : null}
        {delivery.exceptions?.some((exception) => ["open", "recovery_requested"].includes(exception.status)) ? <Card className="border-amber-200 bg-amber-50/70"><CardContent className="flex items-start gap-3 py-4"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="font-semibold text-amber-950">Route update in progress</p><p className="mt-1 text-sm text-amber-900/80">The route team has recorded a delivery update and is reviewing the next safe step. Your tracking page will refresh automatically.</p></div></CardContent></Card> : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  Live location
                  {trackingQuery.isFetching ? <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" aria-label="Refreshing location" /> : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative h-[380px] overflow-hidden bg-muted">
                  <MapView
                    key={mapRetryKey}
                    initialCenter={{ lat: delivery.pickup.latitude, lng: delivery.pickup.longitude }}
                    initialZoom={11}
                    route={{ origin: routeOrigin ? { lat: routeOrigin.latitude, lng: routeOrigin.longitude } : { lat: delivery.pickup.latitude, lng: delivery.pickup.longitude }, destination: { lat: delivery.dropoff.latitude, lng: delivery.dropoff.longitude } }}
                    courierLocation={visibleCourierLocation}
                    destinationLocation={{ lat: delivery.dropoff.latitude, lng: delivery.dropoff.longitude }}
                    onMapReady={() => { setMapReady(true); setMapError(false); }}
                    onMapError={() => { setMapReady(false); setMapError(true); }}
                    onRouteReady={(summary) => { if (!routeQuery.data) setRouteSummary(summary); }}
                    onRouteError={() => setRouteError(true)}
                  />
                  {mapUnavailable ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center">
                      <MapPin className="h-8 w-8 text-primary" />
                      <p className="font-semibold">Your map is taking a moment to load</p>
                      <p className="max-w-md text-sm text-muted-foreground">Your delivery details remain available. We will show the courier location as soon as it is verified.</p>
                      <Button variant="outline" onClick={retryMap}>Load map again</Button>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Route details</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <div><p className="text-xs text-muted-foreground">Pickup</p><p className="font-medium">{formatAddress(delivery.pickup)}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-orange-600" />
                  <div><p className="text-xs text-muted-foreground">Drop-off</p><p className="font-medium">{formatAddress(delivery.dropoff)}</p></div>
                </div>
                <div className="flex items-center justify-between border-t pt-4"><span className="text-sm text-muted-foreground">Distance</span><span className="font-semibold">{displayDistance}</span></div>
                <div className="flex items-center justify-between border-t pt-4"><span className="text-sm text-muted-foreground">Estimated arrival</span><span className="font-semibold">{displayEta}</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Courier details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {delivery.courier ? (
                  <>
                    <div><p className="text-sm text-muted-foreground">Name</p><p className="font-semibold">{delivery.courier.name}</p></div>
                    <div><p className="text-sm text-muted-foreground">Vehicle</p><p className="font-semibold">{formatVehicleType(delivery.courier.vehicleType)}</p></div>
                    {delivery.courier.rating !== null ? <div><p className="text-sm text-muted-foreground">Completed-delivery rating</p><p className="font-semibold">{delivery.courier.rating.toFixed(1)} / 5</p></div> : null}
                    {delivery.courier.phone ? (
                      <div className="grid gap-2 border-t pt-4 sm:grid-cols-2 lg:grid-cols-1">
                        <a href={`tel:${delivery.courier.phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"><Phone className="h-4 w-4" />Call courier</a>
                        <a href={`mailto:mzansicouriers@yahoo.com?subject=Delivery%20${encodeURIComponent(delivery.trackingCode)}%20support`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"><MessageCircle className="h-4 w-4" />Contact support</a>
                      </div>
                    ) : <p className="border-t pt-4 text-sm text-muted-foreground">Courier contact details will appear here as soon as they are ready.</p>}
                  </>
                ) : <p className="text-sm text-muted-foreground">Your delivery is being matched with an eligible courier.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" />Package</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between gap-4"><span className="text-sm text-muted-foreground">Size</span><span className="font-semibold capitalize">{delivery.packageSize}</span></div>
                <div className="flex justify-between gap-4"><span className="text-sm text-muted-foreground">Weight</span><span className="font-semibold">{delivery.packageWeight} kg</span></div>
                {delivery.packageDescription ? <div><p className="text-sm text-muted-foreground">Description</p><p className="font-medium">{delivery.packageDescription}</p></div> : null}
                {delivery.latestLocation ? <p className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Last location update {new Date(delivery.latestLocation.timestamp).toLocaleTimeString()}</p> : <p className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" />Location updates will appear after the courier shares them.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
