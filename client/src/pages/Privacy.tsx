import React from 'react';
import { Link } from 'wouter';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-4">
          <Link href="/" className="text-lg font-bold text-foreground hover:text-primary">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container py-12 max-w-3xl">
        <article className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last Updated: July 9, 2026 | Effective Date: June 1, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
            <p>
              Mzansi Couriers ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Service").
            </p>
            <p>
              We comply with the Protection of Personal Information Act (POPIA) of South Africa and other applicable privacy laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Account Information:</strong> Name, email, phone number, password</li>
              <li><strong>Profile Information:</strong> Photo, bio, vehicle details (for couriers)</li>
              <li><strong>Payment Information:</strong> Bank account details, payment method</li>
              <li><strong>Delivery Information:</strong> Pickup/delivery addresses, package details</li>
              <li><strong>Communication:</strong> Messages, support tickets, feedback</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Location Data:</strong> GPS coordinates during deliveries (with permission)</li>
              <li><strong>Device Information:</strong> Device type, OS, app version, unique identifiers</li>
              <li><strong>Usage Data:</strong> Features used, clicks, time spent, interactions</li>
              <li><strong>Performance Data:</strong> App crashes, errors, performance metrics</li>
              <li><strong>IP Address:</strong> For security and fraud prevention</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment processors (Paystack)</li>
              <li>SMS providers (Twilio)</li>
              <li>Maps providers (Google Maps)</li>
              <li>Analytics providers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use collected information for:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Providing and improving our Service</li>
              <li>Processing payments and payouts</li>
              <li>Sending notifications and updates</li>
              <li>Verifying user identity and preventing fraud</li>
              <li>Responding to support requests</li>
              <li>Analyzing usage patterns and improving features</li>
              <li>Complying with legal obligations</li>
              <li>Marketing and promotional purposes (with consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Sharing and Disclosure</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 We Share Data With</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Service Providers:</strong> Payment processors, SMS providers, hosting providers</li>
              <li><strong>Other Users:</strong> Customers see courier info; couriers see customer info</li>
              <li><strong>Legal Requirements:</strong> When required by law or court order</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 We Do NOT Share Data With</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Advertisers or marketing companies</li>
              <li>Data brokers or third-party sellers</li>
              <li>Any party without your consent (except as required by law)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Active Accounts:</strong> Data retained while account is active</li>
              <li><strong>Deleted Accounts:</strong> Data retained for 6 months after deletion</li>
              <li><strong>Legal Requirements:</strong> Longer retention if required by law</li>
              <li><strong>Permanent Deletion:</strong> After 6 months, all personal data is permanently deleted</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Your Rights</h2>
            <p>Under POPIA and other privacy laws, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your data (right to be forgotten)</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
            </ul>

            <p className="mt-4">
              To exercise these rights, contact us at <a href="mailto:mzansicouriers@yahoo.com" className="text-primary hover:underline">mzansicouriers@yahoo.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Security</h2>
            <p>
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>HTTPS encryption for all data in transit</li>
              <li>Encrypted storage for sensitive data</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing via Paystack</li>
            </ul>
            <p>
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Remember your login information</li>
              <li>Analyze usage patterns</li>
              <li>Improve user experience</li>
              <li>Prevent fraud</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Disabling cookies may affect app functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">8.1 App Tracking Transparency (iOS)</h2>
            <p>
              On iOS devices, we request your permission to track your activity across other apps and websites for analytics purposes. This permission is requested via Apple's App Tracking Transparency (ATT) framework.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-3">What We Track</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Device Identifiers:</strong> IDFA (Identifier for Advertisers) when you grant permission</li>
              <li><strong>Analytics:</strong> App usage patterns, feature engagement, crash reports</li>
              <li><strong>Performance:</strong> App performance metrics and error tracking</li>
            </ul>
            <h3 className="text-xl font-semibold mt-6 mb-3">Your Control</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>You can grant or deny tracking permission when prompted</li>
              <li>You can change your tracking preference in iOS Settings → Privacy → Tracking</li>
              <li>Denying tracking will not prevent you from using Mzansi Couriers</li>
              <li>We respect your choice and will not track you if you deny permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under 18. We do not knowingly collect personal information from children. If we become aware of such collection, we will delete it immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">11. International Data Transfers</h2>
            <p>
              Your data may be transferred to, stored in, and processed in countries other than South Africa. By using our Service, you consent to such transfers. We ensure adequate safeguards are in place.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy at any time. Changes become effective upon posting. We will notify you of material changes via email or in-app notification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">13. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights:
            </p>
            <div className="bg-card p-4 rounded-lg mt-4">
              <p><strong>Email:</strong> <a href="mailto:mzansicouriers@yahoo.com" className="text-primary hover:underline">mzansicouriers@yahoo.com</a></p>
              <p><strong>Data Protection Officer:</strong> <a href="mailto:mzansicouriers@yahoo.com" className="text-primary hover:underline">mzansicouriers@yahoo.com</a></p>
              <p><strong>Support:</strong> <a href="mailto:mzansicouriers@yahoo.com" className="text-primary hover:underline">mzansicouriers@yahoo.com</a></p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Last Updated: July 9, 2026 | Version: 1.1
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
