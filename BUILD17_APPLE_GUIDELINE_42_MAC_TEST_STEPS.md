# Build 17 — Apple Guideline 4.2 Mac Test Steps

## Before opening Xcode

1. Download and unzip the build 17 Xcode package from the latest project checkpoint.
2. Open the unzipped folder and double-click `ios/App/App.xcodeproj`.
3. In Xcode, select the **App** project on the left, then select the **App** target.
4. Confirm **Version = 2.0.2** and **Build = 17**.
5. Select your Apple Developer Team under **Signing & Capabilities**. If Xcode reports a signing error, select your own Team and let Xcode manage signing.
6. Choose an iPad Air or iPad simulator first. Then repeat the important tests on an iPhone simulator or physical iPhone.
7. Select **Product → Clean Build Folder**, then press the Run button.

## Test 1 — Sign in stays inside the app

1. Launch Mzansi Couriers.
2. Tap **Sign in**.
3. Confirm that the authentication page appears inside the app experience. The iPhone should not switch to the separate Safari app.
4. Complete sign-in with the active review account.
5. Confirm that the authentication surface closes and the correct customer or courier home screen appears.
6. Sign out, close the app, reopen it, and confirm that the sign-out state is correct.

If authentication returns to the home screen instead of the dashboard, or if the app opens Safari, stop and record the exact screen and message. Do not submit until this is corrected.

## Test 2 — Courier native workflow

Use a real courier review account with at least one real paid review parcel assigned to the account.

1. Open the courier mobile route.
2. Confirm that the screen shows today’s parcel count and the next delivery action.
3. Tap **Start route** and allow location permission.
4. Tap the native route action. Confirm that Apple Maps/MapKit opens a destination route inside the app flow or presents the native route surface without showing an incorrect overseas location.
5. Open the parcel camera action. Capture a proof photo.
6. Use the parcel-code photo scan action and confirm that the real parcel code is checked against the next stop.
7. Mark arrival, complete the delivery, and upload the proof photo.
8. Confirm that the courier sees the next stop only after the current stop is recorded as complete.
9. Turn on Airplane Mode or disable Wi-Fi briefly. Confirm that the app shows a clear offline message and does not crash. Restore connectivity and confirm that the route can continue.

## Test 3 — Customer tracking workflow

1. Sign in as a customer or use the review tracking entry supplied in App Review Notes.
2. Enter the real review tracking code.
3. Confirm that the delivery timeline, parcel details, courier status, and route information load from the live service.
4. Confirm that the map does not start in San Francisco or another unrelated default location.
5. Confirm that a delivery-status update or notification opens the correct tracking screen.

## Test 4 — Account deletion

1. From the courier mobile screen, tap **Account settings**.
2. Confirm that the account settings page is inside the app.
3. Tap **Delete account**.
4. Read the confirmation text and enter the exact requested confirmation phrase.
5. Confirm deletion.
6. Verify that the app signs out and returns to the public/authentication screen.
7. Close and reopen the app. Confirm that the old account is not restored from the device session.
8. Repeat from the customer role if the review account has both roles.

## Test 5 — Permission denial and accessibility

1. Deny camera permission. Confirm that the app explains why camera access is needed and remains usable.
2. Deny location permission. Confirm that the app explains that route guidance needs location and does not display an unverified route.
3. Deny notification permission. Confirm that delivery actions still work and the app does not crash.
4. On the iPad, enable VoiceOver and move through the courier and account settings screens. Confirm that buttons have meaningful labels and that dialogs can be closed without a mouse.
5. Rotate the iPad if supported and check that no essential button is hidden behind the keyboard, safe area, or bottom of the screen.

## Test 6 — Archive and upload

1. After the tests pass, choose **Product → Archive**.
2. When Organizer opens, select the new archive and choose **Distribute App**.
3. Choose **App Store Connect**, then **Upload**.
4. Wait for processing in App Store Connect.
5. Attach the new build to version 2.0.2, update the review notes with the test account and parcel code, answer the privacy questions consistently with the binary, and submit.

## What to send back if something fails

Send a screenshot showing the failed screen, the device/simulator model, whether it was iPhone or iPad, and the exact step number above. The most important failures to report are: Safari opening during sign-in, a crash when starting route or opening MapKit, a camera/location permission failure, a stale account after deletion, or an empty/inaccessible review route.
