import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapView } from '@/components/Map';
import { trpc } from '@/lib/trpc';
import { MapPin, Navigation, Phone, MessageSquare, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  currentLocation?: { lat: number; lng: number };
}

export default function CourierDeliveryMap({
  pickupLocation,
  dropoffLocation,
  customerName = 'Customer',
  customerPhone,
  packageDescription,
  deliveryId,
  currentLocation,
}: CourierDeliveryMapProps) {
  const [deliveryStatus, setDeliveryStatus] = useState<'in_progress' | 'arrived_pickup' | 'arrived_dropoff' | 'completed'>('in_progress');
  const [gpsLocation, setGpsLocation] = useState(currentLocation || null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distanceKm: number; durationMinutes: number } | null>(null);

  const pickupValidation = trpc.geocoding.validate.useQuery(
    { address: pickupLocation.address },
    { enabled: !pickupLocation.lat || !pickupLocation.lng },
  );
  const dropoffValidation = trpc.geocoding.validate.useQuery(
    { address: dropoffLocation.address },
    { enabled: !dropoffLocation.lat || !dropoffLocation.lng },
  );

  const pickupCoords = useMemo<{ lat: number; lng: number } | null>(() => {
    if (typeof pickupLocation.lat === 'number' && typeof pickupLocation.lng === 'number') {
      return { lat: pickupLocation.lat, lng: pickupLocation.lng };
    }
    if (pickupValidation.data?.valid && typeof pickupValidation.data.latitude === 'number' && typeof pickupValidation.data.longitude === 'number') {
      return { lat: pickupValidation.data.latitude, lng: pickupValidation.data.longitude };
    }
    return null;
  }, [pickupLocation.lat, pickupLocation.lng, pickupValidation.data]);
  const dropoffCoords = useMemo<{ lat: number; lng: number } | null>(() => {
    if (typeof dropoffLocation.lat === 'number' && typeof dropoffLocation.lng === 'number') {
      return { lat: dropoffLocation.lat, lng: dropoffLocation.lng };
    }
    if (dropoffValidation.data?.valid && typeof dropoffValidation.data.latitude === 'number' && typeof dropoffValidation.data.longitude === 'number') {
      return { lat: dropoffValidation.data.latitude, lng: dropoffValidation.data.longitude };
    }
    return null;
  }, [dropoffLocation.lat, dropoffLocation.lng, dropoffValidation.data]);

  useEffect(() => {
    if (currentLocation || !navigator.geolocation) {
      if (!currentLocation) setGpsError('Location sharing is not available on this device yet. You can still open the route manually.');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGpsError(null);
      },
      () => setGpsError('Allow location access to start navigation from your current position.'),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentLocation]);

  const navigationDestination = deliveryStatus === 'in_progress' ? pickupCoords : dropoffCoords;
  const routeOrigin = deliveryStatus === 'in_progress' ? gpsLocation : (gpsLocation || pickupCoords);
  const routeReady = Boolean(routeOrigin && navigationDestination);
  const routeQuery = trpc.routing.calculateRoute.useQuery({
    originLat: routeOrigin?.lat ?? -26.2041,
    originLng: routeOrigin?.lng ?? 28.0473,
    destLat: navigationDestination?.lat ?? -26.2041,
    destLng: navigationDestination?.lng ?? 28.0473,
  }, { enabled: routeReady });

  useEffect(() => {
    if (routeQuery.data) setRouteSummary({ distanceKm: routeQuery.data.distanceKm, durationMinutes: routeQuery.data.durationMinutes });
    if (routeQuery.error) setRouteSummary(null);
  }, [routeQuery.data, routeQuery.error]);

  useEffect(() => {
    setRouteSummary(null);
  }, [deliveryStatus]);

  const openGoogleMapsNavigation = () => {
    const origin = gpsLocation ? `${gpsLocation.lat},${gpsLocation.lng}` : pickupLocation.address;
    const destination = deliveryStatus === 'in_progress' ? pickupLocation.address : dropoffLocation.address;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openAppleMapsNavigation = () => {
    const origin = gpsLocation ? `${gpsLocation.lat},${gpsLocation.lng}` : pickupLocation.address;
    const destination = deliveryStatus === 'in_progress' ? pickupLocation.address : dropoffLocation.address;
    const url = `maps://maps.apple.com/?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}&dirflg=d`;
    window.location.href = url;
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
                <p className="font-bold text-lg">{deliveryId || "Preparing"}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusColor(deliveryStatus)}`}>
                {getStatusLabel(deliveryStatus)}
              </span>
            </div>

            {/* Route Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Estimated Distance</p>
                <p className="text-lg font-bold">{routeSummary ? `${routeSummary.distanceKm.toFixed(1)} km` : routeQuery.isFetching ? 'Calculating…' : routeReady ? 'Route details are updating' : 'Preparing route'}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
                <p className="text-lg font-bold">{routeSummary ? `${routeSummary.durationMinutes} mins` : routeQuery.isFetching ? 'Calculating…' : routeReady ? 'Route details are updating' : 'Preparing route'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {pickupCoords && dropoffCoords && (gpsLocation || deliveryStatus !== 'in_progress') ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Navigation className="w-4 h-4 text-accent" />Live Courier Route</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MapView
              key={deliveryStatus}
              initialCenter={routeOrigin || pickupCoords}
              initialZoom={11}
              route={{ origin: routeOrigin || pickupCoords, destination: navigationDestination || dropoffCoords }}
              courierLocation={gpsLocation || pickupCoords}
              destinationLocation={navigationDestination || dropoffCoords}
              onRouteReady={setRouteSummary}
            />
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-6 text-sm text-muted-foreground">{deliveryStatus === 'in_progress' && !gpsLocation ? 'Allow location access to calculate the route from your current position and start navigation to pickup.' : 'Add verified pickup and drop-off addresses to see the courier route.'}</CardContent></Card>
      )}

      {gpsError ? <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" role="status">{gpsError}</p> : null}

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
            <p className="text-xs text-muted-foreground">Package: {packageDescription || "Package details will appear here when they are ready."}</p>
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
              <p className="text-xs text-muted-foreground">{customerPhone || "Customer contact details will appear here when available."}</p>
            </div>
            {customerPhone ? (
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
            ) : null}
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
          {deliveryStatus === 'in_progress' ? 'Navigate to Pickup' : 'Navigate to Drop-off'} in Google Maps
        </Button>
        <Button
          className="w-full gap-2"
          variant="outline"
          onClick={openAppleMapsNavigation}
          size="lg"
        >
          <Navigation className="w-4 h-4" />
          {deliveryStatus === 'in_progress' ? 'Navigate to Pickup' : 'Navigate to Drop-off'} in Apple Maps
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
