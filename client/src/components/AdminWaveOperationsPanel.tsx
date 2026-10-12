import { useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDot, Clock3, Coins, GitBranch, Loader2, Package, RefreshCw, Route, ShieldAlert, Truck, UserRound, Waves } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const filters = [
  ["all", "All operations"],
  ["active", "Active"],
  ["planned", "Planned / ready"],
  ["in_progress", "In progress"],
  ["exception", "Exceptions / recovery"],
  ["completed", "Completed"],
  ["settlement_blocked", "Settlement blocked"],
] as const;

type Filter = (typeof filters)[number][0];
type WaveStatus = "planned" | "assigned" | "ready" | "departed" | "handover" | "in_progress" | "completed" | "failed" | "recovery" | "settled" | "cancelled";

const allowedTransitions: Record<WaveStatus, WaveStatus[]> = {
  planned: ["assigned", "cancelled"],
  assigned: ["ready", "failed", "recovery", "cancelled"],
  ready: ["departed", "failed", "recovery", "cancelled"],
  departed: ["handover", "in_progress", "failed", "recovery"],
  handover: ["in_progress", "completed", "failed", "recovery"],
  in_progress: ["handover", "completed", "failed", "recovery"],
  completed: ["settled", "recovery"],
  failed: ["recovery", "cancelled"],
  recovery: ["assigned", "ready", "departed", "failed", "completed", "cancelled"],
  settled: [],
  cancelled: [],
};

const statusLabel = (status: string) => status.replaceAll("_", " ").replaceAll("-", " ");
const zar = (value: unknown) => `R${Number(value ?? 0).toFixed(2)}`;
const dateLabel = (value: unknown) => value ? new Date(String(value)).toLocaleString() : "Not recorded";
const statusTone = (status: string) => {
  if (["completed", "settled"].includes(status)) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
  if (["failed", "recovery", "cancelled"].includes(status)) return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200";
  if (["departed", "handover", "in_progress"].includes(status)) return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200";
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
};

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-xl border bg-background p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p></div>;
}

export default function AdminWaveOperationsPanel() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<Filter>("all");
  const [reconcileRunId, setReconcileRunId] = useState<number | null>(null);
  const operations = trpc.relaySettlement.getWaveOperations.useQuery({ filter });
  const harness = trpc.relaySettlement.getSyntheticWaveHarnessStatus.useQuery();
  const seedHarness = trpc.relaySettlement.seedSyntheticWaveOperations.useMutation({
    onSuccess: (result) => { toast.success(result.idempotent ? "Synthetic acceptance data is already seeded." : "Synthetic Wave Operations data seeded."); void harness.refetch(); void operations.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const resetHarness = trpc.relaySettlement.resetSyntheticWaveOperations.useMutation({
    onSuccess: () => { toast.success("Synthetic acceptance data reset. No production records were changed."); void harness.refetch(); void operations.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const transition = trpc.relaySettlement.transitionDispatchWave.useMutation({
    onSuccess: () => { toast.success("Wave lifecycle event recorded."); void operations.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const recover = trpc.relaySettlement.recordWaveRecovery.useMutation({
    onSuccess: () => { toast.success("Recovery action recorded."); void operations.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const reconcile = trpc.relaySettlement.reconcileDispatchRun.useQuery(
    { dispatchRunId: reconcileRunId ?? 0 },
    { enabled: reconcileRunId !== null, retry: false },
  );

  if (operations.isLoading) return <Card><CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading durable wave operations…</CardContent></Card>;
  if (operations.isError) return <Card className="border-red-200"><CardContent className="py-8 text-sm text-destructive" role="alert">Wave operations could not be loaded. Refresh and try again.</CardContent></Card>;

  const data = operations.data;
  const waves = data?.waves ?? [];
  const runs = data?.runs ?? [];
  const totals = {
    waves: waves.length,
    parcels: waves.reduce((sum, row) => sum + row.wave.parcelCount, 0),
    exceptions: waves.reduce((sum, row) => sum + row.exceptions.filter((exception) => ["open", "recovery_requested"].includes(exception.status)).length, 0),
    blocked: waves.filter((row) => row.reconciliation?.status === "blocked").length,
    platform: waves.reduce((sum, row) => sum + Number(row.wave.platformAllocation), 0),
    pool: waves.reduce((sum, row) => sum + Number(row.wave.courierPoolAllocation), 0),
  };

  const recordTransition = (waveId: number, currentStatus: WaveStatus, toStatus: WaveStatus) => {
    transition.mutate({ waveId, toStatus, eventKey: `admin-wave:${waveId}:${toStatus}:${Date.now()}`, reason: `Admin operations transition: ${statusLabel(currentStatus)} to ${statusLabel(toStatus)}` });
  };

  const requestRecovery = (wave: (typeof waves)[number]) => {
    recover.mutate({ waveId: wave.wave.id, idempotencyKey: `admin-recovery:${wave.wave.id}:${Date.now()}`, reason: "Admin requested controlled recovery review." });
  };

  return <div className="space-y-6">
    <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Waves className="h-5 w-5 text-emerald-700" />Admin Wave Operations</CardTitle>
            <CardDescription className="mt-1 max-w-3xl">Monitor and manage durable dispatch waves created from committed runs. Lifecycle, recovery, reconciliation, and settlement actions use the existing secure, idempotent backend workflows.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={() => void operations.refetch()} disabled={operations.isFetching} className="gap-2"><RefreshCw className={`h-4 w-4 ${operations.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-emerald-300 bg-white/70 p-3 text-sm text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100"><strong>Financial control:</strong> the 20% platform allocation is revenue allocation, not automatically profit. Every courier payment shown here must come from the one shared 80% courier pool; it is never 80% per courier or per leg.</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><Metric label="Visible waves" value={String(totals.waves)} /><Metric label="Parcels" value={String(totals.parcels)} /><Metric label="Open exceptions" value={String(totals.exceptions)} tone={totals.exceptions ? "text-amber-700" : "text-emerald-700"} /><Metric label="Settlement blocks" value={String(totals.blocked)} tone={totals.blocked ? "text-red-700" : "text-emerald-700"} /><Metric label="Platform allocation" value={zar(totals.platform)} /><Metric label="Shared courier pool" value={zar(totals.pool)} /></div>
      </CardContent>
    </Card>

    <Card className="border-sky-200 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20">
      <CardHeader className="pb-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="h-5 w-5 text-sky-700" />Synthetic acceptance harness</CardTitle><CardDescription className="mt-1 max-w-3xl">Seed or remove an isolated QA namespace covering normal, 50+ parcel multi-wave, relay, active, completed, cancellation, failed-handover, recovery, capacity-blocked, settlement-blocked, notification-failure, and fully reconciled states. This never sends notifications, charges cards, creates payouts, or mutates real operations.</CardDescription></div><div className="flex flex-wrap gap-2"><Button type="button" onClick={() => seedHarness.mutate()} disabled={seedHarness.isPending || harness.data?.seeded} className="gap-2"><CheckCircle2 className="h-4 w-4" />{seedHarness.isPending ? "Seeding…" : harness.data?.seeded ? "Seeded" : "Seed synthetic QA data"}</Button><Button type="button" variant="outline" onClick={() => resetHarness.mutate()} disabled={resetHarness.isPending || !harness.data?.seeded} className="gap-2"><RefreshCw className={`h-4 w-4 ${resetHarness.isPending ? "animate-spin" : ""}`} />{resetHarness.isPending ? "Resetting…" : "Reset QA data"}</Button></div></div></CardHeader>
      <CardContent className="space-y-3"><div className="rounded-lg border border-sky-300 bg-white/70 p-3 text-xs text-sky-950 dark:bg-sky-950/40 dark:text-sky-100"><strong>Namespace:</strong> <code>{harness.data?.namespace ?? "qa:wave-operations:v1"}</code> · {harness.data?.seeded ? `${harness.data.counts?.runs ?? 0} runs · ${harness.data.counts?.waves ?? 0} waves · ${harness.data.counts?.parcels ?? 0} parcels` : "Not seeded"}. Reset uses an exact recorded table/id catalog, not broad production queries.</div>{harness.data?.seeded && harness.data.statuses ? <div className="flex flex-wrap gap-2">{Object.entries(harness.data.statuses).map(([status, count]) => <Badge key={status} variant="outline" className="capitalize">{statusLabel(status)}: {count}</Badge>)}</div> : null}<div className="flex flex-wrap gap-1.5">{(harness.data?.scenarios ?? []).map((scenario) => <Badge key={scenario} variant="secondary" className="text-[11px]">{statusLabel(scenario)}</Badge>)}</div></CardContent>
    </Card>

    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Wave operation filters">{filters.map(([value, label]) => <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)} role="tab" aria-selected={filter === value}>{label}</Button>)}</div>

    {runs.length ? <Card><CardHeader><CardTitle className="text-lg">Dispatch/run overview</CardTitle><CardDescription>Runs are shown separately from waves so Admin can see whether the planned operation has been materialized and reconciled.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{runs.slice(0, 12).map(({ run, reconciliation, assignmentCount }) => <div key={run.id} className="rounded-xl border bg-muted/20 p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold">Run #{run.id}</p><p className="text-xs text-muted-foreground">Created {dateLabel(run.createdAt)}</p></div><Badge variant="outline" className="capitalize">{statusLabel(run.status)}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><span><strong>{run.parcelCount}</strong><br />parcels</span><span><strong>{assignmentCount}</strong><br />assignments</span><span><strong>{run.unassignedCount}</strong><br />unassigned</span></div><p className={`mt-3 text-xs ${reconciliation?.status === "blocked" ? "text-red-700" : "text-muted-foreground"}`}>Reconciliation: {reconciliation?.status ?? "not started"}{reconciliation?.blockingReason ? ` · ${reconciliation.blockingReason}` : ""}</p>{run.aiSummary?.includes("qa:wave-operations:v1") ? <p className="mt-2 text-[11px] font-medium text-sky-700">Synthetic QA · {run.aiSummary.split("scenario=")[1] ?? "scenario"}</p> : null}</div>)}</CardContent></Card> : null}

    {!waves.length ? <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center"><CircleDot className="h-8 w-8 text-muted-foreground" /><p className="font-semibold">No waves match this filter</p><p className="max-w-md text-sm text-muted-foreground">Durable waves appear here after a committed dispatch run is materialized. Synthetic QA data can be used for acceptance testing without touching real payments or payouts.</p></CardContent></Card> : null}

    <div className="space-y-4">{waves.map((row) => {
      const { wave, run, reconciliation, parcels, couriers, relayLegs, events, recoveryActions, exceptions, settlementLinks } = row;
      const activeExceptions = exceptions.filter((exception) => ["open", "recovery_requested"].includes(exception.status));
      const nextStatuses = allowedTransitions[wave.status as WaveStatus] ?? [];
      return <Card key={wave.id} className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><CardTitle className="text-lg">Wave {wave.waveNumber} · Run #{wave.dispatchRunId}</CardTitle><Badge className={`capitalize ${statusTone(wave.status)}`}>{statusLabel(wave.status)}</Badge>{activeExceptions.length ? <Badge variant="destructive">{activeExceptions.length} attention</Badge> : null}</div><CardDescription className="mt-1">Wave ID {wave.id} · departure sequence {wave.departureSequence} · planned offset {wave.departureOffsetMinutes} minutes</CardDescription></div><div className="flex flex-wrap gap-2">{nextStatuses.filter((status) => ["ready", "departed", "handover", "in_progress", "completed", "settled", "cancelled"].includes(status)).slice(0, 2).map((status) => <Button key={status} type="button" size="sm" variant={status === "cancelled" ? "outline" : "default"} onClick={() => recordTransition(wave.id, wave.status as WaveStatus, status)} disabled={transition.isPending}>{status === "cancelled" ? "Cancel" : `Mark ${statusLabel(status)}`}</Button>)}{["failed", "recovery"].includes(wave.status) || activeExceptions.length ? <Button type="button" size="sm" variant="outline" onClick={() => requestRecovery(row)} disabled={recover.isPending} className="gap-1"><ShieldAlert className="h-3.5 w-3.5" />Request recovery</Button> : null}<Button type="button" size="sm" variant="ghost" onClick={() => { setReconcileRunId(wave.dispatchRunId); toast.info("Reconciliation refreshed for this run."); }} className="gap-1"><RefreshCw className="h-3.5 w-3.5" />Reconcile</Button></div></div></CardHeader>
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Parcels / couriers" value={`${wave.parcelCount} / ${wave.courierCount}`} /><Metric label="Load" value={`${Number(wave.totalWeightKg).toFixed(1)} kg · ${Number(wave.totalVolumeM3).toFixed(3)} m³`} /><Metric label="Capacity" value={`${wave.capacityUnits ?? "—"} parcels · ${wave.capacityWeightKg ? `${Number(wave.capacityWeightKg).toFixed(1)} kg` : "—"}`} /><Metric label="Road route" value={`${Number(wave.routeDistanceKm).toFixed(1)} km · ${wave.routeDurationMinutes} min`} /></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Customer revenue" value={zar(wave.customerCharge)} /><Metric label="Platform allocation" value={zar(wave.platformAllocation)} /><Metric label="Shared 80% pool" value={zar(wave.courierPoolAllocation)} /><Metric label="Reserved" value={zar(wave.reservedAmount)} /><Metric label="Est. courier net" value={zar(wave.estimatedCourierNet)} /></div>
          <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl border p-4"><h3 className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4 text-blue-700" />Parcels assigned</h3>{parcels.length ? <div className="mt-3 space-y-2">{parcels.map(({ link, delivery }) => <div key={link.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-2 text-sm"><span><strong>{delivery?.trackingCode ?? `Parcel #${link.deliveryId}`}</strong><span className="ml-2 text-xs text-muted-foreground">{delivery?.packageSize ?? "size unknown"} · {delivery?.packageWeight ?? "—"} kg</span></span><Badge variant="outline" className="capitalize">{statusLabel(link.status)}</Badge></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No parcel links recorded.</p>}</div><div className="rounded-xl border p-4"><h3 className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4 text-emerald-700" />Courier assignments</h3>{couriers.length ? <div className="mt-3 space-y-2">{couriers.map(({ assignment, courier }) => <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-2 text-sm"><span><strong>{courier?.name ?? `Courier #${assignment.courierId}`}</strong><span className="ml-2 text-xs capitalize text-muted-foreground">{assignment.role}</span></span><Badge variant="outline" className="capitalize">{statusLabel(assignment.status)}</Badge></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No courier assignment links recorded.</p>}</div></div>
          <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl border p-4"><h3 className="flex items-center gap-2 font-semibold"><Route className="h-4 w-4 text-orange-700" />Relay legs and handovers</h3>{relayLegs.length ? <div className="mt-3 space-y-2">{relayLegs.map(({ link, leg }) => <div key={link.id} className="rounded-lg bg-muted/30 p-3 text-sm"><div className="flex items-center justify-between gap-2"><strong>Leg {link.sequence} · {leg?.originArea ?? "Origin"} → {leg?.destinationArea ?? "Destination"}</strong><Badge variant="outline" className="capitalize">{statusLabel(leg?.status ?? "not linked")}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{leg?.roadDistanceKm ?? "—"} road km · {leg?.handoverTimeMinutes ?? 0} min handover · from courier {leg?.fromCourierId ?? "—"} to courier {leg?.toCourierId ?? "—"}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No relay legs linked to this wave.</p>}</div><div className="rounded-xl border p-4"><h3 className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4 text-purple-700" />Departure and arrival</h3><div className="mt-3 grid gap-2 text-sm"><p><strong>Planned:</strong> run created {dateLabel(run?.createdAt)} + {wave.departureOffsetMinutes} minutes</p><p><strong>Actual departure:</strong> {dateLabel(wave.startedAt)}</p><p><strong>Actual completion:</strong> {dateLabel(wave.completedAt)}</p><p><strong>Settlement:</strong> {dateLabel(wave.settledAt)} · {settlementLinks.length} allocation link(s)</p></div></div></div>
          {activeExceptions.length || recoveryActions.length || reconciliation?.blockingReason ? <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20"><h3 className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-100"><AlertTriangle className="h-4 w-4" />Admin attention</h3>{activeExceptions.map((exception) => <p key={`exception-${exception.id}`} className="mt-2 text-sm text-amber-950 dark:text-amber-100">{statusLabel(exception.type)} · {exception.reason} · {statusLabel(exception.status)}</p>)}{recoveryActions.map(({ action, originalCourier, replacementCourier }) => <p key={action.id} className="mt-2 text-sm text-amber-950 dark:text-amber-100">Recovery {statusLabel(action.status)} · {action.reason}{originalCourier ? ` · original: ${originalCourier.name}` : ""}{replacementCourier ? ` · replacement: ${replacementCourier.name}` : ""}</p>)}{reconciliation?.blockingReason ? <p className="mt-2 text-sm font-semibold text-red-700">Reconciliation blocker: {reconciliation.blockingReason}</p> : null}</div> : null}
          <div className="rounded-xl border p-4"><h3 className="flex items-center gap-2 font-semibold"><GitBranch className="h-4 w-4 text-slate-700" />Auditable event timeline</h3>{events.length ? <div className="mt-3 space-y-3">{events.map((event) => <div key={event.id} className="border-l-2 border-emerald-200 pl-3 dark:border-emerald-900"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold capitalize">{event.fromStatus ? `${statusLabel(event.fromStatus)} → ` : ""}{statusLabel(event.toStatus)}</p><span className="text-[11px] text-muted-foreground">{dateLabel(event.createdAt)}</span></div><p className="mt-1 text-xs text-muted-foreground">{event.reason ?? "Lifecycle event recorded"} · key {event.eventKey}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No lifecycle events recorded.</p>}</div>
        </CardContent>
      </Card>;
    })}</div>
  </div>;
}
