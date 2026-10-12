import { useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminRelayExceptionsPanel() {
  const utils = trpc.useUtils();
  const exceptions = trpc.smartStack.adminExceptions.useQuery();
  const resolve = trpc.smartStack.resolveException.useMutation({ onSuccess: () => { toast.success("Exception resolution recorded."); utils.smartStack.adminExceptions.invalidate(); } });
  const [noteById, setNoteById] = useState<Record<number, string>>({});
  const uniqueExceptions = Array.from(new Map((exceptions.data ?? []).map((row) => [row.exception.id, row])).values());

  if (exceptions.isLoading) return <Card><CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading route exceptions…</CardContent></Card>;
  if (exceptions.isError) return <Card><CardContent className="py-6 text-sm text-muted-foreground">The route exception queue is taking a moment to load. Refresh to try again.</CardContent></Card>;
  if (!uniqueExceptions.length) return <Card className="border-emerald-200 bg-emerald-50/60"><CardContent className="flex items-center gap-3 py-5 text-sm text-emerald-900"><CheckCircle2 className="h-5 w-5" />No open relay exceptions require owner review.</CardContent></Card>;

  return <Card className="border-amber-300 bg-amber-50/60"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-700" />Relay exception queue</CardTitle><CardDescription>Review delays, custody concerns, and failed handoffs. Resolutions are recorded for the parcel history.</CardDescription></CardHeader><CardContent className="space-y-3">{uniqueExceptions.map(({ exception, delivery, reporter }) => <div key={`exception-${exception.id}`} className="rounded-lg border border-amber-200 bg-white/80 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono font-bold">{delivery.trackingCode}</p><p className="mt-1 text-sm font-semibold capitalize text-amber-950">{exception.type.replaceAll("_", " ")}</p><p className="mt-1 text-sm text-muted-foreground">Reported by {reporter.name ?? "courier"} · {exception.status.replaceAll("_", " ")}</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold capitalize text-amber-900">{exception.recoveryAction?.replaceAll("_", " ") ?? "review"}</span></div><p className="mt-3 text-sm text-amber-950">{exception.reason}</p>{exception.note ? <p className="mt-1 text-sm text-muted-foreground">{exception.note}</p> : null}<div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><input value={noteById[exception.id] ?? ""} onChange={(event) => setNoteById((current) => ({ ...current, [exception.id]: event.target.value }))} placeholder="Resolution note" aria-label={`Resolution note for ${delivery.trackingCode}`} className="h-10 rounded-md border border-amber-200 bg-white px-3 text-sm" /><Button onClick={() => resolve.mutate({ exceptionId: exception.id, status: "resolved", resolutionNote: noteById[exception.id]?.trim() || "Owner team reviewed the route and recorded the safe next step." })} disabled={resolve.isPending} className="h-10 gap-2 bg-emerald-700 hover:bg-emerald-800"><CheckCircle2 className="h-4 w-4" />Resolve</Button><Button variant="outline" onClick={() => resolve.mutate({ exceptionId: exception.id, status: "cancelled", resolutionNote: noteById[exception.id]?.trim() || "Owner team closed this exception after review." })} disabled={resolve.isPending} className="h-10">Close</Button></div></div>)}</CardContent></Card>;
}
