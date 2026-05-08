import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { MapPin, Package, Clock, DollarSign, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function CustomerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [showBooking, setShowBooking] = useState(false);

  if (!isAuthenticated || user?.role !== 'customer') {
    return <div>Access denied</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Send a Package</h1>
            <p className="text-muted-foreground">Quick, reliable, and affordable delivery across South Africa 🇿🇦</p>
          </div>
          <Button size="lg" className="gap-2" onClick={() => setShowBooking(!showBooking)}>
            <Plus className="w-4 h-4" />
            New Delivery
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "Total Deliveries", value: "24", change: "+2 this month" },
            { icon: DollarSign, label: "Total Spent", value: "R2,480", change: "+R340 this month" },
            { icon: Clock, label: "Avg Delivery Time", value: "28 mins", change: "Ayoba! 🚀" },
            { icon: TrendingUp, label: "Saved with Bulk", value: "R245", change: "12% discount" }
          ].map((stat, i) => (
            <Card key={i} className="border-border/50 hover:border-accent/50 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Booking Form */}
        {showBooking && (
          <Card className="border-accent/50 bg-gradient-to-br from-background to-accent/5">
            <CardHeader>
              <CardTitle>Book a Delivery</CardTitle>
              <CardDescription>Enter your package details for an instant quote</CardDescription>
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
                  <span className="font-semibold">R75</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Distance (12 km)</span>
                  <span className="font-semibold">R54</span>
                </div>
                <div className="border-t border-accent/20 pt-3 flex items-center justify-between">
                  <span className="font-semibold">Total Estimate</span>
                  <span className="text-2xl font-bold text-accent">R129</span>
                </div>
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
        )}

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
