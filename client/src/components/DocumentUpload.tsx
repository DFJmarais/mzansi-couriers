import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Upload, Camera, X } from "lucide-react";
import { useState } from "react";

interface DocumentUploadProps {
  documentType: "id" | "vehicle_reg" | "insurance" | "vehicle_photo";
  onUpload?: (file: File) => void;
  onNext?: () => void;
}

const documentGuides = {
  id: {
    title: "Upload ID Document",
    requirements: [
      "Clear photo of front and back",
      "All text must be readable",
      "Good lighting, no glare",
      "Entire document visible",
      "File size: max 10MB",
    ],
    tips: "Take photos in natural light. Make sure all corners are visible.",
  },
  vehicle_reg: {
    title: "Upload Vehicle Registration",
    requirements: [
      "Full page, all details visible",
      "Current registration (not expired)",
      "Clear, high-quality photo",
      "All text readable",
      "File size: max 10MB",
    ],
    tips: "Lay the document flat and photograph from directly above.",
  },
  insurance: {
    title: "Upload Insurance Document",
    requirements: [
      "Current policy (valid date)",
      "Full page visible",
      "Policy number clearly visible",
      "Coverage details readable",
      "File size: max 10MB",
    ],
    tips: "Make sure the expiry date is clearly visible and current.",
  },
  vehicle_photo: {
    title: "Upload Vehicle Photo",
    requirements: [
      "Clear side view of vehicle",
      "Entire vehicle visible",
      "Good lighting",
      "License plate visible",
      "File size: max 10MB",
    ],
    tips: "Take a photo from the side showing the full vehicle and license plate.",
  },
};

export function DocumentUpload({ documentType, onUpload, onNext }: DocumentUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const guide = documentGuides[documentType];

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onUpload?.(file);
  };

  return (
    <div className="space-y-6">
      {/* Guidelines */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg">{guide.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Requirements:</h4>
            <ul className="space-y-2">
              {guide.requirements.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> {guide.tips}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      {!uploadedFile ? (
        <Card className="border-2 border-dashed border-muted-foreground/30 hover:border-accent/50 transition-colors">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10">
                  <Camera className="w-6 h-6 text-accent" />
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Upload or Take Photo</h3>
                <p className="text-sm text-muted-foreground">
                  Click below to upload a file or take a photo with your camera
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById(`file-input-${documentType}`)?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById(`file-input-${documentType}`)?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>

              <input
                id={`file-input-${documentType}`}
                type="file"
                accept="image/*,.pdf"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, PDF (max 10MB)
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <Card className="border-green-200 bg-green-50/30">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {preview && (
                  <div className="relative w-full max-h-64 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={preview}
                      alt="Document preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-sm">{uploadedFile?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile?.size || 0) / 1024 / 1024 < 1
                          ? `${((uploadedFile?.size || 0) / 1024).toFixed(2)} KB`
                          : `${((uploadedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setUploadedFile(null);
                      setPreview(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800">
                    {onNext ? 'Document uploaded successfully. Click "Next" to continue.' : 'Document selected successfully. Your parent verification flow will handle the next step.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setUploadedFile(null);
                setPreview(null);
              }}
            >
              Change Document
            </Button>
            <Button className="flex-1" onClick={onNext} disabled={!onNext}>
              {onNext ? 'Next' : 'Next unavailable'}
            </Button>
          </div>
        </div>
      )}

      {/* Quality Check Info */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-900 text-sm">Quality Check</h4>
              <p className="text-sm text-amber-800">
                We'll automatically check if your document is clear and readable. If it's not, we'll ask you to re-upload.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
