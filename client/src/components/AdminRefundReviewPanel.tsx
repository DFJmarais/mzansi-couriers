import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const money = (value: unknown) => `R ${Number(value ?? 0).toFixed(2)}`;

export default function AdminRefundReviewPanel() {
  const [notice, setNotice] = useState<string | null>(null);
  const [partialAmounts, setPartialAmounts] = useState<Record<number, string>>({});
  const refunds = trpc.refunds.list.useQuery();
  const review = trpc.refunds.review.useMutation({ onSuccess: () => { setNotice("Refund moved to review."); void refunds.refetch(); }, onError: (error) => setNotice(error.message) });
  const approve = trpc.refunds.approve.useMutation({ onSuccess: (result) => { setNotice(result.approved ? "Refund approved and queued with Paystack. Final status will update from the signed Paystack webhook." : result.error ?? "Paystack rejected the refund request."); void refunds.refetch(); }, onError: (error) => setNotice(error.message) });
  const reject = trpc.refunds.reject.useMutation({ onSuccess: () => { setNotice("Refund request rejected."); void refunds.refetch(); }, onError: (error) => setNotice(error.message) });
  const pending = (refunds.data ?? []).filter((refund) => !["processed", "failed", "rejected"].includes(refund.status));
  const history = (refunds.data ?? []).filter((refund) => ["processed", "failed", "rejected"].includes(refund.status));

  return <Card className="border-red-200 dark:border-red-900">
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-red-700" /> Manual customer refunds</CardTitle>
      <CardDescription>Refunds are never automatic. An authorised administrator approves the amount; Paystack confirms the final outcome through its signed webhook.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {refunds.isLoading ? <p className="text-sm text-muted-foreground">Loading refund requests…</p> : pending.length === 0 ? <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">No refund requests awaiting action.</p> : <div className="space-y-4">{pending.map((refund) => {
        const amount = partialAmounts[refund.id] ?? String(Number(refund.requestedAmount));
        const busy = review.isPending || approve.isPending || reject.isPending;
        return <div key={refund.id} className="rounded-xl border bg-background p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div><p className="font-semibold text-foreground">Parcel #{refund.parcelId} · {refund.trackingCode}</p><p className="text-sm text-muted-foreground">{refund.customerName ?? "Customer"} · {refund.customerEmail ?? "No email"}</p><p className="mt-1 text-sm text-muted-foreground">Requested {new Date(refund.createdAt).toLocaleString()} · Status: <strong className="text-foreground">{refund.status}</strong></p></div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-200">{refund.paystackStatus ?? "Awaiting admin decision"}</span>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5"><div><span className="text-muted-foreground">Original payment</span><p className="font-semibold">{money(refund.originalPaymentAmount)}</p></div><div><span className="text-muted-foreground">Available to refund</span><p className="font-semibold">{money(refund.availableToRefund)}</p></div><div><span className="text-muted-foreground">Requested refund</span><p className="font-semibold">{money(refund.requestedAmount)}</p></div><div><span className="text-muted-foreground">Paystack reference</span><p className="break-all font-mono text-xs">{refund.transactionReference}</p></div><div><span className="text-muted-foreground">Reason</span><p className="font-medium">{refund.reason}</p></div></div>
          <div className="grid gap-3 rounded-lg border border-red-200 bg-red-50/60 p-3 text-sm dark:border-red-900 dark:bg-red-950/20 sm:grid-cols-2 lg:grid-cols-4"><div><span className="text-muted-foreground">Refund amount</span><p className="font-semibold">{money(refund.refundAmount)}</p></div><div><span className="text-muted-foreground">Courier payout exposure</span><p className="font-semibold">{money(refund.courierPayoutExposure)}</p><p className="text-xs text-muted-foreground">Paid gross: {money(refund.paidCourierGross)}</p></div><div><span className="text-muted-foreground">Platform reversal</span><p className="font-semibold">{money(refund.platformReversalAmount)}</p></div><div><span className="text-muted-foreground">Final Mzansi contribution</span><p className="font-semibold">{money(refund.finalPlatformContribution)}</p><p className="text-xs text-muted-foreground">Courier net: {money(refund.finalCourierEarnings)}</p></div></div>
          <div className="mt-4 flex flex-col gap-3 rounded-lg bg-muted/40 p-3 sm:flex-row sm:items-end"><label className="text-sm font-medium">Partial amount<input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setPartialAmounts((current) => ({ ...current, [refund.id]: event.target.value }))} className="mt-1 block w-full rounded-md border bg-background px-3 py-2 sm:w-36" /></label><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => review.mutate({ requestId: refund.id })}><AlertTriangle className="mr-2 h-4 w-4" />Review refund</Button><Button disabled={busy} onClick={() => approve.mutate({ requestId: refund.id })}><CheckCircle2 className="mr-2 h-4 w-4" />Approve full refund</Button><Button variant="secondary" disabled={busy} onClick={() => approve.mutate({ requestId: refund.id, amount: Number(amount) })}>Approve partial</Button><Button variant="destructive" disabled={busy} onClick={() => reject.mutate({ requestId: refund.id, adminNote: "Rejected after administrator review" })}><XCircle className="mr-2 h-4 w-4" />Reject refund</Button></div></div>
        </div>;
      })}</div>}
      {history.length > 0 && <div className="space-y-3"><div><h3 className="text-lg font-semibold text-foreground">Refund audit history</h3><p className="text-sm text-muted-foreground">Completed and rejected refunds remain visible with the financial impact recorded in the parcel ledger.</p></div>{history.map((refund) => <div key={`audit-${refund.id}`} className="rounded-xl border bg-muted/20 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-foreground">Parcel #{refund.parcelId} · {refund.trackingCode}</p><p className="text-sm text-muted-foreground">{refund.customerName ?? "Customer"} · {new Date(refund.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-background px-3 py-1 text-sm font-semibold text-foreground">{refund.status}</span></div><div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5"><div><span className="text-muted-foreground">Refund amount</span><p className="font-semibold">{money(refund.refundAmount)}</p></div><div><span className="text-muted-foreground">Courier exposure</span><p className="font-semibold">{money(refund.courierPayoutExposure)}</p></div><div><span className="text-muted-foreground">Platform reversal</span><p className="font-semibold">{money(refund.platformReversalAmount)}</p></div><div><span className="text-muted-foreground">Final contribution</span><p className="font-semibold">{money(refund.finalPlatformContribution)}</p></div><div><span className="text-muted-foreground">Courier net</span><p className="font-semibold">{money(refund.finalCourierEarnings)}</p></div></div></div>)}</div>}
      <div className="flex items-center justify-between gap-3">{notice && <p role="status" className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">{notice}</p>}<Button className="ml-auto" variant="outline" onClick={() => void refunds.refetch()} disabled={refunds.isFetching}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
    </CardContent>
  </Card>;
}
