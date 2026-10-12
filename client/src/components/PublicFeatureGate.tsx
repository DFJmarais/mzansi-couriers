import { ArrowLeft, EyeOff, Home } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicFeatureKey } from "@/../../shared/feature-visibility";

export default function PublicFeatureGate({
  featureKey,
  title,
  description,
  children,
}: {
  featureKey: PublicFeatureKey;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [, navigate] = useLocation();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: visibility, isLoading: visibilityLoading } = trpc.featureVisibility.public.useQuery();

  if (userLoading || visibilityLoading) {
    return <main className="grid min-h-screen place-items-center bg-mzansi-sand px-4 text-foreground"><p className="text-sm text-muted-foreground">Loading this workspace…</p></main>;
  }

  if (user?.role !== "admin" && visibility?.[featureKey] !== true) {
    return <main className="min-h-screen bg-mzansi-sand px-4 py-10 text-foreground sm:px-6"><div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center"><Card className="w-full border-emerald-950/10 shadow-sm"><CardHeader><div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700"><EyeOff className="h-6 w-6" aria-hidden="true" /></div><CardTitle>{title}</CardTitle><p className="text-sm text-muted-foreground">{description}</p></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={() => navigate("/")}><Home className="mr-2 h-4 w-4" />Back to home</Button><Button type="button" variant="outline" onClick={() => navigate("/become-driver")}><ArrowLeft className="mr-2 h-4 w-4" />Courier onboarding</Button></CardContent></Card></div></main>;
  }

  return <>{children}</>;
}
