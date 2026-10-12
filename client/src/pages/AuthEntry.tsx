import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/BrandLogo";
import { startAuthFlow } from "@/lib/native-auth";
import { ArrowRight, LockKeyhole, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

function dashboardPath(role: string | undefined, native: boolean) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "courier") return native ? "/courier/mobile" : "/courier/dashboard";
  return native ? "/customer/mobile" : "/customer/dashboard";
}

export default function AuthEntry() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const requestedPath = localStorage.getItem("mzansi-auth-return-path");
    localStorage.removeItem("mzansi-auth-return-path");
    // A customer booking is only valid for a customer account. Privileges always
    // come from the authenticated account; never from a client-side role choice.
    if (requestedPath && user.role === "customer") {
      setLocation(requestedPath);
      return;
    }
    setLocation(dashboardPath(user.role, /native|capacitor/i.test(navigator.userAgent)));
  }, [isAuthenticated, setLocation, user]);

  const continueToAuth = async () => {
    setError("");
    setIsStarting(true);
    try {
      await startAuthFlow();
    } catch {
      setError("We could not open the secure sign-in service. Check your connection and try again.");
      setIsStarting(false);
    }
  };

  const switchAccount = async () => {
    setError("");
    setIsSwitching(true);
    try {
      await logout();
      await startAuthFlow();
    } catch {
      setError("We could not sign out safely. Please try again.");
      setIsSwitching(false);
    }
  };

  return (
    <main className="min-h-screen bg-mzansi-sand px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg items-center justify-center">
        <Card className="w-full overflow-hidden border-emerald-950/10 shadow-xl">
          <div className="bg-mzansi-green px-6 py-8 text-white sm:px-8">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1"><BrandLogo className="h-12 w-12" /></span>
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Mzansi Couriers</p><p className="mt-1 text-sm text-emerald-50">Local parcels. Real routes. Across Mzansi.</p></div>
            </div>
            <h1 className="mt-8 text-3xl font-bold tracking-tight">Sign in to continue</h1>
            <p className="mt-3 text-sm leading-6 text-emerald-50">Your account privileges decide which dashboard you receive. Customers book parcels, couriers manage delivery work, fleet partners manage vehicles, and administrators manage operations.</p>
          </div>
          <CardHeader className="space-y-2 px-6 pt-7 sm:px-8">
            <CardTitle className="text-xl">Secure account access</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">Sign in or create an account using the secure identity service. We do not ask you to choose a role in the app, and no one can promote themselves to administrator from this screen.</p>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-8 sm:px-8">
            {!isAuthenticated ? <Button size="lg" className="h-12 w-full justify-between" onClick={() => void continueToAuth()} disabled={isStarting}>
              <span className="flex items-center gap-2"><LockKeyhole className="h-5 w-5" />{isStarting ? "Opening secure sign-in…" : "Sign in or create account"}</span><ArrowRight className="h-5 w-5" />
            </Button> : <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><p className="font-semibold">You are signed in as {user?.name || user?.email || "your account"}.</p><p className="text-emerald-800">Your account privileges are being checked. You will be sent to the correct dashboard automatically.</p><Button variant="outline" className="w-full bg-white" onClick={() => void switchAccount()} disabled={isSwitching}><LogOut className="mr-2 h-4 w-4" />{isSwitching ? "Signing out…" : "Sign in with another account"}</Button></div>}
            {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
            <div className="grid gap-3 pt-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="rounded-lg bg-emerald-50 p-3"><ShieldCheck className="mb-2 h-5 w-5 text-emerald-700" /><p className="font-semibold text-emerald-950">Secure session</p><p className="mt-1">Your signed session returns to the app after authentication.</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="font-semibold text-slate-900">Automatic access</p><p className="mt-1">Your email account determines the dashboard and permissions you receive.</p></div>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setLocation("/")}>Back to home</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
