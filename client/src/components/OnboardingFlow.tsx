import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle2, Lightbulb } from "lucide-react";
import { useState } from "react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  onComplete?: () => void;
}

export function OnboardingFlow({ steps, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Welcome!</h2>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">{step.icon}</div>
            <div>
              <CardTitle>{step.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>{step.content}</CardContent>
      </Card>

      {/* Steps Overview */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="space-y-2">
            {steps.map((s, index) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  index === currentStep
                    ? "bg-accent/10 border border-accent/20"
                    : index < currentStep
                    ? "bg-green-50"
                    : "bg-muted/30"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                    index === currentStep
                      ? "bg-accent text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>
                )}
                <span className={`text-sm ${index <= currentStep ? "font-semibold" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep(currentStep - 1)}
        >
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            if (currentStep === steps.length - 1) {
              onComplete?.();
            } else {
              setCurrentStep(currentStep + 1);
            }
          }}
        >
          {currentStep === steps.length - 1 ? "Complete" : "Next"}
          {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>

      {/* Tip */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900">
                <strong>Tip:</strong> You can skip this tour and access it later from your settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
