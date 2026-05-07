import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Truck, Package, BarChart3, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Onboarding() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hasRole, setHasRole] = useState(false);
  const selectRoleMutation = trpc.auth.selectRole.useMutation();

  // Check if user has a role and redirect
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }

    if (user?.role && ['customer', 'courier', 'admin'].includes(user.role)) {
      setHasRole(true);
      if (user.role === 'customer') setLocation("/customer/dashboard");
      if (user.role === 'courier') setLocation("/courier/dashboard");
      if (user.role === 'admin') setLocation("/admin/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  const handleRoleSelection = async (role: string) => {
    if (role === 'admin') {
      toast.error("Admin access is restricted. Please contact support.");
      return;
    }

    setSelectedRole(role);
    try {
      await selectRoleMutation.mutateAsync({ role: role as 'customer' | 'courier' });
      toast.success(`Welcome! Setting up your ${role} account...`);
    } catch (error) {
      toast.error("Failed to set role. Please try again.");
      setSelectedRole(null);
    }
  };

  // Redirect after successful role selection
  useEffect(() => {
    if (selectRoleMutation.isSuccess && selectedRole) {
      const timer = setTimeout(() => {
        if (selectedRole === 'customer') setLocation("/customer/dashboard");
        if (selectedRole === 'courier') setLocation("/courier/dashboard");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectRoleMutation.isSuccess, selectedRole, setLocation]);

  if (!isAuthenticated || hasRole) {
    return null;
  }

  const isLoading = selectRoleMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">MC</div>
            <span className="font-bold text-lg">Mzansi Couriers</span>
          </div>
          <div className="text-sm text-muted-foreground">Welcome, {user?.name}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-20 md:py-32">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Heading */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Choose Your Role</h1>
            <p className="text-lg text-muted-foreground">Select how you'd like to use Mzansi Couriers</p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              {
                id: 'customer',
                icon: Package,
                title: 'Send Packages',
                description: 'Send packages quickly and affordably to anyone in South Africa',
                features: [
                  'Instant price quotes',
                  'Real-time tracking',
                  'Verified couriers',
                  '24/7 support'
                ]
              },
              {
                id: 'courier',
                icon: Truck,
                title: 'Become a Courier',
                description: 'Earn money by delivering packages in your area',
                features: [
                  'Flexible work hours',
                  'Competitive rates',
                  'Instant payouts',
                  'Build your business'
                ]
              }
            ].map((role) => (
              <Card 
                key={role.id}
                className={`border transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                  selectedRole === role.id 
                    ? 'border-accent shadow-lg ring-2 ring-accent/20' 
                    : 'border-border/50 hover:border-accent/50'
                }`}
              >
                <CardContent className="pt-8 space-y-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <role.icon className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{role.title}</h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {role.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full gap-2" 
                    variant={selectedRole === role.id ? "default" : "outline"}
                    disabled={isLoading && selectedRole !== role.id}
                    onClick={() => handleRoleSelection(role.id)}
                  >
                    {isLoading && selectedRole === role.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Select
                        {selectedRole === role.id && <ArrowRight className="w-4 h-4" />}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-6 text-center space-y-2">
            <p className="text-sm font-semibold">You can change your role anytime in settings</p>
            <p className="text-xs text-muted-foreground">Your account will be configured based on your selection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
