import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Zap, MapPin, TrendingUp, Users, Award, Clock, ArrowRight, CheckCircle2, Truck, DollarSign, Shield } from "lucide-react";

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

      {/* Hero Section - South African Voice */}
      <section className="container py-20 md:py-32 space-y-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-accent">Ayoba! 🚀 South Africa's Fastest Delivery</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Delivery That's
                <br />
                <span className="text-accent">Lekker, Fast</span>
                <br />& Reliable
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Connect with verified couriers across Mzansi. Send packages anywhere, anytime. From Joburg to Cape Town, Durban to Pretoria. Track every step with confidence. No stress, no hassle.
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

          {/* Hero Image - South African themed */}
          <div className="relative h-96 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl border border-accent/20 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,#ff6b35,transparent_50%)]"></div>
            <div className="relative z-10 text-center space-y-4">
              <Truck className="w-24 h-24 text-accent mx-auto" />
              <p className="text-xl font-semibold">Real-time Tracking</p>
              <p className="text-sm text-muted-foreground">Know exactly where your package is</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - SA Focus */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Why Mzansi Couriers is Lekker</h2>
          <p className="text-lg text-muted-foreground">Built for South Africa, by South Africans</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: DollarSign,
              title: "Honest Pricing",
              description: "No hidden charges. What you see is what you pay. Competitive rates across all regions.",
            },
            {
              icon: Shield,
              title: "Verified Couriers",
              description: "All couriers are vetted and insured. Your packages are safe with us.",
            },
            {
              icon: Clock,
              title: "Fast Delivery",
              description: "Same-day delivery in major cities. Express options available.",
            },
            {
              icon: MapPin,
              title: "Nationwide Coverage",
              description: "From Johannesburg to Cape Town, Durban to Pretoria. We cover all of Mzansi.",
            },
            {
              icon: TrendingUp,
              title: "Earn More",
              description: "Couriers earn competitive rates. Flexible hours, real income.",
            },
            {
              icon: Award,
              title: "Top Rated",
              description: "4.8★ rating from thousands of happy customers and couriers.",
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card key={i} className="border-border/50 hover:border-accent/50 transition-all hover:shadow-lg">
                <CardContent className="pt-8 space-y-4">
                  <Icon className="w-12 h-12 text-accent" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works - South African Context */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">How It Works - Easy Peasy</h2>
          <p className="text-lg text-muted-foreground">Three simple steps to get your package delivered</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Book Your Delivery",
              description: "Enter pickup and dropoff addresses. Tell us what you're sending. Get an instant quote in Rand.",
            },
            {
              step: "2",
              title: "We Find a Courier",
              description: "Our system matches your delivery with the nearest available courier. They accept and head your way.",
            },
            {
              step: "3",
              title: "Track & Receive",
              description: "Watch your package in real-time. Get updates every step of the way. Delivered with confidence.",
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

      {/* Pricing Section - South African Rand */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Pricing That Won't Hurt Your Pocket</h2>
          <p className="text-lg text-muted-foreground">Transparent, honest pricing. All prices in South African Rand.</p>
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

      {/* Testimonials Section - South African Stories */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Loved by Mzansi</h2>
          <p className="text-lg text-muted-foreground">Real stories from real South Africans</p>
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
              quote: "I earn R2,500+ per week with flexible hours. Best decision ever! This is lekker!",
              rating: 5,
            },
            {
              name: "Sipho Ndlela",
              role: "Customer, Durban",
              quote: "Reliable, affordable, and they actually care. No stress, no hassle. Highly recommended!",
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
                <p className="text-sm italic">\"{testimonial.quote}\"</p>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section - South African Brand Voice */}
      <section className="container py-20">
        <div className="bg-gradient-to-r from-accent to-accent/80 rounded-3xl p-12 md:p-16 text-white space-y-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Get Going?</h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Join thousands of South Africans using Mzansi Couriers. Fast, affordable, reliable delivery across Mzansi. No stress, no hassle. Just lekker service.
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
            <div>
              <h4 className="font-bold mb-4">About Mzansi</h4>
              <p className="text-sm text-muted-foreground">South Africa's fastest delivery network. Built for Mzansi, by Mzansi.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Customers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent">Send a Package</a></li>
                <li><a href="#" className="hover:text-accent">Track Delivery</a></li>
                <li><a href="#" className="hover:text-accent">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Couriers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent">Become a Courier</a></li>
                <li><a href="#" className="hover:text-accent">Earnings</a></li>
                <li><a href="#" className="hover:text-accent">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent">Privacy</a></li>
                <li><a href="#" className="hover:text-accent">Terms</a></li>
                <li><a href="#" className="hover:text-accent">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Mzansi Couriers. South Africa's Delivery Network. 🇿🇦</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
