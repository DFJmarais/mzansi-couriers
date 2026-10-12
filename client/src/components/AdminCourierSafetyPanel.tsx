import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "MC";
}

function duration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const SOUTH_AFRICAN_PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"];

export default function AdminCourierSafetyPanel() {
  const safety = trpc.adminAudit.courierSafety.useQuery(undefined, { refetchInterval: 60_000, retry: false });
  const [, setLocation] = useLocation();
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const couriers = Array.from(new Map((safety.data?.couriers ?? []).map((courier) => [courier.userId, courier])).values());
  const provinceOptions = useMemo(() => Array.from(new Set([...SOUTH_AFRICAN_PROVINCES, ...couriers.map((courier) => courier.province).filter((value): value is string => Boolean(value))])).sort(), [couriers]);
  const regionOptions = useMemo(() => Array.from(new Set(couriers.map((courier) => courier.region).filter((value): value is string => Boolean(value)))).sort(), [couriers]);
  const filteredCouriers = useMemo(() => couriers.filter((courier) => (provinceFilter === "all" || courier.province === provinceFilter) && (regionFilter === "all" || courier.region === regionFilter)), [couriers, provinceFilter, regionFilter]);
  const visibleCouriers = useMemo(() => [...filteredCouriers].sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable) || b.activePackageCount - a.activePackageCount || a.name.localeCompare(b.name)), [filteredCouriers]);
  const availableCount = filteredCouriers.filter((courier) => courier.isAvailable && courier.safety.eligibleForOffers).length;
  const safetyHoldCount = filteredCouriers.filter((courier) => !courier.safety.eligibleForOffers).length;

  return (
    <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-700" />Active couriers and driver safety</CardTitle>
            <CardDescription>See the full courier database, live locations, parcel activity, driving totals, and fatigue controls before offers are sent.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2"><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{availableCount} eligible</Badge><Badge variant="outline" className="border-amber-300 text-amber-800">{safetyHoldCount} on safety hold</Badge></div>
        </div>
      </CardHeader>
      <CardContent>
        {safety.isLoading ? <p className="text-sm text-muted-foreground">Loading courier locations and safety totals…</p> : safety.error ? <p className="text-sm text-destructive" role="alert">Courier safety data is temporarily unavailable.</p> : !couriers.length ? <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">There are no courier profiles yet. Approved courier profiles will appear here with an avatar, location, parcel activity, and safety status.</div> : (
          <>
            <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-white/80 p-3 dark:bg-slate-950/30"><p className="text-xs text-muted-foreground">Drivers in view</p><p className="mt-1 text-xl font-bold">{filteredCouriers.length}<span className="ml-1 text-sm font-normal text-muted-foreground">/ {couriers.length}</span></p></div><div className="rounded-lg bg-white/80 p-3 dark:bg-slate-950/30"><p className="text-xs text-muted-foreground">Available for new work</p><p className="mt-1 text-xl font-bold text-emerald-700">{availableCount}</p></div><div className="rounded-lg bg-white/80 p-3 dark:bg-slate-950/30"><p className="text-xs text-muted-foreground">Safety thresholds</p><p className="mt-1 text-sm font-semibold">{safety.data?.limits.maxWeeklyKilometres.toLocaleString()} km · {duration(safety.data?.limits.maxWeeklyDrivingMinutes ?? 0)}/week</p></div></div>
            <div className="mt-4 flex flex-col gap-3 rounded-lg border bg-white/70 p-3 dark:bg-slate-950/30 sm:flex-row sm:items-end"><label className="text-sm font-semibold">Province<select value={provinceFilter} onChange={(event) => setProvinceFilter(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal sm:w-52"><option value="all">All provinces</option>{provinceOptions.map((province) => <option key={`province-${province}`} value={province}>{province}</option>)}</select></label><label className="text-sm font-semibold">Operating region<select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal sm:w-64"><option value="all">All regions</option>{regionOptions.map((region) => <option key={`region-${region}`} value={region}>{region}</option>)}</select></label><button type="button" onClick={() => { setProvinceFilter("all"); setRegionFilter("all"); }} className="h-10 rounded-md border px-3 text-sm font-semibold hover:bg-muted">Clear location filters</button></div>
            <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-2" aria-label="Courier profiles">{visibleCouriers.map((courier) => { const safe = courier.safety.eligibleForOffers; return <button key={courier.userId} type="button" onClick={() => setLocation(`/admin/couriers/${courier.userId}`)} className="flex w-full items-center gap-3 rounded-xl border bg-background p-3 text-left transition-colors hover:border-emerald-400" aria-label={`Open ${courier.name} courier profile`}>
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm"><AvatarImage src={courier.avatarUrl ?? undefined} alt={`${courier.name} verified selfie`} /><AvatarFallback className="bg-emerald-700 font-bold text-white">{initials(courier.name)}</AvatarFallback></Avatar>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-2 font-semibold"><span className="truncate">{courier.name}</span>{courier.isAvailable ? <span className="h-2 w-2 rounded-full bg-emerald-500" title="Available" /> : <span className="h-2 w-2 rounded-full bg-slate-300" title="Unavailable" />}</span><span className="mt-1 block text-xs capitalize text-muted-foreground">{courier.vehicleType} · {courier.vehicleRegistration} · {courier.activePackageCount} active package{courier.activePackageCount === 1 ? "" : "s"}</span><span className="mt-1 block text-xs text-muted-foreground">{courier.region ? `${courier.region}, ${courier.province ?? "South Africa"}` : courier.province ?? "Region not recorded"}</span></span>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${safe ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{safe ? "Eligible" : "Safety hold"}</span>
              </button>; })}</div>
              <div className="rounded-xl border border-dashed bg-background p-5 text-sm text-muted-foreground"><p className="font-semibold text-foreground">Select a courier to open their full profile</p><p className="mt-1">Each profile has its own page with complete tracking history, package activity, relay handovers, kilometres, and driving times.</p></div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Safety policy: maximum {safety.data?.limits.maxWeeklyKilometres.toLocaleString()} km and {duration(safety.data?.limits.maxWeeklyDrivingMinutes ?? 0)} driving per UTC week, plus a {safety.data?.limits.cooldownHours}-hour rest period after reaching the daily limit. Limits are protective controls, not a substitute for local employment, transport, or health-and-safety advice.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
