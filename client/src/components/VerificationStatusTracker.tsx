import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Loader } from "lucide-react";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  timestamp?: string;
}

interface VerificationStatusTrackerProps {
  steps: VerificationStep[];
  overallStatus: "pending" | "in_progress" | "completed" | "failed";
  estimatedTime?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    label: "Pending",
  },
  in_progress: {
    icon: Loader,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "In Progress",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Completed",
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Failed",
  },
};

export function VerificationStatusTracker({
  steps,
  overallStatus,
  estimatedTime,
}: VerificationStatusTrackerProps) {
  const config = statusConfig[overallStatus];
  const Icon = config.icon;
  const completedCount = steps.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={`border-2 ${config.bg}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 ${config.color}`}>
              <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Verification Status</h3>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {steps.length} steps completed
              </p>
            </div>
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>

          {/* Timeline */}
          {estimatedTime && (
            <p className="text-sm text-muted-foreground mt-3">
              Estimated completion: <strong>{estimatedTime}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Steps Timeline */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepConfig = statusConfig[step.status];
          const StepIcon = stepConfig.icon;

          return (
            <Card key={step.id} className={stepConfig.bg}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Timeline Connector */}
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${stepConfig.color} border-current`}>
                      <StepIcon className="w-5 h-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-0.5 h-12 bg-muted mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <Badge variant="outline" className={stepConfig.color}>
                        {stepConfig.label}
                      </Badge>
                    </div>

                    {step.timestamp && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {step.status === "completed" ? "Completed: " : "Started: "}
                        {step.timestamp}
                      </p>
                    )}

                    {step.status === "failed" && (
                      <div className="mt-3 p-2 bg-red-100 rounded border border-red-200">
                        <p className="text-xs text-red-800">
                          This step needs another look. Please contact our support team or try again.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 text-sm">What's Happening</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ We're reviewing your documents</li>
                <li>✓ Verifying your vehicle and insurance</li>
                <li>✓ Checking your background</li>
                <li>✓ You'll get an email when approved</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-3">
            Have questions about your verification status?
          </p>
          <div className="flex gap-2">
            <a href="mailto:mzansicouriers@yahoo.com" className="text-sm text-accent hover:underline font-semibold">
              Contact Support
            </a>
            <span className="text-muted-foreground">•</span>
            <button className="text-sm text-accent hover:underline font-semibold">
              FAQ
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
