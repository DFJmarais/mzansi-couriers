import React from 'react';
import { Link } from 'wouter';
import { Mail, MessageCircle, Phone, Globe } from 'lucide-react';

export default function Support() {
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
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Support & Help</h1>
          <p className="text-lg text-muted-foreground">
            We're here to help. Choose your preferred contact method below.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Email */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Mail className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-semibold">Email Support</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Send us an email and we'll respond within 24 hours.
            </p>
            <a 
              href="mailto:mzansicouriers@yahoo.com"
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              mzansicouriers@yahoo.com
            </a>
          </div>

          {/* Delivery Support */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MessageCircle className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-semibold">Delivery Support</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Contact our support team about a delivery, payment, or account issue.
            </p>
            <a
              href="mailto:mzansicouriers@yahoo.com?subject=Mzansi%20Couriers%20support"
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              Email Support
            </a>
          </div>

          {/* Support hours */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Phone className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-semibold">Support Hours</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Email support is monitored Monday through Friday, 9:00 AM–5:00 PM SAST. A phone line is not currently published.
            </p>
            <a
              href="mailto:mzansicouriers@yahoo.com?subject=Mzansi%20Couriers%20support"
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              Contact Support
            </a>
          </div>

          {/* Website */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Globe className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-semibold">Website</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Visit our website for FAQs and more information.
            </p>
            <a 
              href="https://mzansicouriers.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              Visit Website
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <details className="bg-card border border-border rounded-lg p-4 cursor-pointer group">
              <summary className="font-semibold text-foreground group-open:text-primary">
                How do I track my delivery?
              </summary>
              <p className="text-muted-foreground mt-3">
                Once your delivery is accepted by a courier, you can track it in real-time using the map view in the app. You'll see the courier's location and estimated arrival time.
              </p>
            </details>

            <details className="bg-card border border-border rounded-lg p-4 cursor-pointer group">
              <summary className="font-semibold text-foreground group-open:text-primary">
                What if my delivery is late?
              </summary>
              <p className="text-muted-foreground mt-3">
                If your delivery is more than 2 hours late, review the Refund Policy and email mzansicouriers@yahoo.com with your tracking code to request help.
              </p>
            </details>

            <details className="bg-card border border-border rounded-lg p-4 cursor-pointer group">
              <summary className="font-semibold text-foreground group-open:text-primary">
                How do couriers get paid?
              </summary>
              <p className="text-muted-foreground mt-3">
                Couriers are paid weekly on Fridays. Earnings are calculated based on distance, package size, and demand. Payments are transferred directly to your bank account.
              </p>
            </details>

            <details className="bg-card border border-border rounded-lg p-4 cursor-pointer group">
              <summary className="font-semibold text-foreground group-open:text-primary">
                What items can't be delivered?
              </summary>
              <p className="text-muted-foreground mt-3">
                We cannot deliver weapons, illegal drugs, hazardous materials, stolen goods, counterfeit items, or anything that violates South African law. See our Terms of Service for the complete list.
              </p>
            </details>

            <details className="bg-card border border-border rounded-lg p-4 cursor-pointer group">
              <summary className="font-semibold text-foreground group-open:text-primary">
                How do I request a refund?
              </summary>
              <p className="text-muted-foreground mt-3">
                Email mzansicouriers@yahoo.com with your tracking code, explain the issue, and attach any relevant evidence (photos or screenshots).
              </p>
            </details>

            <details className="bg-card border border-border rounded-lg p-4 cursor-pointer group">
              <summary className="font-semibold text-foreground group-open:text-primary">
                Is my payment secure?
              </summary>
              <p className="text-muted-foreground mt-3">
                Yes. We use Paystack for secure payment processing. All transactions are encrypted and comply with PCI DSS standards. Your payment information is never stored on our servers.
              </p>
            </details>

            <details className="bg-card border border-border rounded-lg p-4 cursor-pointer group">
              <summary className="font-semibold text-foreground group-open:text-primary">
                How do I become a courier?
              </summary>
              <p className="text-muted-foreground mt-3">
                Click "Become a Courier" on the home page. You'll need to provide your vehicle details, driver's license, and bank account information. We'll verify your information and activate your account.
              </p>
            </details>

            <details className="bg-card border border-border rounded-lg p-4 cursor-pointer group">
              <summary className="font-semibold text-foreground group-open:text-primary">
                What if I have a dispute with a courier?
              </summary>
              <p className="text-muted-foreground mt-3">
                Contact us immediately through the app. We review GPS tracking, delivery photos, and communication history to resolve disputes fairly. Both parties can appeal our decision.
              </p>
            </details>
          </div>
        </div>

        {/* Legal Links */}
        <div className="bg-card border border-border rounded-lg p-6 mb-12">
          <h3 className="text-xl font-semibold mb-4">Legal Documents</h3>
          <div className="space-y-2">
            <Link href="/privacy" className="block text-primary hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="block text-primary hover:underline">Terms of Service</Link>
            <Link href="/refund" className="block text-primary hover:underline">Refund Policy</Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <strong>General Support:</strong><br />
              <a href="mailto:mzansicouriers@yahoo.com" className="text-primary hover:underline">
                mzansicouriers@yahoo.com
              </a>
            </p>
            <p>
              <strong>Privacy & Data:</strong><br />
              <a href="mailto:mzansicouriers@yahoo.com" className="text-primary hover:underline">
                mzansicouriers@yahoo.com
              </a>
            </p>
            <p>
              <strong>Refunds:</strong><br />
              <a href="mailto:mzansicouriers@yahoo.com" className="text-primary hover:underline">
                mzansicouriers@yahoo.com
              </a>
            </p>
            <p>
              <strong>Hours:</strong><br />
              Monday - Friday: 9:00 AM - 5:00 PM SAST<br />
              Saturday - Sunday: Limited support
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
