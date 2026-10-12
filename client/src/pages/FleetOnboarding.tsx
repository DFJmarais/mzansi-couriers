import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/**
 * Fleet Partner Onboarding
 * Multi-step form for new fleet partners
 */
export default function FleetOnboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    saIdNumber: "",
    businessRegistrationNumber: "",
    vatNumber: "",
    contactEmail: "",
    contactPhone: "",
    physicalAddress: "",
    operatingProvinces: [] as string[],
    areasServed: [] as string[],
  });

  const createFleet = trpc.fleet.createFleetAccount.useMutation({
    onSuccess: () => {
      setFormError("");
      setStep(3);
    },
    onError: (error) => {
      setFormError(error.message || "We could not create the fleet account. Please try again.");
      toast.error(error.message || "We could not create the fleet account.");
    },
  });

  const provinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape",
  ];

  const handleStepOne = () => {
    if (!formData.businessName.trim() || !formData.ownerName.trim()) {
      setFormError("Enter the business name and owner's name.");
      return;
    }
    if (!/^\d{13}$/.test(formData.saIdNumber.trim())) {
      setFormError("Enter a valid 13-digit South African ID number.");
      return;
    }
    setFormError("");
    setStep(2);
  };

  const handleSubmit = () => {
    if (!formData.contactEmail.trim() || !formData.contactPhone.trim() || !formData.physicalAddress.trim()) {
      setFormError("Enter your email, phone number, and physical address.");
      return;
    }
    if (formData.operatingProvinces.length === 0) {
      setFormError("Select at least one operating province.");
      return;
    }
    if (formData.areasServed.length === 0) {
      setFormError("Enter at least one area served.");
      return;
    }
    setFormError("");
    createFleet.mutate({
      businessName: formData.businessName,
      ownerName: formData.ownerName,
      saIdNumber: formData.saIdNumber,
      businessRegistrationNumber: formData.businessRegistrationNumber || undefined,
      vatNumber: formData.vatNumber || undefined,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      physicalAddress: formData.physicalAddress,
      operatingProvinces: formData.operatingProvinces,
      areasServed: formData.areasServed,
    });
  };

  return (
    <div className="min-h-screen bg-mzansi-sand flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-2xl overflow-hidden border-emerald-900/10 shadow-sm"><div className="bg-mzansi-green px-6 py-6 text-white sm:px-8"><Button variant="ghost" className="-ml-3 mb-3 text-white hover:bg-white/10 hover:text-white" onClick={() => setLocation("/fleet")} aria-label="Back to fleet page"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Fleet partner registration</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">Put your fleet to work.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50">Register as a courier business or an independent fleet operator. You keep your vehicles and your existing business.</p><div className="mt-5 grid grid-cols-3 gap-2 text-xs">{['Business details', 'Operations', 'Verification'].map((label, index) => <div key={label} className={`rounded-lg px-3 py-2 ${step === index + 1 ? 'bg-white text-emerald-900' : 'bg-emerald-950/30 text-emerald-100'}`}><span className="font-semibold">0{index + 1}</span><span className="ml-2 hidden sm:inline">{label}</span></div>)}</div></div><div className="p-6 sm:p-8">
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-2 text-slate-950">Tell us about your fleet</h2>
            <p className="text-slate-600 mb-8">
              Start with your owner and business details. You can operate as a registered business or as an independent fleet operator.
            </p>

            <div className="space-y-4">
              {formError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
              <h2 className="text-xl font-bold">Business Information</h2>
              <Input
                placeholder="Business Name"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
              />
              <Input
                placeholder="Owner Name"
                value={formData.ownerName}
                onChange={(e) =>
                  setFormData({ ...formData, ownerName: e.target.value })
                }
              />
              <Input
                placeholder="South African ID (13 digits)"
                value={formData.saIdNumber}
                onChange={(e) =>
                  setFormData({ ...formData, saIdNumber: e.target.value })
                }
              />
              <Input
                placeholder="Registration number (optional)"
                value={formData.businessRegistrationNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    businessRegistrationNumber: e.target.value,
                  })
                }
              />
              <Input
                placeholder="VAT Number (optional)"
                value={formData.vatNumber}
                onChange={(e) =>
                  setFormData({ ...formData, vatNumber: e.target.value })
                }
              />
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleStepOne}
                  className="flex-1"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold mb-2 text-slate-950">Where you operate</h2>
            <p className="text-slate-600 mb-8">
              Add the contact and operating-area details we need to understand your coverage.
            </p>

            <div className="space-y-4">
              {formError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
              <Input
                placeholder="Contact Email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
              />
              <Input
                placeholder="Contact Phone"
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, contactPhone: e.target.value })
                }
              />
              <Input
                placeholder="Physical Address"
                value={formData.physicalAddress}
                onChange={(e) =>
                  setFormData({ ...formData, physicalAddress: e.target.value })
                }
              />
              <Input
                placeholder="Areas served (comma-separated, for example Cape Town, Stellenbosch)"
                value={formData.areasServed.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    areasServed: e.target.value.split(",").map((area) => area.trim()).filter(Boolean),
                  })
                }
              />
              <div>
                <label className="block text-sm font-medium mb-2">
                  Operating Provinces
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {provinces.map((province) => (
                    <label key={province} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.operatingProvinces.includes(province)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              operatingProvinces: [
                                ...formData.operatingProvinces,
                                province,
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              operatingProvinces:
                                formData.operatingProvinces.filter(
                                  (p) => p !== province
                                ),
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{province}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createFleet.isPending}
                  className="flex-1"
                >
                  {createFleet.isPending ? "Creating..." : "Create Fleet Account"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center space-y-6">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2 text-slate-950">Fleet registration received</h2>
              <p className="text-slate-600">
                Your fleet account has been created successfully. Your account is pending verification.
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="text-sm text-slate-700">
                <strong>Next Steps:</strong>
              </p>
              <ul className="text-sm text-slate-600 mt-2 space-y-1">
                <li>✓ Upload required documents (ID, registration, insurance)</li>
                <li>✓ Add your first vehicle</li>
                <li>✓ Register your drivers</li>
                <li>✓ Start accepting deliveries</li>
              </ul>
            </div>
            <Button onClick={() => setLocation("/fleet/dashboard")} className="w-full">
              Go to Fleet Dashboard
            </Button>
          </div>
        )}
      </div></Card>
    </div>
  );
}
