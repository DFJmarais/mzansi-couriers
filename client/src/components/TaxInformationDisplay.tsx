import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, DollarSign, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const TaxInformationDisplay: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Tax Information for Couriers
          </CardTitle>
          <CardDescription>
            Important information about your tax obligations as an independent contractor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-700">
              As an independent contractor, you are responsible for your own taxes. Mzansi Couriers is not your employer.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900">1. SARS Registration</h4>
              <p className="mt-2 text-sm text-gray-700">
                You must register with the South African Revenue Service (SARS) as a self-employed person if your annual income exceeds R23,800.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.sars.gov.za" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    Visit SARS Website
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900">2. Income Declaration</h4>
              <p className="mt-2 text-sm text-gray-700">
                You must declare all earnings from Mzansi Couriers to SARS. We will provide you with an earnings statement annually.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                <li>• Annual earnings statement provided by January 31st</li>
                <li>• Use this for your tax return filing</li>
                <li>• Keep records of all deliveries and earnings</li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900">3. Tax Payment</h4>
              <p className="mt-2 text-sm text-gray-700">
                You are responsible for calculating and paying your own taxes. The standard income tax rate for self-employed individuals is:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                <li>• 18% - 45% depending on your income bracket</li>
                <li>• Plus 2% unemployment insurance levy (UIF)</li>
                <li>• You can claim business expenses as deductions</li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900">4. Deductible Business Expenses</h4>
              <p className="mt-2 text-sm text-gray-700">
                You can deduct the following expenses from your taxable income:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                <li>• Vehicle fuel and maintenance</li>
                <li>• Vehicle insurance</li>
                <li>• Vehicle registration and licensing</li>
                <li>• Phone and internet costs</li>
                <li>• Vehicle depreciation</li>
                <li>• Repairs and spare parts</li>
                <li>• Parking and toll fees</li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900">5. Record Keeping</h4>
              <p className="mt-2 text-sm text-gray-700">
                Keep detailed records of:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                <li>• All deliveries completed and earnings</li>
                <li>• All business expenses and receipts</li>
                <li>• Vehicle maintenance and repairs</li>
                <li>• Fuel purchases</li>
                <li>• Insurance payments</li>
                <li>• Keep records for at least 5 years</li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900">6. Tax Filing Deadline</h4>
              <p className="mt-2 text-sm text-gray-700">
                Tax returns must be filed by:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                <li>• November 30th each year (standard deadline)</li>
                <li>• December 15th if filing online</li>
                <li>• Penalties apply for late filing</li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900">7. Earnings Statement</h4>
              <p className="mt-2 text-sm text-gray-700">
                Mzansi Couriers will provide you with:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                <li>• Annual earnings statement (by January 31st)</li>
                <li>• Monthly earnings breakdown</li>
                <li>• Commission deductions</li>
                <li>• Use this for tax filing</li>
              </ul>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <h4 className="font-semibold text-orange-900">⚠️ Important Reminders</h4>
              <ul className="mt-3 space-y-1 text-sm text-orange-800">
                <li>• You are NOT an employee - no PAYE deductions</li>
                <li>• You must pay your own taxes</li>
                <li>• You are not eligible for unemployment benefits</li>
                <li>• You must maintain your own insurance</li>
                <li>• Penalties for non-compliance can be severe</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="font-semibold text-gray-900">Need Help?</h4>
            <p className="mt-2 text-sm text-gray-700">
              We recommend consulting with a tax professional or accountant to ensure you comply with all tax obligations.
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.sars.gov.za" target="_blank" rel="noopener noreferrer">
                  SARS Website
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:mzansicouriers@yahoo.com">
                  Contact Support
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
