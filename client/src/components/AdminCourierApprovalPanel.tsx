import { useState } from "react";
import { CheckCircle2, Loader2, UserCheck, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ApplicationDocuments({ userId }: { userId: number }) {
  const documents = trpc.onboarding.getVerificationDocuments.useQuery({ userId });
  if (documents.isLoading) return <p className="text-xs text-muted-foreground">Loading submitted documents…</p>;
  if (documents.error) return <p className="text-xs text-destructive">We are preparing these documents: {documents.error.message}</p>;
  if (!documents.data?.length) return <p className="text-xs text-muted-foreground">Verification documents will appear here as soon as they are submitted.</p>;
  return <div className="space-y-1 rounded-md bg-muted/40 p-3"><p className="text-xs font-semibold">Verification documents</p>{documents.data.map((document) => <div key={document.id} className="flex items-center justify-between gap-2 text-xs"><span>{document.documentType}</span><span className="font-medium">{document.verificationStatus}</span></div>)}</div>;
}

export default function AdminCourierApprovalPanel() {
  const utils = trpc.useUtils();
  const pending = trpc.onboarding.getPendingApplications.useQuery();
  const approve = trpc.onboarding.approveApplication.useMutation({ onSuccess: () => utils.onboarding.getPendingApplications.invalidate() });
  const reject = trpc.onboarding.rejectApplication.useMutation({ onSuccess: () => utils.onboarding.getPendingApplications.invalidate() });
  const activate = trpc.onboarding.activateAccount.useMutation({ onSuccess: () => utils.onboarding.getPendingApplications.invalidate() });
  const [reason, setReason] = useState<Record<number, string>>({});

  if (pending.isLoading) return <Card><CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading courier applications…</CardContent></Card>;
  if (pending.error) return <Card><CardContent className="py-6 text-sm text-destructive" role="alert">{pending.error.message}</CardContent></Card>;
  const applications = pending.data ?? [];

  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-accent" />Courier applications</CardTitle>
      <CardDescription>Review each application before welcoming a courier onto paid parcel routes.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {applications.length === 0 ? <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">You are all caught up. New courier applications will appear here for review.</p> : applications.map((application) => <div key={application.userId} className="space-y-3 rounded-lg border p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">Application #{application.userId}</p><p className="text-sm text-muted-foreground">Vehicle: {application.vehicleType ?? "To be provided"} · {application.vehicleRegistration ?? "Registration to be provided"}</p><p className="text-xs text-muted-foreground">Licence: {application.licenseNumber ? "Supplied" : "To be provided"}</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">Pending review</span></div>
        <ApplicationDocuments userId={application.userId} />
        <textarea value={reason[application.userId] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [application.userId]: event.target.value }))} placeholder="Optional review note or next information needed" aria-label={`Review note for application ${application.userId}`} className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" />
        <div className="grid gap-2 sm:grid-cols-3"><Button onClick={() => approve.mutate({ userId: application.userId, notes: reason[application.userId] })} disabled={approve.isPending || reject.isPending || activate.isPending} className="gap-2"><CheckCircle2 className="h-4 w-4" />Approve</Button><Button variant="outline" onClick={() => reject.mutate({ userId: application.userId, reason: reason[application.userId]?.trim() || "Please share the remaining information so we can continue the review." })} disabled={approve.isPending || reject.isPending || activate.isPending} className="gap-2"><XCircle className="h-4 w-4" />Request more information</Button><Button variant="secondary" onClick={() => activate.mutate({ userId: application.userId })} disabled={activate.isPending || approve.isPending || reject.isPending}>Activate approved courier</Button></div>
      </div>)}
      {approve.error ? <p className="text-sm text-destructive" role="alert">{approve.error.message}</p> : null}
      {reject.error ? <p className="text-sm text-destructive" role="alert">{reject.error.message}</p> : null}
      {activate.error ? <p className="text-sm text-destructive" role="alert">{activate.error.message}</p> : null}
    </CardContent>
  </Card>;
}
