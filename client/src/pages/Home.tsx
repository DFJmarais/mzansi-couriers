import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Zap, MapPin, TrendingUp, Users, Award, Clock, ArrowRight, CheckCircle2, Truck, Shield } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleSignIn = () => {
    window.location.href = getLoginUrl();
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/onboarding");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const handleBecomeCourier = () => {
    if (isAuthenticated) {
      setLocation("/courier/onboarding");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-white font-bold text-lg">
              MC
            </div>
            <div>
              <div className="font-bold text-lg">Mzansi Couriers</div>
              <div className="text-xs text-accent">🇿🇦 South Africa's Delivery Network</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Sawubona, {user?.name}</span>
                <Button variant="outline" onClick={() => setLocation("/onboarding")}>
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={handleSignIn}>
                  Sign In
                </Button>
                <Button onClick={handleGetStarted} className="gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32 space-y-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-accent">The easiest way to earn with your vehicle</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                The Easiest Way for Ordinary South Africans
                <br />
                <span className="text-accent">to Earn Money with Their Vehicles</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Join thousands of couriers earning extra income. Send packages across South Africa with verified, friendly couriers. Real-time tracking, transparent pricing, instant payouts.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" onClick={handleGetStarted} className="gap-2">
                Send a Package
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleBecomeCourier}>
                Become a Courier
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8">
              {[
                { label: "Delivery Zones", value: "4" },
                { label: "Verified Couriers", value: "Active" },
                { label: "Support", value: "24/7" },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl blur-3xl"></div>
            <Card className="relative border-accent/30 bg-gradient-to-br from-accent/10 to-background">
              <CardContent className="pt-12 pb-8 px-8">
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <Truck className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold">Real-time Tracking</h3>
                      <p className="text-sm text-muted-foreground">Know exactly where your package is at all times</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 text-accent flex-shrink-0 mt-1 font-bold text-lg">R</div>
                    <div>
                      <h3 className="font-semibold">Transparent Pricing</h3>
                      <p className="text-sm text-muted-foreground">Instant quotes based on distance and package size</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Shield className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold">Courier Network</h3>
                      <p className="text-sm text-muted-foreground">Connect with couriers across South Africa</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps to send your package</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: MapPin,
              title: "Enter Locations",
              description: "Provide pickup and dropoff addresses"
            },
            {
              icon: MapPin,
              title: "Get Quote",
              description: "Instant pricing in Rand (R) based on distance and package details"
            },
            {
              icon: Truck,
              title: "Track Delivery",
              description: "Real-time updates until your package arrives"
            }
          ].map((feature, i) => (
            <Card key={i} className="border-border/50 hover:border-accent/50 transition-all">
              <CardContent className="pt-8 pb-6">
                <feature.icon className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold">Delivery Zones & Pricing</h2>
          <p className="text-muted-foreground">We deliver in your town, your settlement, and across South Africa. Local deliveries (5-150km radius) or national coverage.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { zone: "Johannesburg", rate: "R10/km", region: "Gauteng" },
            { zone: "Cape Town", rate: "R10/km", region: "Western Cape" },
            { zone: "Durban", rate: "R10/km", region: "KwaZulu-Natal" },
            { zone: "Pretoria", rate: "R10/km", region: "Gauteng" }
          ].map((pricing, i) => (
            <Card key={i} className="border-border/50 hover:border-accent/50 transition-all">
              <CardContent className="pt-6">
                <h3 className="font-semibold">{pricing.zone}</h3>
                <p className="text-sm text-muted-foreground mt-1">{pricing.region}</p>
                <p className="text-lg font-bold text-accent mt-4">{pricing.rate}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold">What Users Say</h2>
          <p className="text-muted-foreground">Real feedback from customers and couriers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Thabo Mthembu",
              role: "Customer",
              quote: "Straightforward service. My packages arrive on time and I can track them the whole way."
            },
            {
              name: "Naledi Khumalo",
              role: "Courier",
              quote: "Good earning opportunity with flexible hours. The app is easy to use and payments are reliable."
            },
            {
              name: "Sipho Ndlela",
              role: "Business Owner",
              quote: "We use Mzansi Couriers for all our deliveries. Consistent service and professional couriers."
            }
          ].map((testimonial, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 space-y-8">
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border border-accent/20 p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Send packages locally in your town or across South Africa. Coverage from your settlement to any destination. Transparent pricing in Rand and real-time tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={handleGetStarted} className="gap-2">
              Send Your First Package
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleGetStarted}>
              Become a Courier
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-background/50">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 Mzansi Couriers. Connecting South Africa.</p>
        </div>
      </footer>
    </div>
  );
}
