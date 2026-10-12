# Mzansi Couriers Native App Store Rejection Audit

## Current architecture

Mzansi Couriers is a React 19 and Tailwind frontend served through an Express/tRPC backend, packaged for iOS with Capacitor. The native iOS project currently launches `BridgeViewController`, a `CAPBridgeViewController` whose primary responsibility is loading the production web bundle into a WKWebView. The native project already includes Capacitor Camera, Geolocation, Local Notifications, Push Notifications, and App plugins.

The existing backend is the source of truth for delivery operations. The most relevant persisted procedures are `deliveryRuns` for courier route creation, acceptance, pickup, proof-of-delivery, customer confirmation, exceptions, and completion; `tracking` for public/customer tracking details and current courier location; `smartStack` for route recommendations; and `customerPayments` for payment readiness. These should be preserved rather than replaced.

## Apple findings mapped to the code

| Apple concern | Current implementation | Remediation direction |
|---|---|---|
| App resembles web browsing | The iOS entry point remains a Capacitor WebView, but the app now presents a branded auth entry and focused courier/customer operations routes. | Completed for build 15: native-backed camera, location, local notifications, offline feedback, camera-photo barcode decoding, and a native MapKit destination presenter are tied to real delivery workflows while the existing backend remains the source of truth. |
| Sign-in opens the default browser | The original direct browser redirect was visible to Apple reviewers. | Completed for build 15: branded in-app auth entry, Capacitor Browser surface, `mzansi://auth/callback`, signed bearer-session handoff, refresh, and native logout cleanup. Physical-device callback testing remains a Mac-only check. |
| Native courier capability | `CourierRunWorkflow` contains real route actions and native-backed camera, geolocation, local notifications, online/offline state, and parcel-code scanning. | Completed for build 15: focused mobile courier operations route, persisted delivery actions, MapKit destination presenter, camera evidence, barcode photo decoding, and App Review demonstration notes. |
| Native tracking | `tracking.getByCode` returns tracking code, sender/recipient, pickup/dropoff, status, courier, latest location, relay legs, and exception events. | Completed for build 15: focused customer mobile tracking route backed by the existing tracking procedures; no synthetic tracking responses were added. |
| Permissions | `Info.plist` contains camera, photo library, and location purpose strings. Capacitor configuration also declares location/photo purposes. | Verify only required permissions are requested at the moment of use and keep purpose text aligned with the actual delivery workflow. |
| iPad review | The native project supports iPad orientations and the existing build has iPad icon/launch fixes. | Validate the native entry, courier route action sizes, tracking layout, keyboard behavior, and camera/permission prompts on iPad Air 11-inch layout in Xcode. |

## Important limitation discovered

The current application does not have a first-party email/password authentication API. The existing sign-in flow is Manus OAuth, completed by `/api/oauth/callback` and a secure server session cookie. Therefore, adding a native login form that pretends to authenticate against the current backend would be unsafe and would not satisfy the requirement. Build 15 uses the existing identity provider through the in-app Capacitor authentication surface and the registered `mzansi://auth/callback` return URL. No fake local password system was added. The sandbox cannot run `xcodebuild`, so the callback, iPhone/iPad permission prompts, Keychain/session persistence, and accessibility still require Mac/Xcode validation.

## Implementation order

The implementation should proceed in this order: first create a stable native authentication return path and in-app auth entry; then expose the existing real delivery-run and tracking data through native-feeling screens; then add scan/signature and notification deep-link surfaces; finally validate iPhone/iPad behavior, permissions, error states, and App Review instructions. The existing Paystack payout validation remains unrelated and paused.

## Build 16 secure-session and account controls

The native bearer session is now stored through a Keychain-backed `NativeSecureStoragePlugin` on iOS, with localStorage retained only as a browser fallback. Logout, unauthorized recovery, and account deletion clear both stores. The account settings route is reachable from the customer and courier mobile headers, and the deletion mutation removes personal records while preserving anonymized delivery custody and payment/dispute history where required.

Static validation completed in the sandbox includes TypeScript, production build, focused and full Vitest runs, Capacitor iOS synchronization, route screenshots, and ZIP integrity. The remaining validation boundary is Mac-only: compile the Swift plugin with Xcode, run on an iPhone and iPad Air-class device/simulator, confirm Keychain persistence across relaunch, verify account deletion signs out without a crash, and inspect VoiceOver/focus behavior and permission prompts.
