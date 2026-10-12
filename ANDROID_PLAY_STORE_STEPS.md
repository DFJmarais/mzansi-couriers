# Mzansi Couriers — Google Play Android Wrapper

This package contains a Capacitor Android Studio project for Mzansi Couriers. It uses the existing app ID `com.mzansi.couriers`, version name `2.0.2`, and Android version code `31`. The latest production web bundle is already copied into the Android project.

## What is included

The wrapper includes the Mzansi Couriers branded launcher icon, the existing splash screen, location and camera capabilities for courier operations, notification permission support, parcel-photo access, the in-app authentication flow, offline route snapshots, dark mode, automatic local-time dark scheduling, animated theme controls, haptic/audio tap feedback, the visual ripple effect, QR custody scanning, sender-only QR download, relay condition inspection, and delivery review controls.

## Open the project

1. Install the latest stable **Android Studio** on a Windows, Mac, or Linux computer.
2. Install the Android SDK platform and build tools requested by Android Studio. The project targets Android API 36 and supports Android 7.0/API 24 and newer.
3. Extract this archive while keeping its internal folder structure.
4. Open the extracted `android` folder in Android Studio. If Android Studio asks to trust or sync Gradle, choose **Trust Project** and **Sync Now**.
5. Wait for Gradle sync to finish. The first sync may take several minutes.

## Test before release

1. Start an Android emulator or connect an Android phone with USB debugging enabled.
2. Select the `app` run configuration and press **Run**.
3. Test sign-in, customer booking, sender QR download, courier pickup and delivery scans, camera proof, recipient notifications, relay QR receipt and condition inspection, defect photo upload, offline route search, account deletion, the Safety Centre, dark mode, the automatic 18:00–06:00 local-time schedule, and the Home theme button.
4. Test both light and dark system settings and enable Android accessibility options, including Remove animations if available.

## Create the Google Play upload file

1. In Android Studio choose **Build → Generate Signed Bundle / APK**.
2. Select **Android App Bundle** and continue.
3. Create a new keystore owned by the Mzansi Couriers business, or select the existing production keystore. Store the keystore and passwords securely; Google Play updates must use the same signing identity.
4. Select the `release` variant and finish the wizard.
5. Upload the resulting `.aab` file to Google Play Console under the Mzansi Couriers app.

## Important Play Console items

Complete the Google Play Data safety form to match the final binary. The app uses location for delivery routing, camera and photos for parcel evidence, notifications for delivery updates, and account information for authentication and operations. It does not need advertising ID or advertising tracking for the courier workflow. Add a public privacy-policy URL, support email, app screenshots, a feature graphic, and a content rating before submitting the release for review.

The Android wrapper is prepared, but the final signed `.aab` cannot be created here because this sandbox does not contain the Android SDK or your private Google Play signing key. Do not send the keystore or signing passwords in chat.
