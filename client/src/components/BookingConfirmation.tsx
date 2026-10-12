import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, Package, Clock, DollarSign, Copy, Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface BookingFormData {
  pickupAddress: string;
  dropoffAddress: string;
  pickupCoords: {lat: number, lng: number} | null;
  dropoffCoords: {lat: number, lng: number} | null;
  pickupDetails: any;
  dropoffDetails: any;
  packageSize: 'small' | 'medium' | 'large';
  weight: string;
  description: string;
  distance: number;
  duration: number;
  estimatedPrice: number;
  trackingCode?: string;
  packageLabelPhotoUrl?: string;
}

interface BookingConfirmationProps {
  booking: BookingFormData | null;
  onNewBooking: () => void;
}

export default function BookingConfirmation({ booking, onNewBooking }: BookingConfirmationProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!booking?.trackingCode) return;
    QRCode.toDataURL(booking.trackingCode, { width: 320, margin: 2, errorCorrectionLevel: 'M' }).then(setQrDataUrl).catch(() => setQrDataUrl(''));
  }, [booking?.trackingCode]);

  if (!booking) {
    return null;
  }

  const copyTrackingCode = () => {
    if (booking.trackingCode) {
      navigator.clipboard.writeText(booking.trackingCode);
      toast.success('Tracking code copied to clipboard');
    }
  };

  const getPackageSizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      small: 'Small (< 5kg)',
      medium: 'Medium (5-15kg)',
      large: 'Large (> 15kg)'
    };
    return labels[size] || size;
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <CardTitle className="text-green-900">Booking Confirmed!</CardTitle>
              <CardDescription className="text-green-700">
                Your delivery has been successfully booked
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tracking Code */}
      {booking.trackingCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Tracking Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 bg-gray-100 p-4 rounded-lg">
              <code className="flex-1 text-lg font-mono font-bold text-gray-900">
                {booking.trackingCode}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyTrackingCode}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Save this code to track your delivery. You can share it with the recipient.
            </p>
            {booking.packageLabelPhotoUrl ? <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3"><p className="text-sm font-semibold text-green-900">Labelled parcel photo received</p><img src={booking.packageLabelPhotoUrl} alt="Your parcel showing its identification code" className="mt-2 max-h-64 w-full rounded-lg object-contain" /></div> : null}
            {qrDataUrl ? <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4 text-center"><div className="flex items-center justify-center gap-2 text-sm font-semibold text-orange-950"><QrCode className="h-4 w-4" />Sender QR code</div><img src={qrDataUrl} alt={`QR code for parcel ${booking.trackingCode}`} className="mx-auto mt-3 h-52 w-52 rounded-lg bg-white p-2" /><p className="mt-2 text-xs text-orange-900">Download or print this code and place it on the parcel. Only you, the sender, can download it from this confirmation.</p><a href={qrDataUrl} download={`mzansi-parcel-${booking.trackingCode}.png`} className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700"><Download className="h-4 w-4" />Download QR code</a></div> : null}
          </CardContent>
        </Card>
      )}

      {/* Booking Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pickup */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium text-sm">{booking.pickupAddress}</p>
            {booking.pickupDetails && (
              <div className="text-xs text-gray-600 space-y-1">
                {booking.pickupDetails.street && (
                  <p>{booking.pickupDetails.street}</p>
                )}
                {booking.pickupDetails.city && (
                  <p>{booking.pickupDetails.city}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dropoff */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium text-sm">{booking.dropoffAddress}</p>
            {booking.dropoffDetails && (
              <div className="text-xs text-gray-600 space-y-1">
                {booking.dropoffDetails.street && (
                  <p>{booking.dropoffDetails.street}</p>
                )}
                {booking.dropoffDetails.city && (
                  <p>{booking.dropoffDetails.city}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Package Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Package
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-600">Size</p>
                <Badge variant="secondary">{getPackageSizeLabel(booking.packageSize)}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-600">Weight</p>
                <p className="font-medium">{booking.weight} kg</p>
              </div>
              {booking.description && (
                <div>
                  <p className="text-xs text-gray-600">Description</p>
                  <p className="text-sm">{booking.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Delivery Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-600">Distance</p>
                <p className="font-medium">{booking.distance.toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Estimated Time</p>
                <p className="font-medium">
                  {Math.round(booking.duration / 60)} hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-600">Estimated Price</p>
                <p className="text-2xl font-bold text-orange-600">
                  R{booking.estimatedPrice.toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-gray-600">
                Final price may vary based on actual delivery conditions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onNewBooking} className="flex-1">
          Create Another Booking
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={!booking.trackingCode}
          onClick={() => {
            if (booking.trackingCode) {
              window.location.href = `/track?code=${encodeURIComponent(booking.trackingCode)}`;
            }
          }}
        >
          View Tracking
        </Button>
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>What happens next?</strong> A courier will be assigned to your delivery shortly. 
            You'll receive updates via SMS and email. Track your package using the tracking code above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
