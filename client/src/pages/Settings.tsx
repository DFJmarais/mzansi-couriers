import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Bell, Camera, Check, FileText, Info, MapPin, Moon, Shield, Sun, UserRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/BrandLogo";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

function SettingRow({ icon: Icon, title, description, children }: { icon: typeof Bell; title: string; description: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-start gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">{title}</p><p className="text-sm text-muted-foreground">{description}</p></div></div>
    <div className="shrink-0">{children}</div>
  </div>;
}

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/auth" });
  const { themeMode, setThemeMode } = useTheme();
  const [messages, setMessages] = useState<Record<string, string>>({});
  const featureQuery = trpc.featureVisibility.admin.useQuery(undefined, { enabled: user?.role === "admin" });
  const featureUpdate = trpc.featureVisibility.update.useMutation({
    onSuccess: () => featureQuery.refetch(),
  });

  if (loading || !user) return <main className="grid min-h-screen place-items-center bg-background text-foreground">Loading settings…</main>;

  const requestPermission = async (kind: "notifications" | "location" | "camera") => {
    try {
      if (kind === "notifications" && "Notification" in window) await Notification.requestPermission();
      if (kind === "location") await new Promise<void>((resolve, reject) => navigator.geolocation?.getCurrentPosition(() => resolve(), reject));
      if (kind === "camera") { const stream = await navigator.mediaDevices?.getUserMedia({ video: true }); stream?.getTracks().forEach(track => track.stop()); }
      setMessages(prev => ({ ...prev, [kind]: "Permission checked on this device." }));
    } catch { setMessages(prev => ({ ...prev, [kind]: "Permission is managed in your phone settings." })); }
  };

  const modeButton = (mode: ThemeMode, label: string, Icon: typeof Sun) => <Button type="button" variant={themeMode === mode ? "default" : "outline"} aria-pressed={themeMode === mode} onClick={() => setThemeMode?.(mode)} className="gap-2"><Icon className="h-4 w-4" />{themeMode === mode && <Check className="h-3 w-3" />}{label}</Button>;

  return <main className="min-h-screen bg-background px-4 pb-10 text-foreground sm:px-6">
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between border-b border-border py-4">
        <div className="flex items-center gap-3"><BrandLogo className="h-9 w-9" /><div><p className="font-semibold">Settings</p><p className="text-xs text-muted-foreground">Your in-app preferences</p></div></div>
        <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} aria-label="Back to dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Button>
      </header>
      <section><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Account & preferences</p><h1 className="mt-2 text-3xl font-bold">Make the app work for you.</h1><p className="mt-2 text-muted-foreground">Signed in as {user.email || user.name || "your Mzansi Couriers account"}. These controls stay inside the app.</p></section>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />Profile and privacy</CardTitle></CardHeader><CardContent className="space-y-3"><SettingRow icon={Shield} title="Profile and account security" description="Manage your account, device security, and account deletion."><Button variant="outline" onClick={() => navigate("/settings/account")}>Open profile</Button></SettingRow></CardContent></Card>
      <Card><CardHeader><CardTitle>Device permissions</CardTitle></CardHeader><CardContent className="space-y-3"><SettingRow icon={Bell} title="Notifications" description={messages.notifications || "Receive delivery updates and account alerts."}><Button variant="outline" onClick={() => requestPermission("notifications")}>Enable</Button></SettingRow><SettingRow icon={MapPin} title="Location" description={messages.location || "Use location for routes and private parcel tracking."}><Button variant="outline" onClick={() => requestPermission("location")}>Enable</Button></SettingRow><SettingRow icon={Camera} title="Camera" description={messages.camera || "Capture parcel labels and proof-of-delivery photos."}><Button variant="outline" onClick={() => requestPermission("camera")}>Enable</Button></SettingRow></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Moon className="h-5 w-5 text-primary" />Theme</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{modeButton("light", "Light", Sun)}{modeButton("dark", "Dark", Moon)}{modeButton("system", "Follow phone", Shield)}</div><p className="mt-3 text-sm text-muted-foreground">Choose light mode, high-contrast dark mode, or automatically follow your phone’s appearance.</p></CardContent></Card>
      {user.role === "admin" ? <Card className="border-amber-300/70"><CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />Public feature visibility</CardTitle><p className="text-sm text-muted-foreground">Keep features available to administrators while deciding what the public can use on the live site.</p></CardHeader><CardContent className="space-y-3">{featureQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading visibility controls…</p> : featureQuery.data?.map(feature => <div key={feature.featureKey} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold">{feature.label}</p>{!feature.isPublic && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-red-700">Hidden</span>}</div><p className="text-sm text-muted-foreground">{feature.description}</p></div><Button type="button" variant={feature.isPublic ? "default" : "outline"} disabled={featureUpdate.isPending} onClick={() => featureUpdate.mutate({ featureKey: feature.featureKey as "customer_booking" | "package_tracking" | "courier_onboarding" | "fleet_registration", isPublic: !feature.isPublic })} className="gap-2">{feature.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{feature.isPublic ? "Visible to public" : "Hidden from public"}</Button></div>)}</CardContent></Card> : null}
      <Card><CardHeader><CardTitle>Information and support</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/legal")}><Info className="h-4 w-4" />About Mzansi Couriers</Button><Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/terms")}><FileText className="h-4 w-4" />Terms and conditions</Button><Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/privacy")}><Shield className="h-4 w-4" />Privacy policy</Button><Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/support")}><Bell className="h-4 w-4" />Support</Button></CardContent></Card>
    </div>
  </main>;
}
