import React from 'react';
import { Link } from 'wouter';

export default function Refund() {
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
          <h1 className="text-4xl font-bold mb-2">Refund Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last Updated: June 1, 2026 | Effective Date: June 1, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">Overview</h2>
            <p>
              This Refund Policy explains when and how refunds are issued for deliveries made through Mzansi Couriers. Please read this carefully to understand your rights and responsibilities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Customer Refund Policy</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Refundable Scenarios</h3>
            <p><strong>Full Refund - 100%</strong></p>
            <p>You are eligible for a full refund in the following situations:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Delivery Not Completed:</strong> Courier fails to complete the delivery, courier cancels after accepting, delivery is lost, or customer cancels before courier acceptance</li>
              <li><strong>Courier No-Show:</strong> Courier does not arrive within 30 minutes of scheduled pickup or does not respond to communication attempts</li>
              <li><strong>System Error:</strong> Incorrect price charged, duplicate charge, technical glitch, or payment processing error</li>
              <li><strong>Damaged Package:</strong> Package arrives damaged, opened, or with missing contents</li>
            </ul>

            <p><strong>Partial Refund - 50%</strong></p>
            <p>You are eligible for a partial refund in the following situations:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Late Delivery:</strong> Delivery arrives more than 2 hours late or after agreed time window</li>
              <li><strong>Wrong Item Delivered:</strong> Courier delivers to wrong address or delivers wrong package</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Non-Refundable Scenarios</h3>
            <p><strong>No Refund - 0%</strong></p>
            <p>You are NOT eligible for a refund in the following situations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Change of Mind:</strong> You change your mind after courier acceptance or no longer need the delivery</li>
              <li><strong>Successful Delivery:</strong> Package is delivered as agreed, on time, and in good condition</li>
              <li><strong>Customer Cancellation:</strong> You cancel after courier has accepted or started pickup</li>
              <li><strong>Customer Unavailability:</strong> You are not available for delivery or do not answer calls/messages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Refund Process</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 How to Request a Refund</h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>Email mzansicouriers@yahoo.com from the address associated with your account</li>
              <li>Include the delivery tracking code and explain the issue</li>
              <li>Provide evidence (photos, screenshots, GPS data) where relevant</li>
              <li>Support will review the request and respond by email</li>
            </ol>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Refund Timeline</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Request Deadline:</strong> Within 7 days of delivery date</li>
              <li><strong>Support Review:</strong> 1-2 business days</li>
              <li><strong>Refund Approval:</strong> 3-5 business days</li>
              <li><strong>Bank Processing:</strong> 3-5 business days</li>
              <li><strong>Total Time:</strong> 7-12 business days</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Refund Method</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refunds are issued to your original payment method</li>
              <li>If you paid by card, refund goes back to your card</li>
              <li>If you paid by bank transfer, refund goes to your bank account</li>
              <li>You can check refund status in the app</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Courier Refund Policy</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Courier Earnings</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Once a delivery is completed, earnings cannot be refunded</li>
              <li>Earnings are paid out daily</li>
              <li>Earnings are non-refundable except in cases of fraud</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Exceptions</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fraudulent delivery (not actually completed)</li>
              <li>Courier engaged in illegal activity</li>
              <li>Courier violated terms of service</li>
              <li>Chargeback or payment dispute</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Dispute Resolution</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 If You Disagree with Our Decision</h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>Contact support within 7 days of decision</li>
              <li>Provide additional evidence or explanation</li>
              <li>Our team will review your appeal</li>
              <li>We will make a final decision within 5 business days</li>
            </ol>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 What We Consider</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>GPS tracking data</li>
              <li>Delivery photos and timestamps</li>
              <li>Customer and courier ratings, where available</li>
              <li>Support email correspondence</li>
              <li>Previous dispute history</li>
              <li>Evidence you provide</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Special Circumstances</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Lost or Damaged Packages</h3>
            <p><strong>Without Insurance:</strong></p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Maximum refund: delivery fee only</li>
              <li>We are not liable for package contents</li>
              <li>You assume risk of package value</li>
            </ul>

            <p><strong>With Insurance:</strong></p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Maximum refund: declared package value</li>
              <li>Insurance covers loss or damage</li>
              <li>Claim must be filed within 7 days</li>
              <li>We will assess claim based on evidence</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Force Majeure</h3>
            <p>In case of natural disasters, severe weather, road closures, or government restrictions:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full refund of delivery fee</li>
              <li>Reschedule delivery for later date</li>
              <li>Store credit for future deliveries</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Fraud Prevention</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Fraudulent Refund Requests</h3>
            <p>We investigate claims of fake damage, false non-delivery, duplicate requests, or collusion.</p>
            <p><strong>If Fraud is Detected:</strong></p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Refund will be denied</li>
              <li>Account may be suspended</li>
              <li>Legal action may be pursued</li>
              <li>Police may be contacted</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Repeated Refund Requests</h3>
            <p>If you request multiple refunds in a short time or have a high refund rate, we may investigate your account.</p>
            <p><strong>Possible Actions:</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account suspension</li>
              <li>Refund denial</li>
              <li>Legal action</li>
              <li>Police report</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Contact Information</h2>
            <div className="bg-card p-4 rounded-lg">
              <p><strong>For Refund Questions:</strong></p>
              <p>Email: <a href="mailto:mzansicouriers@yahoo.com" className="text-primary hover:underline">mzansicouriers@yahoo.com</a></p>
              <p>Support: <Link href="/support" className="text-primary hover:underline">Open the support page</Link></p>
              <p className="mt-4 text-sm"><strong>Response Time:</strong> Email within 24 hours during published support hours</p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Last Updated: June 1, 2026 | Version: 1.0
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
