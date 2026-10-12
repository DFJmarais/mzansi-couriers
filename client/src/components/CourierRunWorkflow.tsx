import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Camera, CheckCircle2, ExternalLink, Link2, Loader2, MapPin, Package, Play, ScanLine, Search, XCircle } from "lucide-react";
import { buildStopNavigationUrl, getNextDeliveryStop, type DeliveryStopStatus } from "@/lib/delivery-run-workflow";
import { getPaymentReadiness } from "@/lib/payment-readiness";
import { captureDeliveryEvidence, requestCourierLocation, scheduleCourierUpdate } from "@/lib/native-courier";
import { decodeParcelCodeFromFile } from "@/lib/native-barcode";
import { openNativeRoute } from "@/lib/native-map";
import { enqueueOfflineAction, readOfflineActions, readOfflineSnapshot, writeOfflineSnapshot } from "@/lib/offline-store";
import { searchOfflineParcels } from "@/lib/offline-route-search";

type StopRow = {
  stop: { id: number; sequence: number; status: DeliveryStopStatus; proofPhotoUrl?: string | null; courierAcceptedAt?: string | null; pickupCompletedAt?: string | Date | null; declineReason?: string | null };
  paymentStatus?: "pending" | "paid" | "failed" | "cancelled" | null;
  pickupAddress?: { street: string; city: string; postalCode?: string | null } | null;
  dropoffAddress?: { street: string; city: string; postalCode?: string | null } | null;
  delivery: {
    trackingCode: string;
    packageDescription?: string | null;
    pickupLatitude: string | number;
    pickupLongitude: string | number;
    dropoffLatitude: string | number;
    dropoffLongitude: string | number;
    estimatedPrice?: string | number | null;
    distance?: string | number | null;
    packageSize?: "small" | "medium" | "large" | null;
    packageWeight?: string | number | null;
    packageLabelPhotoUrl?: string | null;
    packageLabelConfirmedAt?: string | Date | null;
  };
};

const formatAddress = (address: StopRow["dropoffAddress"]) => {
  if (!address) return "Address details are being prepared";
  return `${address.street}, ${address.city}${address.postalCode ? `, ${address.postalCode}` : ""}`;
};

export default function CourierRunWorkflow() {
  const utils = trpc.useUtils();
  const active = trpc.deliveryRuns.active.useQuery();
  const createRun = trpc.deliveryRuns.createFromAssigned.useMutation({ onSuccess: () => utils.deliveryRuns.active.invalidate() });
  const startRun = trpc.deliveryRuns.start.useMutation({ onSuccess: () => utils.deliveryRuns.active.invalidate() });
  const beginStop = trpc.deliveryRuns.beginStop.useMutation({ onSuccess: () => utils.deliveryRuns.active.invalidate() });
  const markArrived = trpc.deliveryRuns.markArrived.useMutation({ onSuccess: () => utils.deliveryRuns.active.invalidate() });
  const completeWithPhoto = trpc.deliveryRuns.completeWithPhoto.useMutation({ onSuccess: () => utils.deliveryRuns.active.invalidate() });
  const acceptStop = trpc.deliveryRuns.acceptStop.useMutation({ onSuccess: () => utils.deliveryRuns.active.invalidate() });
  const confirmPickup = trpc.deliveryRuns.confirmPickup.useMutation({ onSuccess: () => utils.deliveryRuns.active.invalidate() });
  const declineStop = trpc.deliveryRuns.declineStop.useMutation({ onSuccess: () => { setDeclineReason(""); utils.deliveryRuns.active.invalidate(); } });
  const requestHelp = trpc.deliveryRuns.requestHelp.useMutation({ onSuccess: () => { setHelpNote(""); setHelpSent(true); } });
  const custodyScan = trpc.parcelCustody.scan.useMutation();
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineCategory, setDeclineCategory] = useState("Route does not fit today");
  const [helpIssue, setHelpIssue] = useState<"address" | "customer" | "parcel" | "relay">("address");
  const [helpNote, setHelpNote] = useState("");
  const [helpSent, setHelpSent] = useState(false);
  const [nativeMessage, setNativeMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isNetworkOnline, setIsNetworkOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [cachedRoute, setCachedRoute] = useState<typeof active.data | null>(() => readOfflineSnapshot<typeof active.data>("courier-active-route"));
  const [pendingOfflineActions, setPendingOfflineActions] = useState(() => readOfflineActions().length);
  const [parcelSearch, setParcelSearch] = useState("");

  useEffect(() => {
    if (active.data) {
      writeOfflineSnapshot("courier-active-route", active.data);
      setCachedRoute(active.data);
    }
  }, [active.data]);

  useEffect(() => {
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsMessage("Location sharing is not available on this phone. You can still open the delivery address in Google Maps.");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => { setGpsLocation({ lat: coords.latitude, lng: coords.longitude }); setGpsMessage(null); },
      () => setGpsMessage("Turn on location sharing to make navigation start from your current position."),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const refreshNativeLocation = async () => {
    try {
      const location = await requestCourierLocation();
      setGpsLocation({ lat: location.lat, lng: location.lng });
      setGpsMessage(null);
      setNativeMessage("Your live location is ready for route guidance.");
    } catch (error) {
      setGpsMessage(error instanceof Error ? error.message : "Turn on location access to start route guidance.");
    }
  };

  const startNativeRoute = async () => {
    if (!run) return;
    try {
      const location = await requestCourierLocation();
      setGpsLocation({ lat: location.lat, lng: location.lng });
      setGpsMessage(null);
      if (!isNetworkOnline) {
        enqueueOfflineAction("start-route", { runId: run.id });
        setPendingOfflineActions((count) => count + 1);
        setNativeMessage("Route start saved on this device. It will be sent when you reconnect.");
        return;
      }
      startRun.mutate({ runId: run.id });
      await scheduleCourierUpdate("Mzansi route started", "Your parcel order is ready. Keep this app open for the next delivery step.");
      setNativeMessage("Route started with live location ready on this device.");
    } catch (error) {
      setGpsMessage(error instanceof Error ? error.message : "Turn on location access before starting the route.");
    }
  };

  const activeData = active.data ?? cachedRoute;
  const run = activeData?.run;
  const assignedSummary = activeData?.assignedSummary;
  const stops = (activeData?.stops || []) as StopRow[];
  const nextStop = useMemo(() => getNextDeliveryStop(stops.map(({ stop }) => stop)), [stops]);
  const nextStopRow = nextStop ? stops.find(({ stop }) => stop.id === nextStop.id) : undefined;
  const filteredStops = useMemo(() => searchOfflineParcels(stops, parcelSearch), [stops, parcelSearch]);
  const completedCount = stops.filter(({ stop }) => stop.status === "completed").length;
  const isAwaitingConfirmation = nextStopRow?.stop.status === "awaiting_customer_confirmation";
  const paymentReadiness = getPaymentReadiness(nextStopRow?.paymentStatus);
  const paymentReady = paymentReadiness.ready;
  const paymentLabel = paymentReadiness.label;

  const handlePhoto = (file: File | undefined) => {
    if (!file || !nextStopRow) return;
    if (!file.type.startsWith("image/")) { setPhotoMessage("Please choose a photo of the delivered parcel."); return; }
    if (file.size > 8 * 1024 * 1024) { setPhotoMessage("This photo is too large. Please choose one smaller than 8 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoMessage(null);
      const photoDataUrl = String(reader.result);
      if (!isNetworkOnline) {
        enqueueOfflineAction("complete-with-photo", { stopId: nextStopRow.stop.id, photoDataUrl, photoName: file.name });
        setPendingOfflineActions((count) => count + 1);
        setNativeMessage("Proof photo saved on this device. Reconnect to send it to the customer.");
      } else {
        completeWithPhoto.mutate({ stopId: nextStopRow.stop.id, photoDataUrl, photoName: file.name });
      }
    };
    reader.onerror = () => setPhotoMessage("We could not open that photo yet. Please choose it again.");
    reader.readAsDataURL(file);
  };

  const openRoute = async (latitude: number, longitude: number, title: string) => {
    try {
      const openedNatively = await openNativeRoute(latitude, longitude, title);
      if (!openedNatively) window.open(buildStopNavigationUrl(gpsLocation, { lat: latitude, lng: longitude }), "_blank", "noopener,noreferrer");
    } catch (error) {
      setNativeMessage(error instanceof Error ? error.message : "We could not open the native route map.");
    }
  };

  const handleParcelCodeScan = async (file: File | undefined) => {
    if (!file || !nextStopRow) return;
    try {
      setIsScanning(true);
      setNativeMessage("Reading the parcel code from the camera photo…");
      const scannedValue = await decodeParcelCodeFromFile(file);
      if (!scannedValue) {
        setNativeMessage("We could not read a code from that photo. Try again with the full code in focus.");
        return;
      }
      const scanned = scannedValue.toUpperCase().replace(/\s+/g, "");
      const expected = nextStopRow.delivery.trackingCode.toUpperCase().replace(/\s+/g, "");
      if (scanned !== expected) {
        setNativeMessage(`Scanned ${scannedValue}. Check it against ${nextStopRow.delivery.trackingCode}.`);
        return;
      }
      const scanType = nextStopRow.stop.pickupCompletedAt ? "delivery" : "pickup";
      await custodyScan.mutateAsync({ trackingCode: nextStopRow.delivery.trackingCode, scanType, stopId: nextStopRow.stop.id });
      setNativeMessage(scanType === "pickup" ? "Pickup QR verified and recorded. You may confirm collection." : "Delivery QR verified. The sender and recipient have been notified that this parcel reached the delivery point.");
    } catch (error) {
      setNativeMessage(error instanceof Error ? error.message : "We could not read that parcel code photo.");
    } finally {
      setIsScanning(false);
    }
  };

  const takeNativePhoto = async () => {
    if (!nextStopRow) return;
    try {
      setPhotoMessage(null);
      setNativeMessage("Opening the secure delivery camera…");
      const evidence = await captureDeliveryEvidence();
      if (!evidence) {
        setNativeMessage("The camera was closed. Your delivery is still open.");
        return;
      }
      if (!isNetworkOnline) {
        enqueueOfflineAction("complete-with-photo", { stopId: nextStopRow.stop.id, photoDataUrl: evidence.dataUrl, photoName: evidence.fileName });
        setPendingOfflineActions((count) => count + 1);
        setNativeMessage("Proof photo saved on this device. Reconnect to send it to the customer.");
      } else {
        completeWithPhoto.mutate({ stopId: nextStopRow.stop.id, photoDataUrl: evidence.dataUrl, photoName: evidence.fileName });
      }
      await scheduleCourierUpdate("Delivery evidence saved", `Proof photo captured for parcel ${nextStopRow.delivery.trackingCode}.`);
      setNativeMessage("Proof photo captured. The customer confirmation step is now active.");
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : "We could not open the delivery camera. Please try again.");
      setNativeMessage(null);
    }
  };

  if (active.isLoading) return <Card><CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading your route…</CardContent></Card>;

  if (!run) {
    const assignedCount = assignedSummary?.total ?? 0;
    const readyCount = assignedSummary?.ready ?? 0;
    return <Card className="border-accent/30 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-accent" />Your delivery route</CardTitle><CardDescription>{assignedCount > 0 ? `You have ${assignedCount} parcel${assignedCount === 1 ? "" : "s"} assigned for today.` : "Your parcel list will appear here as soon as work is assigned to you."}</CardDescription></CardHeader><CardContent className="space-y-3">{assignedCount > 0 ? <div className="rounded-lg bg-accent/10 p-3 text-sm"><p className="font-semibold">Today’s workload: {assignedCount} parcel{assignedCount === 1 ? "" : "s"}</p><p className="mt-1 text-muted-foreground">{readyCount > 0 ? `${readyCount} parcel${readyCount === 1 ? " is" : "s are"} paid and ready for pickup.` : "Your assigned parcels will become ready here as soon as payment is confirmed."}</p></div> : null}<Button onClick={() => createRun.mutate()} disabled={createRun.isPending || readyCount === 0} className="h-12 w-full gap-2 text-base"><ScanLine className="h-5 w-5" />{createRun.isPending ? "Loading your parcels…" : readyCount > 0 ? "Show my paid parcels" : assignedCount > 0 ? "Preparing payment confirmation" : "Preparing your parcel list"}</Button>{createRun.error ? <p className="mt-3 text-sm text-destructive" role="alert">{createRun.error.message}</p> : null}</CardContent></Card>;
  }

  if (run.status === "completed") {
    return <Card className="border-green-200 bg-green-50 shadow-sm"><CardContent className="flex flex-col items-center gap-2 py-8 text-center text-green-900"><CheckCircle2 className="h-10 w-10 text-green-600" /><p className="text-lg font-bold">Route complete</p><p className="text-sm">All {stops.length} parcels were delivered and confirmed.</p></CardContent></Card>;
  }

  return <Card className="border-accent/30 shadow-sm">
    <CardHeader className="space-y-3">
      <div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-accent" />Your delivery route</CardTitle><CardDescription className="mt-1">{completedCount} of {stops.length} parcels complete</CardDescription></div><Badge variant={run.status === "active" ? "default" : "secondary"}>{run.status === "active" ? "On route" : "Ready"}</Badge></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`${completedCount} of ${stops.length} parcels complete`}><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${stops.length ? (completedCount / stops.length) * 100 : 0}%` }} /></div><div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Smart route order</p><span className="rounded-full bg-white px-2 py-1 font-mono text-xs font-semibold text-blue-900">Batch MC-RUN-{run.id}</span></div><p className="mt-1">Your {stops.length} stop{stops.length === 1 ? " is" : "s are"} grouped by pickup area and ordered toward the next delivery to help reduce unnecessary backtracking. Load the numbered parcels in order and follow the list from top to bottom.</p></div>
    </CardHeader>
    <CardContent className="space-y-4">
      {!isNetworkOnline ? <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status"><p className="font-semibold">Offline mode is active</p><p className="mt-1">Your saved route and proof actions stay on this device. Reconnect to sync them with the customer.</p>{pendingOfflineActions > 0 ? <p className="mt-2 font-medium">{pendingOfflineActions} action{pendingOfflineActions === 1 ? "" : "s"} waiting to sync.</p> : null}</div> : null}
      {run.status === "planned" ? <div className="rounded-xl bg-accent/10 p-4"><p className="font-semibold">Step 1: Accept your first parcel</p><p className="mt-1 text-sm text-muted-foreground">Check the parcel identification code photo and destination below. Accept it only when the code matches the parcel.</p><Button onClick={startNativeRoute} disabled={startRun.isPending || !nextStopRow?.stop.courierAcceptedAt || !paymentReady} className="mt-3 h-12 w-full gap-2 text-base"><Play className="h-5 w-5" />{startRun.isPending ? "Starting…" : "Start route with live location"}</Button>{!nextStopRow?.stop.courierAcceptedAt ? <p className="mt-2 text-xs text-muted-foreground">Choose the next parcel below to get your route underway.</p> : !paymentReady ? <p className="mt-2 text-xs text-amber-800">{paymentLabel}. The route can start when payment is verified.</p> : null}{startRun.error ? <p className="mt-2 text-sm text-destructive" role="alert">{startRun.error.message}</p> : null}</div> : null}

      {nextStopRow ? <div className="space-y-4 rounded-xl border-2 border-accent/30 bg-background p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next parcel · stop {nextStopRow.stop.sequence} of {stops.length}</p><p className="mt-1 break-all font-mono text-2xl font-bold tracking-wide">{nextStopRow.delivery.trackingCode}</p><p className="mt-1 text-sm text-muted-foreground">Match this identification code to the code visible on the parcel.</p><label className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => void handleParcelCodeScan(event.target.files?.[0])} disabled={isScanning} /><ScanLine className="h-4 w-4" />{isScanning ? "Reading code…" : "Scan parcel code"}</label></div><div className="flex shrink-0 flex-col items-end gap-2"><Badge variant="outline" className="capitalize">{nextStopRow.stop.status.replaceAll("_", " ")}</Badge><Badge className={paymentReady ? "bg-green-600 text-white" : "bg-amber-100 text-amber-950"} aria-label={`Payment status: ${paymentLabel}`}>{paymentReady ? paymentReadiness.shortLabel : paymentLabel}</Badge></div></div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Customer parcel label</p><div className="mt-2 flex items-start gap-3">{nextStopRow.delivery.packageLabelPhotoUrl ? <img src={nextStopRow.delivery.packageLabelPhotoUrl} alt="Customer photo of parcel label" className="h-20 w-20 rounded-lg border border-emerald-200 object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-emerald-300 text-center text-xs text-emerald-800">Photo pending</div>}<p className="text-sm text-emerald-950">The customer confirmed this code was written or printed on the parcel. Compare the physical parcel with the photo before pickup.</p></div></div><div className="rounded-lg bg-orange-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-orange-800">Deliver to</p><p className="mt-1 text-base font-semibold text-orange-950">{formatAddress(nextStopRow.dropoffAddress)}</p></div>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Route</p><p className="font-semibold">{nextStopRow.delivery.distance != null ? `${Number(nextStopRow.delivery.distance).toFixed(1)} km` : "Route ready"}</p></div><div><p className="text-xs text-muted-foreground">Parcel</p><p className="font-semibold capitalize">{nextStopRow.delivery.packageSize || "Parcel"}</p></div><div><p className="text-xs text-muted-foreground">Weight</p><p className="font-semibold">{nextStopRow.delivery.packageWeight != null ? `${Number(nextStopRow.delivery.packageWeight).toFixed(1)} kg` : "Recorded"}</p></div><div><p className="text-xs text-muted-foreground">Your share</p><p className="font-semibold text-accent">{nextStopRow.delivery.estimatedPrice != null ? `R${(Number(nextStopRow.delivery.estimatedPrice) * 0.8).toFixed(2)}` : "Recorded after delivery"}</p></div></div>
        {isAwaitingConfirmation ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Photo sent. Waiting for customer confirmation.</p><p className="mt-1">Stay on this parcel. The next parcel will unlock after the customer confirms receipt.</p></div> : !nextStopRow.stop.courierAcceptedAt && nextStopRow.stop.status === "queued" ? <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4"><div><p className="font-semibold text-blue-950">Do you accept this parcel?</p><p className="mt-1 text-sm text-blue-900/80">Accept it to add it to your route, or decline it so another nearby courier can be offered the parcel.</p>{!paymentReady ? <p className="mt-2 font-medium text-amber-800">{paymentLabel}. This parcel becomes ready to accept once payment is verified.</p> : null}</div><div className="grid gap-2 sm:grid-cols-2"><Button onClick={() => acceptStop.mutate({ stopId: nextStopRow.stop.id })} disabled={acceptStop.isPending || !paymentReady} className="h-11 gap-2"><CheckCircle2 className="h-5 w-5" />{acceptStop.isPending ? "Accepting…" : "Accept parcel"}</Button><Button variant="outline" onClick={() => declineStop.mutate({ stopId: nextStopRow.stop.id, reason: `${declineCategory}${declineReason.trim() ? `: ${declineReason.trim()}` : ""}` })} disabled={declineStop.isPending} className="h-11 gap-2"><XCircle className="h-5 w-5" />{declineStop.isPending ? "Returning…" : "Decline parcel"}</Button></div><select value={declineCategory} onChange={(event) => setDeclineCategory(event.target.value)} aria-label="Reason for declining parcel" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Route does not fit today</option><option>Too many stops for my vehicle</option><option>Pickup area is too far</option><option>Timing does not work</option><option>Vehicle or parcel size mismatch</option><option>Need help before accepting</option></select><input value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} placeholder="Optional extra detail for the owner team" aria-label="Additional decline details" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />{declineStop.error ? <p className="text-sm text-destructive" role="alert">{declineStop.error.message}</p> : null}</div> : <div className="space-y-2">
          {!nextStopRow.stop.pickupCompletedAt ? <div className="space-y-2">
            <Button type="button" onClick={() => void openRoute(Number(nextStopRow.delivery.pickupLatitude), Number(nextStopRow.delivery.pickupLongitude), "Pickup location")} className="h-12 w-full gap-2 text-base"><MapPin className="h-5 w-5" />Open pickup map</Button><Button asChild variant="outline" className="h-11 w-full gap-2"><a href={buildStopNavigationUrl(gpsLocation, { lat: Number(nextStopRow.delivery.pickupLatitude), lng: Number(nextStopRow.delivery.pickupLongitude) })} target="_blank" rel="noreferrer"><ExternalLink className="h-5 w-5" />Use Google Maps</a></Button>
            {nextStopRow.stop.status === "queued" && nextStopRow.stop.courierAcceptedAt ? <Button variant="outline" onClick={() => beginStop.mutate({ stopId: nextStopRow.stop.id })} disabled={beginStop.isPending} className="h-11 w-full gap-2"><Play className="h-5 w-5" />{beginStop.isPending ? "Starting pickup route…" : "Start pickup route"}</Button> : null}
            {nextStopRow.stop.status === "navigating" ? <Button variant="outline" onClick={() => markArrived.mutate({ stopId: nextStopRow.stop.id })} disabled={markArrived.isPending} className="h-11 w-full gap-2"><MapPin className="h-5 w-5" />{markArrived.isPending ? "Saving arrival…" : "I have reached pickup"}</Button> : null}
            {nextStopRow.stop.status === "arrived" ? <Button onClick={() => confirmPickup.mutate({ stopId: nextStopRow.stop.id })} disabled={confirmPickup.isPending} className="h-12 w-full gap-2 text-base"><CheckCircle2 className="h-5 w-5" />{confirmPickup.isPending ? "Recording pickup…" : "Parcel collected — continue"}</Button> : null}
          </div> : <div className="space-y-2">
            <Button type="button" onClick={() => void openRoute(Number(nextStopRow.delivery.dropoffLatitude), Number(nextStopRow.delivery.dropoffLongitude), "Delivery destination")} className="h-12 w-full gap-2 text-base"><MapPin className="h-5 w-5" />Open delivery map</Button><Button asChild variant="outline" className="h-11 w-full gap-2"><a href={buildStopNavigationUrl(gpsLocation, { lat: Number(nextStopRow.delivery.dropoffLatitude), lng: Number(nextStopRow.delivery.dropoffLongitude) })} target="_blank" rel="noreferrer"><ExternalLink className="h-5 w-5" />Use Google Maps</a></Button>
            {nextStopRow.stop.status === "navigating" ? <Button variant="outline" onClick={() => markArrived.mutate({ stopId: nextStopRow.stop.id })} disabled={markArrived.isPending} className="h-11 w-full gap-2"><MapPin className="h-5 w-5" />{markArrived.isPending ? "Saving arrival…" : "I have arrived at delivery"}</Button> : null}
            {["arrived", "navigating"].includes(nextStopRow.stop.status) ? <div className="grid gap-2 sm:grid-cols-2"><Button type="button" onClick={takeNativePhoto} disabled={completeWithPhoto.isPending} className="h-12 w-full gap-2"><Camera className="h-5 w-5" />Use delivery camera</Button><label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-base font-medium hover:bg-accent hover:text-accent-foreground"><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => handlePhoto(event.target.files?.[0])} /><Camera className="h-5 w-5" />Choose photo</label></div> : null}
          </div>
        }</div>}
        {gpsMessage ? <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status"><AlertCircle className="h-5 w-5 shrink-0" />{gpsMessage}<Button type="button" size="sm" variant="outline" className="ml-auto shrink-0" onClick={refreshNativeLocation}>Enable location</Button></p> : null}
        {nativeMessage ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{nativeMessage}</p> : null}
        {nextStopRow ? <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4"><div><p className="font-semibold text-blue-950">Need a hand with this delivery?</p><p className="mt-1 text-sm text-blue-900/80">Choose a topic and the owner team will receive a helpful delivery note.</p></div><div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]"><select value={helpIssue} onChange={(event) => { setHelpIssue(event.target.value as typeof helpIssue); setHelpSent(false); }} className="h-11 rounded-md border border-blue-200 bg-white px-3 text-sm text-blue-950" aria-label="Delivery help topic"><option value="address">Finding the address</option><option value="customer">Contacting the customer</option><option value="parcel">Parcel guidance</option><option value="relay">Relay handoff</option></select><input value={helpNote} onChange={(event) => { setHelpNote(event.target.value); setHelpSent(false); }} placeholder="Optional note for the owner team" className="h-11 rounded-md border border-blue-200 bg-white px-3 text-sm text-blue-950" /><Button type="button" onClick={() => requestHelp.mutate({ stopId: nextStopRow.stop.id, issue: helpIssue, note: helpNote.trim() || undefined })} disabled={requestHelp.isPending} className="h-11 bg-blue-700 hover:bg-blue-800">{requestHelp.isPending ? "Sending…" : "Ask for help"}</Button></div>{helpSent ? <p className="text-sm font-medium text-blue-900" role="status">Help request sent. You can continue with the delivery while the owner team follows up.</p> : null}{requestHelp.error ? <p className="text-sm text-destructive" role="alert">We could not send that request yet. Please try again.</p> : null}</div> : null}
        {photoMessage ? <p className="text-sm text-destructive" role="alert">{photoMessage}</p> : null}
        {completeWithPhoto.isPending ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Uploading your proof photo securely…</p> : null}
        {completeWithPhoto.error ? <p className="text-sm text-destructive" role="alert">{completeWithPhoto.error.message}</p> : null}
        {completeWithPhoto.data?.confirmationPath ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900"><p className="flex items-center gap-2 font-semibold"><Link2 className="h-4 w-4" />Customer confirmation link ready</p><p className="mt-1 break-all text-xs">{window.location.origin}{completeWithPhoto.data.confirmationPath}</p><Button variant="outline" size="sm" className="mt-2" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${completeWithPhoto.data?.confirmationPath}`)}>Copy link</Button></div> : null}
      </div> : null}

      <div className="space-y-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Today’s parcels</p><span className="text-xs text-muted-foreground">{filteredStops.length} of {stops.length}</span></div><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={parcelSearch} onChange={(event) => setParcelSearch(event.target.value)} placeholder="Search code, address, city or parcel" aria-label="Search saved parcels" className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" /></div><p className="text-xs text-muted-foreground">Search works from the saved route on this device, including when you are offline.</p>{filteredStops.length > 0 ? filteredStops.map(({ stop, delivery, paymentStatus }) => <div key={stop.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm"><span className="flex min-w-0 items-center gap-2"><span className="font-semibold">{stop.sequence}.</span><span className="min-w-0"><span className="block truncate font-mono">{delivery.trackingCode}</span><span className="block truncate text-xs text-muted-foreground">{formatAddress(stops.find((row) => row.stop.id === stop.id)?.dropoffAddress ?? null)}</span></span></span><span className={`shrink-0 text-right text-xs font-medium ${paymentStatus === "paid" ? "text-green-700" : "text-amber-800"}`}>{paymentStatus === "paid" ? "Paid · ready" : paymentStatus === "pending" ? "Payment pending" : paymentStatus ? `Payment ${paymentStatus}` : "Payment status updating"}</span></div>) : <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No saved parcel matches “{parcelSearch}”. Try the tracking code, street, city, or stop number.</div>}</div>
    </CardContent>
  </Card>;
}
