import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { MapPin, Package, Clock, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function CustomerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

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
            <p className="text-muted-foreground">Quick, affordable, and reliable delivery across South Africa</p>
          </div>
          <Button size="lg" onClick={() => setActiveTab("book")}>
            + New Delivery
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "Total Deliveries", value: "12" },
            { icon: Clock, label: "In Progress", value: "1" },
            { icon: TrendingUp, label: "Total Spent", value: "R2,450" },
            { icon: MapPin, label: "Addresses Saved", value: "5" }
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-accent opacity-50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Booking Form */}
        {activeTab === "book" && (
          <Card className="border-2 border-accent/50">
            <CardHeader>
              <CardTitle>Create New Delivery</CardTitle>
              <CardDescription>Enter package details and select delivery type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pickup */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    Pickup Location
                  </h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Street address" className="input-field" />
                    <input type="text" placeholder="City/Town" className="input-field" />
                    <input type="text" placeholder="Postal code" className="input-field" />
                  </div>
                </div>

                {/* Dropoff */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    Dropoff Location
                  </h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Street address" className="input-field" />
                    <input type="text" placeholder="City/Town" className="input-field" />
                    <input type="text" placeholder="Postal code" className="input-field" />
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent" />
                  Package Details
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Package Size</label>
                    <select className="input-field">
                      <option>Small (up to 2kg)</option>
                      <option>Medium (2-10kg)</option>
                      <option>Large (10-50kg)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Weight (kg)</label>
                    <input type="number" placeholder="0.5" className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Delivery Type</label>
                    <select className="input-field">
                      <option>Standard (24-48h)</option>
                      <option>Same-day</option>
                      <option>Express (2-4h)</option>
                    </select>
                  </div>
                </div>
                <textarea placeholder="Describe your package..." className="input-field h-24" />
              </div>

              {/* Price Estimate */}
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Price</p>
                    <p className="text-3xl font-bold text-accent">R87.50</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Estimated Time</p>
                    <p className="text-lg font-semibold">25 minutes</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button size="lg" className="flex-1">
                  Confirm & Pay
                </Button>
                <Button size="lg" variant="outline" className="flex-1" onClick={() => setActiveTab("overview")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Deliveries */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Active Deliveries</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No active deliveries</p>
                  <Button className="mt-4" onClick={() => setActiveTab("book")}>
                    Send Your First Package
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Deliveries */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Recent Deliveries</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No delivery history yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
