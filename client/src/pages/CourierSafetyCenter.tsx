import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Phone, ShieldCheck, Siren, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function getLocation(): Promise<{ latitude?: number; longitude?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition((position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => resolve({}), { enableHighAccuracy: true, timeout: 5000 });
  });
}

export default function CourierSafetyCenter() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/auth" });
  const [, navigate] = useLocation();
  const profile = trpc.courierSafety.getProfile.useQuery(undefined, { enabled: Boolean(user) });
  const activeCheckin = trpc.courierSafety.activeCheckin.useQuery(undefined, { enabled: Boolean(user) });
  const incidents = trpc.courierSafety.myIncidents.useQuery(undefined, { enabled: Boolean(user) });
  const saveProfile = trpc.courierSafety.saveProfile.useMutation({ onSuccess: () => { toast.success("Safety details saved"); void profile.refetch(); } });
  const startCheckin = trpc.courierSafety.startCheckin.useMutation({ onSuccess: () => { toast.success("Safety check-in started"); void activeCheckin.refetch(); } });
  const completeCheckin = trpc.courierSafety.completeCheckin.useMutation({ onSuccess: () => { toast.success("You are checked in safely"); void activeCheckin.refetch(); } });
  const cancelCheckin = trpc.courierSafety.cancelCheckin.useMutation({ onSuccess: () => { void activeCheckin.refetch(); } });
  const createIncident = trpc.courierSafety.createIncident.useMutation({ onSuccess: (result) => { toast.success("Safety report sent to the Mzansi operations team"); void incidents.refetch(); if (result.emergencyNumber) window.location.href = `tel:${result.emergencyNumber}`; } });
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [preference, setPreference] = useState<"saps_10111" | "emergency_112" | "trusted_contact">("saps_10111");
  const [incidentType, setIncidentType] = useState<"accident" | "threat" | "medical" | "vehicle_breakdown" | "parcel_security" | "roadside_hazard" | "other">("other");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [checkinMinutes, setCheckinMinutes] = useState("60");

  useEffect(() => {
    if (profile.data) {
      setContactName(profile.data.trustedContactName ?? "");
      setContactPhone(profile.data.trustedContactPhone ?? "");
      setPreference(profile.data.emergencyPreference);
    }
  }, [profile.data]);

  if (loading || !user) return <main className="ios-screen grid min-h-screen place-items-center">Loading your safety centre…</main>;

  const save = () => saveProfile.mutate({ trustedContactName: contactName, trustedContactPhone: contactPhone, emergencyPreference: preference, vehicleInsuranceAcknowledged: true, goodsInTransitPolicyAcknowledged: true, prohibitedItemsAcknowledged: true, safetyTrainingAcknowledged: true });
  const report = async () => { const location = await getLocation(); createIncident.mutate({ type: incidentType, urgency: incidentType === "parcel_security" || incidentType === "vehicle_breakdown" ? "high" : "normal", description: incidentDescription, ...location }); };
  const sos = async (number: "10111" | "112") => { if (!window.confirm(`This will log an urgent SOS and open your phone dialler for ${number}. Continue?`)) return; const location = await getLocation(); createIncident.mutate({ type: "sos", urgency: "urgent", description: `Courier activated emergency SOS. Preferred emergency number: ${number}.`, emergencyNumber: number, ...location }); };

  return <main className="ios-screen min-h-screen px-4 pb-10 text-foreground sm:px-6">
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="ios-header -mx-4 flex items-center justify-between border-b px-4 py-3 sm:-mx-6 sm:px-6"><div><p className="ios-eyebrow">Courier protection</p><h1 className="text-xl font-bold">Safety Centre</h1></div><Button variant="ghost" onClick={() => navigate("/courier/mobile")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></header>
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950"><div className="flex items-start gap-3"><Siren className="mt-1 h-7 w-7 shrink-0 text-red-700" /><div><h2 className="text-lg font-bold">Need immediate help?</h2><p className="mt-1 text-sm">Move to a safe public place if possible. Use SOS for an immediate danger, accident, medical emergency, or threat.</p></div></div><div className="mt-4 grid grid-cols-2 gap-3"><Button className="min-h-12 bg-red-700 text-white hover:bg-red-800" onClick={() => void sos("10111")} disabled={createIncident.isPending}><Phone className="mr-2 h-4 w-4" />SOS / SAPS 10111</Button><Button variant="outline" className="min-h-12 border-red-300 bg-white text-red-800" onClick={() => void sos("112")} disabled={createIncident.isPending}><Phone className="mr-2 h-4 w-4" />Mobile emergency 112</Button></div><p className="mt-3 text-xs text-red-800">The app records the incident for the Mzansi operations team and opens your device dialler. Mzansi Couriers is not an emergency service.</p></section>
      <Card className="ios-group"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" />Safety setup</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Complete this once so the operations team knows who to contact and what responsibilities apply.</p><div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="trusted-name">Trusted contact name</Label><Input id="trusted-name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" /></div><div><Label htmlFor="trusted-phone">Trusted contact phone</Label><Input id="trusted-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+27…" inputMode="tel" /></div></div><div><Label htmlFor="emergency-preference">Preferred emergency route</Label><select id="emergency-preference" value={preference} onChange={(e) => setPreference(e.target.value as typeof preference)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="saps_10111">SAPS 10111</option><option value="emergency_112">Mobile emergency 112</option><option value="trusted_contact">Trusted contact first</option></select></div><div className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm"><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />I will keep my vehicle insurance current. Vehicle insurance is the courier's responsibility.</p><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />I understand package-in-transit cover applies only according to the published policy and its limits.</p><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />I will not carry prohibited, dangerous, illegal, or undisclosed items.</p></div><Button onClick={save} disabled={saveProfile.isPending || !contactName.trim() || !contactPhone.trim()} className="w-full">{saveProfile.isPending ? "Saving…" : "Save safety details"}</Button><p className="text-xs text-muted-foreground">Approved service radius: 120 km. Same-day service is limited to routes within the applicable local radius.</p></CardContent></Card>
      <Card className="ios-group"><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-emerald-700" />Route safety check-in</CardTitle></CardHeader><CardContent className="space-y-3">{activeCheckin.data ? <><p className="text-sm">Your check-in is active until <strong>{new Date(activeCheckin.data.expectedBy).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>. Check in when you reach a safe point.</p><div className="flex gap-2"><Button onClick={async () => completeCheckin.mutate(await getLocation())} disabled={completeCheckin.isPending} className="flex-1">I’m safe</Button><Button variant="outline" onClick={() => cancelCheckin.mutate()} className="flex-1">Cancel</Button></div></> : <><p className="text-sm text-muted-foreground">For a long route or isolated area, set a check-in reminder. If it becomes overdue, the operations team can follow up.</p><div className="flex gap-2"><select aria-label="Check-in duration" value={checkinMinutes} onChange={(e) => setCheckinMinutes(e.target.value)} className="rounded-md border bg-background px-3"><option value="30">30 min</option><option value="60">60 min</option><option value="120">2 hours</option><option value="240">4 hours</option></select><Button onClick={async () => startCheckin.mutate({ minutes: Number(checkinMinutes), ...await getLocation() })} disabled={startCheckin.isPending} className="flex-1">Start check-in</Button></div></>}</CardContent></Card>
      <Card className="ios-group"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-700" />Report a safety issue</CardTitle></CardHeader><CardContent className="space-y-3"><select aria-label="Safety issue type" value={incidentType} onChange={(e) => setIncidentType(e.target.value as typeof incidentType)} className="w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="accident">Accident</option><option value="threat">Threat or harassment</option><option value="medical">Medical concern</option><option value="vehicle_breakdown">Vehicle breakdown</option><option value="parcel_security">Parcel security concern</option><option value="roadside_hazard">Roadside hazard</option><option value="other">Other</option></select><Textarea value={incidentDescription} onChange={(e) => setIncidentDescription(e.target.value)} placeholder="Tell the operations team what happened and what help you need" maxLength={1000} /><Button variant="outline" onClick={() => void report()} disabled={createIncident.isPending || incidentDescription.trim().length < 3} className="w-full">Send safety report</Button></CardContent></Card>
      <Card className="ios-group"><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-emerald-700" />Recent reports</CardTitle></CardHeader><CardContent>{incidents.data?.length ? <div className="space-y-2">{incidents.data.slice(0, 5).map((incident) => <div key={incident.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between gap-3"><strong>{incident.type.replaceAll("_", " ")}</strong><span className="capitalize text-muted-foreground">{incident.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-muted-foreground">{new Date(incident.createdAt).toLocaleString()}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No safety reports have been filed from this account.</p>}</CardContent></Card>
    </div>
  </main>;
}
