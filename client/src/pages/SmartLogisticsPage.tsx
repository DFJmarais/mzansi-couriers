import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourierTierSelector, VehicleManager, RoutePublisher, PartnerLevelDisplay } from "@/components/SmartLogisticsComponents";

export default function SmartLogisticsPage() {
  const [activeTab, setActiveTab] = useState("tiers");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Smart Logistics Network</h1>
          <p className="text-lg text-muted-foreground">
            Join South Africa's most advanced peer-to-peer delivery network
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tiers">Courier Tiers</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
          </TabsList>

          {/* Courier Tiers Tab */}
          <TabsContent value="tiers" className="space-y-6">
            <CourierTierSelector />
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-6">
            <VehicleManager />
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes" className="space-y-6">
            <RoutePublisher />
          </TabsContent>

          {/* Partners Tab */}
          <TabsContent value="partners" className="space-y-6">
            <PartnerLevelDisplay />
          </TabsContent>
        </Tabs>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚗 Flexible Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Choose Local, Regional, or Long Haul based on your vehicle and availability.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📍 Smart Routing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Publish routes and let the system match parcels to your journey.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⭐ Partner Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Earn bonuses and exclusive benefits as you climb the partner levels.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
