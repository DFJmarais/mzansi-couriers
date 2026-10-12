import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, MapPin, Clock, DollarSign, Zap, Shield, TrendingUp } from 'lucide-react';
import StandaloneBackButton from '@/components/StandaloneBackButton';

export function BecomeDriver() {
  const [, setLocation] = useLocation();

  const handleSignUp = () => {
    setLocation('/courier/apply');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container pt-6">
        <StandaloneBackButton />
      </div>
      {/* Hero Section */}
      <section className="container py-20 space-y-8">
        <div className="max-w-3xl space-y-6">
          <div className="inline-block bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
            <span className="text-accent font-semibold text-sm">Join Our Network</span>
          </div>
          <h1 className="text-5xl font-bold">Earn through eligible relay deliveries</h1>
          <p className="text-xl text-muted-foreground">
            Set your availability, work within your approved service area, and accept delivery offers that fit your schedule. Courier earnings depend on completed deliveries and the applicable route pricing.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Income depends on your availability, location, and the number of completed deliveries.
          </p>
          <Button size="lg" onClick={handleSignUp} className="gap-2">
            Start Earning Today
          </Button>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold">Why Join Mzansi Couriers?</h2>
          <p className="text-muted-foreground">Everything you need to succeed as a courier</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border/50 hover:border-accent/50 transition-all">
            <CardContent className="pt-8">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Work Your Area</h3>
              <p className="text-sm text-muted-foreground">
                Operate within your 120km radius. Know your area, build relationships with customers.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/50 transition-all">
            <CardContent className="pt-8">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Schedule</h3>
              <p className="text-sm text-muted-foreground">
                Work when you want. No fixed hours. Balance work with other commitments.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/50 transition-all">
            <CardContent className="pt-8">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Transparent earnings records</h3>
              <p className="text-sm text-muted-foreground">
                Review the amount associated with each completed delivery. Actual earnings depend on availability, location, route, and completed deliveries.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/50 transition-all">
            <CardContent className="pt-8">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Easy to Use App</h3>
              <p className="text-sm text-muted-foreground">
                Simple interface, real-time tracking, and a dashboard for recorded earnings and payout status.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/50 transition-all">
            <CardContent className="pt-8">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Your Responsibility</h3>
              <p className="text-sm text-muted-foreground">
                You're responsible for your vehicle, license, and insurance. Any package-protection terms depend on the applicable delivery policy.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/50 transition-all">
            <CardContent className="pt-8">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Grow Your Income</h3>
              <p className="text-sm text-muted-foreground">
                More deliveries = more earnings. Build your reputation and attract premium customers.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Earnings Breakdown */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold">How Much Can You Earn?</h2>
          <p className="text-muted-foreground">Illustrative scenarios only; actual earnings are not guaranteed.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { deliveries: 10, daily: 'R420', monthly: 'R8,400', label: 'Part-time' },
            { deliveries: 15, daily: 'R630', monthly: 'R12,600', label: 'Full-time' },
            { deliveries: 20, daily: 'R840', monthly: 'R16,800', label: 'Full-time+' },
          ].map((scenario, i) => (
            <Card key={i} className={`border-border/50 ${i === 1 ? 'border-accent/50 ring-1 ring-accent/20' : ''}`}>
              <CardContent className="pt-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Deliveries per day</p>
                    <p className="text-3xl font-bold">{scenario.deliveries}</p>
                  </div>
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Daily earnings</p>
                    <p className="text-2xl font-bold text-accent">{scenario.daily}</p>
                  </div>
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Monthly earnings (20 working days)</p>
                    <p className="text-2xl font-bold">{scenario.monthly}</p>
                  </div>
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
                      {scenario.label}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-lg p-8">
          <h3 className="font-semibold mb-4">Earnings Calculation</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base per delivery (R42 average)</span>
              <span className="font-semibold">R42</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">× 15 deliveries/day</span>
              <span className="font-semibold">= R630/day</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">× 20 working days/month</span>
              <span className="font-semibold">= R12,600/month</span>
            </div>
            <div className="border-t border-accent/20 pt-3 mt-3 flex justify-between">
              <span className="font-semibold">Plus weight surcharges</span>
              <span className="font-semibold text-accent">+R1,400-4,200</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2">
              <span>Total monthly earnings</span>
              <span className="text-accent">R14,000-16,800</span>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold">What You Need</h2>
          <p className="text-muted-foreground">Simple requirements to get started</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-accent" />
                Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'Valid South African ID',
                'Valid driver\'s license',
                'Own vehicle (car, van, or motorcycle)',
                'Vehicle insurance (your responsibility)',
                'Smartphone with GPS',
                'Reliable internet connection',
                'At least 18 years old',
              ].map((req, i) => (
                <div key={i} className="flex gap-3">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{req}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Recommended
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'Good knowledge of your local area',
                'Excellent customer service skills',
                'Professional appearance',
                'Reliable phone number',
                'Email address',
                'Bank account for payments',
              ].map((rec, i) => (
                <div key={i} className="flex gap-3">
                  <Check className="w-5 h-5 text-accent/50 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{rec}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold">How It Works</h2>
          <p className="text-muted-foreground">Simple process to get started and start earning</p>
        </div>

        <div className="space-y-6">
          {[
            {
              step: 1,
              title: 'Sign Up',
              description: 'Create your account and provide your details. Verification takes 24-48 hours.',
            },
            {
              step: 2,
              title: 'Download App',
              description: 'Get the Mzansi Couriers app on your phone. Set your 120km service area.',
            },
            {
              step: 3,
              title: 'Accept Deliveries',
              description: 'Get notifications for deliveries in your area. Accept the ones you want.',
            },
            {
              step: 4,
              title: 'Pick Up & Deliver',
              description: 'Pick up the package and deliver it. Get real-time tracking and customer feedback.',
            },
            {
              step: 5,
              title: 'Track earnings and payouts',
              description: 'Completed deliveries appear in your earnings record. Payout timing depends on verified payment details and the applicable processing schedule.',
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-accent text-background font-bold">
                  {item.step}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border border-accent/20 p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Start Earning?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Apply to join the South African courier network and review the requirements before accepting delivery work.
          </p>
          <Button size="lg" onClick={handleSignUp} className="gap-2">
            Apply Now
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold">Frequently Asked Questions</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            {
              q: 'Do I need my own vehicle?',
              a: 'Yes, you need to provide your own vehicle (car, van, or motorcycle). You\'re responsible for its maintenance and insurance.',
            },
            {
              q: 'How often do I get paid?',
              a: 'Completed deliveries are recorded in your earnings dashboard. Payout timing depends on verified payment details and the applicable processing schedule.',
            },
            {
              q: 'Can I work part-time?',
              a: 'Yes! You can work whenever you want. Accept deliveries that fit your schedule.',
            },
            {
              q: 'What if a delivery is damaged?',
              a: 'Packages may be covered while in transit subject to the published goods-in-transit policy, limits, exclusions, and claims process. Vehicle insurance is not provided by Mzansi Couriers.',
            },
            {
              q: 'Do I need to work in a specific area?',
              a: 'You choose your 120km service area. You can only accept deliveries within this radius.',
            },
            {
              q: 'What if I have an accident?',
              a: 'Your vehicle insurance covers accidents. We insure the packages, not the vehicle.',
            },
          ].map((faq, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">{faq.q}</h4>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
