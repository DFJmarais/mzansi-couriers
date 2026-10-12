import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Package, Truck, Users, ArrowRight, Camera, MapPinned, Moon, Sun, WifiOff, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { BrandLogo } from "@/components/BrandLogo";
import { Capacitor } from "@capacitor/core";
import { useTheme } from "@/contexts/ThemeContext";
import { playThemeToggleFeedback } from "@/lib/theme-feedback";
import { PublicAssistant } from "@/components/PublicAssistant";
import { useState } from "react";

export default function Home() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: visibility } = trpc.featureVisibility.public.useQuery();
  const isAuthenticated = Boolean(user);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme, scheduleEnabled } = useTheme();
  const [themeRipple, setThemeRipple] = useState(false);

  const handleThemeToggle = () => {
    playThemeToggleFeedback();
    setThemeRipple(true);
    window.setTimeout(() => setThemeRipple(false), 420);
    toggleTheme?.();
  };

  const goToDashboard = () => {
    if (user?.role === "courier") return setLocation(Capacitor.isNativePlatform() ? "/courier/mobile" : "/courier/dashboard");
    if (user?.role === "admin") return setLocation("/admin/dashboard");
    setLocation(Capacitor.isNativePlatform() ? "/customer/mobile" : "/customer/dashboard");
  };

  const sendPackage = () => {
    setLocation("/customer/send-package");
  };

  // Keep the public CTA focused on the courier application journey. The
  // application page handles sign-in and then opens the onboarding forms;
  // this button must never route a visitor to a dashboard.
  const becomeCourier = () => setLocation("/become-driver");
  const isPublicFeature = (key: keyof NonNullable<typeof visibility>) => Boolean(visibility?.[key]);
  const canUse = (key: keyof NonNullable<typeof visibility>) => isPublicFeature(key) || user?.role === "admin";
  const hiddenBadge = (key: keyof NonNullable<typeof visibility>) => user?.role === "admin" && !isPublicFeature(key) ? <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">Hidden</span> : null;

  return (
    <div className="home-shell min-h-screen min-w-0 overflow-x-clip bg-mzansi-sand text-foreground">
      <header className="sticky top-0 z-50 bg-mzansi-sand/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-mzansi-sand/85">
        <div className="container relative flex min-h-14 items-center justify-between gap-2 sm:min-h-16 sm:gap-4">
          <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => setLocation("/")}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center sm:h-14 sm:w-14"><BrandLogo className="h-11 w-11 sm:h-14 sm:w-14" /></span>
            <span className="min-w-0">
              <span className="block text-base font-bold">Mzansi Couriers</span>
              <span className="hidden text-xs text-muted-foreground min-[480px]:block">Local parcels. Real routes. Across Mzansi.</span>
            </span>
          </button>
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Primary navigation">
            {canUse("package_tracking") ? <Button variant="ghost" size="sm" onClick={() => setLocation("/track")} className="hidden sm:inline-flex"><Truck className="mr-1 h-4 w-4" />Track{hiddenBadge("package_tracking")}</Button> : null}
            {canUse("fleet_registration") ? <Button variant="ghost" size="sm" onClick={() => setLocation("/fleet")} className="hidden md:inline-flex"><Users className="mr-1 h-4 w-4" />Fleet{hiddenBadge("fleet_registration")}</Button> : null}
            {toggleTheme ? <Button variant="ghost" size="sm" onClick={handleThemeToggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={scheduleEnabled ? "Automatic night schedule is on; tapping sets a manual mode" : undefined} className="theme-toggle-button gap-1.5 px-2 sm:px-3"><span className="theme-toggle-ripple" aria-hidden="true" data-active={themeRipple} /><span className="theme-toggle-content"><span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</span><span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span></span></Button> : null}
            {isAuthenticated ? <Button size="sm" variant="outline" onClick={goToDashboard}>Dashboard</Button> : <Button size="sm" onClick={() => setLocation("/auth")}>Sign in</Button>}
          </nav>
        </div>
      </header>

      <main>
        {Capacitor.isNativePlatform() ? (
          <section className="border-b border-emerald-950/10 bg-emerald-950 px-4 py-5 text-white sm:px-6" aria-labelledby="native-workspace-title">
            <div className="container max-w-5xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Mzansi Couriers app</p>
                  <h2 id="native-workspace-title" className="mt-1 text-xl font-bold">Open your delivery workspace</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-50/80">Use the app for the work that happens on the road: book a parcel, follow a live route, scan a parcel code, capture delivery evidence, and confirm handoffs.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-white text-emerald-950 hover:bg-emerald-50" onClick={goToDashboard}>{isAuthenticated ? "Open dashboard" : "Sign in to work"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => setLocation("/track")}><MapPinned className="mr-2 h-4 w-4" />Track a parcel</Button>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs text-emerald-50/80 sm:grid-cols-3">
                <span className="flex items-center gap-2"><Camera className="h-4 w-4 text-emerald-300" />Camera proof of delivery</span>
                <span className="flex items-center gap-2"><WifiOff className="h-4 w-4 text-emerald-300" />Offline route snapshot and sync queue</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Keychain session and account controls</span>
              </div>
            </div>
          </section>
        ) : null}
        <section className={`container grid gap-8 py-10 sm:gap-12 sm:py-16 ${canUse("customer_booking") ? "md:grid-cols-[1.15fr_.85fr] md:items-center md:py-24" : "md:py-28"}`}>
          <div className="max-w-2xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 sm:text-sm sm:tracking-[0.18em]">{canUse("customer_booking") ? "South African parcel delivery" : "South African courier network"}</p>
            <h1 className="max-w-[14ch] text-[clamp(2.35rem,11vw,3.75rem)] font-bold leading-[1.04] tracking-tight">{canUse("customer_booking") ? "Send a parcel. Track it. Confirm delivery." : "Build your route. Earn with Mzansi."}</h1>
            <p className="max-w-xl text-lg text-muted-foreground">{canUse("customer_booking") ? "Enter the pickup and drop-off details, pay the quoted delivery price, and use the tracking code to follow the parcel until the customer confirms it has arrived." : "We are currently onboarding verified drivers and couriers before opening customer bookings. Apply, share your vehicle details, and get ready to deliver across South Africa."}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {canUse("customer_booking") ? <Button size="lg" onClick={sendPackage} className="bg-emerald-600 text-white hover:bg-emerald-700"><Package className="mr-2 h-5 w-5" />Send a package{hiddenBadge("customer_booking")}<ArrowRight className="ml-2 h-4 w-4" /></Button> : null}
              {canUse("package_tracking") ? <Button size="lg" variant="outline" onClick={() => setLocation("/track")}>Track a package{hiddenBadge("package_tracking")}</Button> : null}
              {!canUse("customer_booking") && canUse("courier_onboarding") ? <Button size="lg" onClick={becomeCourier} className="bg-emerald-600 text-white hover:bg-emerald-700">Start your courier application{hiddenBadge("courier_onboarding")}<ArrowRight className="ml-2 h-4 w-4" /></Button> : null}
            </div>
          </div>
          {canUse("customer_booking") ? <div className="route-card min-w-0 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_12px_32px_rgba(2,44,34,0.08)] sm:p-6">
            <div className="flex items-start justify-between gap-3"><h2 className="min-w-0 text-lg font-semibold leading-tight sm:text-xl">How delivery works</h2><span className="route-stamp shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-800 sm:px-3 sm:text-[10px]">Mzansi route</span></div>
            <ol className="route-steps mt-6 space-y-5">
              <li className="flex min-w-0 gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">1</span><span className="min-w-0 break-words"><strong className="block">Book and pay</strong><span className="text-sm text-muted-foreground">Add both addresses and parcel details, then confirm the Paystack payment.</span></span></li>
              <li className="flex min-w-0 gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">2</span><span className="min-w-0 break-words"><strong className="block">Courier pickup and route</strong><span className="text-sm text-muted-foreground">An eligible courier sees the paid parcel, accepts it, and follows the route.</span></span></li>
              <li className="flex min-w-0 gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">3</span><span className="min-w-0 break-words"><strong className="block">Photo and confirmation</strong><span className="text-sm text-muted-foreground">The courier takes a proof photo, and the customer confirms delivery at the destination.</span></span></li>
            </ol>
          </div> : null}
        </section>

        <section className="home-courier-section bg-emerald-950 text-white" style={{ backgroundColor: "#022c22" }}>
          <div className="container grid gap-8 py-14 md:grid-cols-[1.1fr_.9fr] md:items-center md:py-16">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">For independent couriers</p>
              <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-4xl">Have a reliable vehicle? Turn your driving time into delivery income.</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-emerald-50/80">Join a South African parcel network where you can see paid delivery work in your area, choose the parcels you are able to carry, and build a record of completed deliveries. You stay in control of your availability and route—whether you are moving through the city, the suburbs, or between towns.</p>
              {isPublicFeature("courier_onboarding") || user?.role === "admin" ? <Button size="lg" className="mt-6 bg-white text-emerald-950 hover:bg-emerald-50" onClick={becomeCourier}>Start your courier application{hiddenBadge("courier_onboarding")}<ArrowRight className="ml-2 h-4 w-4" /></Button> : null}
            </div>
            <div className="rounded-2xl bg-white/10 p-6 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
              <h3 className="text-xl font-semibold">What the work looks like</h3>
              <p className="mt-4 text-sm leading-6 text-emerald-50/80">Complete your application and vehicle details, wait for owner approval, then use the courier dashboard to view eligible paid parcels. Accept a route, follow the customer address, take a proof-of-delivery photo, and wait for the customer to confirm arrival.</p>
              <p className="mt-4 pt-4 text-sm leading-6 text-emerald-50/80"><strong className="text-white">Paystack pays verified courier earnings once a week.</strong> Payout processing normally takes place on Thursday or Friday after your banking details have been confirmed. Income varies by parcel availability, distance, and the work you accept.</p>
            </div>
          </div>
        </section>

        <section className="bg-mzansi-sand shadow-[0_-8px_24px_rgba(2,44,34,0.04)]">
          <div className="container grid gap-4 py-10 md:grid-cols-3">
            {canUse("customer_booking") ? <div><h2 className="font-semibold">Need to send?</h2><p className="mt-1 text-sm text-muted-foreground">Book a customer delivery and receive a tracking code after verified payment.</p><Button variant="link" className="mt-2 h-auto p-0" onClick={sendPackage}>Start a booking{hiddenBadge("customer_booking")}<ArrowRight className="ml-1 h-4 w-4" /></Button></div> : null}
            {canUse("courier_onboarding") ? <div><h2 className="font-semibold">Want to deliver?</h2><p className="mt-1 text-sm text-muted-foreground">See the courier requirements, submit your vehicle details, and apply for owner approval.</p><Button variant="link" className="mt-2 h-auto p-0" onClick={becomeCourier}>Courier onboarding{hiddenBadge("courier_onboarding")}<ArrowRight className="ml-1 h-4 w-4" /></Button></div> : null}
            {canUse("fleet_registration") ? <div><h2 className="font-semibold">Operate a fleet?</h2><p className="mt-1 text-sm text-muted-foreground">Register one fleet account and manage multiple vehicles from the fleet dashboard.</p><Button variant="link" className="mt-2 h-auto p-0" onClick={() => setLocation("/fleet")}>Fleet registration{hiddenBadge("fleet_registration")}<ArrowRight className="ml-1 h-4 w-4" /></Button></div> : null}
          </div>
        </section>
      </main>

      <footer className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Mzansi Couriers · Proudly moving parcels across South Africa</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer navigation">
          <button type="button" onClick={() => setLocation("/support")} className="hover:text-foreground">Support</button>
          <button type="button" onClick={() => setLocation("/privacy")} className="hover:text-foreground">Privacy</button>
          <button type="button" onClick={() => setLocation("/terms")} className="hover:text-foreground">Terms</button>
          <button type="button" onClick={() => setLocation("/refund")} className="hover:text-foreground">Refunds</button>
        </nav>
      </footer>
      <PublicAssistant visibility={visibility ?? undefined} />
    </div>
  );
}
