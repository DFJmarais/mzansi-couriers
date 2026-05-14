import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, MapPin } from 'lucide-react';
import { RegionalPricingSelector, PaymentMethodsManager, LanguageSwitcher, NotificationPreferences } from '@/components/Phase2Features';

export default function CustomerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [showBooking, setShowBooking] = useState(false);
  const [selectedZone, setSelectedZone] = useState('johannesburg');
  // Language managed by LocalizationContext
  // const [currentLanguage, setCurrentLanguage] = useState('en');

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to access your dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Language Switcher */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Customer'}</h1>
            <p className="text-muted-foreground mt-1">Send packages across Mzansi with transparent pricing</p>
          </div>
          <LanguageSwitcher  />
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-accent/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-accent">12</p>
                <p className="text-sm text-muted-foreground mt-2">Total Deliveries</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-accent/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-accent">R1,245</p>
                <p className="text-sm text-muted-foreground mt-2">Amount Spent</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-accent/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-accent">4.8</p>
                <p className="text-sm text-muted-foreground mt-2">Average Rating</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regional Pricing Selector */}
        <RegionalPricingSelector onZoneSelect={setSelectedZone} />

        {/* Book a Delivery */}
        <Card className="border-accent/50 bg-gradient-to-br from-background to-accent/5">
          <CardHeader>
            <CardTitle>Book a Delivery</CardTitle>
            <CardDescription>Tell us what you're sending. We'll match you with available couriers. Instant quote in Rand.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold">Pickup Location</label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-input bg-background hover:border-accent/50 transition-colors cursor-pointer">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Enter pickup address" className="flex-1 bg-transparent outline-none text-sm" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold">Dropoff Location</label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-input bg-background hover:border-accent/50 transition-colors cursor-pointer">
                  <MapPin className="w-4 h-4 text-accent" />
                  <input type="text" placeholder="Enter dropoff address" className="flex-1 bg-transparent outline-none text-sm" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold">Package Size</label>
                <select className="w-full px-4 py-3 rounded-lg border border-input bg-background hover:border-accent/50 transition-colors cursor-pointer">
                  <option>Small (up to 1kg)</option>
                  <option>Medium (up to 10kg)</option>
                  <option>Large (up to 50kg)</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold">Weight (kg)</label>
                <input type="number" placeholder="0.5" className="w-full px-4 py-3 rounded-lg border border-input bg-background hover:border-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-sm font-semibold">Package Description</label>
                <textarea placeholder="What are you sending?" className="w-full px-4 py-3 rounded-lg border border-input bg-background hover:border-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent resize-none" rows={3}></textarea>
              </div>
            </div>
            {/* Price Estimate */}
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Base fare</span>
                <span className="font-semibold">R40</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Distance (12 km @ R10/km)</span>
                <span className="font-semibold">R120</span>
              </div>
              {/* Surge Pricing Indicator */}
              <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded">
                <span className="text-sm text-orange-900 font-semibold">📈 Surge Pricing (1.5x)</span>
                <span className="font-semibold text-orange-600">+R67</span>
              </div>
              <div className="border-t border-accent/20 pt-3 flex items-center justify-between">
                <span className="font-semibold">Total Estimate</span>
                <span className="text-2xl font-bold text-accent">R156</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">⏰ Peak lunch hour pricing active. Schedule for later to save money.</p>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 gap-2" onClick={() => setShowBooking(false)}>
                Confirm Booking
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowBooking(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deliveries */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recent Deliveries</h2>
          <div className="space-y-3">
            {[
              {
                id: "DEL-1024",
                from: "Sandton, Johannesburg",
                to: "Midrand, Johannesburg",
                status: "delivered",
                date: "Today at 2:30 PM",
                amount: "R145"
              },
              {
                id: "DEL-1023",
                from: "Rosebank, Johannesburg",
                to: "Bryanston, Johannesburg",
                status: "delivered",
                date: "Yesterday at 11:15 AM",
                amount: "R98"
              },
              {
                id: "DEL-1022",
                from: "Fourways, Johannesburg",
                to: "Sunninghill, Johannesburg",
                status: "delivered",
                date: "2 days ago at 3:45 PM",
                amount: "R75"
              }
            ].map((delivery, i) => (
              <Card key={i} className="border-border/50 hover:border-accent/50 transition-all hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-sm">{delivery.id}</p>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {delivery.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{delivery.from} → {delivery.to}</p>
                      <p className="text-xs text-muted-foreground">{delivery.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-accent">{delivery.amount}</p>
                      <Button size="sm" variant="ghost" className="mt-2">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <PaymentMethodsManager />

        {/* Notification Preferences */}
        <NotificationPreferences />

        {/* Saved Addresses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Saved Addresses</h2>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Address
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: "Home", address: "123 Main Street, Johannesburg, 2000" },
              { label: "Work", address: "456 Business Avenue, Sandton, 2146" }
            ].map((addr, i) => (
              <Card key={i} className="border-border/50 hover:border-accent/50 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{addr.label}</p>
                      <p className="text-sm text-muted-foreground mt-1">{addr.address}</p>
                    </div>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
