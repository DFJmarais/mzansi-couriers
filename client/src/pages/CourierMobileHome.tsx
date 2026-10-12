import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CourierRunWorkflow from "@/components/CourierRunWorkflow";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/_core/hooks/useAuth";
import { Capacitor } from "@capacitor/core";
import { AlertTriangle, House, LogOut, Moon, Route, Settings, Sun, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

export default function CourierMobileHome() {
  const { user, isAuthenticated, loading, logout } = useAuth({ redirectOnUnauthenticated: false });
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-mzansi-sand text-sm text-muted-foreground">Loading your courier account…</main>;
  if (!isAuthenticated || (user?.role !== "courier" && user?.role !== "admin")) {
    return <main className="flex min-h-screen items-center justify-center bg-mzansi-sand p-6"><div className="max-w-sm text-center"><p className="font-semibold">Courier access is ready after account approval.</p><Button className="mt-4" onClick={() => setLocation("/auth")}>Sign in</Button></div></main>;
  }

  return <main className="ios-screen min-h-screen bg-mzansi-sand pb-8 text-foreground">
    <header className="ios-header sticky top-0 z-20 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <div className="flex items-center gap-3"><BrandLogo className="h-9 w-9" /><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Courier</p><p className="font-semibold">Delivery workspace</p></div></div>
        <div className="flex items-center gap-1.5"><Badge variant="outline" className="gap-1.5">{online ? <Wifi className="h-3.5 w-3.5 text-emerald-700" /> : <WifiOff className="h-3.5 w-3.5 text-amber-700" />}{online ? "Online" : "Offline"}</Badge>{toggleTheme ? <Button variant="ghost" size="icon" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark night mode"} onClick={toggleTheme}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button> : null}<Button variant="ghost" size="icon" aria-label="Account settings" onClick={() => setLocation("/settings/account")}><Settings className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => void logout().then(() => setLocation("/"))}><LogOut className="h-4 w-4" /></Button></div>
      </div>
    </header>
    <div className="ios-content mobile-borderless-shell mx-auto max-w-2xl space-y-5 px-4 pt-5 sm:px-6">
      <section className="ios-large-title"><p className="ios-eyebrow">Today</p><h1 className="font-bold tracking-tight">Your route is ready.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Parcel codes, pickup steps, customer confirmation, proof photos, and safety support are all in one place.</p><Button variant="outline" className="mt-4 min-h-11 gap-2 border-red-200 text-red-700" onClick={() => setLocation("/courier/safety")}><AlertTriangle className="h-4 w-4" />Open Safety Centre</Button></section>
      <CourierRunWorkflow />
      {Capacitor.isNativePlatform() ? <p className="text-center text-xs text-muted-foreground">Native camera, live location, device security, and route tools are available when a delivery action needs them.</p> : null}
    </div>
    <nav className="ios-tab-bar sticky bottom-0 z-20 mx-auto mt-6 flex max-w-2xl justify-around px-4 py-2 backdrop-blur" aria-label="Courier app navigation"><Button variant="ghost" className="min-h-11 flex-1 flex-col gap-1 text-xs" onClick={() => setLocation("/")}><House className="h-4 w-4" />Home</Button><Button variant="ghost" className="min-h-11 flex-1 flex-col gap-1 text-xs" aria-current="page"><Route className="h-4 w-4" />Route</Button><Button variant="ghost" className="min-h-11 flex-1 flex-col gap-1 text-xs" onClick={() => setLocation("/settings/account")}><Settings className="h-4 w-4" />Account</Button></nav>
  </main>;
}
