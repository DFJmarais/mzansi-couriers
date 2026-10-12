import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle } from "lucide-react";

interface PricingBreakdownProps {
  baseFare: number;
  distance: number;
  distanceCost: number;
  fragileCharge?: number;
  hazmatCharge?: number;
  rushCharge?: number;
  weightCharge?: number;
  surgeMultiplier?: number;
  total: number;
  estimatedTime?: string;
  priceGuarantee?: boolean;
}

export function PricingBreakdown({
  baseFare,
  distance,
  distanceCost,
  fragileCharge = 0,
  hazmatCharge = 0,
  rushCharge = 0,
  weightCharge = 0,
  surgeMultiplier = 1,
  total,
  estimatedTime,
  priceGuarantee = true,
}: PricingBreakdownProps) {
  const subtotal = baseFare + distanceCost + fragileCharge + hazmatCharge + rushCharge + weightCharge;
  const surgeAmount = subtotal * (surgeMultiplier - 1);

  return (
    <Card className="border-2 border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Price Breakdown</CardTitle>
          {priceGuarantee && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <Check className="w-3 h-3 mr-1" />
              Price Guaranteed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base Fare */}
        <div className="flex justify-between items-center py-2 border-b border-green-100">
          <span className="text-sm text-muted-foreground">Base Fare</span>
          <span className="font-medium">R{baseFare.toFixed(2)}</span>
        </div>

        {/* Distance */}
        <div className="flex justify-between items-center py-2 border-b border-green-100">
          <span className="text-sm text-muted-foreground">
            Distance ({distance.toFixed(1)} km @ R8.50/km)
          </span>
          <span className="font-medium">R{distanceCost.toFixed(2)}</span>
        </div>

        {/* Surcharges */}
        {fragileCharge > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-green-100">
            <span className="text-sm text-muted-foreground">Fragile Item Surcharge</span>
            <span className="font-medium text-orange-600">+R{fragileCharge.toFixed(2)}</span>
          </div>
        )}

        {hazmatCharge > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-green-100">
            <span className="text-sm text-muted-foreground">Hazmat Surcharge</span>
            <span className="font-medium text-red-600">+R{hazmatCharge.toFixed(2)}</span>
          </div>
        )}

        {rushCharge > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-green-100">
            <span className="text-sm text-muted-foreground">Rush Delivery Surcharge</span>
            <span className="font-medium text-blue-600">+R{rushCharge.toFixed(2)}</span>
          </div>
        )}

        {weightCharge > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-green-100">
            <span className="text-sm text-muted-foreground">Weight Surcharge</span>
            <span className="font-medium">+R{weightCharge.toFixed(2)}</span>
          </div>
        )}

        {/* Subtotal */}
        <div className="flex justify-between items-center py-2 border-b border-green-100">
          <span className="text-sm font-semibold">Subtotal</span>
          <span className="font-semibold">R{subtotal.toFixed(2)}</span>
        </div>

        {/* Surge Multiplier */}
        {surgeMultiplier > 1 && (
          <div className="flex justify-between items-center py-2 border-b border-green-100 bg-yellow-50 px-2 rounded">
            <span className="text-sm text-muted-foreground">
              Peak Hours Surge ({(surgeMultiplier * 100).toFixed(0)}%)
            </span>
            <span className="font-medium text-yellow-700">+R{surgeAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center py-3 bg-green-100/50 px-3 rounded-lg border border-green-200">
          <span className="font-bold text-lg">Total</span>
          <span className="font-bold text-2xl text-green-700">R{total.toFixed(2)}</span>
        </div>

        {/* Estimated Time */}
        {estimatedTime && (
          <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-blue-700">
              Estimated delivery: <strong>{estimatedTime}</strong>
            </span>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground pt-2 space-y-1">
          <p>✓ This price is guaranteed and won't change</p>
          <p>✓ No hidden fees</p>
          <p>✓ Courier assigned within 2 minutes</p>
        </div>
      </CardContent>
    </Card>
  );
}
