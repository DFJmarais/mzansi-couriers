import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function getMondayIso() {
  const date = new Date();
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

export default function AdminPayoutReviewPanel() {
  const [weekStart, setWeekStart] = useState(getMondayIso);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const input = useMemo(() => ({ weekStart }), [weekStart]);
  const review = trpc.payouts.getWeeklyReview.useQuery(input);
  const process = trpc.payouts.processWeeklyCourierPayouts.useMutation({
    onSuccess: (result) => {
      setNotice(`Test-mode processing completed for ${result.results.length} payout(s).`);
      void review.refetch();
    },
    onError: (error) => setNotice(error.message),
  });

  const pending = Array.from(new Map((review.data?.candidates.filter((payout) => payout.status === "pending") ?? []).map((payout) => [payout.id, payout])).values());
  const selected = pending.filter((payout) => selectedIds.includes(payout.id));
  const total = selected.reduce((sum, payout) => sum + Number(payout.amount), 0);

  return (
    <Card className="border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-accent" /> Weekly courier payouts</CardTitle>
        <CardDescription>Review verified courier earnings before Paystack processing. The normal processing window is Thursday or Friday.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="text-sm font-medium">Week starting Monday
            <input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="mt-1 block rounded-md border bg-background px-3 py-2 font-normal" />
          </label>
          <Button variant="outline" onClick={() => void review.refetch()} disabled={review.isFetching}><RefreshCw className="mr-2 h-4 w-4" />Refresh review</Button>
        </div>

        {review.isLoading ? <p className="text-sm text-muted-foreground">Preparing the payout review…</p> : pending.length === 0 ? <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">No eligible verified courier payouts are ready for this week.</p> : (
          <>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm"><label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={selected.length === pending.length} onChange={(event) => setSelectedIds(event.target.checked ? pending.map((payout) => payout.id) : [])} /> Select all eligible payouts</label><span>{selected.length} selected</span></div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-3">Review</th><th className="p-3">Courier</th><th className="p-3">Deliveries</th><th className="p-3">Amount</th><th className="p-3">Recipient</th></tr></thead><tbody>{pending.map((payout) => <tr key={payout.id} className="border-t"><td className="p-3"><input type="checkbox" checked={selectedIds.includes(payout.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, payout.id] : current.filter((id) => id !== payout.id))} aria-label={`Select payout for courier ${payout.courierId}`} /></td><td className="p-3">#{payout.courierId}</td><td className="p-3">{payout.deliveryCount ?? 0}</td><td className="p-3">R {Number(payout.amount).toFixed(2)}</td><td className="p-3">Verified</td></tr>)}</tbody></table>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold">Selected total: R {total.toFixed(2)}</p><Button onClick={() => process.mutate({ payoutIds: selectedIds, testMode: true })} disabled={process.isPending || selectedIds.length === 0}>{process.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Approve selected test transfers</Button></div>
          </>
        )}
        {notice && <p role="status" className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">{notice}</p>}
      </CardContent>
    </Card>
  );
}
