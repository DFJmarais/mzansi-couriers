import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Play, Lightbulb, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  tips: string[];
  icon: React.ReactNode;
}

interface CourierTutorialProps {
  steps: TutorialStep[];
  onComplete?: () => void;
}

export function CourierTutorial({ steps, onComplete }: CourierTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleComplete = () => {
    const newCompleted = new Set(completed);
    newCompleted.add(step.id);
    setCompleted(newCompleted);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold">Welcome to Mzansi Couriers!</h2>
        <p className="text-lg text-muted-foreground">
          Learn how to get started and start earning
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            Tutorial {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="bg-accent h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <Card className="border-2 border-accent/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 text-accent">{step.icon}</div>
            <div>
              <CardTitle className="text-2xl">{step.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{step.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video */}
          {step.videoUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Play className="w-16 h-16 text-accent mx-auto" />
                  <p className="text-muted-foreground">Video Tutorial</p>
                  <Button
                    onClick={() => {
                      if (step.videoUrl) {
                        window.open(step.videoUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    Watch Video
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-accent" />
              Key Tips
            </h4>
            <ul className="space-y-2">
              {step.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 p-3 bg-accent/5 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Steps Overview */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="space-y-2">
            {steps.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(index)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  index === currentStep
                    ? "bg-accent/10 border border-accent/20"
                    : completed.has(s.id)
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                {completed.has(s.id) ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                      index === currentStep
                        ? "bg-accent text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                )}
                <span className="font-semibold">{s.title}</span>
              </button>
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
        <Button className="flex-1" onClick={handleComplete}>
          {currentStep === steps.length - 1 ? "Start Earning" : "Next"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <button className="text-sm text-accent hover:underline">
          Skip tutorial
        </button>
      </div>
    </div>
  );
}
