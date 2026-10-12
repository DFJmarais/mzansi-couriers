import React from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Car, ChevronRight, CircleAlert, MapPin, Package, Settings2, ShieldCheck, Truck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const statusLabels: Record<string, string> = {
  available: "Available",
  on_delivery: "On delivery",
  offline: "Offline",
  maintenance: "Maintenance",
  suspended: "Suspended",
};

function statusClass(status: string) {
  if (status === "available") return "bg-emerald-100 text-emerald-800";
  if (status === "on_delivery") return "bg-blue-100 text-blue-800";
  if (status === "maintenance") return "bg-amber-100 text-amber-800";
  if (status === "suspended") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold text-slate-950">{value}</p></div>;
}

export default function FleetCommandCentre() {
  const [, setLocation] = useLocation();
  const fleetQuery = trpc.fleet.getFleetAccount.useQuery();
  const vehiclesQuery = trpc.fleet.getFleetVehicles.useQuery(undefined, { enabled: Boolean(fleetQuery.data) });
  const driversQuery = trpc.fleet.getFleetDrivers.useQuery(undefined, { enabled: Boolean(fleetQuery.data) });
  const dashboardQuery = trpc.fleet.getFleetDashboard.useQuery(undefined, { enabled: Boolean(fleetQuery.data) });
  const recommendationsQuery = trpc.fleet.getAIRecommendations.useQuery(undefined, { enabled: Boolean(fleetQuery.data) });
  const [selectedDrivers, setSelectedDrivers] = useState<Record<number, number>>({});
  const approveRecommendation = trpc.fleet.approveRecommendation.useMutation({ onSuccess: () => { recommendationsQuery.refetch(); dashboardQuery.refetch(); toast.success("Parcel assigned to your approved fleet route."); } });
  const vehicles = vehiclesQuery.data ?? [];
  const drivers = driversQuery.data ?? [];
  const fleet = fleetQuery.data;
  const dashboard = dashboardQuery.data;

  const availableVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.availability === "available").length, [vehicles]);
  const activeVehicles = dashboard?.activeVehicles ?? vehicles.filter((vehicle) => vehicle.availability === "in_use").length;

  if (fleetQuery.isLoading) {
    return <div className="min-h-screen grid place-items-center bg-mzansi-sand text-muted-foreground">Loading your fleet command centre…</div>;
  }

  if (!fleet) {
    return (
      <div className="min-h-screen bg-mzansi-sand px-4 py-10">
        <Card className="mx-auto max-w-xl overflow-hidden">
          <div className="p-7 text-white" style={{ backgroundColor: "var(--mzansi-green)" }}>
            <Button variant="ghost" className="-ml-3 mb-3 text-white hover:bg-white/10 hover:text-white" onClick={() => setLocation("/")} aria-label="Back to home"><ArrowLeft className="mr-2 h-4 w-4" />Back to home</Button>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Fleet mode</p>
            <h1 className="mt-2 text-3xl font-bold">Put your fleet to work.</h1>
            <p className="mt-3 text-sm leading-6 text-emerald-50">Connect your vehicles to delivery opportunities across South Africa while keeping your existing business.</p>
          </div>
          <div className="space-y-4 p-7">
            <p className="text-muted-foreground">Register your fleet first. Once your details are verified, this becomes your command centre for vehicles, drivers, deliveries, and earnings.</p>
            <Button onClick={() => { window.location.href = "/fleet/onboarding"; }}>Register your fleet <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mzansi-sand px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Button variant="ghost" className="-ml-3 mb-2 text-slate-700 hover:bg-white/70" onClick={() => setLocation("/fleet")} aria-label="Back to fleet overview"><ArrowLeft className="mr-2 h-4 w-4" />Back to fleet overview</Button>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Fleet command centre</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Put your fleet to work.</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Keep your existing courier business moving with an additional delivery and revenue channel across Mzansi.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={fleet.status === "suspended" ? "bg-red-100 text-red-800" : fleet.status === "pending" || fleet.status === "rejected" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}>
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {fleet.status}
            </Badge>
            <Button variant="outline" size="icon" aria-label="Fleet settings" onClick={() => { window.location.href = "/fleet/settings"; }}><Settings2 className="h-4 w-4" /></Button>
          </div>
        </header>

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Fleet sections">
          {[['Overview', '/fleet/dashboard'], ['Vehicles', '/fleet'], ['Drivers', '/fleet/drivers'], ['Deliveries', '/fleet/deliveries'], ['Earnings', '/courier/earnings']].map(([label, href]) => (
            <Button key={label} variant={label === "Overview" ? "default" : "outline"} className="justify-start" onClick={() => { window.location.href = href; }}>{label}<ChevronRight className="ml-auto h-4 w-4" /></Button>
          ))}
        </nav>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Fleet overview">
          <Card className="p-4"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Vehicles</p><Truck className="h-5 w-5 text-emerald-700" /></div><p className="mt-3 text-3xl font-bold">{vehicles.length}</p><p className="text-xs text-muted-foreground">Registered to this fleet</p></Card>
          <Card className="p-4"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Active</p><MapPin className="h-5 w-5 text-blue-700" /></div><p className="mt-3 text-3xl font-bold">{activeVehicles}</p><p className="text-xs text-muted-foreground">On delivery now</p></Card>
          <Card className="p-4"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Available</p><Car className="h-5 w-5 text-emerald-700" /></div><p className="mt-3 text-3xl font-bold">{availableVehicles}</p><p className="text-xs text-muted-foreground">Ready for suitable work</p></Card>
          <Card className="p-4"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Drivers</p><Users className="h-5 w-5 text-emerald-700" /></div><p className="mt-3 text-3xl font-bold">{dashboard?.driverCount ?? drivers.length}</p><p className="text-xs text-muted-foreground">Added to this fleet</p></Card>
          <Card className="border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center justify-between"><p className="text-sm font-medium text-emerald-900">Next action</p><Package className="h-5 w-5 text-emerald-700" /></div><p className="mt-3 font-semibold text-emerald-950">{(dashboard?.deliveriesToday ?? 0) > 0 ? "Review today’s deliveries" : vehicles.length === 0 ? "Add your first vehicle" : "Review available work"}</p><p className="text-xs text-emerald-800">{dashboard?.deliveriesToday ?? 0} deliveries recorded today.</p></Card>
        </section>

        {(fleet.status === "pending" || fleet.status === "rejected") && (
          <Card className="border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">Verification is still in progress</h2><p className="mt-1 text-sm text-amber-900">You can review your fleet details while checks are pending. Delivery opportunities become available after the required verification is complete.</p></div></div></Card>
        )}

        <Card className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Today</p><h2 className="mt-1 text-xl font-semibold">Delivery and earnings snapshot</h2></div><p className="text-sm text-muted-foreground">Only recorded fleet records appear here.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><Metric label="Deliveries" value={String(dashboard?.deliveriesToday ?? 0)} /><Metric label="Completed" value={String(dashboard?.completedDeliveries ?? 0)} /><Metric label="Gross delivery value" value={`R${dashboard?.grossRevenue ?? "0.00"}`} /><Metric label="Fleet share after 20% fee" value={`R${dashboard?.fleetEarnings ?? "0.00"}`} /></div><p className="mt-4 text-xs text-muted-foreground">Platform fee recorded today: R{dashboard?.platformFee ?? "0.00"}. Figures update when fleet delivery and earnings records are created.</p></Card>\n\n        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Fill my fleet</h2><p className="mt-1 text-sm text-muted-foreground">Find suitable delivery work for vehicles that are available and verified.</p></div><Truck className="h-6 w-6 text-emerald-700" /></div>
            <div className="mt-5 space-y-3">{(recommendationsQuery.data?.recommendations ?? []).length ? (recommendationsQuery.data?.recommendations ?? []).map((recommendation) => <div key={`${recommendation.deliveryId}-${recommendation.vehicleId}`} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-emerald-950">Parcel {recommendation.trackingCode}</p><p className="mt-1 text-sm text-emerald-900">{recommendation.packageSize} parcel · {recommendation.packageWeight.toFixed(1)} kg{recommendation.distanceKm == null ? "" : ` · ${recommendation.distanceKm.toFixed(1)} km`}</p></div><Badge className="bg-white text-emerald-800">{recommendation.vehicleRegistration}</Badge></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-emerald-900">Estimated courier share: R{(recommendation.estimatedPrice * 0.8).toFixed(2)}</span><span className="font-medium text-amber-800">Owner approval required</span></div><p className="mt-2 text-xs text-emerald-800">{recommendation.reason}. Review the full route before assigning this parcel.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><select value={selectedDrivers[recommendation.deliveryId] ?? ""} onChange={(event) => setSelectedDrivers((current) => ({ ...current, [recommendation.deliveryId]: Number(event.target.value) }))} className="h-11 min-w-0 flex-1 rounded-md border border-emerald-200 bg-white px-3 text-sm text-emerald-950" aria-label={`Driver for parcel ${recommendation.trackingCode}`}><option value="">Choose an active verified driver</option>{drivers.filter((driver) => driver.status === "active" && driver.backgroundCheckStatus === "verified").map((driver) => <option key={driver.id} value={driver.id}>{driver.driverName}</option>)}</select><Button className="h-11" disabled={!selectedDrivers[recommendation.deliveryId] || approveRecommendation.isPending} onClick={() => approveRecommendation.mutate({ deliveryId: recommendation.deliveryId, vehicleId: recommendation.vehicleId, driverId: selectedDrivers[recommendation.deliveryId] })}>{approveRecommendation.isPending ? "Assigning…" : "Approve & assign"}</Button></div>{drivers.filter((driver) => driver.status === "active" && driver.backgroundCheckStatus === "verified").length === 0 ? <p className="text-xs text-amber-800">Add and verify a fleet driver before approving this recommendation.</p> : null}</div>) : <div className="rounded-xl border border-dashed bg-slate-50 p-5"><p className="font-medium">No suitable live work yet.</p><p className="mt-1 text-sm text-muted-foreground">{recommendationsQuery.data?.message ?? "When paid parcels match an available insured vehicle, this space will show the vehicle fit and transparent 80/20 revenue split before you accept."}</p><Button className="mt-4" variant="outline" onClick={async () => { await Promise.all([dashboardQuery.refetch(), vehiclesQuery.refetch(), recommendationsQuery.refetch()]); toast.info("Your fleet is ready to review suitable work when it becomes available."); }}>Refresh available work <ChevronRight className="ml-2 h-4 w-4" /></Button></div>}</div>
          </Card>

          <Card className="p-5"><h2 className="text-xl font-semibold">Today’s fleet view</h2><p className="mt-1 text-sm text-muted-foreground">A simple snapshot of what is currently on file.</p><div className="mt-5 space-y-3"><div className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="text-sm">Fleet account</span><span className="font-semibold capitalize">{fleet.status}</span></div><div className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="text-sm">Vehicles awaiting setup</span><span className="font-semibold">{vehicles.filter((vehicle) => vehicle.availability === "offline").length}</span></div><div className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="text-sm">Drivers added</span><span className="font-semibold">{dashboard?.driverCount ?? drivers.length}</span></div><div className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="text-sm">Today’s fleet earnings</span><span className="font-semibold">R{dashboard?.fleetEarnings ?? "0.00"}</span></div></div><Button className="mt-5 w-full" variant="outline" onClick={() => { window.location.href = "/fleet"; }}>Manage vehicles and capacity <ChevronRight className="ml-auto h-4 w-4" /></Button></Card>
        </div>

        <Card className="p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Your fleet principle</h2><p className="mt-1 text-sm text-muted-foreground">You already have the vehicles. Mzansi Couriers helps keep them moving.</p></div><p className="max-w-md text-sm text-muted-foreground">Delivery opportunities and earnings depend on available work, fleet capacity, completed deliveries, and your operating costs.</p></div></Card>
      </div>
    </div>
  );
}
