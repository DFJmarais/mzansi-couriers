import { useMemo, useState } from "react";
import { ClipboardCheck, DollarSign, Mail, MapPinned, PackageSearch, Receipt, Search, ShieldCheck, Truck, UserCheck, Waves } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import AdminCourierSafetyPanel from "@/components/AdminCourierSafetyPanel";
import AdminOperationsAuditPanel from "@/components/AdminOperationsAuditPanel";
import AdminPayoutReviewPanel from "@/components/AdminPayoutReviewPanel";
import AdminRelayEconomicsPanel from "@/components/AdminRelayEconomicsPanel";
import AdminRelayExceptionsPanel from "@/components/AdminRelayExceptionsPanel";
import AdminDispatchPanel from "@/components/AdminDispatchPanel";
import AdminRefundReviewPanel from "@/components/AdminRefundReviewPanel";
import AdminCourierApprovalPanel from "@/components/AdminCourierApprovalPanel";
import AdminWaveOperationsPanel from "@/components/AdminWaveOperationsPanel";
import { trpc } from "@/lib/trpc";

const sections = [
  { id: "couriers", label: "Active couriers", description: "Driver locations, safety limits, activity, and courier profiles.", icon: Truck, tone: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20" },
  { id: "movement", label: "Package movement", description: "Routes, custody scans, relay handovers, and audit history.", icon: MapPinned, tone: "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20" },
  { id: "payouts", label: "Courier payouts", description: "Weekly payout readiness, verified bank details, and earnings.", icon: DollarSign, tone: "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20" },
  { id: "refunds", label: "Manual refunds", description: "Review customer refund requests and approve Paystack refunds manually.", icon: Receipt, tone: "border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20" },
  { id: "exceptions", label: "Relay exceptions", description: "Delays, failed handovers, recovery actions, and open risks.", icon: ClipboardCheck, tone: "border-orange-200 bg-orange-50/70 dark:border-orange-900 dark:bg-orange-950/20" },
  { id: "waves", label: "Wave operations", description: "Dispatch runs, durable waves, relay legs, capacity, recovery, reconciliation, and shared-pool economics.", icon: Waves, tone: "border-teal-200 bg-teal-50/70 dark:border-teal-900 dark:bg-teal-950/20" },
  { id: "dispatch", label: "Paid parcel assignment", description: "Review safe route recommendations and assign paid parcels.", icon: PackageSearch, tone: "border-purple-200 bg-purple-50/70 dark:border-purple-900 dark:bg-purple-950/20" },
  { id: "recruitment", label: "Courier recruitment", description: "Review new driver enquiries, contact applicants, check documents, approve, and activate couriers.", icon: UserCheck, tone: "border-sky-200 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/20" },
] as const;

type SectionId = (typeof sections)[number]["id"];

function CourierRecruitmentPanel() {
  const [, setLocation] = useLocation();
  const [vehicleType, setVehicleType] = useState("all");
  const [province, setProvince] = useState("all");
  const [verificationStatus, setVerificationStatus] = useState("all");
  const [reviewStatus, setReviewStatus] = useState("all");
  const enquiryFilters = useMemo(() => ({ vehicleType, province, verificationStatus: verificationStatus as "all" | "pending" | "approved" | "replacement_required", reviewStatus: reviewStatus as "all" | "new" | "reviewed" }), [vehicleType, province, verificationStatus, reviewStatus]);
  const applicationEnquiries = trpc.adminAudit.applicationEnquiries.useQuery(enquiryFilters);
  const latestEnquiries = applicationEnquiries.data?.enquiries.slice(0, 3) ?? [];

  return <div className="space-y-6">
    <Card className="border-sky-200 dark:border-sky-900">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><UserCheck className="h-5 w-5 text-sky-700" />Courier recruitment</h2>
            <p className="mt-1 text-sm text-muted-foreground">One workflow for people who want to become couriers—from first enquiry through document review and activation.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200"><Mail className="h-4 w-4" />{applicationEnquiries.data?.newCount ?? 0} new enquiries</span>
        </div>
        <div className="mt-5 rounded-xl bg-sky-50/70 p-4 dark:bg-sky-950/20"><div className="mb-3 flex items-center gap-2"><Search className="h-4 w-4 text-sky-700" /><p className="text-sm font-semibold text-foreground">Filter recruitment enquiries</p><span className="text-xs text-muted-foreground">{applicationEnquiries.data?.total ?? 0} shown</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-semibold text-muted-foreground">Vehicle type<select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-2.5 py-2 text-sm font-normal text-foreground"><option value="all">All vehicle types</option><option value="car">Car</option><option value="bakkie">Bakkie</option><option value="van">Van</option><option value="motorcycle">Motorcycle</option><option value="truck">Truck</option><option value="other">Other</option></select></label><label className="text-xs font-semibold text-muted-foreground">Province<select value={province} onChange={(event) => setProvince(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-2.5 py-2 text-sm font-normal text-foreground"><option value="all">All provinces</option>{['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="text-xs font-semibold text-muted-foreground">Document verification<select value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-2.5 py-2 text-sm font-normal text-foreground"><option value="all">Any document status</option><option value="pending">Any pending document</option><option value="approved">Any approved document</option><option value="replacement_required">Replacement required</option></select></label><label className="text-xs font-semibold text-muted-foreground">Application review<select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-2.5 py-2 text-sm font-normal text-foreground"><option value="all">All review states</option><option value="new">Not reviewed</option><option value="reviewed">Reviewed</option></select></label></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {latestEnquiries.map((enquiry) => <div key={enquiry.id} role="button" tabIndex={0} onClick={() => setLocation(`/admin/courier-enquiries?lead=${enquiry.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setLocation(`/admin/courier-enquiries?lead=${enquiry.id}`); } }} className="cursor-pointer rounded-xl border bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-start justify-between gap-2"><p className="font-semibold text-foreground">{enquiry.fullName}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${enquiry.reviewStatus === "reviewed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{enquiry.reviewStatus === "reviewed" ? "Reviewed" : "New"}</span></div><a onClick={(event) => event.stopPropagation()} className="mt-1 block truncate text-sm text-accent hover:underline" href={`mailto:${enquiry.email}`}>{enquiry.email}</a><a onClick={(event) => event.stopPropagation()} className="text-sm text-muted-foreground hover:underline" href={`tel:${enquiry.phone}`}>{enquiry.phone}</a><p className="mt-1 text-xs text-muted-foreground">{enquiry.province ?? "Province not recorded"} · {enquiry.vehicleType ?? "Vehicle not recorded"}</p><p className="mt-2 text-xs font-semibold text-sky-700">Open complete application →</p></div>)}
        </div>
        <Button type="button" variant="outline" className="mt-4" onClick={() => setLocation("/admin/courier-enquiries")}>View all enquiries and contact details</Button>
      </CardContent>
    </Card>
    <AdminCourierApprovalPanel />
  </div>;
}

function SectionPanel({ activeSection }: { activeSection: SectionId }) {
  if (activeSection === "couriers") return <AdminCourierSafetyPanel />;
  if (activeSection === "movement") return <AdminOperationsAuditPanel />;
  if (activeSection === "payouts") return <div className="space-y-6"><AdminRelayEconomicsPanel /><AdminPayoutReviewPanel /></div>;
  if (activeSection === "refunds") return <AdminRefundReviewPanel />;
  if (activeSection === "exceptions") return <AdminRelayExceptionsPanel />;
  if (activeSection === "waves") return <AdminWaveOperationsPanel />;
  if (activeSection === "recruitment") return <CourierRecruitmentPanel />;
  return <Card className="border-accent/30"><CardContent className="p-4 sm:p-6"><h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><PackageSearch className="h-5 w-5 text-purple-700" />Paid parcel assignment</h2><p className="mb-4 mt-1 text-sm text-muted-foreground">Review route recommendations and assign eligible paid parcels to safe, available couriers.</p><AdminDispatchPanel /></CardContent></Card>;
}

export default function AdminCourierDashboard() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const active = sections.find((section) => section.id === activeSection);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card"><div className="mx-auto max-w-6xl px-4 py-6"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Owner operations</p><h1 className="mt-2 text-3xl font-bold text-foreground">Admin Dashboard</h1><p className="mt-1 max-w-3xl text-muted-foreground">All courier, parcel, payout, relay, dispatch, and recruitment functions are available from this one workspace.</p></div></div>
        <main className="mx-auto max-w-7xl px-4 py-8">
          {activeSection && active ? <><div className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Admin workspace</p><h2 className="mt-1 text-2xl font-bold text-foreground">{active.label}</h2><p className="mt-1 text-sm text-muted-foreground">{active.description}</p></div><Button type="button" variant="outline" onClick={() => setActiveSection(null)}>All sections</Button></div><SectionPanel activeSection={activeSection} /></> : <><div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/20"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><h2 className="font-bold text-foreground">Everything in one dashboard</h2><p className="mt-1 text-sm text-muted-foreground">Choose a function below. Detailed data loads only when you open that card, keeping the admin workspace fast and easy to use.</p></div></div></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Admin dashboard sections">{sections.map((section) => { const Icon = section.icon; return <button key={section.id} type="button" onClick={() => setActiveSection(section.id)} className={`group min-h-40 rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${section.tone}`} aria-label={`Open ${section.label}`}><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/80 text-foreground shadow-sm"><Icon className="h-5 w-5" /></span><span className="text-sm font-semibold text-accent transition-transform group-hover:translate-x-1">Open →</span></div><h2 className="mt-5 text-lg font-bold text-foreground">{section.label}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{section.description}</p></button>; })}</div></>}
        </main>
      </div>
    </DashboardLayout>
  );
}
