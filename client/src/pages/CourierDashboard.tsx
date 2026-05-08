import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { MapPin, Zap, TrendingUp, Clock, Star, Navigation, CheckCircle2, XCircle } from "lucide-react";
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
            <p className="text-muted-foreground">Manage deliveries and earn big in South Africa 🇿🇦</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              isOnline 
                ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700' 
                : 'bg-muted border-border'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`}></div>
              <span className="text-sm font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <Button 
              size="lg"
              variant={isOnline ? "default" : "outline"}
              onClick={() => setIsOnline(!isOnline)}
              className="gap-2"
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: "Today's Earnings", value: "R450", subtext: "3 deliveries" },
            { icon: Clock, label: "Active Deliveries", value: "2", subtext: "On the way" },
            { icon: Zap, label: "Total Deliveries", value: "247", subtext: "Ayoba! 🚀" },
            { icon: Star, label: "Rating", value: "4.9", subtext: "Based on 156 reviews" }
          ].map((stat, i) => (
            <Card key={i} className="border-border/50 hover:border-accent/50 transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-2">{stat.subtext}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Available Jobs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Available Nearby Jobs</h2>
            <Button size="sm" variant="outline" className="gap-2">
              <Navigation className="w-4 h-4" />
              Refresh
            </Button>
          </div>
          
          {isOnline ? (
            <div className="grid gap-4">
              {[
                {
                  from: "Sandton, Johannesburg",
                  to: "Midrand, Johannesburg",
                  distance: "12 km",
                  price: "R145",
                  time: "18 mins",
                  size: "Medium",
                  urgency: "standard"
                },
                {
                  from: "Rosebank, Johannesburg",
                  to: "Bryanston, Johannesburg",
                  distance: "8 km",
                  price: "R95",
                  time: "12 mins",
                  size: "Small",
                  urgency: "urgent"
                },
                {
                  from: "Fourways, Johannesburg",
                  to: "Sunninghill, Johannesburg",
                  distance: "6 km",
                  price: "R75",
                  time: "9 mins",
                  size: "Small",
                  urgency: "standard"
                }
              ].map((job, i) => (
                <Card key={i} className="border-l-4 border-l-accent hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-5 gap-4 items-start">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pickup</p>
                          <p className="font-semibold text-sm">{job.from}</p>
                        </div>
                        <div className="flex items-center justify-center md:col-span-1">
                          <div className="flex-1 h-px bg-border md:flex-none md:h-auto">
                            <MapPin className="w-4 h-4 text-muted-foreground mx-auto" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Dropoff</p>
                          <p className="font-semibold text-sm">{job.to}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Details</p>
                          <p className="font-semibold text-sm">{job.distance} • {job.time}</p>
                          <p className="text-xs text-muted-foreground mt-1">{job.size} package</p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-2xl font-bold text-accent">{job.price}</p>
                          {job.urgency === 'urgent' && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Urgent
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button size="sm" className="flex-1 gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-2">
                          <XCircle className="w-4 h-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="pt-12 pb-12 text-center space-y-4">
                <Zap className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <div>
                  <p className="font-semibold">Go online to see available jobs</p>
                  <p className="text-sm text-muted-foreground mt-1">Turn on your availability to start receiving delivery requests</p>
                </div>
                <Button className="gap-2" onClick={() => setIsOnline(true)}>
                  <Navigation className="w-4 h-4" />
                  Go Online Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Active Deliveries */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Active Deliveries</h2>
          <Card className="border-border/50">
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <div>
                <p className="font-semibold">No active deliveries</p>
                <p className="text-sm text-muted-foreground mt-1">Accept a job to start earning</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Summary */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Weekly Earnings</h2>
          <div className="grid md:grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <Card key={i} className="border-border/50 hover:border-accent/50 transition-all">
                <CardContent className="pt-4 pb-4 text-center space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">{day}</p>
                  <p className="text-xl font-bold">R{(Math.random() * 400 + 100).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 8 + 2)} trips</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
