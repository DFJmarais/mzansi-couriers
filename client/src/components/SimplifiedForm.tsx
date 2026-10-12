import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Info } from "lucide-react";
import { useState } from "react";

interface FormPage {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  helpText?: string;
}

interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface SimplifiedFormProps {
  pages: FormPage[];
  onSubmit?: (data: Record<string, any>) => void;
}

export function SimplifiedForm({ pages, onSubmit }: SimplifiedFormProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const page = pages[currentPage];
  const progress = ((currentPage + 1) / pages.length) * 100;
  const isLastPage = currentPage === pages.length - 1;

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleNext = () => {
    if (!isLastPage) {
      setCurrentPage(currentPage + 1);
    } else {
      onSubmit?.(formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{page.title}</h2>
          <span className="text-sm text-muted-foreground">
            {currentPage + 1} of {pages.length}
          </span>
        </div>
        {page.description && (
          <p className="text-muted-foreground">{page.description}</p>
        )}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="pt-8 space-y-6">
          {/* Help Text */}
          {page.helpText && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{page.helpText}</p>
            </div>
          )}

          {/* Fields - ONE PER SCREEN */}
          {page.fields.map((field) => (
            <div key={field.id} className="space-y-3">
              <label className="block">
                <span className="font-semibold text-lg">
                  {field.label}
                  {field.required && <span className="text-red-600 ml-1">*</span>}
                </span>
              </label>

              {field.type === "checkbox" ? (
                <div className="flex items-center gap-3 p-4 border-2 border-input rounded-lg hover:border-accent cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    id={field.id}
                    checked={formData[field.id] || false}
                    onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <label htmlFor={field.id} className="cursor-pointer flex-1">
                    {field.placeholder}
                  </label>
                </div>
              ) : field.type === "select" ? (
                <select
                  value={formData[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-input rounded-lg focus:outline-none focus:border-accent text-lg"
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
                  className="w-full px-4 py-3 border-2 border-input rounded-lg focus:outline-none focus:border-accent text-lg"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Page Indicator */}
      <div className="flex gap-2 justify-center">
        {pages.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentPage
                ? "bg-accent w-8"
                : index < currentPage
                ? "bg-green-600 w-2"
                : "bg-muted w-2"
            }`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button size="lg" className="flex-1" onClick={handleNext}>
          {isLastPage ? "Complete" : "Next"}
          {!isLastPage && <ChevronRight className="w-5 h-5 ml-2" />}
        </Button>
      </div>

      {/* Skip Option */}
      {!isLastPage && (
        <div className="text-center">
          <button className="text-sm text-accent hover:underline">
            Save and continue later
          </button>
        </div>
      )}
    </div>
  );
}
