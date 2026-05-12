import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Loader2 } from 'lucide-react';

interface SurgeInfoProps {
  basePrice?: number;
  showFullPage?: boolean;
}

export function SurgePricingDisplay({ basePrice, showFullPage = false }: SurgeInfoProps) {
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout>();

  // Calculate current surge multiplier
  const { data: surge, isLoading: surgeLoading, refetch } = trpc.surgePricing.calculateMultiplier.useQuery();

  // Calculate final price if basePrice provided
  const { data: priceInfo, isLoading: priceLoading } = trpc.surgePricing.calculateFinalPrice.useQuery(
    { basePrice: basePrice || 0 },
    { enabled: basePrice !== undefined }
  );

  // Refresh surge multiplier every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);
    setRefreshInterval(interval);
    return () => clearInterval(interval);
  }, [refetch]);

  if (!showFullPage) {
    // Compact display for embedding in other pages
    if (surgeLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking surge pricing...
        </div>
      );
    }

    if (!surge?.isActive) {
      return (
        <div className="text-sm text-green-600 font-semibold">
          ✓ Base pricing active
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <TrendingUp className="h-5 w-5 text-orange-600" />
        <div>
          <p className="font-semibold text-orange-900">Surge Pricing Active</p>
          <p className="text-sm text-orange-700">
            {surge.multiplier}x multiplier • {surge.reason}
          </p>
        </div>
      </div>
    );
  }

  // Full page display
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            📈 Surge Pricing
          </h1>
          <p className="text-slate-600">Real-time pricing adjustments based on demand</p>
        </div>

        {/* Current Status */}
        {surgeLoading ? (
          <Card className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading surge pricing...</p>
          </Card>
        ) : (
          <Card className={`p-8 border-2 ${surge?.isActive ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
            <div className="text-center">
              <div className="text-5xl mb-4">
                {surge?.isActive ? '📈' : '✓'}
              </div>
              <h2 className={`text-3xl font-bold mb-2 ${surge?.isActive ? 'text-orange-600' : 'text-green-600'}`}>
                {surge?.isActive ? 'Surge Pricing Active' : 'Base Pricing'}
              </h2>
              <div className="text-6xl font-bold mb-4">
                {surge?.multiplier}x
              </div>
              <p className={`text-lg font-semibold capitalize ${surge?.isActive ? 'text-orange-700' : 'text-green-700'}`}>
                {surge?.reason?.replace(/_/g, ' ')}
              </p>
            </div>
          </Card>
        )}

        {/* Price Calculation */}
        {basePrice !== undefined && priceInfo && (
          <Card className="p-6 border-2 border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Price Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Base Price:</span>
                <span className="font-semibold text-slate-900">R{priceInfo.basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Surge Multiplier:</span>
                <span className="font-semibold text-slate-900">{priceInfo.multiplier}x</span>
              </div>
              {priceInfo.savings > 0 && (
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-orange-700">Surge Charge:</span>
                  <span className="font-semibold text-orange-600">+R{priceInfo.savings.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <span className="text-lg font-bold text-blue-900">Final Price:</span>
                <span className="text-2xl font-bold text-blue-600">R{priceInfo.finalPrice.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* How It Works */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            How Surge Pricing Works
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✓ <strong>Peak Hours:</strong> Prices increase during high-demand times (lunch, evening rush)</li>
            <li>✓ <strong>High Demand:</strong> When many deliveries are pending, multipliers activate</li>
            <li>✓ <strong>Real-time:</strong> Multipliers update every 5 minutes based on current demand</li>
            <li>✓ <strong>Fair Pricing:</strong> Couriers earn more during peak times, customers pay for faster service</li>
            <li>✓ <strong>Transparent:</strong> You always see the breakdown before confirming your delivery</li>
          </ul>
        </Card>

        {/* Peak Hours Info */}
        <Card className="p-6 border-2 border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4">Typical Peak Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-semibold text-orange-900">Morning Rush</p>
              <p className="text-sm text-orange-700">7:00 AM - 9:00 AM</p>
              <p className="text-lg font-bold text-orange-600 mt-2">1.25x - 1.5x</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-semibold text-orange-900">Lunch Peak</p>
              <p className="text-sm text-orange-700">12:00 PM - 2:00 PM</p>
              <p className="text-lg font-bold text-orange-600 mt-2">1.5x - 2.0x</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-semibold text-orange-900">Evening Rush</p>
              <p className="text-sm text-orange-700">5:00 PM - 7:00 PM</p>
              <p className="text-lg font-bold text-orange-600 mt-2">1.5x - 2.0x</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-green-900">Off-Peak</p>
              <p className="text-sm text-green-700">Other times</p>
              <p className="text-lg font-bold text-green-600 mt-2">1.0x (Base)</p>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-6 bg-amber-50 border-amber-200">
          <h3 className="font-bold text-slate-900 mb-3">💡 Money-Saving Tips</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Schedule deliveries during off-peak hours for lower prices</li>
            <li>• Use our delivery scheduling feature to lock in base prices</li>
            <li>• Check surge pricing before confirming your order</li>
            <li>• Urgent deliveries during peak hours cost more but guarantee faster service</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

// Full page component
export default function SurgePricingPage() {
  return <SurgePricingDisplay showFullPage={true} />;
}
