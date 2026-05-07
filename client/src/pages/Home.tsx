import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MapPin, Zap, TrendingUp, Shield, Clock, Users } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (isAuthenticated && user) {
    if (user.role === 'customer') {
      navigate('/customer/dashboard');
    } else if (user.role === 'courier') {
      navigate('/courier/dashboard');
    } else if (user.role === 'admin') {
      navigate('/admin/dashboard');
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">MC</span>
            </div>
            <span className="font-bold text-lg">Mzansi Couriers</span>
          </div>
          <div className="flex items-center gap-3">
            <a href={getLoginUrl('/customer/dashboard')} className="text-sm font-medium hover:text-accent transition-colors">
              Sign In
            </a>
            <Button size="sm" onClick={() => { window.location.href = getLoginUrl('/customer/dashboard'); }}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section-padding relative overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5">
                  <Zap className="w-3 h-3 text-accent" />
                  <span className="text-sm font-medium">South Africa's Fastest Delivery Network</span>
                </div>
                <h1 className="text-balance text-5xl md:text-6xl font-bold leading-tight">
                  Delivery Made Simple, Fast & Affordable
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Connect with verified couriers in real-time. Send packages anywhere, anytime. Track every step of your delivery journey.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => { window.location.href = getLoginUrl('/customer/dashboard'); }}>
                  Send a Package
                </Button>
                <Button size="lg" variant="outline" onClick={() => { window.location.href = getLoginUrl('/courier/dashboard'); }}>
                  Become a Courier
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <p className="text-2xl font-bold">50K+</p>
                  <p className="text-sm text-muted-foreground">Active Couriers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">1M+</p>
                  <p className="text-sm text-muted-foreground">Deliveries</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">4.8★</p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </div>

            <div className="relative h-96 lg:h-full min-h-96 bg-gradient-to-br from-accent/20 to-orange-500/20 rounded-2xl border border-accent/30 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
              <div className="relative text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-accent" />
                </div>
                <p className="text-lg font-semibold">Real-time Tracking</p>
                <p className="text-sm text-muted-foreground max-w-xs">Know exactly where your package is at every moment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-16 md:py-24 bg-card border-t border-border">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold">Why Choose Mzansi Couriers?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for South Africa. Designed for speed, reliability, and affordability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Get your package picked up within minutes. Same-day delivery available in major cities."
              },
              {
                icon: TrendingUp,
                title: "Best Prices",
                description: "Dynamic pricing ensures you always get fair rates. No hidden fees, complete transparency."
              },
              {
                icon: Shield,
                title: "Fully Verified",
                description: "All couriers are ID-verified and vehicle-verified. Your packages are in safe hands."
              },
              {
                icon: Clock,
                title: "Real-time Tracking",
                description: "Live GPS tracking, ETA updates, and instant notifications keep you informed."
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Support local couriers and small businesses. Earn extra income as a courier."
              },
              {
                icon: MapPin,
                title: "Nationwide Coverage",
                description: "From urban centers to townships and rural areas. We deliver everywhere."
              }
            ].map((item, i) => (
              <Card key={i} className="border-border hover:shadow-md transition-shadow">
                <CardHeader>
                  <item.icon className="w-8 h-8 text-accent mb-2" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section className="section-padding">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pay only for what you use. No subscriptions, no hidden charges.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                size: "Small",
                weight: "Up to 2kg",
                basePrice: "R45",
                perKm: "R5.50/km",
                description: "Perfect for documents, small gifts, and light items"
              },
              {
                size: "Medium",
                weight: "2-10kg",
                basePrice: "R75",
                perKm: "R8.50/km",
                description: "Ideal for groceries, electronics, and medium packages",
                featured: true
              },
              {
                size: "Large",
                weight: "10-50kg",
                basePrice: "R120",
                perKm: "R12.00/km",
                description: "For bulk orders, furniture, and heavy items"
              }
            ].map((tier, i) => (
              <Card key={i} className={`relative border-2 ${tier.featured ? 'border-accent shadow-lg' : 'border-border'}`}>
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{tier.size}</CardTitle>
                  <CardDescription>{tier.weight}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Base Price</p>
                    <p className="text-2xl font-bold">{tier.basePrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Distance Rate</p>
                    <p className="text-lg font-semibold">{tier.perKm}</p>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2 border-t border-border">{tier.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 p-6 bg-card border border-border rounded-xl text-center">
            <p className="text-muted-foreground mb-2">Peak hour surcharge (7-9am, 12-2pm, 4-6pm)</p>
            <p className="text-2xl font-bold">+25%</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-accent/10 to-orange-500/10 border-t border-border">
        <div className="container text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of customers and couriers already using Mzansi Couriers. Your first delivery is just a few clicks away.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => { window.location.href = getLoginUrl('/customer/dashboard'); }}>
              Send Your First Package
            </Button>
            <Button size="lg" variant="outline" onClick={() => { window.location.href = getLoginUrl('/courier/dashboard'); }}>
              Start Earning as a Courier
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">MC</span>
                </div>
                <span className="font-bold">Mzansi Couriers</span>
              </div>
              <p className="text-sm text-muted-foreground">Delivering excellence across South Africa.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">For Customers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Send a Package</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Track Delivery</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">For Couriers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Join Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Earnings</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Mzansi Couriers. All rights reserved. Made in South Africa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
