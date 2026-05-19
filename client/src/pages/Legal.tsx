import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Shield, Truck, RotateCcw } from "lucide-react";

export default function Legal() {
  const [activeTab, setActiveTab] = useState("terms");

  const sections = [
    {
      id: "terms",
      label: "Terms of Service",
      icon: FileText,
      title: "Terms of Service",
      description: "Our complete terms and conditions",
    },
    {
      id: "privacy",
      label: "Privacy Policy",
      icon: Shield,
      title: "Privacy Policy",
      description: "How we protect your data",
    },
    {
      id: "delivery",
      label: "Delivery Policy",
      icon: Truck,
      title: "Delivery & Shipping Policy",
      description: "Our delivery terms and conditions",
    },
    {
      id: "refund",
      label: "Refund Policy",
      icon: RotateCcw,
      title: "Refund & Dispute Policy",
      description: "How we handle refunds and disputes",
    },
  ];

  const termsContent = `
# Terms of Service - Mzansi Couriers

## 1. Acceptance of Terms
By accessing and using the Mzansi Couriers application, you agree to be bound by these Terms of Service.

## 2. Eligibility
- Minimum Age: You must be at least 18 years old to use this App
- Customers: Must be 18+ to book deliveries
- Couriers: Must be 18+ to accept and complete deliveries

## 3. User Accounts
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

## 4. Prohibited Items
The following items cannot be delivered:
- Weapons (firearms, explosives, ammunition)
- Illegal drugs or controlled substances
- Hazardous materials (flammable, toxic, radioactive)
- Stolen goods or counterfeit items
- Perishable items without proper packaging
- Live animals
- Items that violate South African law

## 5. Liability and Responsibility
- Courier is responsible for safe handling and delivery of packages
- Mzansi Couriers is a platform only and does not assume liability for lost or damaged items
- Customers may purchase optional delivery insurance
- Platform liability is limited to the delivery fee paid

## 6. Refund Policy
- Refund requests must be submitted within 7 days of delivery date
- Refunds are processed within 3-5 business days
- Refunds are issued to original payment method

## 7. Payment and Fees
- Platform commission: 15%
- All fees are transparent with no hidden charges
- Payments are processed via Paystack

## 8. Courier Payments
- Couriers are paid weekly on Fridays
- Payments include all deliveries completed in that week
- Funds are held for up to 5 business days for verification

## 9. Dispute Resolution
Disputes are handled through automated AI review followed by manual support team review if needed.

## 10. Governing Law
These Terms are governed by the laws of South Africa.

For complete terms, please visit our website or contact support@mzansicouriers.com
  `;

  const privacyContent = `
# Privacy Policy - Mzansi Couriers

## 1. Information We Collect
- Account information (name, email, phone, date of birth)
- Location data (GPS coordinates during deliveries)
- Device information (device type, OS, app version)
- Usage data (pages visited, features used, time spent)
- Payment information (processed securely by Paystack)

## 2. How We Use Your Information
- Service delivery and matching customers with couriers
- Verification and safety checks
- App improvement and analytics
- Communication and notifications
- Legal compliance

## 3. Data Retention
- Active user accounts: Data retained while account is active
- After account deletion: Data retained for 6 months for legal purposes
- Delivery records: Retained for 6 months for dispute resolution
- Payment records: Retained for 7 years (tax requirement)

## 4. Data Sharing
We share data with:
- Service providers (Paystack, Twilio, Google Maps)
- Law enforcement (if required by court order)
- We do NOT sell your data to third parties

## 5. Security
- Encryption of data in transit (HTTPS/TLS)
- Secure password hashing
- Access controls and authentication
- Regular security audits

## 6. Your Rights
- Access and correct your personal data
- Delete your account (data retained for 6 months)
- Opt-out of marketing communications
- Request data in portable format

## 7. POPIA Compliance
Mzansi Couriers complies with the Protection of Personal Information Act (POPIA) of South Africa.

For complete privacy information, please contact privacy@mzansicouriers.com
  `;

  const deliveryContent = `
# Delivery & Shipping Policy - Mzansi Couriers

## 1. Service Coverage
- Service Area: Entire South Africa
- No Geographic Exclusions
- Deliveries available 24/7

## 2. Booking and Acceptance
- Booking is confirmed upon payment
- Courier acceptance is not guaranteed
- If no courier accepts within 30 minutes, booking is cancelled and refunded

## 3. Package Requirements
- Small: Up to 5 kg
- Medium: 5-20 kg
- Large: 20-50 kg

## 4. Pricing
- Fees calculated based on distance, size, weight, and demand
- Platform commission: 15%
- Optional insurance available
- No hidden charges

## 5. Delivery Process
- Pickup within 30 minutes of estimated time
- Real-time GPS tracking
- Delivery confirmation with photo
- Recipient must confirm receipt

## 6. Delivery Times
- Same-Day Delivery: 2-4 hours (within city)
- Express Delivery: 1-2 hours (premium)
- Standard Delivery: 4-8 hours
- Next-Day Delivery: 24 hours

## 7. Damage and Loss
- Courier is responsible for safe handling
- Optional insurance covers loss or damage
- Claims must be filed within 7 days
- Without insurance: No compensation

## 8. Refunds and Cancellations
- Cancellation before pickup: Full refund
- Cancellation after pickup: Not refundable
- Delivery not completed: Full refund
- Courier no-show: Full refund

## 9. Courier Conduct
- Professional and courteous service required
- Prohibited: Harassment, theft, reckless driving
- Report misconduct through in-app support

For complete delivery information, please contact support@mzansicouriers.com
  `;

  const refundContent = `
# Refund & Dispute Policy - Mzansi Couriers

## 1. Refund Eligibility
Refunds ARE available for:
- Delivery not completed
- Courier no-show (>1 hour late)
- System errors
- Courier cancellation
- Significant delays (>2 hours)

Refunds ARE NOT available for:
- Customer change of mind
- Recipient refusal
- Delivery completed successfully
- Minor delays (<2 hours)

## 2. Refund Request Process
1. Contact support within 7 days of delivery
2. Provide delivery reference and reason
3. Support team investigates (3-5 business days)
4. Decision communicated
5. Refund processed (3-5 business days)

## 3. Dispute Resolution
- Automated AI review of GPS tracking and timestamps
- Manual review by support team if needed
- Investigation within 3-5 business days
- Decision explained to both parties

## 4. Resolution Options
- Refund Approved: Full or partial refund issued
- Refund Denied: Decision explained
- Appeal: Available within 7 days

## 5. Special Cases
- Lost packages: GPS tracking reviewed
- Damaged packages: Photos and evidence assessed
- Wrong address: Courier error = full refund + redeliver

## 6. Appeal Process
- Appeals must be filed within 7 days
- Require new evidence or information
- Senior staff review within 5-7 business days
- Final decision is binding

## 7. Fraud Prevention
- System monitors for repeated refund requests
- Fraud results in account suspension or termination
- Chargebacks may result in account suspension

For dispute assistance, contact disputes@mzansicouriers.com
  `;

  const contentMap: { [key: string]: string } = {
    terms: termsContent,
    privacy: privacyContent,
    delivery: deliveryContent,
    refund: refundContent,
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Legal & Policies</h1>
          <p className="text-muted-foreground">
            Read our terms, policies, and guidelines
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                <section.icon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{section.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <section.icon className="w-5 h-5" />
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {contentMap[section.id]}
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="mt-8 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Questions?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you have any questions about our policies, please contact us:
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Email:</strong> support@mzansicouriers.com
              </p>
              <p>
                <strong>In-App Support:</strong> Available 24/7
              </p>
              <p>
                <strong>Disputes:</strong> disputes@mzansicouriers.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
