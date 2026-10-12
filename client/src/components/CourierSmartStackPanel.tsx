import { useMemo, useState } from "react";
import { CheckCircle2, Fuel, Loader2, Plus, Route, ShieldAlert, TrendingUp, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const riskStyles = {
  low: "bg-emerald-100 text-emerald-900",
  medium: "bg-amber-100 text-amber-900",
  high: "bg-orange-100 text-orange-900",
  critical: "bg-red-100 text-red-900",
} as const;

const exceptionLabels = {
  courier_delayed: "I am running late",
  receiving_courier_delayed: "Receiving courier is delayed",
  handoff_failed: "Handoff could not be completed",
  address_clarification: "Address needs clarification",
  recipient_unavailable: "Recipient is unavailable",
  connectivity_concern: "Connectivity concern",
  custody_review: "Parcel custody needs review",
} as const;

export default function CourierSmartStackPanel() {
  const utils = trpc.useUtils();
  const recommendation = trpc.smartStack.myRecommendation.useQuery();
  const addOns = trpc.smartStack.myAddOns.useQuery();
  const active = trpc.deliveryRuns.active.useQuery();
  const exceptions = trpc.smartStack.myExceptions.useQuery();
  const acceptAddOn = trpc.smartStack.acceptAddOn.useMutation({ onSuccess: () => { toast.success("Add-on added to your route."); utils.smartStack.myAddOns.invalidate(); utils.deliveryRuns.active.invalidate(); } });
  const declineAddOn = trpc.smartStack.declineAddOn.useMutation({ onSuccess: () => { toast.success("Add-on declined. Your rating is unchanged."); utils.smartStack.myAddOns.invalidate(); } });
  const reportException = trpc.smartStack.reportException.useMutation({ onSuccess: (result) => { toast.success(result.message); setExceptionNote(""); utils.smartStack.myExceptions.invalidate(); } });
  const [exceptionType, setExceptionType] = useState<keyof typeof exceptionLabels>("courier_delayed");
  const [recoveryAction, setRecoveryAction] = useState<"wait_and_retry" | "safe_hold" | "request_replacement" | "operations_review">("wait_and_retry");
  const [exceptionNote, setExceptionNote] = useState("");

  const activeStop = useMemo(() => active.data?.stops?.find(({ stop }) => !["completed", "failed"].includes(stop.status)), [active.data?.stops]);
  const recommendationData = recommendation.data;
  const routeStops = Array.isArray(recommendationData?.routeStops) ? recommendationData.routeStops as Array<{ parcelId: number; kind: string; area: string }> : [];
  const openExceptions = (exceptions.data ?? []).filter((exception) => ["open", "recovery_requested"].includes(exception.status));

  const submitException = () => {
    if (!activeStop?.delivery.id) {
      toast.info("Start or load a parcel route before reporting a route exception.");
      return;
    }
    const reason = exceptionNote.trim() || exceptionLabels[exceptionType];
    reportException.mutate({ deliveryId: activeStop.delivery.id, type: exceptionType, recoveryAction, reason, note: exceptionNote.trim() || undefined });
  };

  return <div className="space-y-4">
    {recommendationData ? <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50 via-background to-amber-50 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Mzansi SmartStack</p><CardTitle className="mt-1 flex items-center gap-2"><Route className="h-5 w-5 text-emerald-700" />Your best route recommendation</CardTitle><CardDescription className="mt-1">A transparent recommendation built from route fit, deadlines, capacity, and recorded courier economics.</CardDescription></div><Badge className={riskStyles[recommendationData.deadlineRisk]}> {recommendationData.deadlineRisk} deadline risk</Badge></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-lg bg-white/80 p-3"><p className="text-xs text-muted-foreground">Parcels</p><p className="text-2xl font-bold">{routeStops.filter((stop) => stop.kind === "pickup").length}</p></div><div className="rounded-lg bg-white/80 p-3"><p className="text-xs text-muted-foreground">Estimated net</p><p className="text-2xl font-bold text-emerald-700">R{Number(recommendationData.estimatedCourierNet).toFixed(2)}</p></div><div className="rounded-lg bg-white/80 p-3"><p className="text-xs text-muted-foreground">Route time</p><p className="text-2xl font-bold">{recommendationData.totalTimeMinutes}m</p></div><div className="rounded-lg bg-white/80 p-3"><p className="text-xs text-muted-foreground">Capacity</p><p className="text-2xl font-bold">{recommendationData.capacityUsedUnits}/{recommendationData.capacityUnits}</p></div></div>
      </CardHeader>
      <CardContent className="space-y-3"><div className="grid gap-2 text-sm sm:grid-cols-3"><p className="flex items-center gap-2"><Route className="h-4 w-4 text-emerald-700" />{Number(recommendationData.totalDistanceKm).toFixed(1)} km route</p><p className="flex items-center gap-2"><Fuel className="h-4 w-4 text-amber-700" />R{Number(recommendationData.estimatedFuel).toFixed(2)} estimated fuel</p><p className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-700" />{Number(recommendationData.stackScore).toFixed(0)} SmartStack score</p></div>{routeStops.length ? <div className="rounded-lg border border-emerald-200 bg-white/70 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Route order</p><div className="mt-2 flex flex-wrap gap-2">{routeStops.map((stop, index) => <span key={`${stop.parcelId}-${stop.kind}-${index}`} className="rounded-full border border-emerald-200 px-2 py-1 text-xs font-medium">{index + 1}. {stop.kind === "pickup" ? "Collect" : "Deliver"} · {stop.area}</span>)}</div></div> : null}</CardContent>
    </Card> : null}

    {addOns.data?.length ? <Card className="border-amber-300 bg-amber-50/70"><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-amber-700" />Optional add-on opportunities</CardTitle><CardDescription>These parcels were checked against your current route. Declining an add-on never lowers your courier rating.</CardDescription></CardHeader><CardContent className="space-y-3">{addOns.data.map(({ opportunity, delivery }) => <div key={opportunity.id} className="rounded-lg border border-amber-200 bg-white/80 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-mono font-bold">{delivery.trackingCode}</p><p className="mt-1 text-sm text-muted-foreground">+{Number(opportunity.additionalDistanceKm).toFixed(1)} km · +{opportunity.additionalTimeMinutes} minutes · R{Number(opportunity.additionalPayout).toFixed(2)} additional payout</p></div><Badge className={riskStyles[opportunity.deadlineRisk]}>{opportunity.deadlineRisk} risk</Badge></div><p className="mt-2 text-sm text-amber-950">{opportunity.reason}</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><Button onClick={() => acceptAddOn.mutate({ opportunityId: opportunity.id })} disabled={acceptAddOn.isPending || declineAddOn.isPending} className="gap-2 bg-emerald-700 hover:bg-emerald-800"><CheckCircle2 className="h-4 w-4" />Accept add-on</Button><Button variant="outline" onClick={() => declineAddOn.mutate({ opportunityId: opportunity.id })} disabled={acceptAddOn.isPending || declineAddOn.isPending} className="gap-2"><XCircle className="h-4 w-4" />Decline safely</Button></div></div>)}</CardContent></Card> : null}

    <Card className="border-blue-200 bg-blue-50/60"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-blue-700" />Report a route exception</CardTitle><CardDescription>Only use this while safely stopped. A report preserves the parcel’s custody trail and gives the owner team a clear recovery path.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 sm:grid-cols-2"><select value={exceptionType} onChange={(event) => setExceptionType(event.target.value as keyof typeof exceptionLabels)} className="h-11 rounded-md border border-blue-200 bg-white px-3 text-sm text-blue-950" aria-label="Exception type">{Object.entries(exceptionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={recoveryAction} onChange={(event) => setRecoveryAction(event.target.value as typeof recoveryAction)} className="h-11 rounded-md border border-blue-200 bg-white px-3 text-sm text-blue-950" aria-label="Recovery action"><option value="wait_and_retry">Wait and retry the planned step</option><option value="safe_hold">Keep the parcel in a safe hold</option><option value="request_replacement">Request a replacement courier</option><option value="operations_review">Send for owner-team review</option></select></div><textarea value={exceptionNote} onChange={(event) => setExceptionNote(event.target.value)} placeholder="Add a short factual note for the route team (optional)" className="min-h-20 w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-950" aria-label="Exception note" /><Button onClick={submitException} disabled={reportException.isPending || !activeStop?.delivery.id} className="h-11 w-full gap-2 bg-blue-700 hover:bg-blue-800"><ShieldAlert className="h-4 w-4" />{reportException.isPending ? "Sending report…" : "Report safely"}</Button>{openExceptions.length ? <div className="rounded-lg border border-blue-200 bg-white/80 p-3 text-sm text-blue-950"><p className="font-semibold">Open route updates</p>{openExceptions.slice(0, 2).map((exception) => <p key={exception.id} className="mt-1">{exception.type.replaceAll("_", " ")} · {exception.status.replaceAll("_", " ")}</p>)}</div> : null}{reportException.error ? <p className="text-sm text-destructive" role="alert">{reportException.error.message}</p> : null}{active.isLoading ? <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Checking your active parcel…</p> : null}</CardContent></Card>
  </div>;
}
