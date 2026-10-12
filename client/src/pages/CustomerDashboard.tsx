import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, MapPin, Loader2, AlertCircle, BookOpen, Camera, CheckCircle2, Download, Printer, QrCode, Home as HomeIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import AddressSelector from '@/components/AddressSelector';
import BookingConfirmation from '@/components/BookingConfirmation';
import { trpc } from '@/lib/trpc';
import QRCode from 'qrcode';

const BOOKING_DRAFT_KEY = 'mzansi-booking-draft-v1';
const LEGACY_BOOKING_DRAFT_KEY = 'bookingFormData';

interface BookingFormData {
  pickupAddress: string;
  dropoffAddress: string;
  pickupCoords: {lat: number, lng: number} | null;
  dropoffCoords: {lat: number, lng: number} | null;
  pickupDetails: any;
  dropoffDetails: any;
  packageSize: 'small' | 'medium' | 'large';
  serviceLevel: 'economy' | 'priority' | 'express' | 'localSameDay';
  packageType: 'envelope' | 'box' | 'soft_parcel';
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  fragile: boolean;
  livestock: boolean;
  weight: string;
  description: string;
  distance: number;
  duration: number;
  estimatedPrice: number;
  customerPhone: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  trackingCode?: string;
  packageLabelPhotoUrl?: string;
}

export default function CustomerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [distanceError, setDistanceError] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingFormData | null>(null);
  const [packagingRequirementsAccepted, setPackagingRequirementsAccepted] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [parcelCode, setParcelCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [parcelPhotoKey, setParcelPhotoKey] = useState('');
  const [parcelPhotoUrl, setParcelPhotoUrl] = useState('');
  const [parcelLabelConfirmed, setParcelLabelConfirmed] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftWasResumed, setDraftWasResumed] = useState(false);
  const prepareParcelCode = trpc.customerPayments.prepareParcelCode.useMutation();
  const uploadParcelLabelPhoto = trpc.customerPayments.uploadParcelLabelPhoto.useMutation();
  const startCheckout = trpc.customerPayments.startCheckout.useMutation();
  const verifyCheckout = trpc.customerPayments.verifyCheckout.useMutation();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      prepareParcelCode.mutateAsync().then(({ trackingCode }) => setParcelCode(trackingCode)).catch(() => setPaymentError('We could not prepare your parcel identification code yet. Please try again.'));
      return;
    }
    const savedPublicCode = localStorage.getItem('mzansi-public-parcel-code');
    const publicCode = savedPublicCode || `MC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    localStorage.setItem('mzansi-public-parcel-code', publicCode);
    setParcelCode(publicCode);
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (!parcelCode) return;
    QRCode.toDataURL(parcelCode, { width: 360, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [parcelCode]);
  
  const [formData, setFormData] = useState<BookingFormData>({
    pickupAddress: '',
    dropoffAddress: '',
    pickupCoords: null,
    dropoffCoords: null,
    pickupDetails: null,
    dropoffDetails: null,
    packageSize: 'small',
    serviceLevel: 'economy',
    packageType: 'box',
    lengthCm: '30',
    widthCm: '20',
    heightCm: '15',
    fragile: false,
    livestock: false,
    weight: '0.5',
    description: '',
    distance: 0,
    duration: 0,
    estimatedPrice: 0,
    customerPhone: user?.phone || '',
    recipientName: '',
    recipientEmail: '',
    recipientPhone: ''
  });

  // tRPC queries for routing
  const calculateRouteQuery = trpc.routing.calculateRoute.useQuery(
    {
      originLat: formData.pickupCoords?.lat || 0,
      originLng: formData.pickupCoords?.lng || 0,
      destLat: formData.dropoffCoords?.lat || 0,
      destLng: formData.dropoffCoords?.lng || 0
    },
    {
      enabled: false,
      retry: false
    }
  );

  const calculatePriceQuery = trpc.routing.calculatePrice.useQuery(
    {
      distanceKm: formData.distance,
      packageSize: formData.packageSize,
      packageWeight: Number(formData.weight) || 0,
      serviceLevel: formData.serviceLevel,
      lengthCm: Number(formData.lengthCm),
      widthCm: Number(formData.widthCm),
      heightCm: Number(formData.heightCm),
    },
    {
      enabled: formData.distance > 0,
      retry: false
    }
  );

  // Complete a Paystack redirect only after the server verifies the matching transaction.
  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get('reference');
    if (!reference || bookingConfirmed) return;
    setIsSubmitting(true);
    verifyCheckout.mutateAsync({ reference })
      .then((result) => {
        if (!result.success) {
          setPaymentError(result.error || 'Payment could not be verified. No delivery was created.');
          return;
        }
        const paidBooking = result.bookingData;
        const bookingData: BookingFormData = {
          ...formData,
          pickupAddress: paidBooking?.pickup ? `${paidBooking.pickup.street}, ${paidBooking.pickup.city}` : formData.pickupAddress,
          dropoffAddress: paidBooking?.dropoff ? `${paidBooking.dropoff.street}, ${paidBooking.dropoff.city}` : formData.dropoffAddress,
          pickupCoords: paidBooking?.pickup ? { lat: Number(paidBooking.pickup.latitude), lng: Number(paidBooking.pickup.longitude) } : formData.pickupCoords,
          dropoffCoords: paidBooking?.dropoff ? { lat: Number(paidBooking.dropoff.latitude), lng: Number(paidBooking.dropoff.longitude) } : formData.dropoffCoords,
          packageSize: paidBooking?.packageSize ?? formData.packageSize,
          packageType: paidBooking?.packageType ?? formData.packageType,
          lengthCm: paidBooking?.lengthCm?.toString() ?? formData.lengthCm,
          widthCm: paidBooking?.widthCm?.toString() ?? formData.widthCm,
          heightCm: paidBooking?.heightCm?.toString() ?? formData.heightCm,
          fragile: Boolean(paidBooking?.fragile ?? formData.fragile),
          livestock: Boolean(paidBooking?.livestock ?? formData.livestock),
          weight: paidBooking?.packageWeight?.toString() ?? formData.weight,
          description: paidBooking?.packageDescription ?? formData.description,
          distance: Number(paidBooking?.distance ?? formData.distance),
          duration: Number(paidBooking?.estimatedDeliveryTime ?? formData.duration),
          estimatedPrice: Number(paidBooking?.amount ?? formData.estimatedPrice),
          customerPhone: paidBooking?.customerPhone ?? formData.customerPhone,
          recipientName: paidBooking?.recipientName ?? formData.recipientName,
          recipientEmail: paidBooking?.recipientEmail ?? formData.recipientEmail,
          recipientPhone: paidBooking?.recipientPhone ?? formData.recipientPhone,
          trackingCode: result.trackingCode,
          packageLabelPhotoUrl: paidBooking?.packageLabelPhotoKey ? `/manus-storage/${paidBooking.packageLabelPhotoKey}` : parcelPhotoUrl,
        };
        setConfirmedBooking(bookingData);
        setBookingConfirmed(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        toast.success('Payment verified. Your delivery has been created.');
      })
      .catch((error) => {
        console.error('Payment verification failed:', error);
        setPaymentError('We could not verify this payment. Please contact support before trying again.');
      })
      .finally(() => setIsSubmitting(false));
  }, []);

  // Load the complete booking draft so a sender can safely pause and resume later.
  useEffect(() => {
    const savedDraft = localStorage.getItem(BOOKING_DRAFT_KEY);
    const legacyFormData = localStorage.getItem(LEGACY_BOOKING_DRAFT_KEY);
    if (savedDraft || legacyFormData) {
      try {
        const parsed = JSON.parse(savedDraft || legacyFormData || '{}');
        const savedData = parsed.formData ?? parsed;
        setFormData(prev => ({ ...prev, ...savedData, serviceLevel: savedData.serviceLevel ?? 'economy' }));
        if (parsed.parcelCode) setParcelCode(parsed.parcelCode);
        if (parsed.parcelPhotoKey) setParcelPhotoKey(parsed.parcelPhotoKey);
        if (parsed.parcelPhotoUrl) setParcelPhotoUrl(parsed.parcelPhotoUrl);
        if (typeof parsed.parcelLabelConfirmed === 'boolean') setParcelLabelConfirmed(parsed.parcelLabelConfirmed);
        if (typeof parsed.packagingRequirementsAccepted === 'boolean') setPackagingRequirementsAccepted(parsed.packagingRequirementsAccepted);
        setDraftSavedAt(parsed.savedAt || new Date().toISOString());
        setDraftWasResumed(Boolean(savedData?.pickupAddress || savedData?.dropoffAddress || savedData?.description));
      } catch (error) {
        console.error('Failed to load saved form data:', error);
      }
    }
    const packagingAccepted = localStorage.getItem('packagingRequirementsAccepted') === 'true';
    setPackagingRequirementsAccepted(packagingAccepted);
    setDraftReady(true);
  }, []);

  // Save the complete draft automatically whenever booking progress changes.
  useEffect(() => {
    if (!draftReady || bookingConfirmed) return;
    const savedAt = new Date().toISOString();
    localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify({
      formData,
      parcelCode,
      parcelPhotoKey,
      parcelPhotoUrl,
      parcelLabelConfirmed,
      packagingRequirementsAccepted,
      savedAt,
    }));
    localStorage.setItem(LEGACY_BOOKING_DRAFT_KEY, JSON.stringify(formData));
    setDraftSavedAt(savedAt);
  }, [draftReady, bookingConfirmed, formData, parcelCode, parcelPhotoKey, parcelPhotoUrl, parcelLabelConfirmed, packagingRequirementsAccepted]);

  // Calculate distance when both coordinates are available
  useEffect(() => {
    if (formData.pickupCoords && formData.dropoffCoords) {
      calculateDistance();
    }
  }, [formData.pickupCoords, formData.dropoffCoords]);

  // Update price when distance or package size changes
  useEffect(() => {
    if (formData.distance > 0 && calculatePriceQuery.data) {
      setFormData(prev => ({
        ...prev,
        estimatedPrice: calculatePriceQuery.data?.totalPrice || 0
      }));
    }
  }, [calculatePriceQuery.data]);

  const calculateDistance = async () => {
    if (!formData.pickupCoords || !formData.dropoffCoords) {
      return;
    }

    setIsCalculating(true);
    setDistanceError('');

    try {
      const result = await calculateRouteQuery.refetch();
      
      if (result.data) {
        setFormData(prev => ({
          ...prev,
          distance: result.data.distanceKm,
          duration: result.data.durationMinutes
        }));
      } else {
        setDistanceError('We are preparing the route distance. Please check both addresses and try again.');
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      setDistanceError('We are preparing the route distance. Please check both addresses and try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePickupSelect = (address: string, coords: {lat: number, lng: number}, details?: any) => {
    console.log('Pickup selected:', { address, coords, details });
    setFormData(prev => ({
      ...prev,
      pickupAddress: address,
      pickupCoords: coords,
      pickupDetails: details
    }));
    toast.success('Pickup location added to your route.');
  };

  const handleDropoffSelect = (address: string, coords: {lat: number, lng: number}, details?: any) => {
    console.log('Dropoff selected:', { address, coords, details });
    setFormData(prev => ({
      ...prev,
      dropoffAddress: address,
      dropoffCoords: coords,
      dropoffDetails: details
    }));
    toast.success('Drop-off location added to your route.');
  };

  const handleParcelPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setPaymentError('Please choose a clear photo of the parcel showing the identification code.'); return; }
    if (file.size > 8 * 1024 * 1024) { setPaymentError('The parcel photo must be 8 MB or smaller.'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setPaymentError('');
        const result = await uploadParcelLabelPhoto.mutateAsync({ photoDataUrl: String(reader.result), photoName: file.name });
        setParcelPhotoKey(result.key);
        setParcelPhotoUrl(result.url);
        toast.success('Parcel photo uploaded securely.');
      } catch (error) {
        console.error('Parcel photo upload failed:', error);
        setPaymentError('We could not upload that parcel photo. Please try again.');
      }
    };
    reader.onerror = () => setPaymentError('We could not open that parcel photo. Please choose it again.');
    reader.readAsDataURL(file);
  };

  const handlePackageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sizeMap: Record<string, 'small' | 'medium' | 'large'> = {
      'Small (up to 1kg)': 'small',
      'Medium (1-5kg)': 'medium',
      'Large (5-20kg)': 'large'
    };
    const size = sizeMap[e.target.value] || 'small';
    setFormData(prev => ({
      ...prev,
      packageSize: size
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pickupAddress || !formData.dropoffAddress) {
      toast.info('Add both pickup and drop-off locations to continue.');
      return;
    }

    if (formData.distance === 0) {
      toast.info('Add verified addresses so we can prepare your route distance.');
      return;
    }

    if (!isAuthenticated) {
      localStorage.setItem('mzansi-auth-return-path', '/customer/send-package');
      toast.info('Your booking details are ready. Sign in or create an account to continue securely to payment.');
      setLocation('/auth');
      return;
    }

    setIsSubmitting(true);
    setPaymentError('');
    try {
      const toAddress = (address: string, details: any) => ({
        street: details?.street || address,
        city: details?.city || 'South Africa',
        postalCode: details?.postalCode || undefined,
        latitude: Number(details?.latitude ?? 0),
        longitude: Number(details?.longitude ?? 0),
      });
      const amount = Number(calculatePriceQuery.data?.totalPrice ?? formData.estimatedPrice);
      const result = await startCheckout.mutateAsync({
        pickup: toAddress(formData.pickupAddress, formData.pickupDetails),
        dropoff: toAddress(formData.dropoffAddress, formData.dropoffDetails),
        packageSize: formData.packageSize,
        serviceLevel: formData.serviceLevel,
        packageType: formData.packageType,
        lengthCm: Number(formData.lengthCm),
        widthCm: Number(formData.widthCm),
        heightCm: Number(formData.heightCm),
        fragile: formData.fragile,
        livestock: formData.livestock,
        packageWeight: Number(formData.weight),
        packageDescription: formData.description || undefined,
        distance: formData.distance,
        estimatedDeliveryTime: formData.duration,
        amount,
        customerEmail: user?.email || '',
        customerName: user?.name || 'Mzansi Couriers customer',
        customerPhone: formData.customerPhone.trim() || undefined,
        recipientName: formData.recipientName.trim(),
        recipientEmail: formData.recipientEmail.trim() || undefined,
        recipientPhone: formData.recipientPhone.trim() || undefined,
        callbackUrl: `${window.location.origin}/customer/send-package`,
        trackingCode: parcelCode,
        packageLabelPhotoKey: parcelPhotoKey,
        packageLabelConfirmed: true,
      });
      if (!result.success) {
        setPaymentError(result.error || 'Paystack could not start checkout.');
        return;
      }
      window.location.assign(result.authorization_url);
    } catch (error) {
      console.error('Error starting payment:', error);
      setPaymentError('Payment could not be started. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasBookingProgress = Boolean(
    formData.pickupAddress ||
    formData.dropoffAddress ||
    formData.description ||
    formData.customerPhone ||
    formData.recipientName ||
    formData.recipientEmail ||
    formData.recipientPhone ||
    parcelPhotoKey ||
    parcelLabelConfirmed ||
    formData.distance > 0,
  );

  const handleHomeNavigation = () => {
    if (hasBookingProgress) {
      const leavePage = window.confirm('Your booking progress is saved on this device. Leave the booking page and return home?');
      if (!leavePage) return;
    }
    setLocation('/');
  };

  if (bookingConfirmed && confirmedBooking) {
    return (
      <DashboardLayout>
        <BookingConfirmation booking={confirmedBooking} onNewBooking={() => {
          setBookingConfirmed(false);
          setConfirmedBooking(null);
          setParcelPhotoKey('');
          setParcelPhotoUrl('');
          setParcelLabelConfirmed(false);
          prepareParcelCode.mutateAsync().then(({ trackingCode }) => setParcelCode(trackingCode));
          setFormData({
            pickupAddress: '',
            dropoffAddress: '',
            pickupCoords: null,
            dropoffCoords: null,
            pickupDetails: null,
            dropoffDetails: null,
            packageSize: 'small',
            serviceLevel: 'economy',
            packageType: 'box',
            lengthCm: '30', widthCm: '20', heightCm: '15', fragile: false, livestock: false,
            weight: '0.5',
            description: '',
            distance: 0,
            duration: 0,
            estimatedPrice: 0,
            customerPhone: user?.phone || ''
            ,recipientName: '', recipientEmail: '', recipientPhone: ''
          });
        }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowPublic>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Send across Mzansi</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleHomeNavigation}
                  aria-label="Return home; booking progress is saved on this device"
                  className="group shrink-0 gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                  <HomeIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  Home
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Return home — your draft is saved on this device</TooltipContent>
            </Tooltip>
          </div>
          <h1 className="text-3xl font-bold">Book a delivery</h1>
          <p className="text-muted-foreground mt-1">Add the pickup and drop-off details, see your quote in Rand, then pay securely with Paystack.</p>
          {draftWasResumed ? <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">Your saved booking progress has been restored. You can continue whenever you are ready.</p> : null}
          {draftSavedAt ? <p className="mt-2 text-xs text-muted-foreground">Draft saved on this device at {new Date(draftSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p> : null}
          {!isAuthenticated ? <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">You can prepare your booking publicly. Sign in or create an account when you are ready to continue to secure payment.</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground"><span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">1. Pickup</span><span aria-hidden="true">→</span><span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">2. Route</span><span aria-hidden="true">→</span><span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">3. Drop-off</span></div>
        </div>

        {/* Packaging Requirements Info */}
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="text-orange-600" size={24} />
              Packaging Requirements
            </CardTitle>
            <CardDescription>A safe parcel starts with secure packaging and a clear label.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Every parcel must be securely packaged, properly sealed, and clearly labeled with your Parcel Identification Code. This helps the courier identify it quickly at pickup and keeps the route moving.
            </p>
            <Button
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-100"
              onClick={() => window.location.href = '/packaging-requirements'}
            >
              View Packaging Requirements
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Booking Form */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle>Delivery Details</CardTitle>
            <CardDescription>Enter your pickup and dropoff locations</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Selection */}
              <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                <AddressSelector
                  label="Pickup Location"
                  placeholder="Pickup address (e.g., 124 Main Road, Kleinmond)"
                  value={formData.pickupAddress}
                  onAddressSelect={handlePickupSelect}
                  type="pickup"
                />

                <AddressSelector
                  label="Dropoff Location"
                  placeholder="Enter dropoff address"
                  value={formData.dropoffAddress}
                  onAddressSelect={handleDropoffSelect}
                  type="dropoff"
                />
              </div>

              {/* Distance and Price Display */}
              {formData.distance > 0 && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Distance</p>
                    <p className="text-2xl font-bold text-gray-900">{formData.distance} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Duration</p>
                    <p className="text-2xl font-bold text-gray-900">{formData.duration} min</p>
                  </div>
                </div>
              )}

              {paymentError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <AlertCircle size={16} />
                  <span>{paymentError}</span>
                </div>
              )}

              {distanceError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {distanceError}
                </div>
              )}

              {isCalculating && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Calculating distance...
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="customer-phone" className="block text-sm font-medium">Phone for delivery updates (optional)</label>
                <input
                  id="customer-phone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(event) => setFormData((current) => ({ ...current, customerPhone: event.target.value }))}
                  placeholder="e.g. 082 123 4567"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">We use this only for delivery-completed WhatsApp or SMS updates when available.</p>
              </div>

              <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div>
                  <h3 className="font-semibold text-orange-950">Recipient details</h3>
                  <p className="text-xs text-orange-900/80">These details let us notify the person receiving the parcel and keep their tracking private.</p>
                </div>
                <input aria-label="Recipient name" required value={formData.recipientName} onChange={(event) => setFormData((current) => ({ ...current, recipientName: event.target.value }))} placeholder="Recipient full name" className="w-full rounded-lg border border-orange-200 bg-white px-3 py-3" />
                <input aria-label="Recipient email" type="email" value={formData.recipientEmail} onChange={(event) => setFormData((current) => ({ ...current, recipientEmail: event.target.value }))} placeholder="Recipient email (optional)" className="w-full rounded-lg border border-orange-200 bg-white px-3 py-3" />
                <input aria-label="Recipient phone" type="tel" value={formData.recipientPhone} onChange={(event) => setFormData((current) => ({ ...current, recipientPhone: event.target.value }))} placeholder="Recipient WhatsApp or SMS number (optional)" className="w-full rounded-lg border border-orange-200 bg-white px-3 py-3" />
              </div>

              {/* Package Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Package Details</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Package Size</label>
                  <select
                    value={formData.packageSize === 'small' ? 'Small (up to 1kg)' : formData.packageSize === 'medium' ? 'Medium (1-5kg)' : 'Large (5-20kg)'}
                    onChange={handlePackageSizeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option>Small (up to 1kg)</option>
                    <option>Medium (1-5kg)</option>
                    <option>Large (5-20kg)</option>
                  </select>
                </div>

                <fieldset className="space-y-2">
                  <legend className="block text-sm font-medium">Delivery service</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {([
                      ['economy', 'Economy', 'Best value; consolidated routes'],
                      ['priority', 'Priority', 'Faster route allocation'],
                      ['express', 'Express', 'Dedicated or next-available capacity'],
                    ] as const).map(([value, label, description]) => (
                      <label key={value} className={`cursor-pointer rounded-lg border px-3 py-3 text-sm transition-colors ${formData.serviceLevel === value ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-white hover:border-orange-400'}`}>
                        <input type="radio" name="service-level" value={value} checked={formData.serviceLevel === value} onChange={() => setFormData(prev => ({ ...prev, serviceLevel: value }))} className="mr-2 h-4 w-4 accent-orange-500" />
                        <span className="font-medium">{label}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <fieldset className="space-y-2">
                  <legend className="block text-sm font-medium">What are you sending?</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {([
                      ['envelope', 'Envelope'],
                      ['box', 'Box'],
                      ['soft_parcel', 'Soft parcel'],
                    ] as const).map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm hover:border-orange-400">
                        <input type="radio" name="package-type" value={value} checked={formData.packageType === value} onChange={() => setFormData(prev => ({ ...prev, packageType: value }))} className="h-4 w-4 accent-orange-500" />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="block text-sm font-medium">Parcel dimensions (cm)</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {([['lengthCm', 'Length'], ['widthCm', 'Width'], ['heightCm', 'Height']] as const).map(([field, label]) => (
                      <label key={field} className="text-xs font-medium text-muted-foreground">{label}
                        <input aria-label={`${label} in centimetres`} type="number" min="1" step="0.1" value={formData[field]} onChange={event => setFormData(prev => ({ ...prev, [field]: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-foreground" />
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Enter the parcel’s outside measurements so the courier can plan vehicle space.</p>
                </fieldset>

                <fieldset className="grid gap-2 sm:grid-cols-2">
                  <legend className="sr-only">Special handling</legend>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm"><input type="checkbox" checked={formData.fragile} onChange={event => setFormData(prev => ({ ...prev, fragile: event.target.checked }))} className="h-4 w-4 accent-orange-500" />Fragile — handle with care</label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm"><input type="checkbox" checked={formData.livestock} onChange={event => setFormData(prev => ({ ...prev, livestock: event.target.checked }))} className="h-4 w-4 accent-orange-500" />Live stock / living items</label>
                </fieldset>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="What are you sending? (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Price Summary */}
              {calculatePriceQuery.data && formData.distance > 0 && (
                <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between">
                    <span className="text-gray-700">{calculatePriceQuery.data.serviceLevel} tariff · {calculatePriceQuery.data.weightBand}</span>
                    <span className="font-semibold">R{calculatePriceQuery.data.basePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">{calculatePriceQuery.data.routeBand} route adjustment</span>
                    <span className="font-semibold">R{calculatePriceQuery.data.distanceCharge}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Billable weight</span>
                    <span>{calculatePriceQuery.data.billableWeightKg} kg</span>
                  </div>
                  <div className="border-t border-green-300 pt-3 flex justify-between">
                    <span className="font-bold">Estimated Total</span>
                    <span className="text-2xl font-bold text-green-700">R{calculatePriceQuery.data.totalPrice}</span>
                  </div>
                </div>
              )}

              {/* Mandatory parcel identification evidence */}
              <div className="space-y-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-orange-950"><Camera className="h-5 w-5 text-orange-600" />Label and photograph your parcel</h3>
                  <p className="mt-1 text-sm text-orange-900">Write or print this code clearly on the outside of the sealed parcel. Before payment, take one clear photo showing the parcel and the complete code.</p>
                </div>
                <div className="rounded-lg bg-white p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your parcel identification code</p><p className="mt-1 break-all font-mono text-2xl font-bold tracking-wide text-slate-950">{parcelCode || 'Preparing your code…'}</p><p className="mt-2 text-xs text-slate-600">Write this code clearly on the parcel. The QR code below contains the same identification code.</p></div>
                {qrDataUrl ? <div className="rounded-lg border border-orange-200 bg-white p-4 text-center"><div className="flex items-center justify-center gap-2 text-sm font-semibold text-orange-950"><QrCode className="h-4 w-4" />Parcel QR code</div><img src={qrDataUrl} alt={`QR code for parcel ${parcelCode}`} className="mx-auto mt-3 h-48 w-48 rounded-lg border border-slate-200 bg-white p-2" /><p className="mt-2 text-xs text-orange-900">Download or print this QR code and place it next to the parcel identification code.</p><div className="mt-3 flex flex-wrap justify-center gap-2"><a href={qrDataUrl} download={`mzansi-parcel-${parcelCode}.png`} className="inline-flex h-10 items-center gap-2 rounded-md bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700"><Download className="h-4 w-4" />Download QR</a><Button type="button" variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" />Print code</Button></div></div> : null}
                <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-orange-400 bg-white px-4 py-3 text-center font-semibold text-orange-800 hover:bg-orange-100"><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => handleParcelPhoto(event.target.files?.[0])} />{uploadParcelLabelPhoto.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}{uploadParcelLabelPhoto.isPending ? 'Uploading parcel photo…' : parcelPhotoKey ? 'Replace parcel photo' : 'Take photo of labelled parcel'}</label>
                {parcelPhotoUrl ? <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-green-800"><CheckCircle2 className="h-4 w-4" />Parcel photo received — check that the full code is visible</div><img src={parcelPhotoUrl} alt="Preview of your labelled parcel" className="max-h-48 w-full rounded-lg border border-green-200 bg-white object-contain" /></div> : <p className="text-xs text-orange-900">A photo is required before you can continue to Paystack.</p>}
                <label className="flex items-start gap-3 text-sm text-orange-950"><input type="checkbox" checked={parcelLabelConfirmed} onChange={(event) => setParcelLabelConfirmed(event.target.checked)} className="mt-1 h-4 w-4" /><span>I confirm that the code above is written or printed clearly on this parcel and is visible in the photo.</span></label>
              </div>

              {/* Packaging Requirements Warning */}
              {!packagingRequirementsAccepted && (
                <div className="flex flex-wrap items-center gap-3 rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="flex-1">Accept all packaging declarations before you can continue to secure Paystack payment.</span>
                  <a href="/packaging-requirements" className="inline-flex items-center gap-1 font-semibold text-orange-800 underline underline-offset-2 hover:text-orange-950">
                    Open Packaging Requirements
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !formData.pickupAddress || !formData.dropoffAddress || formData.distance === 0 || !packagingRequirementsAccepted || !parcelCode || !parcelPhotoKey || !parcelLabelConfirmed}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Paystack
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
