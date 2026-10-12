import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";

interface FormSection {
  id: string;
  title: string;
  description?: string;
  helpText?: string;
  fields: FormField[];
}

interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
}

interface ProgressFormProps {
  sections: FormSection[];
  onSubmit?: (data: Record<string, any>) => void;
}

export function ProgressForm({ sections, onSubmit }: ProgressFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const section = sections[currentSection];
  const progress = ((currentSection + 1) / sections.length) * 100;
  const isLastSection = currentSection === sections.length - 1;

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleNext = () => {
    if (!isLastSection) {
      setCurrentSection(currentSection + 1);
    } else {
      onSubmit?.(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{section.title}</h2>
          <span className="text-sm text-muted-foreground">
            Section {currentSection + 1} of {sections.length}
          </span>
        </div>
        {section.description && (
          <p className="text-muted-foreground">{section.description}</p>
        )}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form Fields */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {section.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold">
                  {field.label}
                  {field.required && <span className="text-red-600 ml-1">*</span>}
                </label>
                {field.helpText && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowHelp(showHelp === field.id ? null : field.id)
                    }
                    className="text-accent hover:text-accent/80"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showHelp === field.id && field.helpText && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
                  {field.helpText}
                </div>
              )}

              {field.type === "textarea" ? (
                <textarea
                  placeholder={field.placeholder}
                  value={formData[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  rows={4}
                />
              ) : field.type === "select" ? (
                <select
                  value={formData[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select an option</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section Overview */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="space-y-2">
            {sections.map((s, index) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  index === currentSection
                    ? "bg-accent/10 border border-accent/20"
                    : index < currentSection
                    ? "bg-green-50"
                    : "bg-muted/30"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                    index < currentSection
                      ? "bg-green-600 text-white"
                      : index === currentSection
                      ? "bg-accent text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentSection ? "✓" : index + 1}
                </div>
                <span className="text-sm font-semibold">{s.title}</span>
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
          disabled={currentSection === 0}
          onClick={() => setCurrentSection(currentSection - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button className="flex-1" onClick={handleNext}>
          {isLastSection ? "Submit" : "Next"}
          {!isLastSection && <ChevronRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
