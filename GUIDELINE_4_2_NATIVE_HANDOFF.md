# Mzansi Couriers — Guideline 4.2 Native Functionality Handoff

## Current build

Build **2.0.2 (24)** presents dedicated courier, customer, and account workspaces with an iOS-style visual hierarchy, high-contrast night-shift dark mode, automatic 18:00–06:00 local-time scheduling, native device integrations, and persistent delivery operations. The app is not a marketing-only shell or a collection of web links.

## Native courier capabilities

The courier workflow uses device location for route guidance, native MapKit route presentation, native camera capture for proof of delivery, parcel-code photo decoding, local route notifications, Keychain-backed session storage, device authentication, and offline route snapshots with queued actions. Build 21/22 also lets the courier search the locally saved route by tracking code, stop number/status, address, city, parcel description, size, or weight without a network request. Build 23 adds a persistent high-contrast dark mode with a one-tap courier-header switch and Account settings control. Build 24 adds the Home-screen Dark/Light button and automatic local-time switching, with manual controls taking priority when the user changes the mode.

The underlying delivery workflow remains persisted and real: the courier reviews paid parcels, accepts or declines stops, starts the route, navigates to pickup and delivery, records arrival, captures evidence, and waits for customer confirmation. The customer can track the parcel and confirm the handoff.

## Automated validation

TypeScript, production build, Capacitor iOS synchronization, and the full Vitest suite pass. The current suite reports **1,389 tests passed and 5 skipped**. The focused accessibility/auth/customer regression suites report **109 tests passed**.

## App Review account requirements

Provide Apple with a dedicated review identity, not the owner account. The courier identity should already have an approved courier profile, an active route, at least two persisted South African test parcels, tracking codes, valid route addresses, and a customer confirmation path. Use the accompanying `APP_STORE_REVIEW_ACCOUNT_SETUP.md` file for the exact App Store Connect review-note template and test-data checklist.

## Review demonstration

1. Sign in through the in-app authentication surface.
2. Open the delivery workspace and Route.
3. Review the next parcel and tracking code, accept it, and start the route with live location.
4. Open the map, progress to a stop, and capture proof with the delivery camera.
5. Enable Airplane Mode after the route loads. Search the saved route by tracking code or city and confirm that the route remains available.
6. Restore connectivity and verify queued actions can resume.
7. Open Account to verify device-security controls and the in-app account deletion path.

## Mac-only checks before submission

The sandbox cannot compile or run the signed Swift binary. On the Mac, verify Xcode compilation, iPhone and iPad behavior, OAuth callback return, Keychain persistence, camera/location permissions, VoiceOver labels, Dynamic Type, Increase Contrast, Button Shapes, portrait/landscape layout, and account deletion. These checks must be completed before claiming device validation in App Store Connect.

The app does not use ARKit and is not a remote desktop client. It does not require another app to create, track, route, or confirm a delivery.
