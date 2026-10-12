# Mzansi Couriers — Xcode Upload Steps

## What this package contains

This package is the corrected Mzansi Couriers native iOS project. It includes the embedded production web bundle, the native-only operational launch panel, offline parcel search over the saved route snapshot, the refreshed Apple-style visual system, high-contrast night-shift dark mode, automatic 18:00–06:00 local-time scheduling, an animated Home-screen sun/moon theme control, subtle tap feedback, a contained visual ripple, the courier Safety Centre, sender-only downloadable parcel QR codes, authenticated pickup/delivery scans, relay condition inspections, private notifications, and post-delivery reviews. Release settings are version **2.0.2**, build **31**.

## Open the project

On your Mac, unzip the **fixed SPM package**. Open the extracted package’s `ios/App` folder, then double-click **App.xcodeproj**. Keep the extracted package folder intact: do not move the `ios` folder out by itself, because the archive includes the local Capacitor package folders under `node_modules` that Xcode needs for Swift Package resolution. Do not open the web project folder instead.

If Xcode shows **Resolving Package Graph Failed**, close Xcode, delete the previously extracted old build 19 folder, unzip the fixed package again, and open `ios/App/App.xcodeproj` from inside the new extracted folder. In Xcode choose **File → Packages → Reset Package Caches**, then choose **File → Packages → Resolve Package Versions** before pressing Run.

## Confirm the release settings

In **General**, confirm the bundle identifier is `com.mzansi.couriers`, the version is `2.0.2`, and the build is **31**. Build 31 adds QR custody verification, relay inspection evidence, sender-only QR download, and delivery reviews.

In **Signing & Capabilities**, select your Apple Developer Team and make sure Xcode reports no signing error. Do not add App Tracking Transparency; this release does not request advertising tracking.

## Test the iPad launch before uploading

Select an iPad simulator or connect an iPad. Press the Run button. Confirm that the app opens beyond the launch screen, the full Mzansi Couriers logo appears, and the app does not freeze. Rotate the iPad through portrait and landscape orientations.

## Archive and upload

Choose **Product → Clean Build Folder**. Then select **Any iOS Device (arm64)** as the run destination. Choose **Product → Archive**. When Organizer opens, select the new archive, choose **Validate App**, and correct any signing message Xcode reports. If validation succeeds, choose **Distribute App**, select **App Store Connect**, and follow the upload steps.

## Finish in App Store Connect

Wait for Apple to process the build. Attach the processed build to the 2.0.2 version. Review the privacy answers so they match the final binary: the app uses camera, photo library, and in-use location permissions; it does not request advertising tracking. Attach the genuine iPad screenshots supplied with this package, review export compliance, and submit the update for review.

A successful Xcode archive and upload is required before the app can be resubmitted. The sandbox can prepare and validate the package, but it cannot sign the binary with your Apple account or upload it on your behalf.
