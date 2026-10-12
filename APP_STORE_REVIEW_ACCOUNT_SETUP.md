# App Store Review Account and Accessibility Checklist

## What has been validated in the project

The automated accessibility and customer/auth regression suites pass: **109 tests passed**. The native courier and customer surfaces provide labelled navigation regions, visible text for primary actions, labelled inputs, status and alert announcements, keyboard-focus rings, reduced-motion handling, safe-area spacing, and 44-point mobile controls. The sandbox cannot operate VoiceOver, Dynamic Type, camera, location, or the signed native iOS binary; those checks must be completed in Xcode on the Mac.

## Create the review account

Use a dedicated account that contains no real customer information. Do not use the owner account, a production courier’s account, or an account containing real banking or payment data. Create the account through the same in-app sign-in flow that a normal user uses. The current app uses the configured identity service rather than a fake local password system.

Create two review identities if possible:

| Identity | Required state | Purpose |
|---|---|---|
| Customer review account | Approved customer profile with one persisted test parcel | Demonstrates booking/tracking/confirmation |
| Courier review account | Approved courier profile with an active delivery run and at least two test stops | Demonstrates route, location, camera evidence, offline snapshot, and parcel search |

If App Store Connect allows only one set of credentials in the current review submission, use the courier identity and explain in Review Notes that the customer tracking view is available from the supplied test parcel’s tracking code. Keep the customer identity available in the notes only if Apple’s review form supports additional account information.

## Required persisted test data

Before submitting, confirm the courier review identity has:

1. An active route with at least two paid test parcels.
2. A pickup and drop-off address in South Africa for each stop.
3. A visible tracking code on each parcel.
4. A customer parcel-label photo or other valid parcel-label evidence where the workflow requires it.
5. A route status that allows the reviewer to start the route and progress through a stop.
6. A customer confirmation path that can be opened after proof-of-delivery is recorded.
7. No real Paystack funds, personal banking details, or real customer addresses.

Use clearly synthetic review data such as `Apple Review Parcel 001`, but do not describe synthetic location as live production movement. The route should exercise the real persisted APIs and actions; it must not be a front-end-only demo.

## App Store Connect Review Notes template

```text
Mzansi Couriers is a parcel-delivery operations app. It is not a catalogue, web clipping, or marketing-only app.

Review account:
Email/username: [dedicated review account]
Password or sign-in instructions: [secure review credential or identity-service instructions]
Role: Courier

Test route:
The supplied courier account has an active route with two persisted South African test parcels. After signing in, tap Open your delivery workspace, then Route. Review the next parcel and tracking code, tap Accept parcel, and tap Start route with live location. Allow location access when prompted. Open the pickup/delivery map, then use the delivery camera to capture proof. The customer confirmation step becomes available after proof is saved.

Offline test:
After the route has loaded, enable Airplane Mode. The saved route remains available. Use Search saved parcels to search by tracking code or city. Supported route actions are shown as pending sync. Restore connectivity to resume synchronization.

Account and privacy:
Open Account from the bottom navigation to review device-security controls and the in-app Delete my account flow. No separate companion app is required.

Permissions:
Camera and location are requested only when the courier action needs them. Photo access is used for parcel evidence.

ARKit and remote desktop:
The app does not use ARKit and is not a remote desktop client.
``` 

Replace bracketed values before submitting. Never paste an owner password into project files or public review notes.

## Mac accessibility verification

Run this on the iPhone and iPad simulator/device using Build 22:

1. Turn on **Settings → Accessibility → VoiceOver**. Swipe through the launch panel, sign-in entry, customer tracking screen, courier route screen, search field, action buttons, and Account screen. Confirm every control has a meaningful spoken label and no decorative icon is announced as a missing control.
2. Turn on **Settings → Accessibility → Display & Text Size → Larger Text** and enable the largest practical Dynamic Type setting. Confirm headings, route cards, search results, and bottom tabs remain usable without clipped text or hidden actions.
3. Test **Increase Contrast** and **Button Shapes**. Confirm selected tabs, status badges, and primary actions remain distinguishable without relying only on color.
4. Test portrait and landscape on the iPad Air-class simulator. Confirm the route search field and bottom tabs remain reachable and content does not sit under the home indicator.
5. Test with the keyboard or hardware keyboard where available. Confirm the search field, route actions, account controls, and deletion confirmation can be reached in logical order.
6. Test permission prompts: deny and then re-enable camera and location. Confirm the app explains the next step and does not become stuck.
7. Capture a short internal test record with the device model, iOS version, VoiceOver result, Dynamic Type result, and any issue found. Do not upload this record unless Apple requests it.
