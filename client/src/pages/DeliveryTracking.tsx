import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/Map";
import { MapPin, Phone, MessageCircle, Clock, Package } from "lucide-react";
import { useState } from "react";

export default function DeliveryTracking() {
  const { user, isAuthenticated } = useAuth();
  const [mapReady, setMapReady] = useState(false);

  if (!isAuthenticated) {
    return <div>Access denied</div>;
  }

  // Mock delivery data
  const delivery = {
    id: "DEL-001",
    status: "in-transit",
    courier: {
      name: "John Mthembu",
      rating: 4.9,
      vehicle: "Toyota Hiace - JNB 456",
      phone: "+27 123 456 7890"
    },
    from: "Sandton, Johannesburg",
    to: "Midrand, Johannesburg",
    distance: "12 km",
    eta: "18 minutes",
    currentLocation: { lat: -25.7461, lng: 28.0332 },
    pickupLocation: { lat: -25.7461, lng: 28.0332 },
    dropoffLocation: { lat: -25.7282, lng: 28.1137 }
  };

  const statusSteps = [
    { label: "pending", completed: true },
    { label: "assigned", completed: true },
    { label: "in-transit", completed: true },
    { label: "delivered", completed: false }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{delivery.id}</h1>
              <p className="text-sm text-muted-foreground">{delivery.from} → {delivery.to}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">ETA</p>
              <p className="text-xl font-bold text-accent">{delivery.eta}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Live Location</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-96 bg-muted rounded-lg overflow-hidden">
                  <MapView onMapReady={() => setMapReady(true)} />
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        step.completed 
                          ? 'bg-accent text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.completed ? '✓' : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold capitalize">{step.label}</p>
                        {step.completed && (
                          <p className="text-xs text-muted-foreground">
                            {step.label === 'pending' && 'Delivery request created'}
                            {step.label === 'assigned' && 'Courier assigned'}
                            {step.label === 'in-transit' && 'Courier is on the way'}
                          </p>
                        )}
                      </div>
                      {step.completed && (
                        <Clock className="w-4 h-4 text-accent" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courier Info & Actions */}
          <div className="space-y-6">
            {/* Courier Card */}
            <Card>
              <CardHeader>
                <CardTitle>Courier Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{delivery.courier.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="font-semibold text-accent">{delivery.courier.rating}★</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-semibold text-sm">{delivery.courier.vehicle}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <Button className="w-full" variant="outline">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Courier
                  </Button>
                  <Button className="w-full" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="font-medium text-sm">{delivery.from}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dropoff</p>
                      <p className="font-medium text-sm">{delivery.to}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Distance</span>
                    <span className="font-semibold">{delivery.distance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ETA</span>
                    <span className="font-semibold">{delivery.eta}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      in-transit
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Package
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-semibold">Medium</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-semibold">3.5 kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-semibold text-sm">Office supplies and documents</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
