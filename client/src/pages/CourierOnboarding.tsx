import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, FileUp, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * CourierOnboarding Component - Production Ready
 * 8-step onboarding flow with backend data persistence
 * Step 1: Welcome
 * Step 2: Requirements Check
 * Step 3: Identity Verification
 * Step 4: Training Module
 * Step 5: Safety & Fraud Rules
 * Step 6: Quiz
 * Step 7: Bank Account Details
 * Step 8: Agreements & Activation
 */

type OnboardingStep = 'welcome' | 'requirements' | 'verification' | 'training' | 'safety' | 'quiz' | 'bank' | 'agreement' | 'complete';

export default function CourierOnboarding() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get onboarding status on mount
  const { data: onboardingStatus } = trpc.onboarding.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, setLocation]);

  const stepMap: Record<OnboardingStep, number> = {
    welcome: 0,
    requirements: 12,
    verification: 25,
    training: 38,
    safety: 50,
    quiz: 63,
    bank: 76,
    agreement: 88,
    complete: 100,
  };

  // Keep this hook before the loading/auth returns so hook order is stable.
  useEffect(() => {
    setProgress(stepMap[currentStep]);
  }, [currentStep]);

  if (!isAuthenticated) return null;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Header with Progress */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-foreground">Mzansi Courier Onboarding</h1>
            <span className="text-sm text-muted-foreground">Step {Math.floor(stepMap[currentStep] / 12) + 1}/8</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {currentStep === 'welcome' && <WelcomeStep onNext={() => setCurrentStep('requirements')} />}
        {currentStep === 'requirements' && (
          <RequirementsStep
            onNext={() => setCurrentStep('verification')}
            onBack={() => setCurrentStep('welcome')}
          />
        )}
        {currentStep === 'verification' && (
          <VerificationStep
            onNext={() => setCurrentStep('training')}
            onBack={() => setCurrentStep('requirements')}
          />
        )}
        {currentStep === 'training' && (
          <TrainingStep
            onNext={() => setCurrentStep('safety')}
            onBack={() => setCurrentStep('verification')}
          />
        )}
        {currentStep === 'safety' && (
          <SafetyStep
            onNext={() => setCurrentStep('quiz')}
            onBack={() => setCurrentStep('training')}
          />
        )}
        {currentStep === 'quiz' && (
          <QuizStep
            onNext={() => setCurrentStep('bank')}
            onBack={() => setCurrentStep('safety')}
          />
        )}
        {currentStep === 'bank' && (
          <BankAccountStep
            onNext={() => setCurrentStep('agreement')}
            onBack={() => setCurrentStep('quiz')}
          />
        )}
        {currentStep === 'agreement' && (
          <AgreementStep
            onNext={() => setCurrentStep('complete')}
            onBack={() => setCurrentStep('bank')}
          />
        )}
        {currentStep === 'complete' && <CompleteStep />}
      </div>
    </div>
  );
}

// ============ STEP 1: WELCOME ============
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card className="p-8 text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <span className="text-3xl">🚚</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to Mzansi Couriers</h2>
        <p className="text-lg text-muted-foreground">Earn money with your vehicle</p>
      </div>

      <div className="space-y-4 text-left mb-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">Deliver parcels in your area</h3>
            <p className="text-sm text-muted-foreground">Connect with customers near you</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">Work when you want</h3>
            <p className="text-sm text-muted-foreground">Be your own boss, set your schedule</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">Earn reliable income</h3>
            <p className="text-sm text-muted-foreground">Get paid per completed delivery</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        This onboarding will take 20-30 minutes. We'll verify your identity, train you on how the platform works, and ensure you're ready to start earning.
      </p>

      <Button onClick={onNext} size="lg" className="w-full">
        Start Training <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </Card>
  );
}

// ============ STEP 2: REQUIREMENTS CHECK ============
function RequirementsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [requirements, setRequirements] = useState({
    hasSADriversLicense: false,
    hasVehicleAccess: false,
    hasWorkingSmartphone: false,
    noSeriousCriminalRecord: false,
    agreeBackgroundVerification: false,
    agreeIdVerification: false,
    agreeVehicleVerification: false,
  });
  const [vehicleType, setVehicleType] = useState<"motorbike" | "car" | "van" | "bakkie">("car");
  const [vehicleRegistration, setVehicleRegistration] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [province, setProvince] = useState("");
  const [region, setRegion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveRequirementsMutation = trpc.onboarding.saveRequirements.useMutation();

  const allMet = Object.values(requirements).every((v) => v);
  const vehicleDetailsComplete = vehicleRegistration.trim().length >= 2 && licenseNumber.trim().length >= 2 && province.trim().length >= 2 && region.trim().length >= 2;

  const handleToggle = (key: keyof typeof requirements) => {
    setRequirements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      await saveRequirementsMutation.mutateAsync({
        ...requirements,
        vehicleType,
        vehicleRegistration: vehicleRegistration.trim(),
        licenseNumber: licenseNumber.trim(),
        province: province.trim(),
        region: region.trim(),
      });
      toast.success('Requirements saved');
      onNext();
    } catch (error) {
      console.error('Error saving requirements:', error);
      toast.error('Failed to save requirements');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Basic Requirements</h2>

      <div className="space-y-4 mb-8">
        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={requirements.hasSADriversLicense}
            onChange={() => handleToggle('hasSADriversLicense')}
            className="w-5 h-5"
          />
          <span className="text-foreground font-medium">I have a valid South African driver's license</span>
        </label>

        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={requirements.hasVehicleAccess}
            onChange={() => handleToggle('hasVehicleAccess')}
            className="w-5 h-5"
          />
          <span className="text-foreground font-medium">I have access to a vehicle (car, bike, bakkie, etc.)</span>
        </label>

        <div className="space-y-3 rounded-lg border p-4 bg-secondary/20">
          <p className="font-semibold text-foreground">Vehicle details</p>
          <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value as typeof vehicleType)} className="w-full px-3 py-2 border rounded-lg bg-background text-foreground">
            <option value="motorbike">Motorbike</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
            <option value="bakkie">Bakkie</option>
          </select>
          <input value={vehicleRegistration} onChange={(e) => setVehicleRegistration(e.target.value)} placeholder="Vehicle registration" className="w-full px-3 py-2 border rounded-lg bg-background text-foreground" />
          <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="Driver licence number" className="w-full px-3 py-2 border rounded-lg bg-background text-foreground" />
          <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-background text-foreground" aria-label="Home province">
            <option value="">Select home province</option>
            <option>Eastern Cape</option>
            <option>Free State</option>
            <option>Gauteng</option>
            <option>KwaZulu-Natal</option>
            <option>Limpopo</option>
            <option>Mpumalanga</option>
            <option>North West</option>
            <option>Northern Cape</option>
            <option>Western Cape</option>
          </select>
          <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Operating region or main town (e.g. Soweto, Cape Town CBD)" className="w-full px-3 py-2 border rounded-lg bg-background text-foreground" aria-label="Operating region" />
        </div>

        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={requirements.hasWorkingSmartphone}
            onChange={() => handleToggle('hasWorkingSmartphone')}
            className="w-5 h-5"
          />
          <span className="text-foreground font-medium">I have a working smartphone</span>
        </label>

        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={requirements.noSeriousCriminalRecord}
            onChange={() => handleToggle('noSeriousCriminalRecord')}
            className="w-5 h-5"
          />
          <span className="text-foreground font-medium">I have no serious criminal record</span>
        </label>

        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-muted-foreground mb-3">For safety and trust, we need to verify:</p>

          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
            <input
              type="checkbox"
              checked={requirements.agreeBackgroundVerification}
              onChange={() => handleToggle('agreeBackgroundVerification')}
              className="w-5 h-5"
            />
            <span className="text-foreground font-medium">I agree to background verification</span>
          </label>

          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
            <input
              type="checkbox"
              checked={requirements.agreeIdVerification}
              onChange={() => handleToggle('agreeIdVerification')}
              className="w-5 h-5"
            />
            <span className="text-foreground font-medium">I agree to ID verification</span>
          </label>

          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
            <input
              type="checkbox"
              checked={requirements.agreeVehicleVerification}
              onChange={() => handleToggle('agreeVehicleVerification')}
              className="w-5 h-5"
            />
            <span className="text-foreground font-medium">I agree to vehicle verification</span>
          </label>
        </div>
      </div>

      {!allMet && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">Please confirm all requirements to continue</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={!allMet || !vehicleDetailsComplete || isSubmitting} 
          className="flex-1"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Continue
        </Button>
      </div>
    </Card>
  );
}

// ============ STEP 3: IDENTITY VERIFICATION ============
function VerificationStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [uploads, setUploads] = useState({
    sa_id: null as File | null,
    selfie: null as File | null,
    driver_license: null as File | null,
    vehicle_registration: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadDocumentMutation = trpc.onboarding.uploadDocument.useMutation();

  const allUploaded = Object.values(uploads).every((v) => v !== null);

  const handleFileChange = (type: keyof typeof uploads, file: File | null) => {
    setUploads((prev) => ({ ...prev, [type]: file }));
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      // Upload all documents
      for (const [type, file] of Object.entries(uploads)) {
        if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const fileData = (e.target?.result as string).split(',')[1]; // Get base64 part
            await uploadDocumentMutation.mutateAsync({
              documentType: type as any,
              fileName: file.name,
              fileData: fileData || '',
            });
          };
          reader.readAsDataURL(file);
        }
      }
      toast.success('Documents uploaded');
      onNext();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-2">Identity & Safety Verification</h2>
      <p className="text-muted-foreground mb-6">
        Mzansi Couriers prioritises customer safety and trust. Upload clear photos of your documents.
      </p>

      <div className="space-y-4 mb-8">
        <FileUploadBox
          label="South African ID"
          description="Upload a clear photo of both sides"
          onChange={(file) => handleFileChange('sa_id', file)}
          uploaded={uploads.sa_id !== null}
        />

        <FileUploadBox
          label="Selfie with ID"
          description="Take a selfie holding your ID"
          onChange={(file) => handleFileChange('selfie', file)}
          uploaded={uploads.selfie !== null}
        />

        <FileUploadBox
          label="Driver's License"
          description="Upload a clear photo of your license"
          onChange={(file) => handleFileChange('driver_license', file)}
          uploaded={uploads.driver_license !== null}
        />

        <FileUploadBox
          label="Vehicle Registration"
          description="Upload a photo of your vehicle's registration"
          onChange={(file) => handleFileChange('vehicle_registration', file)}
          uploaded={uploads.vehicle_registration !== null}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Vehicle insurance is your responsibility. We insure the packages in transit, not your vehicle.
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={!allUploaded || isSubmitting} 
          className="flex-1"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Continue
        </Button>
      </div>
    </Card>
  );
}

// ============ STEP 4: TRAINING MODULE ============
function TrainingStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [currentCard, setCurrentCard] = useState(0);

  const trainingCards = [
    {
      title: 'Who We Are',
      content:
        'Mzansi Couriers is a peer-to-peer logistics platform. We connect senders with independent couriers like you. We use AI-powered dispatching to match jobs efficiently.',
    },
    {
      title: 'How It Works',
      content:
        'Customers post delivery jobs within the applicable 120 km service radius. You accept jobs near you, pick up the package, deliver it, and get paid. It\'s that simple.',
    },
    {
      title: 'Payment',
      content:
        'You earn per delivery. Payments are made weekly via Paystack. The more deliveries you complete, the more you earn.',
    },
    {
      title: 'Ratings & Reviews',
      content:
        'Customers rate you after each delivery. Maintain a high rating to get more job offers. Poor ratings can affect your access.',
    },
    {
      title: 'Pickup Checklist',
      content:
        '1. Verify the package details match the order. 2. Check for any visible damage. 3. Get the sender\'s signature or confirmation. 4. Take a photo of the package. 5. Confirm pickup in the app.',
    },
    {
      title: 'During Delivery',
      content:
        '1. Handle packages with care. 2. Keep the package secure in your vehicle. 3. Arrive on time - customers are waiting. 4. Call the customer 10 minutes before arrival. 5. Use GPS tracking in the app.',
    },
    {
      title: 'Delivery Confirmation',
      content:
        '1. Get the customer\'s signature or photo ID confirmation. 2. Take a photo of the package at delivery location. 3. Get customer feedback if possible. 4. Mark delivery as complete in the app. 5. You\'re done - payment will be processed.',
    },
    {
      title: 'Photo Requirements',
      content:
        'Always take clear photos: 1. At pickup - show package condition. 2. At delivery - show package at destination. 3. Include customer or location landmark. 4. Photos help resolve disputes and protect you.',
    },
    {
      title: 'Customer Communication',
      content:
        '1. Be professional and polite. 2. Respond to messages quickly. 3. Call if you\'re running late. 4. Ask for feedback to improve ratings. 5. Never open or tamper with packages.',
    },
    {
      title: 'Packaging Requirements',
      content:
        'IMPORTANT: Packaging is the CUSTOMER responsibility. Before pickup, verify the parcel is: 1. Securely packaged. 2. Completely sealed. 3. Clearly labeled with Parcel ID Code. 4. In good condition. If packaging is inadequate, REFUSE collection and notify customer to repackage.',
    },
    {
      title: 'Customer Packaging Responsibility',
      content:
        'Customers MUST supply their own packaging materials (boxes, tape, padding, etc.). You are NOT responsible for providing packaging. Your role is to verify the package meets our standards before pickup. If a customer asks you to package items, politely decline and explain they must package themselves.',
    },
    {
      title: 'Parcel Identification Code',
      content:
        'Every booking generates a unique Parcel Identification Code. Your job is to verify this code matches the package before pickup. The code must be clearly visible on the outside of the parcel. Refuse collection if the code is missing or does not match the booking. This protects both you and the customer.',
    },
    {
      title: 'Earnings and payouts',
      content:
        'Completed deliveries are recorded in your earnings dashboard. Payout timing depends on verified payment details and the applicable processing schedule. Do not promise an instant or weekend payout to a customer.',
    },
    {
      title: 'Support',
      content:
        'For delivery, payment, or account issues, email mzansicouriers@yahoo.com. Email support is monitored Monday through Friday, 9:00 AM–5:00 PM SAST, with responses targeted within 24 hours during published support hours.',
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Training Module</h2>

      <div className="bg-secondary/50 rounded-lg p-6 mb-6 min-h-[200px] flex flex-col justify-center">
        <h3 className="text-xl font-bold text-foreground mb-3">{trainingCards[currentCard].title}</h3>
        <p className="text-foreground leading-relaxed">{trainingCards[currentCard].content}</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {trainingCards.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === currentCard ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {currentCard + 1} / {trainingCards.length}
        </span>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => setCurrentCard(Math.max(0, currentCard - 1))}
          variant="outline"
          disabled={currentCard === 0}
        >
          Previous
        </Button>
        {currentCard < trainingCards.length - 1 ? (
          <Button onClick={() => setCurrentCard(currentCard + 1)} className="flex-1">
            Next
          </Button>
        ) : (
          <Button onClick={onNext} className="flex-1">
            I Understand
          </Button>
        )}
      </div>

      <Button onClick={onBack} variant="ghost" className="w-full mt-2">
        Back
      </Button>
    </Card>
  );
}

// ============ STEP 5: SAFETY & FRAUD RULES ============
function SafetyStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [understood, setUnderstood] = useState(false);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Safety & Fraud Rules</h2>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-red-900 mb-3">ZERO TOLERANCE FOR:</h3>
        <ul className="space-y-2 text-sm text-red-800">
          <li>• Theft or stealing parcels</li>
          <li>• Fake deliveries or GPS spoofing</li>
          <li>• Tampering with or opening parcels</li>
          <li>• Violence, harassment, or abuse</li>
          <li>• Fraud or criminal activity</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-blue-900 mb-3">How We Protect Everyone:</h3>
        <p className="text-sm text-blue-800 mb-3">
          Mzansi Couriers records route updates and proof photos so delivery progress can be checked by the customer and support team.
        </p>
        <p className="text-sm text-blue-800 font-semibold">Breaking these rules can result in:</p>
        <ul className="space-y-1 text-sm text-blue-800 mt-2">
          <li>• Permanent account ban</li>
          <li>• Reporting to authorities</li>
          <li>• Legal action</li>
        </ul>
      </div>

      <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 mb-6">
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          className="w-5 h-5 mt-1"
        />
        <span className="text-foreground font-medium">
          I understand these rules and agree to follow them. I know breaking them can result in permanent ban.
        </span>
      </label>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} disabled={!understood} className="flex-1">
          I Agree & Continue
        </Button>
      </div>
    </Card>
  );
}

// ============ STEP 6: QUIZ ============
function QuizStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitQuizMutation = trpc.onboarding.submitQuiz.useMutation();

  const quiz = [
    {
      id: 1,
      question: 'What should you do if a customer is unavailable at the delivery address?',
      options: [
        'Leave the parcel outside',
        'Call the customer and wait',
        'Return the parcel to sender',
        'Open the parcel',
      ],
      correct: 1,
    },
    {
      id: 2,
      question: 'When may you start a parcel route?',
      options: ['Before accepting the parcel', 'After accepting an assigned paid parcel', 'Only after opening the parcel', 'Whenever you choose a destination'],
      correct: 1,
    },
    {
      id: 3,
      question: 'What should you do if you suspect fraud?',
      options: [
        'Ignore it',
        'Report it to support immediately',
        'Handle it yourself',
        'Tell other couriers',
      ],
      correct: 1,
    },
    {
      id: 4,
      question: 'Can you open a parcel to check contents?',
      options: ['Yes, always', 'Only if it seems suspicious', 'Never', 'Only if asked by customer'],
      correct: 2,
    },
    {
      id: 5,
      question: 'What happens if you get a low rating?',
      options: [
        'Nothing happens',
        'You get more jobs',
        'Your access to jobs may be affected',
        'You get paid more',
      ],
      correct: 2,
    },
  ];

  const handleSubmit = async () => {
    let correctCount = 0;
    const quizAnswers = quiz.map((q) => {
      const selectedAnswer = parseInt(answers[q.id] || '-1');
      const isCorrect = selectedAnswer === q.correct;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selectedAnswer,
        correct: isCorrect,
      };
    });

    const finalScore = (correctCount / quiz.length) * 100;
    setScore(finalScore);
    setSubmitted(true);

    if (finalScore >= 80) {
      setIsSubmitting(true);
      try {
        await submitQuizMutation.mutateAsync({
          answers: quizAnswers,
          timeSpent: 0,
        });
        toast.success('Quiz passed! Moving to next step...');
        onNext();
      } catch (error) {
        console.error('Error submitting quiz:', error);
        toast.error('Failed to submit quiz');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (submitted && score < 80) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Quiz Result: {score.toFixed(0)}%</h2>
        <p className="text-muted-foreground mb-6">You need 80% to pass. Please review the training and try again.</p>
        <Button 
          onClick={() => {
            setSubmitted(false);
            setAnswers({});
          }}
          className="w-full"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  const allAnswered = quiz.every((q) => answers[q.id] !== undefined);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Knowledge Quiz</h2>
      <p className="text-muted-foreground mb-6">Answer the following questions. You need 80% to pass.</p>

      <div className="space-y-6 mb-8">
        {quiz.map((q) => (
          <div key={q.id}>
            <p className="font-semibold text-foreground mb-3">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((option, idx) => (
                <label key={idx} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    value={idx}
                    checked={answers[q.id] === String(idx)}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    className="w-4 h-4"
                  />
                  <span className="text-foreground">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!allAnswered || isSubmitting} 
          className="flex-1"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Submit Quiz
        </Button>
      </div>
    </Card>
  );
}

// ============ STEP 7: BANK ACCOUNT DETAILS ============
function BankAccountStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);

  const { data: banksData } = trpc.payments.getBankList.useQuery();
  const saveBankDetailsMutation = trpc.onboarding.saveBankDetails.useMutation();

  useEffect(() => {
    if (banksData?.success && banksData?.data) {
      setBanks(banksData.data);
    }
  }, [banksData]);

  const handleContinue = async () => {
    if (!bankCode || !accountNumber || !accountName) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await saveBankDetailsMutation.mutateAsync({
        bankCode,
        bankName: banks.find((bank) => bank.code === bankCode)?.name || '',
        branchCode: branchCode.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        privacyConsent: true,
      });
      toast.success(`Bank account verified for weekly Paystack payouts (${result.payoutDays})`);
      onNext();
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error(error instanceof Error ? error.message : 'Bank account could not be verified');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-2">Bank Account Details</h2>
      <p className="text-muted-foreground mb-6">
        Add the bank account where Paystack will send your verified earnings. We process courier payouts once a week, normally on Thursday or Friday, after your banking details have been confirmed.
      </p>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Bank name and branch code
            {!banksData && <span className="text-xs text-muted-foreground ml-2">(Loading...)</span>}
          </label>
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
              <option value="">Choose your bank...</option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Branch Code</label>
          <input
            type="text"
            inputMode="numeric"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter your branch code"
            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Enter your account number"
            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Account Holder Name</label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Name on your bank account"
            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          ✓ Paystack verifies the account before payout setup
          <br />
          ✓ Courier earnings are processed once a week, normally Thursday or Friday
          <br />
          ✓ Your account details are used for courier payouts
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={privacyConsent}
            onChange={() => setPrivacyConsent(!privacyConsent)}
            className="w-5 h-5"
          />
          <span className="text-foreground font-medium">
            I have read and agree to the <a href="/privacy" target="_blank" rel="noreferrer" className="text-primary hover:underline">Privacy Policy</a> regarding the collection and processing of my personal and financial information.
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!bankCode || !branchCode || !accountNumber || !accountName || isSubmitting || !privacyConsent}
          className="flex-1"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Continue
        </Button>
      </div>
    </Card>
  );
}

// ============ STEP 8: AGREEMENTS ============
function AgreementStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [agreements, setAgreements] = useState({
    termsAndConditionsAccepted: false,
    courierRulesAccepted: false,
    safetyPoliciesAccepted: false,
    independentContractorAgreementAccepted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveAgreementsMutation = trpc.onboarding.acceptAgreements.useMutation();
  const submitApplicationMutation = trpc.onboarding.submitApplication.useMutation();

  const allAccepted = Object.values(agreements).every((v) => v);

  const handleToggle = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      await saveAgreementsMutation.mutateAsync(agreements);
      await submitApplicationMutation.mutateAsync();
      toast.success('Application submitted for admin approval.');
      onNext();
    } catch (error) {
      console.error('Error saving agreements:', error);
      toast.error('Failed to save agreements');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Final Agreements</h2>
      {(saveAgreementsMutation.isPending || submitApplicationMutation.isPending || isSubmitting) ? <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />Saving your agreement and submitting for approval…</p> : null}
      {saveAgreementsMutation.error || submitApplicationMutation.error ? <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{saveAgreementsMutation.error?.message || submitApplicationMutation.error?.message}</p> : null}

      <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto">
        <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={agreements.termsAndConditionsAccepted}
            onChange={() => handleToggle('termsAndConditionsAccepted')}
            className="w-5 h-5 mt-1 flex-shrink-0"
          />
          <div>
            <span className="text-foreground font-medium">I accept the Terms and Conditions</span>
            <p className="text-sm text-muted-foreground">Read our full terms at mzansicourier.com/terms</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={agreements.courierRulesAccepted}
            onChange={() => handleToggle('courierRulesAccepted')}
            className="w-5 h-5 mt-1 flex-shrink-0"
          />
          <div>
            <span className="text-foreground font-medium">I accept the Courier Rules</span>
            <p className="text-sm text-muted-foreground">I understand the platform rules and will follow them</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={agreements.safetyPoliciesAccepted}
            onChange={() => handleToggle('safetyPoliciesAccepted')}
            className="w-5 h-5 mt-1 flex-shrink-0"
          />
          <div>
            <span className="text-foreground font-medium">I accept the Safety Policies</span>
            <p className="text-sm text-muted-foreground">I will maintain safety standards for all deliveries</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={agreements.independentContractorAgreementAccepted}
            onChange={() => handleToggle('independentContractorAgreementAccepted')}
            className="w-5 h-5 mt-1 flex-shrink-0"
          />
          <div>
            <span className="text-foreground font-medium">I am an independent contractor</span>
            <p className="text-sm text-muted-foreground">I understand I am not an employee and am responsible for my own vehicle and insurance</p>
          </div>
        </label>
      </div>

      {!allAccepted && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">Please accept all agreements to continue</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={!allAccepted || isSubmitting} 
          className="flex-1"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Submit for approval
        </Button>
      </div>
    </Card>
  );
}

// ============ STEP 9: COMPLETE ============
function CompleteStep() {
  const [, setLocation] = useLocation();

  return (
    <Card className="p-8 text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Onboarding Complete!</h2>
        <p className="text-lg text-muted-foreground">Your application has been submitted</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
        <h3 className="font-bold text-blue-900 mb-3">What happens next?</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ Our team will review your documents (24-48 hours)</li>
          <li>✓ You'll receive an email when approved</li>
          <li>✓ Start accepting delivery jobs!</li>
        </ul>
      </div>

      <p className="text-muted-foreground mb-6">
        In the meantime, you can check the status of your application in your dashboard.
      </p>

      <Button onClick={() => setLocation('/courier/dashboard')} size="lg" className="w-full">
        Go to Dashboard
      </Button>
    </Card>
  );
}

// ============ FILE UPLOAD BOX COMPONENT ============
function FileUploadBox({
  label,
  description,
  onChange,
  uploaded,
}: {
  label: string;
  description: string;
  onChange: (file: File | null) => void;
  uploaded: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onChange(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onChange(files[0]);
    }
  };

  return (
    <label
      onDragOver={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex items-center gap-4 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        uploaded
          ? 'bg-green-50 border-green-300'
          : isDragging
            ? 'bg-primary/10 border-primary'
            : 'border-border hover:bg-secondary/50'
      }`}
    >
      <div className="flex-shrink-0">
        {uploaded ? (
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        ) : (
          <FileUp className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <input
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*"
      />
    </label>
  );
}
