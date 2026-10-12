# Mzansi Couriers — Apple Guideline 4.2 Compliance Audit

**Audited release:** Version 2.0.2, build 17  
**Audit date:** 15 September 2026  
**Scope:** Apple Guideline 4.2, related Guideline 4 sign-in presentation, account deletion, and App Review access requirements.

## Executive conclusion

Build 17 is materially stronger than the rejected build 2.0.2 (13). It now contains a coherent courier/customer product flow rather than only a public web shell: authenticated courier route operations, customer tracking, native camera evidence, location permission and route state, local notifications, offline feedback, camera-photo parcel-code decoding, a MapKit destination presenter, in-app authentication presentation, Keychain-backed native session storage, and reachable in-app account deletion.

The project therefore **addresses the specific deficiencies Apple identified**, but I cannot honestly state that it is guaranteed to pass Guideline 4.2. Apple’s rule is outcome-based: the reviewer must experience an app that is useful, unique, and sufficiently app-like, not merely see native APIs in the source code. The remaining material risk is that most screens still run inside the Capacitor WebView, and the custom Swift plugins have not been compiled on an actual Mac because the sandbox has no `xcodebuild` toolchain.

## Apple requirements and current status

| Apple requirement or review expectation | Evidence in build 17 | Status | What still matters |
|---|---|---|---|
| The app must go beyond a repackaged website. Apple says Guideline 4.2 expects features, content, and UI that make the app useful, unique, and app-like.[1] | Focused native courier and customer routes; real delivery-run and tracking APIs; native camera, location, notifications, offline feedback, MapKit presentation, barcode-photo decoding, and Keychain session storage. | **Implemented, with review risk** | The reviewer must see these capabilities in the submitted binary. A Mac test must confirm native actions actually open and complete successfully. |
| Native features must be meaningful rather than decorative. | Courier actions are connected to persisted route state: start route, next parcel, arrival, proof photo, customer confirmation, completion, relay exceptions, and payment readiness. Customer tracking uses real tracking procedures rather than mock records. | **Implemented in code** | Test with a real review account and real review data. Do not submit with an empty courier route or inaccessible demo state. |
| Account-based apps must give App Review full access through an active demo account or fully featured demo mode.[1] | App Review notes now describe the review path and require the review account to sign in through the in-app account screen. | **Documentation prepared** | In App Store Connect, provide credentials that work during review and ensure the backend, test parcel, route, and sample QR/barcode remain live. |
| Sign-in and registration should not send users to the default browser. Apple specifically identified that behavior under Guideline 4.[2] | Branded in-app auth entry; Capacitor Browser surface; `mzansi://auth/callback`; native bearer-session handoff; Keychain-backed token storage; logout and unauthorized cleanup. | **Implemented in code; Mac verification required** | Confirm on a real iPhone/iPad that no Safari app switch occurs, the callback returns to Mzansi Couriers, the auth surface closes, and the dashboard opens. |
| Account creation must be paired with in-app account deletion. Apple says deletion should be easy to find, delete the full account and associated personal data, and not require customer support for an ordinary app.[2] | Account Settings is reachable from both courier and customer mobile headers. The user confirms `DELETE MY ACCOUNT`; the protected mutation removes personal data and anonymizes operational records where retention is required; native session state is cleared. | **Implemented in code** | Test the complete deletion flow on device and verify that the user cannot return to an authenticated screen using a stale Keychain token. |
| Permissions must be understandable and requested at the right time. | Camera, photo-library, location, and notification purpose strings exist; the courier workflow requests camera/location/notifications when the associated action is used. | **Static pass; device verification required** | Confirm the prompts appear only when needed and the app remains usable when permissions are denied. |
| The app must be stable and backend services must be available. Apple asks developers to test for crashes and bugs and keep backend services live during review.[1] | TypeScript check passed; production build passed; 58 test files passed with 1,383 tests and 5 skipped; Capacitor iOS sync passed; ZIP integrity passed. | **Sandbox validation passed** | The sandbox cannot compile Swift or run the iOS binary. Xcode archive and device/simulator testing remain mandatory. |
| iPhone and iPad layouts must be usable. | iOS project targets device families `1,2`, supports the existing iPad launch/icon configuration, and the web routes are responsive. | **Static pass; physical layout verification required** | Test the iPad Air 11-inch-class review environment, keyboard behavior, route actions, dialogs, camera flow, VoiceOver focus, and rotation. |

## What is genuinely implemented

The courier side is not merely a marketing screen. The route workflow uses the existing server procedures and shows the next stop, parcel tracking code, payment readiness, route progress, and action state. It supports native-backed camera evidence, current location, local route notification, online/offline feedback, a MapKit destination surface, and camera-photo barcode decoding. The customer side has a focused mobile tracking route backed by real tracking data, including delivery status and tracking-code lookup.

Authentication now presents a branded in-app entry before the existing identity-provider flow. The native callback uses the registered `mzansi://auth/callback` URL scheme and attaches a signed bearer session to API requests. Build 17 improves this by storing the native session in an iOS Keychain-backed plugin instead of relying on localStorage on iOS. Account deletion is available from in-app settings and clears the native session after the protected deletion mutation completes.

## Remaining risks before submission

The most important unresolved risk is not a missing feature in the source tree; it is **binary verification**. The sandbox does not contain Apple’s Xcode toolchain, so the Swift `NativeMapPlugin` and `NativeSecureStoragePlugin` cannot be compiled here. The Mac build must prove that the plugin registration, MapKit controller, Keychain calls, and Capacitor bridge compile under the exact Xcode/SDK version used for the archive.

A second risk is review discoverability. App Review must receive a working account, a courier route with at least one real review parcel, a customer tracking code, and any sample barcode or parcel code needed to exercise the flows. If the reviewer signs in and sees only an empty route or a generic WebView home screen, the implementation may still be perceived as a repackaged website even though the native capabilities exist.

A third risk is that App Review decides Guideline 4.2 based on the overall experience. The app remains a hybrid Capacitor application, so build 17 should be submitted only after the native courier and customer entry routes have been tested in the actual binary and the Review Notes direct the reviewer immediately to those workflows.

## Required Mac validation before upload

First, unzip the build 17 package, open `ios/App/App.xcodeproj`, select the App target, choose the correct Apple Developer Team, and confirm version **2.0.2** and build **17**. Clean the build folder, build for an iPad Air 11-inch-class simulator, and then run on a physical iPhone if available.

Next, test sign-in from the in-app Mzansi screen. Confirm that the identity surface stays inside the app, the `mzansi://auth/callback` return closes the authentication surface, and the correct dashboard opens. Sign out, relaunch, and confirm the account is not silently restored from an invalid or deleted token.

Then test the courier route with a review courier account. Start the route, accept or open the next real parcel, request location, open the native MapKit destination, capture proof with the native camera, scan or photograph the parcel code, and complete the delivery action. Deny camera and location permissions once to confirm the app explains the limitation and does not crash.

Finally, open Account settings from both customer and courier roles. Delete a test account using the visible confirmation flow, confirm the session ends, relaunch the app, and verify that the deleted account cannot reopen authenticated screens using the prior Keychain token. Test VoiceOver/focus order and iPad layout before archiving.

## Submission recommendation

**Recommendation: conditionally ready for the next App Store submission, pending the Mac-only binary checks above.** Do not describe build 17 as guaranteed to pass. In App Review Notes, provide the active review credentials, a sample tracking code, a sample parcel code if needed, the courier demonstration path, the customer tracking path, and the account-deletion path. Explain that the core courier operations are native-backed and connected to real persisted delivery data.

## References

[1]: https://developer.apple.com/app-store/review/guidelines/ "Apple App Store Review Guidelines"

[2]: https://developer.apple.com/support/offering-account-deletion-in-your-app/ "Apple — Offering account deletion in your app"
