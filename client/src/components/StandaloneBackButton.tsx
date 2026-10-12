import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function StandaloneBackButton({
  label = "Back to home",
  to = "/",
}: {
  label?: string;
  to?: string;
}) {
  const [, setLocation] = useLocation();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => setLocation(to)}
      aria-label={label}
      className="gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
