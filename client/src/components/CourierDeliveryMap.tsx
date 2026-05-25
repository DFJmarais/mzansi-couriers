import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Phone, MessageSquare, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface DeliveryLocation {
  address: string;
  lat?: number;
  lng?: number;
}

interface CourierDeliveryMapProps {
  pickupLocation: DeliveryLocation;
  dropoffLocation: DeliveryLocation;
  customerName?: string;
  customerPhone?: string;
  packageDescription?: string;
  deliveryId?: string;
}

export default function CourierDeliveryMap({
  pickupLocation,
  dropoffLocation,
  customerName = 'Customer',
  customerPhone = '+27 123 456 7890',
  packageDescription = 'Package',
  deliveryId = 'DEL-0000'
}: CourierDeliveryMapProps) {
  const [deliveryStatus, setDeliveryStatus] = useState<'in_progress' | 'arrived_pickup' | 'arrived_dropoff' | 'completed'>('in_progress');

  // Open Google Maps navigation
  const openGoogleMapsNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      pickupLocation.address
    )}&destination=${encodeURIComponent(dropoffLocation.address)}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Open Apple Maps navigation (for iOS)
  const openAppleMapsNavigation = () => {
    const url = `maps://maps.apple.com/?saddr=${encodeURIComponent(
      pickupLocation.address
    )}&daddr=${encodeURIComponent(dropoffLocation.address)}&dirflg=d`;
    window.location.href = url;
  };

  // Calculate approximate distance (rough estimate based on character length - for demo)
  const estimateDistance = () => {
    const chars = (pickupLocation.address + dropoffLocation.address).length;
    return Math.max(3, Math.round(chars / 10)) + ' km';
  };

  // Calculate approximate time
  const estimateTime = () => {
    const distance = parseInt(estimateDistance());
    return Math.max(5, Math.round(distance * 1.5)) + ' mins';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'arrived_pickup':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'arrived_dropoff':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress - Navigate to Pickup';
      case 'arrived_pickup':
        return 'Arrived at Pickup - Pick up package';
      case 'arrived_dropoff':
        return 'Arrived at Dropoff - Deliver package';
      case 'completed':
        return 'Delivery Completed ✓';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="border-l-4 border-l-accent">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Delivery ID</p>
                <p className="font-bold text-lg">{deliveryId}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusColor(deliveryStatus)}`}>
                {getStatusLabel(deliveryStatus)}
              </span>
            </div>

            {/* Route Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Estimated Distance</p>
                <p className="text-lg font-bold">{estimateDistance()}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
                <p className="text-lg font-bold">{estimateTime()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pickup & Dropoff Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Route Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Pickup */}
            <div className="flex items-start gap-3 pb-3 border-b border-border">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-700 dark:text-green-300" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Pickup Location</p>
                <p className="font-semibold text-sm">{pickupLocation.address}</p>
              </div>
            </div>

            {/* Dropoff */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-red-700 dark:text-red-300" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Dropoff Location</p>
                <p className="font-semibold text-sm">{dropoffLocation.address}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-xs text-muted-foreground">📦 Package: {packageDescription}</p>
          </div>
        </CardContent>
      </Card>

      {/* Customer Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{customerName}</p>
              <p className="text-xs text-muted-foreground">{customerPhone}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`tel:${customerPhone}`)}
              >
                <Phone className="w-4 h-4" />
                Call
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`sms:${customerPhone}`)}
              >
                <MessageSquare className="w-4 h-4" />
                SMS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Navigation Instructions</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200 text-xs">
                <li>Click "Open in Google Maps" to start navigation</li>
                <li>Follow the turn-by-turn directions on your phone</li>
                <li>Arrive at the pickup location first</li>
                <li>Pick up the package from the customer</li>
                <li>Navigate to the dropoff location</li>
                <li>Deliver the package and click "Delivered"</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Actions */}
      <div className="flex flex-col gap-3">
        <Button
          className="w-full gap-2"
          onClick={openGoogleMapsNavigation}
          size="lg"
        >
          <Navigation className="w-4 h-4" />
          Open in Google Maps
        </Button>
        <Button
          className="w-full gap-2"
          variant="outline"
          onClick={openAppleMapsNavigation}
          size="lg"
        >
          <Navigation className="w-4 h-4" />
          Open in Apple Maps
        </Button>

        {/* Status Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant={deliveryStatus === 'arrived_pickup' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setDeliveryStatus('arrived_pickup')}
          >
            <Clock className="w-4 h-4" />
            Arrived Pickup
          </Button>
          <Button
            variant={deliveryStatus === 'arrived_dropoff' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setDeliveryStatus('arrived_dropoff')}
          >
            <Clock className="w-4 h-4" />
            Arrived Dropoff
          </Button>
        </div>

        <Button
          className="w-full gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => setDeliveryStatus('completed')}
          disabled={deliveryStatus === 'completed'}
          size="lg"
        >
          <CheckCircle2 className="w-4 h-4" />
          {deliveryStatus === 'completed' ? 'Delivery Completed ✓' : 'Mark as Delivered'}
        </Button>
      </div>
    </div>
  );
}
