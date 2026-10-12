# Mzansi Couriers — Release Readiness Report

**Audit date:** 29 August 2026  
**Release candidate:** Web project checkpoint `a468258a`; native iOS marketing version `2.0.2`, prepared build `10`  
**Production domain:** `https://mzansicourier-nsebzqbt.manus.space`

## Executive decision

The current project is **ready for the owner’s Mac-side Xcode archive and App Store Connect submission workflow**, subject to the three Apple-account/device checks described below. The sandbox audit found no TypeScript errors, no failing automated tests, no production-build failure, no invalid native project reference pattern, and no failure in the safe Paystack webhook or authentication probes.

This is not the same as claiming that a physical iPhone, iPad, Xcode archive, Apple signing, App Store Connect processing, or a real customer charge has been completed. Those checks require macOS/Xcode and the owner’s Apple/Paystack accounts.

## Evidence summary

| Area | Result | Evidence and limitation |
|---|---|---|
| Automated quality | **Pass** | TypeScript check passed; 55 test files passed with 1,364 passing tests and 5 skipped; production web build passed. |
| Customer booking | **Pass in automated and UI coverage** | Booking, pricing, payment handoff, tracking, delivery confirmation, notification, and customer-app tests passed; `/send` rendered with pickup/drop-off fields. A real payment still requires a deliberate account-side transaction. |
| Customer tracking | **Pass** | Tracking route, public tracking tests, tracking-code handoff, map-marker configuration, and route smoke coverage passed. `/track` rendered correctly with validation-ready input. |
| Courier workflow | **Pass in automated and role-aware coverage** | Availability, parcel acceptance, route workflow, proof-of-delivery, earnings, payout status, courier ID, and delivery-assignment tests passed. The current browser session is an admin session, so a separate courier login/device test remains advisable before launch. |
| Fleet workflow | **Pass; visual contrast fixed during this audit** | Fleet onboarding, command centre, vehicle/driver data, capacity matching, owner approval, permissions, and fleet UI tests passed. The fleet landing hero had low contrast in one desktop capture; it was corrected to a deep green background with readable white text, then rechecked on desktop and iPhone-sized viewports. |
| Admin workflow | **Pass in current owner session** | Admin authentication, admin session, dashboard, payout review, courier review, and operational surface checks passed. Role protection correctly returns `403` when an admin session requests courier-only data; this is expected security behavior, not a product failure. |
| Paystack API | **Safe readiness pass** | A non-financial Paystack bank-catalog request returned HTTP 200 using the configured runtime credential. No charge, refund, or transfer was initiated. |
| Paystack webhooks | **Pass** | Production endpoint returned HTTP 401 for an invalid signature and HTTP 200 for a valid harmless signed event. HMAC-SHA512 raw-body verification, constant-time comparison, event mapping, ZAR/amount checks, idempotency, and late-failure protection are covered by tests. |
| Notifications | **Pass in code/test coverage** | Delivery notification, SMS/WhatsApp framework, owner help routing, and notification state tests passed. Delivery to real customer phone numbers or email inboxes was not triggered in this audit. |
| Responsive web UI | **Pass for audited sizes** | Public, tracking, fleet, support, customer booking, courier, fleet dashboard, and admin surfaces were captured at desktop and mobile/iPad-sized viewports. |
| Native iOS configuration | **Pass for sandbox-side checks** | 16 AppIcon slots were found and dimension-checked as opaque; bundle ID is `com.mzansi.couriers`; iOS target is 15.0; iPhone+iPad families are enabled; ATT tracking prompt is absent; embedded production web bundle is present; no unresolved project conflict markers or invalid build-phase reference pattern was found. |

## Payment and payout conclusion

The customer payment architecture is connected to Paystack and the payment/webhook state transitions are covered by automated tests. The safe production probes confirm that the configured Paystack credential can authenticate to a Paystack catalog endpoint and that the deployed webhook endpoint is enforcing signatures correctly.

The audit deliberately did **not** create a real charge, refund, or R100 courier transfer. Therefore, the following remain operational checks for the owner: complete one controlled Paystack test-mode checkout when the valid test credential is available, confirm the Paystack dashboard webhook URL matches the production endpoint, and later perform a controlled live transaction only when funds, recipient details, and authorization are confirmed.

## iOS and all-device conclusion

The native project is structurally prepared for the App Store update as **2.0.2/build 10**, and the web UI has been checked at representative iPhone, desktop, and iPad-sized viewports. However, the Linux sandbox cannot run `xcodebuild`, sign the app, launch an iPad simulator, test a physical iPhone/iPad, or submit to App Store Connect. Consequently, I cannot truthfully certify every Apple device until the Mac-side archive and at least one iPhone/iPad launch check succeed.

## Remaining actions before submission

| Order | Action | Who/where |
|---|---|---|
| 1 | Open the corrected `ios/App/App.xcodeproj` package in Xcode, select **Any iOS Device (arm64)**, and confirm version `2.0.2`. Use build `10` only if App Store Connect has not already used it; otherwise choose the next unused build number. | Owner’s Mac/Xcode |
| 2 | Choose **Product → Clean Build Folder**, then **Product → Archive**. Validate the archive in Organizer and upload it to App Store Connect. | Owner’s Mac/Xcode |
| 3 | In App Store Connect, update the privacy answers to match the actual behavior: the app does not perform cross-app advertising tracking or request ATT permission. | Owner’s App Store Connect account |
| 4 | Attach the authentic iPad screenshots from the prepared package to the new 2.0.2 version. | Owner’s App Store Connect account |
| 5 | Test one complete customer booking in Paystack test mode and one courier completion flow in the uploaded build before submitting for review. | Owner’s accounts/devices |

## Prepared handoff files

The corrected native project package is `Mzansi-Couriers-iOS-Xcode-2.0.2.zip`. The screenshot package is `Mzansi-Couriers-iOS-Submission-Assets.zip`. The project checkpoint is `a468258a`.

## Final assessment

**Recommended action:** proceed to Mac-side Xcode validation and archive preparation. Do not treat the release as fully Apple-certified until the archive validates, the uploaded build processes successfully, an iPhone/iPad smoke test passes, and the App Store Connect privacy/screenshots fields are updated.
