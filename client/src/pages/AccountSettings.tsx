import { ArrowLeft, Clock3, Fingerprint, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/BrandLogo";
import { DataDeletionSettings } from "@/components/DataDeletionSettings";
import { useAuth } from "@/_core/hooks/useAuth";
import { authenticateWithDevice } from "@/lib/native-biometric";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export default function AccountSettings() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/auth" });
  const { theme, toggleTheme, scheduleEnabled, toggleSchedule } = useTheme();
  const [biometricMessage, setBiometricMessage] = useState<string | null>(null);
  const [biometricPending, setBiometricPending] = useState(false);

  const handleBiometricCheck = async () => {
    setBiometricPending(true);
    setBiometricMessage(null);
    try {
      const authenticated = await authenticateWithDevice();
      setBiometricMessage(authenticated ? "Device authentication confirmed for this account." : "Face ID, Touch ID, or device passcode is unavailable in this browser preview.");
    } catch (error) {
      setBiometricMessage(error instanceof Error ? error.message : "Device authentication could not be completed.");
    } finally {
      setBiometricPending(false);
    }
  };

  if (loading || !user) {
    return <main className="ios-screen grid min-h-screen place-items-center text-slate-700">Loading your account…</main>;
  }

  return (
    <main className="ios-screen min-h-screen px-4 pb-8 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="ios-header -mx-4 flex items-center justify-between border-b border-emerald-950/10 px-4 py-3 sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-3"><BrandLogo className="h-9 w-9" /><div><p className="font-semibold">Mzansi Couriers</p><p className="text-xs text-slate-500">Account</p></div></div>
          <Button variant="ghost" onClick={() => navigate("/")} aria-label="Back to home"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        </header>
        <section className="ios-large-title px-1 pt-2">
          <p className="ios-eyebrow">Your account</p>
          <h1 className="font-bold">Manage your details and privacy.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Signed in as {user.email || user.name || "a Mzansi Couriers customer"}. Your account controls stay inside the app.</p>
        </section>
        <Card className="ios-group"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><UserRound className="h-5 w-5 text-emerald-700" />Account access</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-start gap-3 text-sm text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><p>Your account session is secured by the Mzansi Couriers identity service. Signing out or deleting the account clears the app session on this device.</p></div><div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-emerald-950">Use device authentication</p><p className="text-sm text-emerald-900/75">On iPhone and iPad, check Face ID, Touch ID, or your device passcode without leaving the app.</p></div><Button type="button" variant="outline" onClick={handleBiometricCheck} disabled={biometricPending} className="gap-2 border-emerald-300 bg-white"><Fingerprint className="h-4 w-4" />{biometricPending ? "Checking…" : "Check device security"}</Button></div>{biometricMessage ? <p className="text-sm text-emerald-800" role="status">{biometricMessage}</p> : null}</CardContent></Card>
        <Card className="ios-group"><CardHeader><CardTitle className="flex items-center gap-2 text-lg">{theme === "dark" ? <Moon className="h-5 w-5 text-amber-300" /> : <Sun className="h-5 w-5 text-emerald-700" />}Night-shift display</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{theme === "dark" ? "High-contrast dark mode is on" : "Use dark mode at night"}</p><p className="text-sm text-muted-foreground">Brighter text, visible route status colors, and reduced glare for evening deliveries. Your choice is saved on this device.</p></div>{toggleTheme ? <Button type="button" variant="outline" onClick={toggleTheme} aria-pressed={theme === "dark"} className="gap-2">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{theme === "dark" ? "Use light mode" : "Turn on dark mode"}</Button> : null}</div><div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 font-semibold text-emerald-950"><Clock3 className="h-4 w-4" />Automatic night schedule</p><p className="text-sm text-emerald-900/75">{scheduleEnabled ? "On: dark mode runs from 18:00 to 06:00 using your device’s local time." : "Off: you control the display manually from the home screen or courier header."}</p></div>{toggleSchedule ? <Button type="button" variant={scheduleEnabled ? "default" : "outline"} onClick={toggleSchedule} aria-pressed={scheduleEnabled} className="gap-2">{scheduleEnabled ? "Turn schedule off" : "Use automatic schedule"}</Button> : null}</div></CardContent></Card>
        <DataDeletionSettings />
      </div>
    </main>
  );
}
