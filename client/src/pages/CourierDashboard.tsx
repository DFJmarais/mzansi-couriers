import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { MapPin, Zap, TrendingUp, Clock, Star } from "lucide-react";
import { useState } from "react";

export default function CourierDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(false);

  if (!isAuthenticated || user?.role !== 'courier') {
    return <div>Access denied</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Online Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Courier Dashboard</h1>
            <p className="text-muted-foreground">Manage deliveries and track earnings</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <Button 
              variant={isOnline ? "default" : "outline"}
              onClick={() => setIsOnline(!isOnline)}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: "Today's Earnings", value: "R450" },
            { icon: Clock, label: "Active Deliveries", value: "2" },
            { icon: Zap, label: "Total Deliveries", value: "247" },
            { icon: Star, label: "Rating", value: "4.9" }
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

        {/* Available Jobs */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Available Nearby Jobs</h2>
          
          {isOnline ? (
            <div className="grid gap-4">
              {[
                {
                  from: "Sandton, Johannesburg",
                  to: "Midrand, Johannesburg",
                  distance: "12 km",
                  price: "R145",
                  time: "18 mins",
                  size: "Medium"
                },
                {
                  from: "Rosebank, Johannesburg",
                  to: "Bryanston, Johannesburg",
                  distance: "8 km",
                  price: "R95",
                  time: "12 mins",
                  size: "Small"
                },
                {
                  from: "Fourways, Johannesburg",
                  to: "Sunninghill, Johannesburg",
                  distance: "6 km",
                  price: "R75",
                  time: "9 mins",
                  size: "Small"
                }
              ].map((job, i) => (
                <Card key={i} className="border-l-4 border-l-accent hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Pickup</p>
                        <p className="font-medium text-sm">{job.from}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="flex-1 h-px bg-border"></div>
                        <MapPin className="w-4 h-4 text-muted-foreground mx-2" />
                        <div className="flex-1 h-px bg-border"></div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Dropoff</p>
                        <p className="font-medium text-sm">{job.to}</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Distance & Time</p>
                          <p className="font-semibold">{job.distance} • {job.time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Package</p>
                          <p className="font-medium text-sm">{job.size}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-2xl font-bold text-accent">{job.price}</p>
                        <Button size="sm" className="w-full">
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Zap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Go online to see available jobs</p>
                  <Button className="mt-4" onClick={() => setIsOnline(true)}>
                    Go Online
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Active Deliveries */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Active Deliveries</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No active deliveries</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
