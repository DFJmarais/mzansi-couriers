import React from 'react';
import { Link } from 'wouter';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4">
          <Link href="/" className="text-lg font-bold text-foreground hover:text-primary">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="container py-12 max-w-3xl">
        <article className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last Updated: September 29, 2026 | Effective Date: September 29, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Mzansi Couriers application ("App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the App.
            </p>
            <p>
              Mzansi Couriers ("we," "us," "our," or "Platform") is a peer-to-peer logistics platform that connects customers with independent courier contractors to facilitate delivery services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Minimum Age:</strong> You must be at least 18 years old to use this App</li>
              <li><strong>Customers:</strong> Must be 18+ to book deliveries</li>
              <li><strong>Couriers:</strong> Must be 18+ to accept and complete deliveries</li>
              <li><strong>Verification:</strong> We reserve the right to verify your age and identity at any time</li>
            </ul>
            <p className="mt-4">
              By using this App, you represent and warrant that you meet these eligibility requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">Account Registration</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to provide accurate, current, and complete information during registration</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Account Termination</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>We may terminate or suspend your account at any time for violations of these Terms</li>
              <li>Upon account deletion, we retain your data for 6 months for legal and compliance purposes</li>
              <li>After 6 months, all personal data is permanently deleted unless required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">4. User Roles and Responsibilities</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">Customers</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Book deliveries through the App</li>
              <li>Provide accurate pickup and delivery addresses</li>
              <li>Ensure packages comply with our Prohibited Items policy</li>
              <li>Pay the agreed delivery fee plus any optional insurance</li>
              <li>Accept responsibility for package contents</li>
              <li>Provide accurate package descriptions and weights</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Couriers</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accept delivery jobs voluntarily</li>
              <li>Complete deliveries as agreed with customers</li>
              <li>Maintain vehicle and proper licensing</li>
              <li>Follow traffic laws and safety regulations</li>
              <li>Communicate professionally with customers</li>
              <li>Are <strong>independent contractors</strong>, not employees</li>
              <li>Receive no employment benefits or insurance through Mzansi Couriers</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Driver fatigue and safe operating limits</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Do not drive or accept a route when tired, impaired, unwell, or otherwise unable to operate safely.</li>
              <li>The platform records route GPS activity, parcel custody events, and delivery-run times to support safety, incident review, and accurate earnings records.</li>
              <li>Protective platform controls limit new pickup and relay notifications to a maximum of 2,500 kilometres and 60 driving hours in a UTC week, with a 12-hour daily driving threshold.</li>
              <li>When a threshold is reached, new pickup notifications are paused until the required cooldown or the next weekly operating period. A courier must use the rest period and must not attempt to bypass the control with another account.</li>
              <li>These platform limits are safety controls and do not replace South African road-traffic law, occupational health and safety requirements, or a courier's duty to stop whenever it is unsafe to continue.</li>
              <li>Couriers must keep location sharing accurate during active delivery work and must report a safety concern, delay, or incident promptly through the App.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Prohibited Items</h2>
            <p>The following items cannot be delivered through Mzansi Couriers:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Weapons (firearms, explosives, ammunition)</li>
              <li>Illegal drugs or controlled substances</li>
              <li>Hazardous materials (flammable, toxic, radioactive)</li>
              <li>Stolen goods</li>
              <li>Counterfeit items</li>
              <li>Perishable items without proper packaging</li>
              <li>Live animals</li>
              <li>Human remains</li>
              <li>Items that violate South African law</li>
            </ul>
            <p>
              <strong>Violation:</strong> If a courier discovers prohibited items, they may refuse delivery. The customer forfeits the delivery fee and may face account suspension.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Liability and Responsibility</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">Lost or Damaged Packages</h3>
            <p className="mb-4">
              <strong>Responsibility:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Courier is responsible for safe handling and delivery of packages</li>
              <li>Mzansi Couriers is a platform only and does not assume liability for lost or damaged items</li>
              <li>Customer assumes risk of package contents unless optional insurance is purchased</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Insurance Option</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Customers may purchase optional delivery insurance</li>
              <li>Insurance covers loss or damage up to the declared package value</li>
              <li>Insurance claims must be filed within 7 days of delivery</li>
              <li>Claims are assessed based on evidence (photos, courier statement, GPS tracking)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Payment and Fees</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">Delivery Fees</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Fees are calculated based on distance, package size, and demand</li>
              <li>Prices are displayed before confirming the booking</li>
              <li>Customers pay Mzansi Couriers for delivery services</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Platform Commission</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Mzansi Couriers retains 15% commission from each delivery</li>
              <li>Remaining amount is paid to the courier (minus any refunds or disputes)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Payment Processing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payments are processed via Paystack</li>
              <li>All transactions are secure and encrypted</li>
              <li>Payment receipts are provided immediately</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Courier Payments and Payouts</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">Payment Schedule</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Couriers are paid weekly on Fridays</li>
              <li>Payments include all deliveries completed in that week</li>
              <li>Funds are held for up to 5 business days for verification</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Payout Method</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payments are transferred directly to courier bank accounts</li>
              <li>Couriers must provide valid bank account details</li>
              <li>Transfers are processed via Paystack</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Dispute Resolution</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">How Disputes Are Handled</h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>Customer or courier initiates a dispute by emailing mzansicouriers@yahoo.com with the delivery tracking code</li>
              <li>Our system reviews GPS tracking data, delivery timestamps, and communication history</li>
              <li>Support team conducts manual review if needed</li>
              <li>Resolution decision is communicated to both parties</li>
            </ol>

            <h3 className="text-xl font-semibold mt-6 mb-3">Evidence Used</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>GPS tracking from delivery</li>
              <li>Delivery photos and timestamps</li>
              <li>Customer and courier ratings</li>
              <li>Support email correspondence</li>
              <li>Previous dispute history</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Mzansi Couriers is provided "as is" without warranties</li>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to the amount paid for the delivery</li>
              <li>We are not responsible for third-party conduct or services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Mzansi Couriers from any claims, damages, or losses arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the App</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any law</li>
              <li>Disputes with other users</li>
              <li>Your package contents</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">12. Modifications to Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Mzansi Couriers may modify these Terms at any time</li>
              <li>Changes become effective upon posting to the App</li>
              <li>Continued use of the App constitutes acceptance of modified Terms</li>
              <li>We will notify users of material changes via in-app notification</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">13. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of South Africa. Any legal action or proceeding shall be brought exclusively in the courts of South Africa.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">14. Contact Us</h2>
            <p>
              For questions about these Terms of Service, please contact:
            </p>
            <div className="bg-card p-4 rounded-lg mt-4">
              <p><strong>Email:</strong> <a href="mailto:mzansicouriers@yahoo.com" className="text-primary hover:underline">mzansicouriers@yahoo.com</a></p>
              <p><strong>Email Support:</strong> mzansicouriers@yahoo.com (Mon–Fri, 9:00 AM–5:00 PM SAST)</p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              By using Mzansi Couriers, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last Updated: June 1, 2026 | Version: 1.0
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
