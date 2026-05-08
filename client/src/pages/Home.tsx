import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Zap, MapPin, TrendingUp, Users, Award, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

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
              <div className="text-xs text-accent">South Africa's Delivery Network</div>
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
              <span className="text-sm font-semibold text-accent">South Africa's Fastest Delivery Network</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Delivery Made
                <br />
                <span className="text-accent">Simple, Fast</span>
                <br />& Affordable
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Connect with verified couriers across South Africa. Send packages anywhere, anytime. Track every step of your delivery journey with confidence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" onClick={handleGetStarted} className="gap-2">
                Send a Package
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleGetStarted}>
                Become a Courier
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8">
              {[
                { label: "Active Couriers", value: "50K+" },
                { label: "Deliveries", value: "1M+" },
                { label: "Rating", value: "4.8★" },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-accent/10 to-accent/5 rounded-3xl p-8 border border-accent/20 h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <MapPin className="w-16 h-16 text-accent mx-auto" />
                <p className="text-lg font-semibold">Real-time Tracking</p>
                <p className="text-sm text-muted-foreground">Know exactly where your package is</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Why Choose Mzansi Couriers?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for South Africa, by South Africans. We understand local delivery challenges.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Same-day delivery in major cities. Reliable service across all provinces.",
            },
            {
              icon: TrendingUp,
              title: "Transparent Pricing",
              description: "No hidden fees. Instant quotes based on distance, size, and demand.",
            },
            {
              icon: Users,
              title: "Verified Couriers",
              description: "All couriers verified and rated. Your packages are in safe hands.",
            },
            {
              icon: Award,
              title: "Best Rates",
              description: "Competitive pricing. Earn more as a courier. Save more as a customer.",
            },
            {
              icon: Clock,
              title: "24/7 Support",
              description: "Always available. Local support team that understands your needs.",
            },
            {
              icon: MapPin,
              title: "Nationwide Coverage",
              description: "From Cape Town to Durban. Serving all major cities and towns.",
            },
          ].map((feature, i) => (
            <Card key={i} className="border-border/50 hover:border-accent/50 transition-all hover:shadow-lg hover:-translate-y-1">
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
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground">Three simple steps to get your delivery done</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Book Your Delivery",
              description: "Enter pickup and dropoff addresses. Tell us about your package. Get an instant quote.",
            },
            {
              step: "2",
              title: "Courier Accepts",
              description: "A verified courier near you accepts the job. You get real-time updates immediately.",
            },
            {
              step: "3",
              title: "Package Delivered",
              description: "Track your delivery live on the map. Receive confirmation when it's delivered.",
            },
          ].map((item, i) => (
            <div key={i} className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xl">
                {item.step}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground">Pay only for what you use. No hidden charges.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Local",
              description: "Same city delivery",
              price: "R29",
              features: ["Up to 5km", "Standard package", "2-4 hour delivery"],
            },
            {
              title: "Express",
              description: "Priority delivery",
              price: "R49",
              features: ["Up to 15km", "Medium package", "30-60 min delivery"],
              highlighted: true,
            },
            {
              title: "Regional",
              description: "Inter-city delivery",
              price: "R99",
              features: ["Up to 100km", "Large package", "Next day delivery"],
            },
          ].map((tier, i) => (
            <Card
              key={i}
              className={`border transition-all ${
                tier.highlighted
                  ? "border-accent shadow-lg ring-2 ring-accent/20"
                  : "border-border/50 hover:border-accent/50"
              }`}
            >
              <CardContent className="pt-8 space-y-6">
                <div>
                  <h3 className="font-bold text-lg">{tier.title}</h3>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>

                <div className="space-y-1">
                  <div className="text-4xl font-bold">{tier.price}</div>
                  <p className="text-xs text-muted-foreground">Base rate</p>
                </div>

                <ul className="space-y-3">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button className="w-full" variant={tier.highlighted ? "default" : "outline"} onClick={handleGetStarted}>
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Loved by South Africans</h2>
          <p className="text-lg text-muted-foreground">Join thousands of satisfied customers and couriers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Thabo Mthembu",
              role: "Customer, Johannesburg",
              quote: "Mzansi Couriers is incredibly fast! My package arrived in 2 hours. Ayoba! 🚀",
              rating: 5,
            },
            {
              name: "Naledi Khumalo",
              role: "Courier, Cape Town",
              quote: "I earn R2,500+ per week with flexible hours. Best decision ever!",
              rating: 5,
            },
            {
              name: "Sipho Ndlela",
              role: "Customer, Durban",
              quote: "Reliable, affordable, and they actually care. Highly recommended!",
              rating: 5,
            },
          ].map((testimonial, i) => (
            <Card key={i} className="border-border/50 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="pt-8 space-y-4">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <span key={j} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-sm italic">\"{ testimonial.quote}\"</p>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="bg-gradient-to-r from-accent to-accent/80 rounded-3xl p-12 md:p-16 text-white space-y-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Get Started?</h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Join thousands of South Africans using Mzansi Couriers for fast, affordable, reliable delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary" onClick={handleGetStarted} className="gap-2">
              Send a Package
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={handleGetStarted}>
              Become a Courier
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 py-12 bg-background/50">
        <div className="container space-y-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
                  MC
                </div>
                <span className="font-bold">Mzansi Couriers</span>
              </div>
              <p className="text-sm text-muted-foreground">South Africa's fastest delivery network</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">For Customers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition">Send Package</a></li>
                <li><a href="#" className="hover:text-accent transition">Track Delivery</a></li>
                <li><a href="#" className="hover:text-accent transition">Pricing</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">For Couriers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition">Join Us</a></li>
                <li><a href="#" className="hover:text-accent transition">Earnings</a></li>
                <li><a href="#" className="hover:text-accent transition">Support</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition">About Us</a></li>
                <li><a href="#" className="hover:text-accent transition">Contact</a></li>
                <li><a href="#" className="hover:text-accent transition">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2026 Mzansi Couriers. All rights reserved.</p>
            <p>Delivering South Africa, one package at a time. 🇿🇦</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Testimonials component added separately due to complexity
