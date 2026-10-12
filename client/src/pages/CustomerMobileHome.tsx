import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import DeliveryTracking from "@/pages/DeliveryTracking";
import { House, MapPinned, Settings } from "lucide-react";
import { useLocation } from "wouter";

export default function CustomerMobileHome() {
  const [, setLocation] = useLocation();
  return <main className="ios-screen min-h-screen bg-mzansi-sand text-foreground">
    <header className="ios-header sticky top-0 z-20 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex items-center gap-3"><BrandLogo className="h-9 w-9" /><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Customer</p><p className="font-semibold">Delivery tracking</p></div></div>
        <Button variant="ghost" size="icon" aria-label="Account settings" onClick={() => setLocation("/settings/account")}><Settings className="h-4 w-4" /></Button>
      </div>
    </header>
    <div className="ios-content mobile-borderless-shell mx-auto max-w-3xl px-4 pt-5 sm:px-6"><section className="ios-large-title mb-5"><p className="ios-eyebrow">Your parcel</p><h1 className="font-bold tracking-tight">Track your delivery.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">See the latest route update and confirm arrival when your parcel reaches you.</p></section><DeliveryTracking /></div>
    <nav className="ios-tab-bar sticky bottom-0 z-20 mx-auto mt-6 flex max-w-3xl justify-around px-4 py-2 backdrop-blur" aria-label="Customer app navigation"><Button variant="ghost" className="min-h-11 flex-1 flex-col gap-1 text-xs" onClick={() => setLocation("/")}><House className="h-4 w-4" />Home</Button><Button variant="ghost" className="min-h-11 flex-1 flex-col gap-1 text-xs" aria-current="page"><MapPinned className="h-4 w-4" />Tracking</Button><Button variant="ghost" className="min-h-11 flex-1 flex-col gap-1 text-xs" onClick={() => setLocation("/settings/account")}><Settings className="h-4 w-4" />Account</Button></nav>
  </main>;
}
