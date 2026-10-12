import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Truck, TrendingUp, Award } from "lucide-react";

// Courier Tier Selector
export function CourierTierSelector() {
  const tiers = [
    {
      id: 1,
      name: "Local Courier",
      radius: "0-100 km",
      fee: "Configured per route",
      description: "Parcel pickups and local deliveries",
      icon: MapPin,
    },
    {
      id: 2,
      name: "Regional Courier",
      radius: "100-200 km",
      fee: "Configured per route",
      description: "Town-to-town and inter-city deliveries",
      icon: Truck,
    },
    {
      id: 3,
      name: "Long Haul Courier",
      radius: "200+ km",
      fee: "Configured per route",
      description: "Major city routes and bulk transport",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Choose Your Courier Tier</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <Card key={tier.id} className="hover:border-accent/50 transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-accent" />
                    <CardTitle>{tier.name}</CardTitle>
                  </div>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Operating Radius:</span>
                    <Badge variant="outline">{tier.radius}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee:</span>
                    <Badge variant="outline">{tier.fee}</Badge>
                  </div>
                </div>
                <Button className="w-full" disabled title="Tier selection is not connected to courier records yet">Tier selection unavailable</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Vehicle Manager
export function VehicleManager() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Vehicles</h2>
        <Button disabled title="Vehicle management is not connected to verified courier records yet">Vehicle management unavailable</Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No vehicles registered yet. Add a vehicle to start accepting deliveries.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Route Publisher
export function RoutePublisher() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Publish a Route</h2>
      <Card>
        <CardHeader>
          <CardTitle>Create New Route</CardTitle>
          <CardDescription>Publish a route to attract parcel assignments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Departure City</label>
              <input type="text" placeholder="e.g., Johannesburg" className="w-full mt-2 p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-semibold">Destination City</label>
              <input type="text" placeholder="e.g., Cape Town" className="w-full mt-2 p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-semibold">Departure Time</label>
              <input type="datetime-local" className="w-full mt-2 p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-semibold">Distance (km)</label>
              <input type="number" placeholder="e.g., 1400" className="w-full mt-2 p-2 border rounded" />
            </div>
          </div>
          <Button className="w-full" disabled title="Route publishing is not connected to assigned courier runs yet">Route publishing unavailable</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Partner Level Display
export function PartnerLevelDisplay() {
  const levels = [
    { name: "Bronze", icon: "🥉", benefits: ["Basic support", "Standard rates"] },
    { name: "Silver", icon: "🥈", benefits: ["Priority support", "Benefits vary by verified program configuration"] },
    { name: "Gold", icon: "🥇", benefits: ["VIP support", "Benefits vary by verified program configuration", "Exclusive routes"] },
    { name: "Platinum", icon: "💎", benefits: ["Email support during published hours", "Benefits vary by verified program configuration", "Premium routes"] },
    { name: "Diamond", icon: "✨", benefits: ["Elite support", "Benefits vary by verified program configuration", "Reserved routes"] },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mzansi Partner Programme</h2>
      <div className="grid md:grid-cols-5 gap-4">
        {levels.map((level) => (
          <Card key={level.name} className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-2">{level.icon}</div>
              <h3 className="font-bold mb-2">{level.name}</h3>
              <ul className="text-xs space-y-1">
                {level.benefits.map((benefit) => (
                  <li key={benefit} className="text-muted-foreground">
                    ✓ {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
