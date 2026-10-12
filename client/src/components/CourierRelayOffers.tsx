import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Package, ScanLine, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { decodeParcelCodeFromFile } from "@/lib/native-barcode";

export default function CourierRelayOffers() {
  const utils = trpc.useUtils();
  const offers = trpc.relay.myOffers.useQuery();
  const activeReceives = trpc.relay.activeReceives.useQuery();
  const accept = trpc.relay.acceptOffer.useMutation({ onSuccess: () => { utils.relay.myOffers.invalidate(); utils.relay.activeReceives.invalidate(); } });
  const decline = trpc.relay.declineOffer.useMutation({ onSuccess: () => utils.relay.myOffers.invalidate() });
  const scanReceive = trpc.relay.scanReceive.useMutation();
  const submitInspection = trpc.relay.submitInspection.useMutation({ onSuccess: () => utils.relay.activeReceives.invalidate() });
  const [reasonByOffer, setReasonByOffer] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [scanBusy, setScanBusy] = useState<number | null>(null);
  const [defectPhotoByLeg, setDefectPhotoByLeg] = useState<Record<number, { dataUrl: string; name: string }[]>>({});
  const [inspection, setInspection] = useState<Record<number, { sealed: boolean; labelMatches: boolean; noVisibleDamage: boolean; conditionAccepted: boolean; defectNote: string }>>({});

  const scanParcel = async (legId: number, expected: string, file?: File) => {
    if (!file) return;
    setScanBusy(legId);
    try {
      const value = await decodeParcelCodeFromFile(file);
      if (!value || value.toUpperCase().replace(/\s+/g, "") !== expected.toUpperCase().replace(/\s+/g, "")) {
        setMessage("The scanned code does not match this relay parcel. Please photograph the full label again.");
        return;
      }
      await scanReceive.mutateAsync({ legId, trackingCode: expected });
      setMessage("Relay QR verified. Complete the quick condition check before the handoff is approved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "We could not record the relay scan."); }
    finally { setScanBusy(null); }
  };

  const updateInspection = (legId: number, patch: Partial<(typeof inspection)[number]>) => setInspection((current) => ({ ...current, [legId]: { ...(current[legId] ?? { sealed: true, labelMatches: true, noVisibleDamage: true, conditionAccepted: true, defectNote: "" }), ...patch } }));
  const submit = (legId: number) => {
    const item = inspection[legId] ?? { sealed: true, labelMatches: true, noVisibleDamage: true, conditionAccepted: true, defectNote: "" };
    submitInspection.mutate({ legId, conditionAccepted: item.conditionAccepted, checklist: { sealed: item.sealed, labelMatches: item.labelMatches, noVisibleDamage: item.noVisibleDamage }, defectNote: item.defectNote || undefined, defectPhotos: defectPhotoByLeg[legId] ?? [] });
  };

  if (offers.isLoading || activeReceives.isLoading) return <Card><CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Looking for relay handoffs in your area…</CardContent></Card>;
  if (!offers.data?.length && !activeReceives.data?.length) return null;

  return <div className="space-y-4">
    {message ? <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-950" role="status">{message}</p> : null}
    {offers.data?.length ? <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
      <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-700" />Parcel handoffs for your area</CardTitle><CardDescription>Choose a handoff that fits your route and capacity.</CardDescription></CardHeader>
      <CardContent className="space-y-3">{offers.data.map(({ offer, leg, delivery }) => <div key={offer.id} className="rounded-lg border bg-background p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-lg font-bold">{delivery.trackingCode}</p><p className="mt-1 text-sm text-muted-foreground">Relay leg {leg.sequence}: {leg.originArea} <ArrowRight className="inline h-3 w-3" /> {leg.destinationArea}</p></div><span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">Handoff offer</span></div>
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950"><p className="font-semibold">{leg.handoffMode === "designated_point" ? "Meet at the designated handoff point" : "Agree on a safe public meeting point"}</p><p className="mt-1">{leg.meetingAddress ?? "Choose a safe handoff location together before meeting."}</p></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><Button onClick={() => accept.mutate({ offerId: offer.id })} disabled={accept.isPending || decline.isPending} className="h-11 gap-2"><CheckCircle2 className="h-4 w-4" />Accept handoff</Button><Button variant="outline" onClick={() => { const reason = reasonByOffer[offer.id]?.trim(); if (reason) decline.mutate({ offerId: offer.id, reason }); }} disabled={accept.isPending || decline.isPending || !reasonByOffer[offer.id]?.trim()} className="h-11 gap-2"><XCircle className="h-4 w-4" />Pass for now</Button></div>
        <input value={reasonByOffer[offer.id] ?? ""} onChange={(event) => setReasonByOffer((current) => ({ ...current, [offer.id]: event.target.value }))} placeholder="If this handoff does not fit, share a short reason" aria-label={`Reason for declining parcel ${delivery.trackingCode}`} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
      </div>)}</CardContent>
    </Card> : null}
    {activeReceives.data?.map(({ leg, delivery }) => { const item = inspection[leg.id] ?? { sealed: true, labelMatches: true, noVisibleDamage: true, conditionAccepted: true, defectNote: "" }; return <Card key={leg.id} className="border-emerald-200"><CardHeader><CardTitle>Receive relay parcel {delivery.trackingCode}</CardTitle><CardDescription>Scan the parcel first. Then confirm its condition before the other courier approves custody transfer.</CardDescription></CardHeader><CardContent className="space-y-3"><label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white"><input className="sr-only" type="file" accept="image/*" capture="environment" disabled={scanBusy === leg.id} onChange={(event) => void scanParcel(leg.id, delivery.trackingCode, event.target.files?.[0])} /><ScanLine className="h-4 w-4" />{scanBusy === leg.id ? "Reading parcel QR…" : "Scan parcel QR"}</label><div className="grid gap-2 text-sm sm:grid-cols-3">{([['sealed', 'Sealed'], ['labelMatches', 'Label matches'], ['noVisibleDamage', 'No visible damage']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={item[key]} onChange={(event) => updateInspection(leg.id, { [key]: event.target.checked })} />{label}</label>)}</div><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={item.conditionAccepted} onChange={(event) => updateInspection(leg.id, { conditionAccepted: event.target.checked })} />I accept the parcel condition</label>{!item.conditionAccepted ? <><textarea value={item.defectNote} onChange={(event) => updateInspection(leg.id, { defectNote: event.target.value })} placeholder="Describe the defect" className="min-h-20 w-full rounded-md border p-2 text-sm" /><label className="block text-sm font-semibold">Add defect photos<input type="file" accept="image/*" multiple capture="environment" className="mt-2 block w-full text-sm" onChange={(event) => { const files = Array.from(event.target.files ?? []).slice(0, 5); Promise.all(files.map((file) => new Promise<{ dataUrl: string; name: string }>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ dataUrl: String(reader.result), name: file.name }); reader.onerror = reject; reader.readAsDataURL(file); }))).then((photos) => setDefectPhotoByLeg((current) => ({ ...current, [leg.id]: photos }))); }} /></label></> : null}<Button onClick={() => submit(leg.id)} disabled={submitInspection.isPending} className="w-full">{submitInspection.isPending ? "Saving inspection…" : "Submit inspection for handoff approval"}</Button></CardContent></Card>; })}
  </div>;
}
