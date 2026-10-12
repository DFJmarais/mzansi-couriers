import { useState } from "react";
import { AlertTriangle, BrainCircuit, CheckCircle2, RefreshCw, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DispatchRecommendation = {
  runId: number;
  parcelCount: number;
  assignedCount: number;
  assignments: Array<{ parcelId: number; courierId: number; sequence: number; areaMatch: string; reasoning: string }>;
  unassigned: Array<{ parcelId: number; trackingCode: string; reason: string }>;
  aiSummary: string;
};

export default function AdminDispatchPanel() {
  const utils = trpc.useUtils();
  const [recommendation, setRecommendation] = useState<DispatchRecommendation | null>(null);
  const recommend = trpc.aiDispatch.recommend.useMutation({ onSuccess: (data) => setRecommendation(data as DispatchRecommendation) });
  const commit = trpc.aiDispatch.commit.useMutation({ onSuccess: async () => { setRecommendation(null); await utils.aiDispatch.invalidate(); } });
  const assignments = Array.from(new Map((recommendation?.assignments ?? []).map((assignment) => [`${assignment.parcelId}:${assignment.courierId}:${assignment.sequence}`, assignment])).values());
  const unassigned = Array.from(new Map((recommendation?.unassigned ?? []).map((item) => [item.parcelId, item])).values());

  return <Card className="border-accent/30 shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-accent" />AI Relay Network Coordinator</CardTitle>
      <CardDescription>Group eligible parcels into safe relay legs by area, capacity, courier availability, and route fit before offering each leg to a suitable courier.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => recommend.mutate({ includeAssigned: false })} disabled={recommend.isPending} className="gap-2"><RefreshCw className={`h-4 w-4 ${recommend.isPending ? "animate-spin" : ""}`} />{recommend.isPending ? "Analyzing parcels…" : "Analyze relay opportunities"}</Button>
        {recommendation ? <Button variant="outline" onClick={() => commit.mutate({ dispatchRunId: recommendation.runId })} disabled={commit.isPending || recommendation.assignedCount === 0} className="gap-2"><Send className="h-4 w-4" />{commit.isPending ? "Publishing…" : "Publish relay offers"}</Button> : null}
      </div>
      {recommend.error ? <p className="text-sm text-destructive">{recommend.error.message}</p> : null}
      {commit.error ? <p className="text-sm text-destructive">{commit.error.message}</p> : null}
      {recommendation ? <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex flex-wrap gap-2 text-sm"><Badge variant="secondary">{recommendation.parcelCount} eligible parcels</Badge><Badge variant="default">{recommendation.assignedCount} safe relay offers</Badge>{recommendation.unassigned.length ? <Badge variant="destructive">{recommendation.unassigned.length} need manual review</Badge> : <Badge className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" />All eligible parcels have a safe relay plan</Badge>}</div>
        <p className="text-sm text-muted-foreground">{recommendation.aiSummary}</p>
        <div className="divide-y rounded-md border bg-background">{assignments.map((assignment) => <div key={`assignment-${assignment.parcelId}-${assignment.courierId}-${assignment.sequence}`} className="flex flex-col gap-1 px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"><span><strong>Parcel #{assignment.parcelId}</strong> → Courier #{assignment.courierId} · stop {assignment.sequence}</span><span className="text-xs text-muted-foreground">{assignment.areaMatch} · {assignment.reasoning}</span></div>)}</div>
        {unassigned.length ? <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><p className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Network coordination required</p>{unassigned.map((item) => <p key={`unassigned-${item.parcelId}`} className="mt-1">{item.trackingCode}: {item.reason}</p>)}</div> : null}
      </div> : <p className="text-sm text-muted-foreground">No relay plan loaded. Analyze when couriers are online and parcels are ready for pickup or handoff.</p>}
    </CardContent>
  </Card>;
}
