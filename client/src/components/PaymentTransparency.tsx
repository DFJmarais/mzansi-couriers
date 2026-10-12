import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, TrendingUp, Calendar, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PaymentBreakdown {
  deliveryFare: number;
  commission: number;
  processingFee: number;
  insurance: number;
  totalDeduction: number;
  courierPayout: number;
}

export const PaymentTransparency: React.FC = () => {
  const [selectedFare, setSelectedFare] = useState(100);
  
  const calculateBreakdown = (fare: number): PaymentBreakdown => {
    const commission = fare * 0.20; // 20%
    const processingFee = fare * 0.015; // 1.5%
    const insurance = 2; // Fixed amount
    const totalDeduction = commission + processingFee + insurance;
    const courierPayout = fare - totalDeduction;
    
    return {
      deliveryFare: fare,
      commission,
      processingFee,
      insurance,
      totalDeduction,
      courierPayout,
    };
  };

  const breakdown = calculateBreakdown(selectedFare);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Transparency
          </CardTitle>
          <CardDescription>
            Clear breakdown of how your earnings are calculated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-700">
              <strong>Commission Rate: 20%</strong> | <strong>Payout Schedule: Weekly (Fridays)</strong> | <strong>Minimum Payout: R100</strong>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="schedule">Payout Schedule</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Enter Delivery Fare (R):
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={selectedFare}
                  onChange={(e) => setSelectedFare(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-lg font-semibold"
                />
              </div>

              <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Delivery Fare:</span>
                  <span className="font-semibold text-gray-900">R{breakdown.deliveryFare.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Commission (20%):</span>
                    <span className="font-semibold text-red-600">-R{breakdown.commission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Processing Fee (1.5%):</span>
                    <span className="font-semibold text-red-600">-R{breakdown.processingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Insurance Contribution:</span>
                    <span className="font-semibold text-red-600">-R{breakdown.insurance.toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Your Payout:</span>
                    <span className="text-lg font-bold text-green-600">R{breakdown.courierPayout.toFixed(2)}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    You earn {((breakdown.courierPayout / breakdown.deliveryFare) * 100).toFixed(1)}% of the delivery fare
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-1 h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Weekly Payouts</h4>
                    <p className="mt-1 text-sm text-gray-700">
                      Payouts are processed every Friday for earnings accumulated during the week.
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <h4 className="font-semibold text-gray-900">Payout Timeline:</h4>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    <li>
                      <strong>Monday - Sunday:</strong> Earnings accumulate
                    </li>
                    <li>
                      <strong>Friday:</strong> Payout processed
                    </li>
                    <li>
                      <strong>Friday - Monday:</strong> Transfer to your bank account (2-3 business days)
                    </li>
                  </ul>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <h4 className="font-semibold text-gray-900">Minimum Payout: R100</h4>
                  <p className="mt-1 text-sm text-gray-700">
                    If your weekly earnings are below R100, they will be held until the following week and combined.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <h4 className="font-semibold text-gray-900">Payment Method:</h4>
                  <p className="mt-1 text-sm text-gray-700">
                    Direct bank transfer to your registered bank account
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="font-semibold text-gray-900">Example 1: R50 Delivery</h4>
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Delivery Fare:</span>
                      <span>R50.00</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Commission (20%):</span>
                      <span>-R10.00</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Processing Fee (1.5%):</span>
                      <span>-R0.75</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Insurance:</span>
                      <span>-R2.00</span>
                    </div>
                    <div className="border-t border-gray-200 pt-1">
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Your Payout:</span>
                        <span>R37.25</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="font-semibold text-gray-900">Example 2: R200 Delivery</h4>
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Delivery Fare:</span>
                      <span>R200.00</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Commission (20%):</span>
                      <span>-R40.00</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Processing Fee (1.5%):</span>
                      <span>-R3.00</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Insurance:</span>
                      <span>-R2.00</span>
                    </div>
                    <div className="border-t border-gray-200 pt-1">
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Your Payout:</span>
                        <span>R155.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="font-semibold text-gray-900">Example 3: 15 Deliveries/Day</h4>
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Average Fare per Delivery:</span>
                      <span>R100.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of Deliveries:</span>
                      <span>15</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Daily Gross:</span>
                      <span>R1,500.00</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Daily Deductions (20% + 1.5% + insurance):</span>
                      <span>-R330.00</span>
                    </div>
                    <div className="border-t border-gray-200 pt-1">
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Daily Payout:</span>
                        <span>R1,170.00</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-1">
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Weekly Payout (5 days):</span>
                        <span>R5,850.00</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-1">
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Monthly Payout (20 days):</span>
                        <span>R23,400.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Alert className="border-green-200 bg-green-50">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-700">
              <strong>Tip:</strong> More deliveries = Higher earnings. Complete 15-20 deliveries per day to earn R1,170-R1,560 daily (R23,400-R31,200 monthly).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
