import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, UserRound, Loader2, Car, ShieldCheck, Users, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import StandaloneBackButton from '@/components/StandaloneBackButton';
import { toast } from 'sonner';

type DocumentType = 'license' | 'id' | 'insurance';
type UploadedDocument = { url: string; key: string; fileName: string };

const COURIER_APPLICATION_DRAFT_KEY = 'mzansi-courier-application-draft-v1';
const COURIER_APPLICATION_DRAFT_VERSION = 1;
const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type CourierApplicationDraft = {
  version: number;
  savedAt: string;
  currentStep: number;
  fullName: string;
  email: string;
  phone: string;
  age: string;
  province: string;
  vehicleType: string;
  vehicleMakeModel: string;
  vehicleYear: string;
  vehicleOwnership: string;
  hasValidLicense: boolean;
  hasVehicleInsurance: boolean;
  licenseExpiryDate: string;
  insuranceExpiryDate: string;
  wantsFleet: boolean;
  fleetSize: string;
  fleetDetails: string;
  emailConsent: boolean;
  documents: Partial<Record<DocumentType, UploadedDocument>>;
};

const STEPS = [
  { title: 'Your details', summary: 'Contact information' },
  { title: 'Your vehicle', summary: 'Vehicle and access' },
  { title: 'Readiness', summary: 'Licence and insurance' },
  { title: 'Consent', summary: 'Review and submit' },
] as const;

export default function CourierApplication() {
  const { data: user } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [province, setProvince] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleOwnership, setVehicleOwnership] = useState('own');
  const [hasValidLicense, setHasValidLicense] = useState(false);
  const [hasVehicleInsurance, setHasVehicleInsurance] = useState(false);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [wantsFleet, setWantsFleet] = useState(false);
  const [fleetSize, setFleetSize] = useState('');
  const [fleetDetails, setFleetDetails] = useState('');
  const [emailConsent, setEmailConsent] = useState(false);
  const [documents, setDocuments] = useState<Partial<Record<DocumentType, UploadedDocument>>>({});
  const [uploadingDocument, setUploadingDocument] = useState<DocumentType | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const uploadDocument = trpc.courierInterest.uploadDocument.useMutation();
  const submitInterest = trpc.courierInterest.submit.useMutation();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COURIER_APPLICATION_DRAFT_KEY);
      if (!stored) return;

      const draft = JSON.parse(stored) as Partial<CourierApplicationDraft>;
      const savedAt = draft.savedAt ? Date.parse(draft.savedAt) : NaN;
      if (draft.version !== COURIER_APPLICATION_DRAFT_VERSION || !Number.isFinite(savedAt) || Date.now() - savedAt > DRAFT_MAX_AGE_MS) {
        window.localStorage.removeItem(COURIER_APPLICATION_DRAFT_KEY);
        return;
      }

      setCurrentStep(Math.min(Math.max(Number(draft.currentStep) || 0, 0), STEPS.length - 1));
      setFullName(typeof draft.fullName === 'string' ? draft.fullName : '');
      setEmail(typeof draft.email === 'string' ? draft.email : '');
      setPhone(typeof draft.phone === 'string' ? draft.phone : '');
      setAge(typeof draft.age === 'string' ? draft.age : '');
      setProvince(typeof draft.province === 'string' ? draft.province : '');
      setVehicleType(typeof draft.vehicleType === 'string' ? draft.vehicleType : 'car');
      setVehicleMakeModel(typeof draft.vehicleMakeModel === 'string' ? draft.vehicleMakeModel : '');
      setVehicleYear(typeof draft.vehicleYear === 'string' ? draft.vehicleYear : '');
      setVehicleOwnership(typeof draft.vehicleOwnership === 'string' ? draft.vehicleOwnership : 'own');
      setHasValidLicense(draft.hasValidLicense === true);
      setHasVehicleInsurance(draft.hasVehicleInsurance === true);
      setLicenseExpiryDate(typeof draft.licenseExpiryDate === 'string' ? draft.licenseExpiryDate : '');
      setInsuranceExpiryDate(typeof draft.insuranceExpiryDate === 'string' ? draft.insuranceExpiryDate : '');
      setWantsFleet(draft.wantsFleet === true);
      setFleetSize(typeof draft.fleetSize === 'string' ? draft.fleetSize : '');
      setFleetDetails(typeof draft.fleetDetails === 'string' ? draft.fleetDetails : '');
      setEmailConsent(draft.emailConsent === true);
      setDocuments(draft.documents && typeof draft.documents === 'object' ? draft.documents : {});
    } catch {
      window.localStorage.removeItem(COURIER_APPLICATION_DRAFT_KEY);
    } finally {
      setDraftRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!draftRestored) return;
    const draft: CourierApplicationDraft = {
      version: COURIER_APPLICATION_DRAFT_VERSION,
      savedAt: new Date().toISOString(),
      currentStep,
      fullName,
      email,
      phone,
      age,
      province,
      vehicleType,
      vehicleMakeModel,
      vehicleYear,
      vehicleOwnership,
      hasValidLicense,
      hasVehicleInsurance,
      licenseExpiryDate,
      insuranceExpiryDate,
      wantsFleet,
      fleetSize,
      fleetDetails,
      emailConsent,
      documents,
    };
    try {
      window.localStorage.setItem(COURIER_APPLICATION_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Draft saving is best-effort; the application remains usable if storage is unavailable.
    }
  }, [draftRestored, currentStep, fullName, email, phone, age, province, vehicleType, vehicleMakeModel, vehicleYear, vehicleOwnership, hasValidLicense, hasVehicleInsurance, licenseExpiryDate, insuranceExpiryDate, wantsFleet, fleetSize, fleetDetails, emailConsent, documents]);

  const handleDocumentUpload = async (documentType: DocumentType, file?: File) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, JPG, or PNG document.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Each document must be smaller than 8 MB.');
      return;
    }
    setUploadingDocument(documentType);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Unable to read document'));
        reader.readAsDataURL(file);
      });
      const uploaded = await uploadDocument.mutateAsync({ documentType, fileName: file.name, mimeType: file.type as 'application/pdf' | 'image/jpeg' | 'image/png', base64 });
      setDocuments((current) => ({ ...current, [documentType]: { url: uploaded.url, key: uploaded.key, fileName: file.name } }));
      toast.success(`${documentType === 'license' ? 'Driver’s licence' : documentType === 'id' ? 'ID' : 'Insurance'} uploaded.`);
    } catch {
      toast.error('That document could not be uploaded. Please try again.');
    } finally {
      setUploadingDocument(null);
    }
  };

  const validateStep = (step: number) => {
    if (step === 0 && (!fullName.trim() || fullName.trim().length < 2 || !email.trim() || !phone.trim() || !age || Number(age) < 18 || Number(age) > 85 || !province.trim())) {
      toast.error('Please complete your name, email, mobile number, age, and province.');
      return false;
    }
    if (step === 1 && (!vehicleMakeModel.trim() || vehicleMakeModel.trim().length < 2 || !vehicleYear || Number(vehicleYear) < 1950)) {
      toast.error('Please add your vehicle make, model, and year.');
      return false;
    }
    if (step === 2 && (!hasValidLicense || !hasVehicleInsurance || !documents.license || !documents.id || !documents.insurance || !licenseExpiryDate || !insuranceExpiryDate)) {
      toast.error('Please confirm your readiness, add both expiry dates, and upload your licence, ID, and vehicle insurance documents.');
      return false;
    }
    if (step === 3 && !emailConsent) {
      toast.error('Please confirm that you agree to receive application emails.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(currentStep)) setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
  };

  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 0));

  const handleApplicationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep(3)) return;
    try {
      const result = await submitInterest.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        age: Number(age),
        province: province.trim(),
        vehicleType: vehicleType as 'car' | 'bakkie' | 'van' | 'motorcycle' | 'truck' | 'other',
        vehicleMakeModel: vehicleMakeModel.trim(),
        vehicleYear: Number(vehicleYear),
        vehicleOwnership: vehicleOwnership as 'own' | 'financed' | 'lease' | 'borrowed',
        hasValidLicense: true,
        hasVehicleInsurance: true,
        wantsFleet,
        fleetSize: wantsFleet && fleetSize ? Number(fleetSize) : null,
        fleetDetails: wantsFleet && fleetDetails.trim() ? fleetDetails.trim() : null,
        licenseDocumentUrl: documents.license!.url,
        licenseDocumentKey: documents.license!.key,
        licenseExpiryDate,
        idDocumentUrl: documents.id!.url,
        idDocumentKey: documents.id!.key,
        insuranceDocumentUrl: documents.insurance!.url,
        insuranceDocumentKey: documents.insurance!.key,
        insuranceExpiryDate,
        emailConsent: true,
      });
      localStorage.removeItem(COURIER_APPLICATION_DRAFT_KEY);
      toast.success(result.emailSent ? 'Enquiry received. A confirmation email is on its way.' : 'Enquiry received. We will get back to you soon; email confirmation is pending setup.');
      if (!user) {
        localStorage.setItem('mzansi-auth-return-path', '/courier/onboarding');
        setLocation('/auth');
      } else {
        setLocation('/courier/onboarding');
      }
    } catch {
      toast.error('Please check your details and email consent, then try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container pt-6"><StandaloneBackButton /></div>
      <main className="container py-10 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Courier application</p>
            <h1 className="text-4xl font-bold sm:text-5xl">Tell us about you and your vehicle</h1>
            <p className="text-lg text-muted-foreground">Complete these short steps and we will review your details for verification, training, and approval.</p>
          </div>

          <nav aria-label="Application progress" className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}</p>
              <p className="text-sm text-muted-foreground">{Math.round(((currentStep + 1) / STEPS.length) * 100)}% complete</p>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className="h-full rounded-full bg-accent transition-all duration-200" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
            </div>
            <ol className="grid grid-cols-4 gap-2">
              {STEPS.map((step, index) => {
                const isCurrent = index === currentStep;
                const isComplete = index < currentStep;
                return (
                  <li key={step.title}>
                    <button type="button" onClick={() => index < currentStep && setCurrentStep(index)} disabled={index >= currentStep} aria-current={isCurrent ? 'step' : undefined} className={`flex w-full flex-col items-center gap-2 text-center text-xs transition-opacity ${index > currentStep ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${isCurrent ? 'border-accent bg-accent text-accent-foreground' : isComplete ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-background text-muted-foreground'}`}>{isComplete ? <Check className="h-4 w-4" /> : index + 1}</span>
                      <span className={`hidden font-medium sm:block ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</span>
                      <span className="hidden text-muted-foreground md:block">{step.summary}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <Card className="border-accent/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 0 && <UserRound className="h-5 w-5 text-accent" />}
                {currentStep === 1 && <Car className="h-5 w-5 text-accent" />}
                {currentStep === 2 && <ShieldCheck className="h-5 w-5 text-accent" />}
                {currentStep === 3 && <Mail className="h-5 w-5 text-accent" />}
                {STEPS[currentStep].title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{STEPS[currentStep].summary}. Your progress stays on this page while you move between steps.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApplicationSubmit} className="space-y-5">
                {currentStep === 0 && (
                  <div className="space-y-5">
                    <label className="block space-y-2"><span className="flex items-center gap-2 text-sm font-medium"><UserRound className="h-4 w-4 text-accent" />Full name</span><input required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground" autoComplete="name" /></label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block space-y-2"><span className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-accent" />Email address</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground" autoComplete="email" /></label>
                      <label className="block space-y-2"><span className="flex items-center gap-2 text-sm font-medium"><Phone className="h-4 w-4 text-accent" />Mobile number</span><input required type="tel" minLength={7} value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground" autoComplete="tel" /></label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-medium">Age</span><input required type="number" min={18} max={85} value={age} onChange={(event) => setAge(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground" /></label><label className="block space-y-2"><span className="text-sm font-medium">Province</span><select required value={province} onChange={(event) => setProvince(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground"><option value="">Select your province</option>{['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block space-y-2"><span className="text-sm font-medium">Vehicle type</span><select required value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground"><option value="car">Car</option><option value="bakkie">Bakkie</option><option value="van">Van</option><option value="motorcycle">Motorcycle</option><option value="truck">Truck</option><option value="other">Other</option></select></label>
                      <label className="block space-y-2"><span className="text-sm font-medium">Vehicle year</span><input required type="number" min={1950} max={new Date().getFullYear() + 1} value={vehicleYear} onChange={(event) => setVehicleYear(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground" /></label>
                    </div>
                    <label className="block space-y-2"><span className="flex items-center gap-2 text-sm font-medium"><Car className="h-4 w-4 text-accent" />Vehicle make and model</span><input required minLength={2} value={vehicleMakeModel} onChange={(event) => setVehicleMakeModel(event.target.value)} placeholder="For example, Toyota Corolla" className="w-full rounded-lg border bg-background px-3 py-2 text-foreground" /></label>
                    <label className="block space-y-2"><span className="text-sm font-medium">Vehicle access</span><select required value={vehicleOwnership} onChange={(event) => setVehicleOwnership(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground"><option value="own">I own the vehicle</option><option value="financed">The vehicle is financed</option><option value="lease">The vehicle is leased</option><option value="borrowed">I have permission to use the vehicle</option></select></label>
                    <div className="space-y-3 rounded-lg border border-accent/20 bg-accent/5 p-4"><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={wantsFleet} onChange={(event) => setWantsFleet(event.target.checked)} className="mt-1 h-4 w-4" /><span><span className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-accent" />I am applying with a fleet</span><span className="text-muted-foreground">Select this if you want to register or manage more than one delivery vehicle.</span></span></label>{wantsFleet && <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-medium">Number of vehicles</span><input required type="number" min={1} max={1000} value={fleetSize} onChange={(event) => setFleetSize(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground" /></label><label className="block space-y-2"><span className="text-sm font-medium">Fleet details</span><input required minLength={2} value={fleetDetails} onChange={(event) => setFleetDetails(event.target.value)} placeholder="Company or fleet description" className="w-full rounded-lg border bg-background px-3 py-2 text-foreground" /></label></div>}</div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4 text-sm"><p className="mb-3 font-semibold">Before you continue, please confirm:</p><label className="flex items-start gap-3"><input required type="checkbox" checked={hasValidLicense} onChange={(event) => setHasValidLicense(event.target.checked)} className="mt-1 h-4 w-4" /><span>I have a valid driver’s licence for the vehicle I will use.</span></label><label className="mt-4 flex items-start gap-3"><input required type="checkbox" checked={hasVehicleInsurance} onChange={(event) => setHasVehicleInsurance(event.target.checked)} className="mt-1 h-4 w-4" /><span>The vehicle has valid insurance, or I will provide proof before approval.</span></label></div>
                    <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                      <p className="mb-1 font-semibold">Upload your verification documents</p>
                      <p className="mb-4 text-sm text-muted-foreground">PDF, JPG, or PNG files up to 8 MB each. These are stored securely for the admin review team.</p>
                      <div className="grid gap-4 sm:grid-cols-3">
                        {([
                          ['license', 'Driver’s licence'],
                          ['id', 'South African ID'],
                          ['insurance', 'Vehicle insurance'],
                        ] as const).map(([type, label]) => (
                          <label key={type} className="block space-y-2 text-sm">
                            <span className="font-medium">{label}</span>
                            <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => handleDocumentUpload(type, event.target.files?.[0])} className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-accent file:px-2 file:py-1.5 file:text-accent-foreground" />
                            <span className={`block text-xs ${documents[type] ? 'text-emerald-700' : 'text-muted-foreground'}`}>{uploadingDocument === type ? 'Uploading securely…' : documents[type] ? `Uploaded: ${documents[type]?.fileName}` : 'Required before continuing'}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2 text-sm"><span className="font-medium">Driver’s licence expiry date</span><input required type="date" min={new Date().toISOString().slice(0, 10)} value={licenseExpiryDate} onChange={(event) => setLicenseExpiryDate(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground" /></label>
                        <label className="block space-y-2 text-sm"><span className="font-medium">Vehicle insurance expiry date</span><input required type="date" min={new Date().toISOString().slice(0, 10)} value={insuranceExpiryDate} onChange={(event) => setInsuranceExpiryDate(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-foreground" /></label>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">These confirmations and documents help us keep courier onboarding safe and complete. Additional verification may be requested during review.</p>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div className="rounded-lg border bg-muted/30 p-4 text-sm"><p className="mb-3 font-semibold">Ready to send your application?</p><dl className="grid gap-2 sm:grid-cols-2"><div><dt className="text-muted-foreground">Applicant</dt><dd className="font-medium">{fullName || 'Not provided'}</dd></div><div><dt className="text-muted-foreground">Vehicle</dt><dd className="font-medium">{vehicleMakeModel || 'Not provided'}</dd></div><div><dt className="text-muted-foreground">Vehicle type</dt><dd className="font-medium capitalize">{vehicleType}</dd></div><div><dt className="text-muted-foreground">Fleet application</dt><dd className="font-medium">{wantsFleet ? 'Yes' : 'No'}</dd></div></dl></div>
                    <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm"><input required type="checkbox" checked={emailConsent} onChange={(event) => setEmailConsent(event.target.checked)} className="mt-1 h-4 w-4" /><span>I agree that Mzansi Couriers may email me about my courier application, verification steps, training, and related platform updates. I understand I can withdraw this consent later.</span></label>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" onClick={goBack} disabled={currentStep === 0} className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
                  {currentStep < STEPS.length - 1 ? <Button type="button" onClick={goNext} className="gap-2">Continue<ArrowRight className="h-4 w-4" /></Button> : <Button type="submit" disabled={submitInterest.isPending} className="gap-2">{submitInterest.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Submit application</Button>}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
