import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
}

interface CourierPreRegistrationChecklistProps {
  onReady?: () => void;
}

export function CourierPreRegistrationChecklist({ onReady }: CourierPreRegistrationChecklistProps) {
  const items: ChecklistItem[] = [
    {
      id: "id",
      title: "Valid ID Document",
      description: "Driver's License or Passport (clear photo of front and back)",
      required: true,
      completed: false,
    },
    {
      id: "vehicle_reg",
      title: "Vehicle Registration",
      description: "Current vehicle registration document (full page, all details visible)",
      required: true,
      completed: false,
    },
    {
      id: "insurance",
      title: "Vehicle Insurance",
      description: "Current insurance policy document (proof of active coverage)",
      required: true,
      completed: false,
    },
    {
      id: "bank",
      title: "Bank Account Details",
      description: "Bank name, account number, and account holder name",
      required: true,
      completed: false,
    },
    {
      id: "vehicle_photo",
      title: "Vehicle Photo",
      description: "Clear photo of your vehicle from the side",
      required: true,
      completed: false,
    },
    {
      id: "phone",
      title: "Active Phone Number",
      description: "For receiving delivery requests and customer contact",
      required: true,
      completed: false,
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const requiredCount = items.filter((item) => item.required).length;
  const isReady = completedCount === requiredCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Before You Register</h2>
        <p className="text-muted-foreground">
          Gather these documents to speed up your verification process
        </p>
      </div>

      {/* Progress */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Documents Ready</span>
              <span className="text-2xl font-bold text-blue-600">
                {completedCount}/{requiredCount}
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / requiredCount) * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {isReady
                ? "✓ All documents ready! You can proceed to registration."
                : `Prepare ${requiredCount - completedCount} more document(s) to continue`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className={item.completed ? "border-green-200 bg-green-50/30" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  {item.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.required && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-900">Why We Need These Documents</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>✓ <strong>ID:</strong> Verify your identity and age</li>
                <li>✓ <strong>Vehicle Registration:</strong> Confirm vehicle ownership</li>
                <li>✓ <strong>Insurance:</strong> Ensure customer protection</li>
                <li>✓ <strong>Bank Details:</strong> Process your payments safely</li>
                <li>✓ <strong>Vehicle Photo:</strong> Help customers identify you</li>
                <li>✓ <strong>Phone:</strong> Receive delivery requests</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-lg">What Happens Next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white font-semibold">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Submit Documents</h4>
                <p className="text-sm text-muted-foreground">
                  Upload your documents during registration
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white font-semibold">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Verification (24-48 hours)</h4>
                <p className="text-sm text-muted-foreground">
                  We'll review your documents and verify your information
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white font-semibold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Approval & First Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  After admin approval, start accepting eligible deliveries
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          disabled={!isReady}
          onClick={onReady}
        >
          {isReady ? "I'm Ready to Register" : "Prepare Documents First"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={() => {
            window.location.href = "/courier/onboarding";
          }}
        >
          Learn More
        </Button>
      </div>
    </div>
  );
}
