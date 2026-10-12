import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, CheckCircle2, Package, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function DeliveryConfirmation() {
  const [, params] = useRoute("/delivery/confirm/:deliveryId");
  const [, setLocation] = useLocation();
  const deliveryId = Number(params?.deliveryId);
  const confirmation = trpc.deliveryRuns.customerView.useQuery(
    { deliveryId },
    { enabled: Number.isInteger(deliveryId) && deliveryId > 0 },
  );
  const confirmReceipt = trpc.deliveryRuns.confirmReceipt.useMutation({ onSuccess: () => confirmation.refetch() });
  const submitReview = trpc.parcelCustody.review.useMutation();
  const [issueType, setIssueType] = useState<"parcel_mismatch" | "proof_unclear" | "damage_concern" | "recipient_unavailable" | "other">("other");
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSent, setReviewSent] = useState(false);

  if (!Number.isInteger(deliveryId) || deliveryId <= 0) return <div className="container py-12"><Card><CardContent className="py-10 text-center">Invalid delivery confirmation link.</CardContent></Card></div>;
  if (confirmation.isLoading) return <div className="container py-12"><Card><CardContent className="py-10 text-center text-muted-foreground">Loading delivery proof…</CardContent></Card></div>;
  if (confirmation.error) return <div className="container py-12"><Card><CardContent className="py-10 text-center text-destructive">{confirmation.error.message}</CardContent></Card></div>;

  const data = confirmation.data;
  if (!data) return null;
  const completed = data.stop.status === "completed";
  const canConfirm = data.stop.status === "awaiting_customer_confirmation";

  return <div className="min-h-screen bg-background"><div className="container max-w-2xl py-8 space-y-6">
    <div><Button variant="ghost" className="-ml-3 mb-3" onClick={() => setLocation("/track")} aria-label="Back to tracking"><ArrowLeft className="mr-2 h-4 w-4" />Back to tracking</Button><p className="text-sm text-accent font-semibold">Mzansi Couriers</p><h1 className="text-3xl font-bold mt-1">Confirm your delivery</h1><p className="text-muted-foreground mt-2">Check the parcel and courier proof before confirming receipt.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-accent" />Parcel {data.delivery.trackingCode}</CardTitle><CardDescription>Delivery status: {data.stop.status.replaceAll("_", " ")}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4"><ShieldCheck className="w-5 h-5 text-green-600 shrink-0" /><p className="text-sm">Only confirm after you have received the correct parcel. Your confirmation completes this delivery stop.</p></div>{data.stop.proofPhotoUrl ? <div><p className="text-sm font-semibold mb-2">Courier proof photo</p><img src={data.stop.proofPhotoUrl} alt={`Proof photo for parcel ${data.delivery.trackingCode}`} className="w-full max-h-96 object-contain rounded-lg border bg-muted" /></div> : <p className="text-sm text-muted-foreground">The courier has not uploaded a proof photo yet.</p>}{completed ? <><div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="w-5 h-5" />Receipt confirmed. Thank you.</div>{!reviewSent ? <div className="rounded-lg border border-accent/30 p-4 space-y-3"><p className="font-semibold">Rate your Mzansi Couriers experience</p><div className="flex gap-2" aria-label="Delivery rating">{[1, 2, 3, 4, 5].map((score) => <button type="button" key={score} aria-label={`${score} stars`} onClick={() => setReviewScore(score)} className={`text-2xl ${score <= reviewScore ? "text-amber-500" : "text-muted-foreground/40"}`}>★</button>)}</div><textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength={1000} placeholder="Optional feedback" className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" /><Button disabled={submitReview.isPending} onClick={() => submitReview.mutate({ deliveryId, score: reviewScore, comment: reviewComment || undefined }, { onSuccess: () => setReviewSent(true) })}>{submitReview.isPending ? "Saving…" : "Send review"}</Button></div> : <p className="text-sm text-green-700">Thank you for reviewing the service.</p>}</> : canConfirm ? <div className="grid sm:grid-cols-2 gap-3"><Button className="gap-2" disabled={confirmReceipt.isPending} onClick={() => confirmReceipt.mutate({ stopId: data.stop.id, accepted: true })}><CheckCircle2 className="w-4 h-4" />{confirmReceipt.isPending ? "Confirming…" : "Confirm received"}</Button><div className="space-y-2 sm:col-span-2"><label htmlFor="delivery-issue-type" className="text-sm font-semibold">What needs attention?</label><select id="delivery-issue-type" value={issueType} onChange={(event) => setIssueType(event.target.value as typeof issueType)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="parcel_mismatch">This is not the expected parcel</option><option value="proof_unclear">The proof photo is unclear</option><option value="damage_concern">I have a parcel condition concern</option><option value="recipient_unavailable">The recipient is unavailable</option><option value="other">Something else needs attention</option></select></div><Button variant="outline" className="gap-2 sm:col-span-2" disabled={confirmReceipt.isPending} onClick={() => confirmReceipt.mutate({ stopId: data.stop.id, accepted: false, issueType, note: `Customer selected: ${issueType.replaceAll("_", " ")}` })}><AlertCircle className="w-4 h-4" />Report for review</Button></div> : <p className="text-sm text-muted-foreground">This delivery is not waiting for customer confirmation.</p>}{confirmReceipt.error ? <p className="text-sm text-destructive">{confirmReceipt.error.message}</p> : null}</CardContent></Card>
  </div></div>;
}
