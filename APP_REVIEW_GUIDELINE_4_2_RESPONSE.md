# App Review Response — Guideline 4.2

## Summary

Mzansi Couriers is a parcel-delivery operations app, not a marketing catalogue, content aggregator, web clipping, or collection of links. Its purpose is to coordinate real parcel bookings, payments, courier acceptance, relay handoffs, route progress, proof of delivery, customer confirmation, and account controls across South Africa.

The public landing content explains the service, but the iOS build also provides an app-specific operational entry panel and dedicated customer and courier workspaces. The native iOS entry highlights the actions users perform inside the app: opening a delivery workspace, tracking a parcel, capturing proof-of-delivery evidence, using route tools, and continuing during temporary loss of connectivity.

## App-specific utility

A customer can create a parcel booking with pickup and destination details, receive a tracking code, view delivery status, see current courier location when available, and confirm arrival. A courier can view eligible paid work, accept a parcel, see the next stop and parcel code, start a route, use the device location and route presentation, scan or compare a parcel code, capture a camera proof photo, record exceptions, and complete the handoff. The backend persists these actions and the customer can see the resulting status changes.

The app also includes an account workspace with secure native session storage, biometric/device-security checks, notification controls, and in-app account deletion. Route snapshots and queued route actions support the courier workflow during temporary offline periods. Build 21 adds local parcel search over that saved route snapshot: a courier can find a parcel by tracking code, stop number or status, street, city, postal code, parcel description, size, or weight without making a network request. These are operational capabilities tied to parcel delivery, not decorative demonstrations.

## Native iOS integration

The iOS binary meaningfully uses device capabilities in the delivery workflow:

- **Camera:** capture proof-of-delivery evidence and parcel-code photos.
- **Location:** support courier route state and current-location updates when the courier chooses to share them.
- **MapKit route presentation:** present the next delivery destination from the courier workflow.
- **Local and push notifications:** notify users about delivery-status and courier workflow events, with deep links into the relevant parcel or route.
- **Keychain-backed secure storage:** retain the native bearer session securely rather than storing it only in web storage.
- **LocalAuthentication:** allow a user to verify device security from Account settings.
- **Offline route storage:** retain the latest route snapshot and queue supported route actions until connectivity returns.

No ARKit feature is used. The app does not require another installed app to function. A browser-based fallback is retained for the web deployment, but the native iOS binary has its own app-specific routes, native bridge integrations, permissions, and operational workflows.

## Reviewer test path

1. Launch the app and select **Open your delivery workspace** or **Sign in to work** from the native app panel.
2. Sign in using the review account supplied in App Store Connect notes.
3. For a customer account, open the customer workspace, create or open a parcel, review the tracking code and delivery status, and complete customer delivery confirmation when the courier has submitted proof.
4. For a courier account, open the courier workspace, review the next parcel and route, start the route, allow location access when requested, open the route destination, capture the proof photo, and complete the next-stop action.
5. Turn on Airplane Mode after the route snapshot has loaded. Use **Search saved parcels** to find a tracking code or delivery city. Confirm that the latest route remains viewable and that supported actions show as pending sync. Restore connectivity and confirm the queue can resume.
6. Open Account settings to verify secure session/device-security controls and the in-app account deletion path.

The review account should contain a persisted test parcel and an eligible courier route so the operational workflow can be exercised without relying on fabricated content or a separate companion app.

## Guideline mapping

| Guideline | Mzansi Couriers implementation |
|---|---|
| 4.2 | Purpose-built parcel delivery utility with persistent booking, tracking, courier, proof, confirmation, and account workflows. |
| 4.2.1 | Not applicable; the app does not use ARKit. |
| 4.2.2 | The landing explanation is secondary. The native app provides operational workspaces and real persisted delivery actions. |
| 4.2.3(i) | The app does not require another app to create, track, route, or confirm a parcel delivery. |
| 4.2.3(ii) | No additional resource download is required for initial operation; the release embeds its production web bundle and native plugins. |
| 4.2.6 | Mzansi Couriers is submitted by the provider of the Mzansi Couriers service and contains customized South African delivery workflows, not generic client content. |
| 4.2.7 | Not applicable; the app is not a remote desktop client. |

## Claims and limitations

The app should be reviewed with a real review account and a persisted test parcel. Live Paystack payout execution remains an owner-controlled operational check and is not required for the customer booking, courier route, proof, tracking, or confirmation workflow. The app must not describe simulated location or fabricated parcel opportunities as live production data.
