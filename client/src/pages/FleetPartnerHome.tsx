import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Car, ClipboardCheck, MapPin, ShieldCheck, Truck } from "lucide-react";

export default function FleetPartnerHome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-mzansi-sand px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <Button variant="ghost" className="-ml-3 text-slate-700 hover:bg-white/70" onClick={() => setLocation("/")} aria-label="Back to home">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
        </Button>
        <section className="overflow-hidden rounded-3xl bg-[#003f31] text-white shadow-sm">
          <div className="grid gap-8 p-7 sm:p-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">For South African fleet operators</p>
              <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">Put your fleet to work.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90">Connect your vehicles and drivers to delivery opportunities across South Africa through Mzansi Couriers.</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">Keep your existing courier business while using Mzansi Couriers as an additional delivery and revenue channel. You already have the vehicles. We help keep them moving.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/fleet/onboarding"><Button size="lg" className="justify-center bg-white text-emerald-900 hover:bg-emerald-50">Register your fleet <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                <a href="#how-it-works"><Button size="lg" variant="outline" className="justify-center border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white">Learn how it works</Button></a>
              </div>
            </div>
            <div className="rounded-2xl border border-white/25 bg-black/20 p-5">
              <div className="flex items-center gap-3"><Truck className="h-6 w-6 text-white/80" /><p className="font-semibold">An extra lane for your business</p></div>
              <div className="mt-5 space-y-3 text-sm text-white/90"><p>Use your existing vehicles, capacity, and operating areas.</p><p>Review suitable paid work before accepting it.</p><p>Keep control of your drivers, routes, and business.</p></div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="grid gap-4 sm:grid-cols-3">
          <InfoCard icon={<ClipboardCheck />} step="01" title="Register once" text="Submit your fleet owner, contact, operating-area, and verification details." />
          <InfoCard icon={<Car />} step="02" title="Add your vehicles" text="Register cars, bakkies, vans, trucks, or other approved delivery vehicles with their capacity." />
          <InfoCard icon={<ShieldCheck />} step="03" title="Get verified and operate" text="Once approved, manage your vehicles and delivery work from the Fleet Command Centre." />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">What Mzansi provides</p><h2 className="mt-2 text-2xl font-bold text-slate-950">Powerful underneath. Simple on the surface.</h2><div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground"><p><strong className="text-slate-900">Delivery demand:</strong> access additional parcel opportunities that match your capacity and operating areas.</p><p><strong className="text-slate-900">Delivery technology:</strong> use matching, tracking, proof of delivery, and customer communication in one place.</p><p><strong className="text-slate-900">Business control:</strong> Mzansi does not take ownership of your vehicles or replace your existing operation.</p></div></Card>
          <Card className="border-amber-200 bg-amber-50 p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Keep the numbers clear</p><h2 className="mt-2 text-2xl font-bold text-amber-950">A transparent delivery split</h2><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-4"><p className="text-3xl font-bold text-emerald-800">80%</p><p className="mt-1 text-sm text-muted-foreground">Fleet partner share</p></div><div className="rounded-xl bg-white p-4"><p className="text-3xl font-bold text-amber-700">20%</p><p className="mt-1 text-sm text-muted-foreground">Mzansi platform fee</p></div></div><p className="mt-4 text-sm leading-6 text-amber-900">Delivery opportunities and earnings depend on available work, fleet capacity, completed deliveries, and your own operating costs.</p></Card>
        </section>

        <section className="rounded-2xl border border-emerald-900/10 bg-white p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold text-slate-950">Ready to keep your vehicles moving?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Register your fleet, complete verification, and manage your delivery operation from one clear workspace.</p></div><Link href="/fleet/onboarding"><Button className="shrink-0">Register your fleet <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div></section>
      </div>
    </div>
  );
}

function InfoCard({ icon, step, title, text }: { icon: React.ReactNode; step: string; title: string; text: string }) {
  return <Card className="p-5"><div className="flex items-center justify-between"><div className="text-emerald-700">{icon}</div><span className="text-xs font-semibold tracking-[0.16em] text-emerald-700">{step}</span></div><h2 className="mt-4 font-semibold text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></Card>;
}
