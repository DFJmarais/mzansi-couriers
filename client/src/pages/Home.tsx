import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { MapPin, Zap, TrendingUp, Users, Award, ArrowRight, CheckCircle2, Smartphone, Shield } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">MC</div>
            <span className="font-bold text-lg">Mzansi Couriers</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
                <Button variant="outline" size="sm">Dashboard</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = getLoginUrl()}>Sign In</Button>
                <Button size="sm" onClick={() => window.location.href = getLoginUrl()}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32 space-y-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-accent">South Africa's Fastest Delivery Network</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Delivery Made <span className="text-accent">Simple, Fast</span> & <span className="text-accent">Affordable</span>
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Connect with verified couriers in real-time. Send packages anywhere, anytime. Track every step of your delivery journey with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="gap-2" onClick={() => window.location.href = getLoginUrl()}>
                Send a Package
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.location.href = getLoginUrl()}>
                Become a Courier
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-border">
              <div>
                <p className="text-2xl font-bold">50K+</p>
                <p className="text-sm text-muted-foreground">Active Couriers</p>
              </div>
              <div>
                <p className="text-2xl font-bold">1M+</p>
                <p className="text-sm text-muted-foreground">Deliveries Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">4.8★</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </div>

          <div className="relative h-96 md:h-full min-h-96 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 right-10 w-32 h-32 bg-accent rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-accent/50 rounded-full blur-3xl"></div>
            </div>
            <div className="relative text-center space-y-4">
              <MapPin className="w-16 h-16 mx-auto text-accent" />
              <p className="text-sm font-semibold text-muted-foreground">Real-time Tracking</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 md:py-32 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold">Why Choose Mzansi Couriers?</h2>
          <p className="text-lg text-muted-foreground">Experience the future of logistics with our innovative platform</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Get your packages delivered within hours, not days. Real-time courier matching and routing optimization."
            },
            {
              icon: Shield,
              title: "Fully Verified",
              description: "All couriers are background-checked and verified. Your packages are in safe, trusted hands."
            },
            {
              icon: TrendingUp,
              title: "Transparent Pricing",
              description: "No hidden fees. Instant price quotes based on distance, size, and weight. Pay exactly what you see."
            },
            {
              icon: Smartphone,
              title: "Live Tracking",
              description: "Track your delivery in real-time on our interactive map. Know exactly where your package is."
            },
            {
              icon: Users,
              title: "Earn Extra",
              description: "For couriers: Flexible work, competitive rates, and instant payouts. Build your own delivery business."
            },
            {
              icon: Award,
              title: "Award-Winning",
              description: "Trusted by thousands of customers across South Africa. Rated 4.8★ for reliability and service."
            }
          ].map((feature, i) => (
            <Card key={i} className="border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardContent className="pt-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20 md:py-32 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground">Three simple steps to get your delivery started</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Enter Details",
              description: "Provide pickup and dropoff locations, package details, and size."
            },
            {
              step: "2",
              title: "Get Quote",
              description: "Instant AI-powered price estimate based on distance and demand."
            },
            {
              step: "3",
              title: "Track Live",
              description: "Courier accepts and you track delivery in real-time on the map."
            }
          ].map((item, i) => (
            <div key={i} className="relative space-y-4">
              <div className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xl">
                {item.step}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-7 -right-4 w-8 h-8 text-accent">
                  <ArrowRight className="w-full h-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-20 md:py-32 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground">No hidden fees. Pay only for what you use.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              size: "Small",
              description: "Documents, small items",
              basePrice: "R45",
              perKm: "R3.50/km",
              features: ["Up to 1kg", "Standard delivery", "Real-time tracking", "SMS updates"]
            },
            {
              size: "Medium",
              description: "Packages, boxes",
              basePrice: "R75",
              perKm: "R4.50/km",
              features: ["Up to 10kg", "Priority delivery", "Real-time tracking", "SMS + Email updates"],
              popular: true
            },
            {
              size: "Large",
              description: "Bulk items, furniture",
              basePrice: "R150",
              perKm: "R6.00/km",
              features: ["Up to 50kg", "Express delivery", "Real-time tracking", "Dedicated support"]
            }
          ].map((plan, i) => (
            <Card key={i} className={`border transition-all duration-300 ${
              plan.popular 
                ? 'border-accent shadow-lg ring-2 ring-accent/20' 
                : 'border-border/50 hover:border-accent/50'
            }`}>
              <CardContent className="pt-8 space-y-6">
                {plan.popular && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 w-fit">
                    <Award className="w-3 h-3 text-accent" />
                    <span className="text-xs font-semibold text-accent">Most Popular</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-xl mb-1">{plan.size}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{plan.basePrice}</p>
                  <p className="text-sm text-muted-foreground">+ {plan.perKm}</p>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 md:py-32">
        <div className="bg-gradient-to-r from-accent to-accent/80 rounded-2xl p-12 md:p-16 text-center space-y-6 text-white">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Transform Your Logistics?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">Join thousands of satisfied customers and couriers using Mzansi Couriers today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary" onClick={() => window.location.href = getLoginUrl()}>
              Send Your First Package
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" onClick={() => window.location.href = getLoginUrl()}>
              Become a Courier
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="container py-12 md:py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">MC</div>
                <span className="font-bold">Mzansi Couriers</span>
              </div>
              <p className="text-sm text-muted-foreground">South Africa's fastest delivery network.</p>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-sm">For Customers</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Send Package</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Track Delivery</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-sm">For Couriers</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Join Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Earnings</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-sm">Company</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>&copy; 2026 Mzansi Couriers. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
