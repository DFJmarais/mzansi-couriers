import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, FileUp, ChevronRight } from 'lucide-react';

/**
 * CourierOnboarding Component
 * 7-step onboarding flow for new couriers
 * Step 1: Welcome
 * Step 2: Requirements Check
 * Step 3: Identity Verification
 * Step 4: Training Module
 * Step 5: Safety & Fraud Rules
 * Step 6: Quiz
 * Step 7: Agreements & Activation
 */

type OnboardingStep = 'welcome' | 'requirements' | 'verification' | 'training' | 'safety' | 'quiz' | 'agreement' | 'complete';

export default function CourierOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [progress, setProgress] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  if (!user) return null;

  const stepMap: Record<OnboardingStep, number> = {
    welcome: 0,
    requirements: 14,
    verification: 28,
    training: 42,
    safety: 56,
    quiz: 70,
    agreement: 85,
    complete: 100,
  };

  useEffect(() => {
    setProgress(stepMap[currentStep]);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Header with Progress */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-foreground">Mzansi Courier Onboarding</h1>
            <span className="text-sm text-muted-foreground">Step {stepMap[currentStep] / 14 + 1}/7</span>
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
            onNext={() => setCurrentStep('agreement')}
            onBack={() => setCurrentStep('safety')}
          />
        )}
        {currentStep === 'agreement' && (
          <AgreementStep
            onNext={() => setCurrentStep('complete')}
            onBack={() => setCurrentStep('quiz')}
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

  const allMet = Object.values(requirements).every((v) => v);

  const handleToggle = (key: keyof typeof requirements) => {
    setRequirements((prev) => ({ ...prev, [key]: !prev[key] }));
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
        <Button onClick={onNext} disabled={!allMet} className="flex-1">
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

  const allUploaded = Object.values(uploads).every((v) => v !== null);

  const handleFileChange = (type: keyof typeof uploads, file: File | null) => {
    setUploads((prev) => ({ ...prev, [type]: file }));
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

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} disabled={!allUploaded} className="flex-1">
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
        'Customers request deliveries. You accept jobs through the app. Deliveries are tracked live. You earn per completed delivery. Simple as that!',
    },
    {
      title: 'Accepting Jobs',
      content:
        'When a job matches your location and availability, you get a notification. Review the pickup address, dropoff address, and earnings. Accept or decline within 30 seconds.',
    },
    {
      title: 'Pickups',
      content:
        'Go to the pickup address. Collect the parcel. Take a photo of the package. Mark as "picked up" in the app. Your GPS location is tracked for customer confidence.',
    },
    {
      title: 'Deliveries',
      content:
        'Drive to the dropoff address. Arrive safely. Contact the customer if needed. Hand over the parcel. Mark as "delivered" in the app.',
    },
    {
      title: 'Proof of Delivery',
      content:
        'Take a photo of the delivered parcel or get a signature. This protects both you and the customer. Never fake deliveries - our system detects it.',
    },
    {
      title: 'Ratings & Earnings',
      content:
        'Customers rate you after delivery. Your rating affects job availability. You earn per delivery. Payments are processed weekly to your bank account.',
    },
  ];

  const card = trainingCards[currentCard];

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-2">Training Module</h2>
      <p className="text-muted-foreground mb-8">Learn how the platform works (Swipe to continue)</p>

      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8 mb-6 min-h-64 flex flex-col justify-center">
        <h3 className="text-2xl font-bold text-foreground mb-4">{card.title}</h3>
        <p className="text-lg text-foreground leading-relaxed">{card.content}</p>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {trainingCards.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${i === currentCard ? 'bg-primary w-8' : 'bg-secondary w-2'}`}
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
          Mzansi Couriers uses AI fraud detection systems and live GPS tracking. Every delivery is monitored.
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

  const quiz = [
    {
      id: 1,
      question: 'What should you do if a customer is unavailable at the delivery address?',
      options: [
        'Leave the parcel outside',
        'Call the customer and wait for instructions',
        'Return to pickup point',
        'Open the parcel',
      ],
      correct: 1,
    },
    {
      id: 2,
      question: 'What should you do if a parcel looks suspicious or damaged?',
      options: [
        'Open it to check',
        'Report it to Mzansi Couriers immediately',
        'Deliver it anyway',
        'Ignore it',
      ],
      correct: 1,
    },
    {
      id: 3,
      question: 'How do you complete proof of delivery?',
      options: [
        'Just mark it as delivered',
        'Take a photo or get a signature',
        'Send an SMS',
        'Call the customer',
      ],
      correct: 1,
    },
    {
      id: 4,
      question: 'What happens if you fake a delivery?',
      options: [
        'Nothing, the system won\'t detect it',
        'You get paid anyway',
        'Permanent ban and possible legal action',
        'Just a warning',
      ],
      correct: 2,
    },
  ];

  const handleSubmit = () => {
    let correctCount = 0;
    quiz.forEach((q) => {
      if (parseInt(answers[q.id]) === q.correct) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / quiz.length) * 100);
    setScore(finalScore);
    setSubmitted(true);
  };

  if (submitted) {
    const passed = score >= 70;
    return (
      <Card className="p-6 text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
          <span className="text-3xl">{passed ? '✓' : '✗'}</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {passed ? 'Great Job!' : 'Try Again'}
        </h2>
        <p className="text-lg font-semibold text-foreground mb-6">Your Score: {score}%</p>
        {!passed && (
          <p className="text-muted-foreground mb-6">You need 70% to pass. Review the training and try again.</p>
        )}
        <div className="flex gap-3">
          {!passed && (
            <Button onClick={onBack} variant="outline" className="flex-1">
              Review Training
            </Button>
          )}
          <Button onClick={onNext} disabled={!passed} className="flex-1">
            {passed ? 'Continue' : 'Disabled'}
          </Button>
        </div>
      </Card>
    );
  }

  const allAnswered = Object.keys(answers).length === quiz.length;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-2">Courier Knowledge Quiz</h2>
      <p className="text-muted-foreground mb-6">Answer all questions correctly. You need 70% to pass.</p>

      <div className="space-y-6 mb-8">
        {quiz.map((q, idx) => (
          <div key={q.id} className="border rounded-lg p-4">
            <p className="font-semibold text-foreground mb-3">
              {idx + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((option, optIdx) => (
                <label key={optIdx} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    value={optIdx}
                    checked={parseInt(answers[q.id] || '-1') === optIdx}
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
        <Button onClick={handleSubmit} disabled={!allAnswered} className="flex-1">
          Submit Quiz
        </Button>
      </div>
    </Card>
  );
}

// ============ STEP 7: AGREEMENTS ============
function AgreementStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [agreements, setAgreements] = useState({
    termsAndConditions: false,
    courierRules: false,
    safetyPolicies: false,
    independentContractor: false,
  });

  const allAgreed = Object.values(agreements).every((v) => v);

  const handleToggle = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Agreements & Activation</h2>

      <div className="space-y-4 mb-8">
        <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={agreements.termsAndConditions}
            onChange={() => handleToggle('termsAndConditions')}
            className="w-5 h-5 mt-1"
          />
          <div>
            <span className="text-foreground font-medium block">Terms and Conditions</span>
            <span className="text-sm text-muted-foreground">I agree to Mzansi Couriers' terms of service</span>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={agreements.courierRules}
            onChange={() => handleToggle('courierRules')}
            className="w-5 h-5 mt-1"
          />
          <div>
            <span className="text-foreground font-medium block">Courier Rules</span>
            <span className="text-sm text-muted-foreground">I will follow all courier conduct rules</span>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={agreements.safetyPolicies}
            onChange={() => handleToggle('safetyPolicies')}
            className="w-5 h-5 mt-1"
          />
          <div>
            <span className="text-foreground font-medium block">Safety Policies</span>
            <span className="text-sm text-muted-foreground">I will prioritise safety for myself and customers</span>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50">
          <input
            type="checkbox"
            checked={agreements.independentContractor}
            onChange={() => handleToggle('independentContractor')}
            className="w-5 h-5 mt-1"
          />
          <div>
            <span className="text-foreground font-medium block">Independent Contractor Agreement</span>
            <span className="text-sm text-muted-foreground">I am an independent contractor, not an employee</span>
          </div>
        </label>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} disabled={!allAgreed} className="flex-1">
          Activate Courier Account
        </Button>
      </div>
    </Card>
  );
}

// ============ STEP 8: COMPLETE ============
function CompleteStep() {
  const [, setLocation] = useLocation();

  return (
    <Card className="p-8 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
        <span className="text-5xl">🎉</span>
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-2">Congratulations!</h2>
      <p className="text-xl text-primary font-semibold mb-4">You are now a Mzansi Courier</p>
      <p className="text-muted-foreground mb-8">
        Your account is active and ready to start accepting deliveries. Go to your dashboard to go online and start earning.
      </p>
      <Button onClick={() => setLocation('/courier-dashboard')} size="lg" className="w-full">
        Go to Dashboard
      </Button>
    </Card>
  );
}

// ============ HELPER COMPONENTS ============
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
  return (
    <label className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${uploaded ? 'border-green-500 bg-green-50' : 'border-muted-foreground hover:border-primary'}`}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="hidden"
      />
      <div className="flex justify-center mb-2">
        {uploaded ? (
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        ) : (
          <FileUp className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-semibold text-foreground">{label}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {uploaded && <p className="text-sm text-green-600 font-semibold mt-1">✓ Uploaded</p>}
    </label>
  );
}
