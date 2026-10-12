import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, ChevronRight } from 'lucide-react';
import CourierDeliveryMap from './CourierDeliveryMap';

interface Delivery {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  customerName: string;
  customerPhone: string;
  packageDescription: string;
  status: 'accepted' | 'in_progress' | 'arrived_pickup' | 'arrived_dropoff';
  createdAt: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  courierLat?: number;
  courierLng?: number;
}

interface ActiveDeliveriesProps {
  deliveries?: Delivery[];
}

export default function ActiveDeliveries({ deliveries = [] }: ActiveDeliveriesProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    deliveries.length > 0 ? deliveries[0] : null
  );

  // Only display deliveries supplied by the live courier workflow.
  const activeDeliveries = deliveries;
  const displayDelivery = selectedDelivery || activeDeliveries[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'arrived_pickup':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'arrived_dropoff':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'arrived_pickup':
        return 'Arrived at Pickup';
      case 'arrived_dropoff':
        return 'Arrived at Dropoff';
      case 'accepted':
        return 'Accepted';
      default:
        return 'Unknown';
    }
  };

  if (activeDeliveries.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-semibold">No active deliveries</p>
            <p className="text-sm text-muted-foreground mt-1">Accept a job to start earning</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Delivery List */}
      <div className="lg:col-span-1 space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground mb-4">Active Deliveries ({activeDeliveries.length})</h3>
        {activeDeliveries.map((delivery) => (
          <Card
            key={delivery.id}
            className={`cursor-pointer transition-all border-l-4 ${
              selectedDelivery?.id === delivery.id
                ? 'border-l-accent bg-accent/5 shadow-md'
                : 'border-l-border hover:shadow-md'
            }`}
            onClick={() => setSelectedDelivery(delivery)}
          >
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{delivery.id}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(delivery.status)}`}>
                    {getStatusLabel(delivery.status)}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{delivery.dropoffAddress}</span>
                </div>
                <p className="text-xs font-medium text-accent">{delivery.customerName}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Map and Details */}
      <div className="lg:col-span-2">
        {displayDelivery && (
          <CourierDeliveryMap
            pickupLocation={{ address: displayDelivery.pickupAddress, lat: displayDelivery.pickupLat, lng: displayDelivery.pickupLng }}
            dropoffLocation={{ address: displayDelivery.dropoffAddress, lat: displayDelivery.dropoffLat, lng: displayDelivery.dropoffLng }}
            currentLocation={displayDelivery.courierLat != null && displayDelivery.courierLng != null ? { lat: displayDelivery.courierLat, lng: displayDelivery.courierLng } : undefined}
            customerName={displayDelivery.customerName}
            customerPhone={displayDelivery.customerPhone}
            packageDescription={displayDelivery.packageDescription}
            deliveryId={displayDelivery.id}
          />
        )}
      </div>
    </div>
  );
}
