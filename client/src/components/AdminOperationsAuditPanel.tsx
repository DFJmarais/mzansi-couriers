import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock3, GitBranch, MapPinned, PackageCheck, ScanLine, Star, Truck, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/Map";

function value(map: Record<string, number> | undefined, key: string) {
  return map?.[key] ?? 0;
}

function formatPerson(person: { name: string | null; email: string | null } | null | undefined) {
  return person?.name || person?.email || "Unassigned courier";
}

function formatTime(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

function Metric({ icon: Icon, label, value: metricValue, tone = "text-foreground" }: { icon: typeof PackageCheck; label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
      </div>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{metricValue}</p>
    </div>
  );
}

export default function AdminOperationsAuditPanel() {
  const audit = trpc.adminAudit.summary.useQuery(undefined, { refetchInterval: 60_000, retry: false });
  const packages = trpc.adminAudit.packages.useQuery(undefined, { refetchInterval: 60_000, retry: false });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const packageOptions = Array.from(new Map((packages.data ?? []).map((item) => [item.id, item])).values());
  const selectedPackageId = selectedId ?? packageOptions[0]?.id ?? null;
  const movement = trpc.adminAudit.movement.useQuery(
    { deliveryId: selectedPackageId as number },
    { enabled: selectedPackageId !== null, retry: false },
  );
  const report = audit.data;
  const selectedPackage = packageOptions.find((item) => item.id === selectedPackageId);
  const trackPoints = useMemo(() => movement.data?.trackingPoints.map((point) => ({ lat: point.latitude, lng: point.longitude })) ?? [], [movement.data?.trackingPoints]);
  const pickupPoint = movement.data ? { lat: movement.data.delivery.pickup.latitude, lng: movement.data.delivery.pickup.longitude } : undefined;
  const dropoffPoint = movement.data ? { lat: movement.data.delivery.dropoff.latitude, lng: movement.data.delivery.dropoff.longitude } : undefined;

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-blue-700" /> Operations audit report</CardTitle>
            <CardDescription>Review persisted parcel movement, driver activity, route history, and relay custody events.</CardDescription>
          </div>
          {report?.available ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Live records</span> : null}
        </div>
      </CardHeader>
      <CardContent>
        {audit.isLoading ? <p className="text-sm text-muted-foreground">Building the operational report…</p> : audit.error ? <p className="text-sm text-destructive" role="alert">The audit report is taking a moment to load. Refresh the page to try again.</p> : !report?.available ? <p className="text-sm text-muted-foreground">{report && "message" in report ? report.message : "The operations database is not available."}</p> : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={PackageCheck} label="Delivered" value={value(report.deliveries, "delivered")} tone="text-emerald-700" />
              <Metric icon={PackageCheck} label="In transit" value={value(report.deliveries, "in-transit")} tone="text-blue-700" />
              <Metric icon={GitBranch} label="Relay legs" value={Object.values(report.relay.legs).reduce((sum, count) => sum + count, 0)} tone="text-violet-700" />
              <Metric icon={AlertTriangle} label="Open exceptions" value={value(report.exceptions, "open")} tone="text-amber-700" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={ScanLine} label="Custody scans" value={Object.values(report.custodyScans).reduce((sum, count) => sum + count, 0)} tone="text-cyan-700" />
              <Metric icon={ClipboardCheck} label="Inspections" value={Object.values(report.relay.inspections).reduce((sum, count) => sum + count, 0)} tone="text-indigo-700" />
              <Metric icon={MapPinned} label="Active routes" value={value(report.routes.runs, "active")} tone="text-blue-700" />
              <Metric icon={Star} label="Reviews" value={report.reviewCount} tone="text-orange-700" />
            </div>

            <section className="mt-6 rounded-xl border border-blue-200 bg-white/70 p-4 dark:bg-slate-950/20" aria-labelledby="package-movement-heading">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 id="package-movement-heading" className="flex items-center gap-2 text-lg font-semibold"><MapPinned className="h-5 w-5 text-blue-700" />Package movement and driver activity</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Select a parcel to see its GPS track, route stops, scans, handoffs, and the couriers involved.</p>
                </div>
                <label className="w-full lg:max-w-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Choose a package</span><select value={selectedPackageId ?? ""} onChange={(event) => setSelectedId(Number(event.target.value))} className="h-11 w-full rounded-md border border-blue-200 bg-background px-3 text-sm" aria-label="Choose a package to inspect"><option value="" disabled>Select a tracking code</option>{packageOptions.map((item) => <option key={`package-${item.id}`} value={item.id}>{item.trackingCode} · {item.status} · {item.courierName ?? "unassigned"}</option>)}</select></label>
              </div>

              {packages.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading package movement choices…</p> : packages.error ? <p className="mt-4 text-sm text-destructive" role="alert">Package movement choices are temporarily unavailable.</p> : !selectedPackageId ? <p className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No package records are available to inspect.</p> : movement.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading movement history for {selectedPackage?.trackingCode}…</p> : movement.error ? <p className="mt-4 text-sm text-destructive" role="alert">Movement history could not be loaded for this parcel.</p> : movement.data ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30"><p className="text-xs text-muted-foreground">Tracking code</p><p className="mt-1 font-mono font-bold">{movement.data.delivery.trackingCode}</p></div>
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30"><p className="text-xs text-muted-foreground">Current status</p><p className="mt-1 font-semibold capitalize">{movement.data.delivery.status}</p></div>
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30"><p className="text-xs text-muted-foreground">Assigned courier</p><p className="mt-1 font-semibold">{formatPerson(movement.data.delivery.courier)}</p></div>
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30"><p className="text-xs text-muted-foreground">GPS points</p><p className="mt-1 font-semibold">{movement.data.trackingPoints.length}</p></div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                    <div className="overflow-hidden rounded-xl border bg-slate-100"><MapView initialCenter={pickupPoint} initialZoom={9} route={pickupPoint && dropoffPoint ? { origin: pickupPoint, destination: dropoffPoint } : undefined} trackPoints={trackPoints} courierLocation={trackPoints.length ? trackPoints[trackPoints.length - 1] : undefined} /></div>
                    <div className="rounded-xl border bg-background p-4"><h4 className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4 text-emerald-700" />Driver activity</h4><div className="mt-3 space-y-3 text-sm"><p><span className="font-semibold">Route stops:</span> {movement.data.routeStops.length}</p><p><span className="font-semibold">Custody scans:</span> {movement.data.scans.length}</p><p><span className="font-semibold">Relay legs:</span> {movement.data.relayLegs.length}</p><p><span className="font-semibold">Handoff offers:</span> {movement.data.handoffOffers.length}</p><p><span className="font-semibold">Inspections:</span> {movement.data.inspections.length}</p>{movement.data.trackingPoints.length ? <p className="flex items-start gap-2 text-muted-foreground"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" />Last GPS point {formatTime(movement.data.trackingPoints[movement.data.trackingPoints.length - 1].timestamp)}</p> : <p className="text-muted-foreground">No GPS history has been recorded for this parcel.</p>}</div></div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border bg-background p-4"><h4 className="flex items-center gap-2 font-semibold"><ScanLine className="h-4 w-4 text-cyan-700" />Custody timeline</h4>{movement.data.scans.length ? <div className="mt-3 space-y-2">{movement.data.scans.map((scan) => <div key={scan.id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900"><p className="font-semibold capitalize">{scan.scanType.replaceAll("_", " ")} · {scan.accepted ? "accepted" : "review required"}</p><p className="mt-1 text-muted-foreground">{formatTime(scan.scannedAt)} · {formatPerson(scan.scannedBy)}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No custody scans recorded.</p>}</div>
                    <div className="rounded-xl border bg-background p-4"><h4 className="flex items-center gap-2 font-semibold"><GitBranch className="h-4 w-4 text-violet-700" />Relay handoffs</h4>{movement.data.relayLegs.length ? <div className="mt-3 space-y-2">{movement.data.relayLegs.map((leg) => <div key={leg.id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900"><p className="font-semibold">Leg {leg.sequence}: {leg.originArea} → {leg.destinationArea}</p><p className="mt-1 capitalize text-muted-foreground">{leg.status.replaceAll("_", " ")} · from {formatPerson(leg.fromCourier)} to {formatPerson(leg.toCourier)}</p><p className="mt-1 text-xs text-muted-foreground">Handoff time: {formatTime(leg.handedOffAt)}{leg.handoffPoint ? ` · ${leg.handoffPoint.name}` : ""}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">This parcel has no relay legs.</p>}</div>
                  </div>
                </div>
              ) : null}
            </section>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-lg bg-white/70 p-3 dark:bg-slate-950/30"><p className="font-semibold">Handoff outcomes</p><p className="mt-1 text-muted-foreground">{value(report.relay.handoffOffers, "accepted")} accepted · {value(report.relay.handoffOffers, "offered")} awaiting · {value(report.relay.handoffOffers, "declined")} declined</p></div>
              <div className="rounded-lg bg-white/70 p-3 dark:bg-slate-950/30"><p className="font-semibold">Route stops</p><p className="mt-1 text-muted-foreground">{value(report.routes.stops, "completed")} completed · {value(report.routes.stops, "navigating")} navigating · {value(report.routes.stops, "queued")} queued</p></div>
              <div className="rounded-lg bg-white/70 p-3 dark:bg-slate-950/30"><p className="font-semibold">Courier availability</p><p className="mt-1 text-muted-foreground"><Users className="mr-1 inline h-3.5 w-3.5" />{value(report.couriers, "available")} available · {value(report.couriers, "paused")} paused</p></div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Last refreshed {new Date(report.generatedAt).toLocaleString()}. Green shows the planned Google route; orange shows recorded GPS movement when available.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
