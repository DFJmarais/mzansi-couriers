import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Clock3, Download, FileText, MapPin, Package, Pause, Play, RotateCcw, Route } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

function formatDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

function duration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

type CourierProfileReport = {
  profile: { userId: number; province: string | null; region: string | null; vehicleType: string | null; vehicleRegistration: string | null; isAvailable: boolean };
  user: { name: string | null; email: string | null; phone: string | null } | null;
  metrics: { totalKilometres: number; totalDrivingMinutes: number; safety: { eligibleForOffers: boolean; reason: string } };
  packages: Array<{ id: number; trackingCode: string; status: string; distance: number | null; updatedAt: Date | string }>;
  relayLegs: Array<{ id: number; sequence: number; originArea: string; destinationArea: string; status: string; handoffConfirmedByFrom: Date | string | null; handoffConfirmedByTo: Date | string | null; updatedAt: Date | string }>;
  handoffOffers: Array<{ id: number; offeredByCourierId: number; offeredToCourierId: number; status: string; createdAt: Date | string }>;
  inspections: Array<{ id: number; conditionAccepted: boolean; defectNote: string | null; createdAt: Date | string }>;
  custodyScans: Array<{ id: number; scanType: string; scannedCode: string; scannedAt: Date | string }>;
  trackingPoints: Array<{ id: number; deliveryId: number; latitude: number; longitude: number; timestamp: Date | string }>;
};

type PackageEvent = {
  id: string;
  kind: "gps" | "scan" | "handover" | "inspection" | "stop";
  title: string;
  detail: string;
  timestamp: Date | string | null | undefined;
  courierName: string;
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(data: CourierProfileReport) {
  const rows: unknown[][] = [
    ["Section", "Field", "Value", "Timestamp"],
    ["Courier", "Name", data.user?.name ?? "", ""],
    ["Courier", "Email", data.user?.email ?? "", ""],
    ["Courier", "Province", data.profile.province ?? "", ""],
    ["Courier", "Region", data.profile.region ?? "", ""],
    ["Courier", "Vehicle", `${data.profile.vehicleType} ${data.profile.vehicleRegistration}`, ""],
    ["Metrics", "Total GPS kilometres", data.metrics.totalKilometres, ""],
    ["Metrics", "Recorded driving minutes", data.metrics.totalDrivingMinutes, ""],
    ["Metrics", "Safety status", data.metrics.safety.reason, ""],
    ...data.packages.map((item) => ["Package", item.trackingCode, item.status, formatDate(item.updatedAt)]),
    ...data.relayLegs.map((leg) => ["Relay leg", `Leg ${leg.sequence}: ${leg.originArea} to ${leg.destinationArea}`, leg.status, formatDate(leg.updatedAt)]),
    ...data.handoffOffers.map((offer) => ["Handover offer", `From ${offer.offeredByCourierId} to ${offer.offeredToCourierId}`, offer.status, formatDate(offer.createdAt)]),
    ...data.inspections.map((inspection) => ["Inspection", inspection.conditionAccepted ? "Condition accepted" : "Defect recorded", inspection.defectNote ?? "", formatDate(inspection.createdAt)]),
    ...data.custodyScans.map((scan) => ["Custody scan", scan.scanType, scan.scannedCode, formatDate(scan.scannedAt)]),
    ...data.trackingPoints.map((point) => ["GPS point", `Delivery ${point.deliveryId}`, `${point.latitude}, ${point.longitude}`, formatDate(point.timestamp)]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = `mzansi-courier-${data.profile.userId}-activity.csv`;
  anchor.click();
  URL.revokeObjectURL(blobUrl);
}

function htmlCell(value: unknown) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function exportPdf(data: CourierProfileReport) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return;
  const rows = (items: Array<[unknown, unknown, unknown, unknown]>) => items.map((row) => `<tr>${row.map((value) => `<td>${htmlCell(value)}</td>`).join("")}</tr>`).join("");
  printWindow.document.write(`<!doctype html><html><head><title>Mzansi Courier Activity Report</title><style>body{font-family:Arial,sans-serif;color:#13231d;padding:32px;line-height:1.4}h1{margin:0 0 4px;color:#075b43}h2{margin:24px 0 8px;border-bottom:2px solid #f08a24;padding-bottom:4px}p{margin:4px 0;color:#475569}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;background:#effaf3;padding:16px;border-radius:10px}.metric{font-size:20px;font-weight:700}.label{font-size:11px;color:#64748b;text-transform:uppercase}table{width:100%;border-collapse:collapse;font-size:11px}td,th{border-bottom:1px solid #e2e8f0;padding:7px;text-align:left;vertical-align:top}@media print{body{padding:0}.summary{break-inside:avoid}h2{break-after:avoid}}</style></head><body><h1>Mzansi Couriers — Courier Activity Report</h1><p>Generated ${htmlCell(new Date().toLocaleString())}</p><h2>Courier</h2><div class="summary"><div><div class="label">Name</div><div>${htmlCell(data.user?.name ?? "Not recorded")}</div></div><div><div class="label">Province / region</div><div>${htmlCell(`${data.profile.region ? `${data.profile.region}, ` : ""}${data.profile.province ?? "Not recorded"}`)}</div></div><div><div class="label">Vehicle</div><div>${htmlCell(`${data.profile.vehicleType} · ${data.profile.vehicleRegistration}`)}</div></div><div><div class="label">Contact</div><div>${htmlCell(data.user?.email ?? data.user?.phone ?? "Not recorded")}</div></div></div><h2>Operational summary</h2><div class="summary"><div><div class="label">GPS kilometres</div><div class="metric">${htmlCell(data.metrics.totalKilometres)} km</div></div><div><div class="label">Driving time</div><div class="metric">${htmlCell(duration(data.metrics.totalDrivingMinutes))}</div></div><div><div class="label">Packages</div><div class="metric">${htmlCell(data.packages.length)}</div></div><div><div class="label">Safety</div><div class="metric">${htmlCell(data.metrics.safety.eligibleForOffers ? "Eligible" : "Safety hold")}</div></div></div><h2>Package history</h2><table><tr><th>Tracking code</th><th>Status</th><th>Distance</th><th>Updated</th></tr>${rows(data.packages.map((item) => [item.trackingCode, item.status, item.distance ? `${item.distance} km` : "", formatDate(item.updatedAt)]))}</table><h2>Relay and handovers</h2><table><tr><th>Activity</th><th>Status</th><th>Details</th><th>Time</th></tr>${rows(data.relayLegs.map((leg) => [`Leg ${leg.sequence}: ${leg.originArea} → ${leg.destinationArea}`, leg.status, leg.handoffConfirmedByTo ? "Receiving courier confirmed" : "Confirmation pending", formatDate(leg.updatedAt)]))}${rows(data.handoffOffers.map((offer) => ["Handover offer", offer.status, `From ${offer.offeredByCourierId} to ${offer.offeredToCourierId}`, formatDate(offer.createdAt)]))}${rows(data.inspections.map((inspection) => ["Condition inspection", inspection.conditionAccepted ? "Accepted" : "Defect recorded", inspection.defectNote ?? "", formatDate(inspection.createdAt)]))}</table><h2>Parcel custody</h2><table><tr><th>Scan type</th><th>Code</th><th>Time</th><th>Scan ID</th></tr>${rows(data.custodyScans.map((scan) => [scan.scanType, scan.scannedCode, formatDate(scan.scannedAt), scan.id]))}</table><h2>GPS activity</h2><table><tr><th>Delivery</th><th>Latitude</th><th>Longitude</th><th>Time</th></tr>${rows(data.trackingPoints.map((point) => [`Delivery ${point.deliveryId}`, point.latitude.toFixed(5), point.longitude.toFixed(5), formatDate(point.timestamp)]))}</table></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 250);
}

export default function AdminCourierProfile() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/couriers/:userId");
  const userId = Number(params?.userId);
  const profile = trpc.adminAudit.courierProfile.useQuery({ userId }, { enabled: Number.isInteger(userId) && userId > 0, retry: false });
  const data = profile.data as CourierProfileReport | undefined;
  const trackPoints = data?.trackingPoints.map((point) => ({ lat: point.latitude, lng: point.longitude })) ?? [];
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  useEffect(() => {
    if (selectedPackageId === null && data?.packages[0]) setSelectedPackageId(data.packages[0].id);
  }, [data?.packages, selectedPackageId]);
  const selectedPackage = data?.packages.find((item) => item.id === selectedPackageId);
  const movement = trpc.adminAudit.movement.useQuery({ deliveryId: selectedPackageId ?? 0 }, { enabled: selectedPackageId !== null, retry: false });
  const movementTimeline = useMemo(() => movement.data?.trackingPoints.map((point) => ({ lat: point.latitude, lng: point.longitude, timestamp: point.timestamp })) ?? [], [movement.data?.trackingPoints]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    setPlaybackIndex(0);
    setIsPlaying(false);
  }, [selectedPackageId]);
  useEffect(() => {
    if (!isPlaying || movementTimeline.length < 2) return;
    const timer = window.setInterval(() => {
      setPlaybackIndex((current) => {
        if (current >= movementTimeline.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [isPlaying, movementTimeline.length]);
  const visibleMovementPoints = movementTimeline.slice(0, playbackIndex + 1).map(({ lat, lng }) => ({ lat, lng }));
  const currentMovementPoint = visibleMovementPoints.at(-1);
  const packageEvents = useMemo<PackageEvent[]>(() => {
    if (!movement.data) return [];
    const events: PackageEvent[] = [];
    movement.data.trackingPoints.forEach((point) => events.push({ id: `gps-${point.id}`, kind: "gps", title: "GPS position recorded", detail: `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`, timestamp: point.timestamp, courierName: point.courier?.name ?? "Unknown courier" }));
    movement.data.scans.forEach((scan) => events.push({ id: `scan-${scan.id}`, kind: "scan", title: `Custody scan: ${scan.scanType.replaceAll("_", " ")}`, detail: scan.scannedCode, timestamp: scan.scannedAt, courierName: scan.scannedBy?.name ?? "Unknown courier" }));
    movement.data.relayLegs.forEach((leg) => events.push({ id: `handover-${leg.id}`, kind: "handover", title: `Relay handover · leg ${leg.sequence}`, detail: `${leg.fromCourier?.name ?? "Unknown courier"} → ${leg.toCourier?.name ?? "Unknown courier"} · ${leg.originArea} → ${leg.destinationArea}`, timestamp: leg.handoffConfirmedByTo ?? leg.handoffConfirmedByFrom ?? leg.updatedAt, courierName: leg.toCourier?.name ?? leg.fromCourier?.name ?? "Unknown courier" }));
    movement.data.handoffOffers.forEach((offer) => events.push({ id: `offer-${offer.id}`, kind: "handover", title: `Handover offer · ${offer.status.replaceAll("_", " ")}`, detail: `${offer.offeredBy?.name ?? "Unknown courier"} → ${offer.offeredTo?.name ?? "Unknown courier"}`, timestamp: offer.createdAt, courierName: offer.offeredBy?.name ?? "Unknown courier" }));
    movement.data.inspections.forEach((inspection) => events.push({ id: `inspection-${inspection.id}`, kind: "inspection", title: inspection.conditionAccepted ? "Relay condition accepted" : "Relay defect recorded", detail: inspection.defectNote ?? "No defect note", timestamp: inspection.createdAt, courierName: inspection.inspector?.name ?? "Unknown courier" }));
    movement.data.routeStops.forEach((stop) => events.push({ id: `stop-${stop.id}`, kind: "stop", title: `Route stop ${stop.sequence} · ${stop.status.replaceAll("_", " ")}`, detail: `Run ${stop.runId}`, timestamp: stop.updatedAt, courierName: stop.runCourier?.name ?? "Unknown courier" }));
    return events.sort((a, b) => new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime());
  }, [movement.data]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Courier profile</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">{data?.user?.name ?? "Courier activity"}</h1>
              <p className="mt-1 text-muted-foreground">A complete operational view of this courier’s work, movement, and relay handovers.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setLocation("/admin/couriers")}><ArrowLeft className="mr-2 h-4 w-4" />Back to Courier Dashboard</Button>{data ? <><Button type="button" variant="outline" onClick={() => downloadCsv(data)}><Download className="mr-2 h-4 w-4" />CSV report</Button><Button type="button" variant="outline" onClick={() => exportPdf(data)}><FileText className="mr-2 h-4 w-4" />PDF report</Button></> : null}</div>
          </div>
        </div>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
          {profile.isLoading ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading courier profile history…</CardContent></Card> : profile.error || !data ? <Card><CardContent className="p-6 text-sm text-destructive" role="alert">This courier profile could not be loaded.</CardContent></Card> : <>
            <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20">
              <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <div><p className="text-xs text-muted-foreground">Province / region</p><p className="mt-1 font-semibold">{data.profile.region ? `${data.profile.region}, ` : ""}{data.profile.province ?? "Not recorded"}</p></div>
                <div><p className="text-xs text-muted-foreground">Vehicle</p><p className="mt-1 font-semibold capitalize">{data.profile.vehicleType} · {data.profile.vehicleRegistration}</p></div>
                <div><p className="text-xs text-muted-foreground">Profile status</p><p className="mt-1 font-semibold">{data.profile.isAvailable ? "Available for work" : "Not available"}</p></div>
                <div><p className="text-xs text-muted-foreground">Contact</p><p className="mt-1 font-semibold">{data.user?.email ?? data.user?.phone ?? "Not recorded"}</p></div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Total GPS distance</p><p className="mt-1 text-2xl font-bold">{data.metrics.totalKilometres.toLocaleString()} km</p><p className="text-xs text-muted-foreground">Across recorded tracking points</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Recorded driving time</p><p className="mt-1 text-2xl font-bold">{duration(data.metrics.totalDrivingMinutes)}</p><p className="text-xs text-muted-foreground">Based on GPS intervals</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Packages assigned</p><p className="mt-1 text-2xl font-bold">{data.packages.length}</p><p className="text-xs text-muted-foreground">{data.packages.filter((item) => item.status === "delivered").length} delivered</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Safety status</p><p className="mt-1 text-2xl font-bold">{data.metrics.safety.eligibleForOffers ? "Eligible" : "Safety hold"}</p><p className="text-xs capitalize text-muted-foreground">{data.metrics.safety.reason.replaceAll("_", " ")}</p></CardContent></Card>
            </div>

            <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-700" />Tracking history and route</CardTitle></CardHeader><CardContent>{trackPoints.length ? <MapView className="h-[360px] overflow-hidden rounded-xl" initialCenter={trackPoints.at(-1)} initialZoom={10} courierLocation={trackPoints.at(-1)} trackPoints={trackPoints} /> : <p className="text-sm text-muted-foreground">No GPS tracking history has been recorded for this courier yet.</p>}<p className="mt-3 text-xs text-muted-foreground">The map shows only this courier’s recorded movement points. No other courier’s location is included.</p></CardContent></Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-700" />Select a package to trace</CardTitle></CardHeader><CardContent>{data.packages.length ? <div className="space-y-3"><label className="block text-sm font-medium text-foreground" htmlFor="courier-package-select">Package route</label><select id="courier-package-select" value={selectedPackageId ?? ""} onChange={(event) => setSelectedPackageId(Number(event.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"><option value="" disabled>Choose a package</option>{data.packages.map((item) => <option key={`package-option-${item.id}`} value={item.id}>{item.trackingCode} · {item.status.replaceAll("-", " ")}</option>)}</select><div className="space-y-2">{data.packages.map((item) => <button key={`package-${item.id}`} type="button" onClick={() => setSelectedPackageId(item.id)} className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted ${selectedPackageId === item.id ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : ""}`}><div><p className="font-mono font-semibold">{item.trackingCode}</p><p className="text-xs text-muted-foreground">Updated {formatDate(item.updatedAt)}{item.distance ? ` · ${item.distance} km planned` : ""}</p></div><Badge variant="outline" className="capitalize">{item.status.replaceAll("-", " ")}</Badge></button>)}</div></div> : <p className="text-sm text-muted-foreground">No packages are assigned to this courier.</p>}</CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-orange-700" />Relay and handover history</CardTitle></CardHeader><CardContent>{data.relayLegs.length || data.handoffOffers.length || data.inspections.length ? <div className="space-y-3">{data.relayLegs.map((leg) => <div key={`leg-${leg.id}`} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><p className="font-semibold">Leg {leg.sequence}: {leg.originArea} → {leg.destinationArea}</p><Badge variant="outline" className="capitalize">{leg.status.replaceAll("_", " ")}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{leg.handoffConfirmedByFrom ? `From courier confirmed ${formatDate(leg.handoffConfirmedByFrom)}. ` : ""}{leg.handoffConfirmedByTo ? `Receiving courier confirmed ${formatDate(leg.handoffConfirmedByTo)}.` : "Handover confirmation pending."}</p></div>)}{data.handoffOffers.map((offer) => <div key={`offer-${offer.id}`} className="rounded-lg bg-orange-50 p-3 text-sm dark:bg-orange-950/20"><p className="font-semibold">Handover offer · <span className="capitalize">{offer.status}</span></p><p className="text-xs text-muted-foreground">Created {formatDate(offer.createdAt)} · From courier {offer.offeredByCourierId} to courier {offer.offeredToCourierId}</p></div>)}{data.inspections.map((inspection) => <div key={`inspection-${inspection.id}`} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900"><p className="font-semibold">Condition inspection: {inspection.conditionAccepted ? "Accepted" : "Defect recorded"}</p><p className="text-xs text-muted-foreground">{formatDate(inspection.createdAt)}{inspection.defectNote ? ` · ${inspection.defectNote}` : ""}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No relay handovers have been recorded for this courier.</p>}</CardContent></Card>
            </div>

            {selectedPackage && <Card className="border-blue-200 dark:border-blue-900"><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-700" />Complete route for {selectedPackage.trackingCode}</CardTitle><p className="text-sm text-muted-foreground">This view is limited to the selected package and includes its GPS path, custody scans, relay legs, handover offers, inspections, and route stops.</p></CardHeader><CardContent className="space-y-5">{movement.isLoading ? <p className="text-sm text-muted-foreground">Loading this package’s route history…</p> : movement.error ? <p className="text-sm text-destructive" role="alert">This package route could not be loaded.</p> : movement.data ? <><div className="rounded-xl border bg-muted/20 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-foreground">Route playback</p><p className="text-xs text-muted-foreground">{movementTimeline.length ? `${playbackIndex + 1} of ${movementTimeline.length} GPS points · ${formatDate(movementTimeline[playbackIndex]?.timestamp)}` : "No timed GPS points"}</p></div><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => { setPlaybackIndex(0); setIsPlaying(false); }} disabled={!movementTimeline.length}><RotateCcw className="mr-1 h-4 w-4" />Reset</Button><Button type="button" size="sm" onClick={() => setIsPlaying((playing) => !playing)} disabled={movementTimeline.length < 2}>{isPlaying ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}{isPlaying ? "Pause" : "Play"}</Button></div></div><input aria-label="Route playback time" type="range" min="0" max={Math.max(0, movementTimeline.length - 1)} value={Math.min(playbackIndex, Math.max(0, movementTimeline.length - 1))} onChange={(event) => { setPlaybackIndex(Number(event.target.value)); setIsPlaying(false); }} className="mt-3 w-full accent-emerald-600" disabled={!movementTimeline.length} /></div><div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">{visibleMovementPoints.length ? <MapView className="h-[360px] overflow-hidden rounded-xl" initialCenter={currentMovementPoint} initialZoom={10} courierLocation={currentMovementPoint} trackPoints={visibleMovementPoints} /> : <div className="flex min-h-[220px] items-center justify-center rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">No GPS points recorded for this package.</div>}<div className="space-y-3"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Parcel status</p><p className="mt-1 font-semibold capitalize">{movement.data.delivery.status.replaceAll("-", " ")}</p><p className="mt-1 text-xs text-muted-foreground">Last updated {formatDate(movement.data.delivery.updatedAt)}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Activity totals</p><p className="mt-1 font-semibold">{movement.data.trackingPoints.length} GPS points · {movement.data.scans.length} custody scans</p><p className="mt-1 text-xs text-muted-foreground">{movement.data.relayLegs.length} relay legs · {movement.data.routeStops.length} route stops</p></div><div className="rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-foreground">Chronological activity</p><Badge variant="outline">{packageEvents.length} events</Badge></div>{packageEvents.length ? <div className="mt-3 max-h-[360px] space-y-3 overflow-y-auto pr-1">{packageEvents.map((event) => <div key={event.id} className="relative border-l-2 border-emerald-200 pl-3 dark:border-emerald-900"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold capitalize text-foreground">{event.title}</p><span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(event.timestamp)}</span></div><p className="mt-1 text-xs text-muted-foreground">{event.detail}</p><p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Courier: {event.courierName}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No package events have been recorded.</p>}</div></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-lg border p-3"><p className="font-semibold">Custody</p><p className="mt-1 text-sm text-muted-foreground">{movement.data.scans.map((scan) => `${scan.scanType} · ${scan.scannedBy?.name ?? "Unknown courier"} · ${formatDate(scan.scannedAt)}`).join(" | ") || "No scans recorded"}</p></div><div className="rounded-lg border p-3"><p className="font-semibold">Relay handovers</p><p className="mt-1 text-sm text-muted-foreground">{movement.data.relayLegs.map((leg) => `Leg ${leg.sequence}: ${leg.fromCourier?.name ?? "Unknown"} → ${leg.toCourier?.name ?? "Unknown"} · ${leg.status}`).join(" | ") || "No relay legs"}</p></div><div className="rounded-lg border p-3"><p className="font-semibold">Inspections</p><p className="mt-1 text-sm text-muted-foreground">{movement.data.inspections.map((inspection) => `${inspection.inspector?.name ?? "Unknown courier"}: ${inspection.conditionAccepted ? "Accepted" : "Defect"} · ${formatDate(inspection.createdAt)}`).join(" | ") || "No inspections"}</p></div><div className="rounded-lg border p-3"><p className="font-semibold">Route stops</p><p className="mt-1 text-sm text-muted-foreground">{movement.data.routeStops.map((stop) => `${stop.sequence}. ${stop.status} · ${stop.runCourier?.name ?? "Unknown courier"}`).join(" | ") || "No route stops"}</p></div></div></> : null}</CardContent></Card>}

            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-purple-700" />GPS activity timeline</CardTitle></CardHeader><CardContent>{data.trackingPoints.length ? <div className="max-h-[360px] overflow-auto"><div className="space-y-2">{data.trackingPoints.slice().reverse().map((point) => <div key={`point-${point.id}`} className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border-b px-2 py-2 text-sm"><span><span className="font-semibold">Delivery #{point.deliveryId}</span><span className="ml-2 text-muted-foreground">{point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</span></span><span className="text-right text-xs text-muted-foreground">{formatDate(point.timestamp)}</span></div>)}</div></div> : <p className="text-sm text-muted-foreground">No GPS points to show.</p>}</CardContent></Card>
          </>}
        </main>
      </div>
    </DashboardLayout>
  );
}
