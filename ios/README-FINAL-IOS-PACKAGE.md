# Mzansi Couriers — Corrected iOS Xcode Package

This package contains the corrected Capacitor iOS project and the production web bundle.

## Corrections included

- Complete opaque `AppIcon` catalog with iPhone and iPad slots.
- iPad 76pt, 83.5pt, and 1024pt icon assets.
- `CFBundleIconName` and icon-file metadata in `Info.plist`.
- `BridgeViewController` included in the Xcode target Sources phase.
- Safe single Capacitor launch path for iPad.
- All four iPad orientations enabled.
- Release settings use `AppIcon`, the custom plist, and `GENERATE_INFOPLIST_FILE = NO`.
- Marketing version `2.0.2` and corrected upload build `13`.
- No ATT/IDFA tracking request in the native package.
- Production web bundle embedded at `App/public`.

## Open in Xcode

Open `App.xcodeproj` on a Mac with Xcode. Select the `App` target, choose **Any iOS Device (arm64)**, and verify the version/build fields before archiving. The App Store version currently being resubmitted is `2.0.2`; build `13` is the corrected upload to use.

Before Archive, choose **Product → Clean Build Folder**, then **Product → Archive**. Validate the archive first. Upload it only after Organizer shows the intended version and build.

The `ipad-screenshots` folder contains five genuine 13-inch iPad screenshots captured from real Mzansi Couriers public routes: Home, Fleet, Support, Packaging Requirements, and Courier onboarding. Each JPEG is exactly 2048 × 2732 pixels and can be attached to the 12.9-inch/13-inch iPad App Store slot.

The `iphone-screenshots` folder contains five genuine current iPhone captures of the same routes at 1284 × 2778 pixels for the 6.5-inch iPhone slot. These replace the older screenshots that showed outdated screens and demo-style dashboard figures. Upload these to the iPhone 6.5-inch media slot in the same order: Home, Fleet, Support, Packaging Requirements, and Courier onboarding.

## Important limitation

A Mac with Xcode is required to compile and sign the native project. Apple Developer account actions—uploading, attaching the processed build, replacing both iPhone and iPad screenshot sets, and resubmitting—must be completed in the user’s App Store Connect account.
