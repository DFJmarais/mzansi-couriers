# iOS App Review Audit

Apple’s screenshots report four issues in the submitted build: a blank app icon, an iPad launch freeze, inaccurate 13-inch iPad screenshots, and an App Tracking Transparency/privacy disclosure mismatch.

The available native source is `/home/ubuntu/MzansiCouriers-iOS-CapApp-SPM-FIXED/App/App`. Its `Assets.xcassets/AppIcon.appiconset/Contents.json` declares iPhone, iPad, and iOS marketing slots, including iPad 76pt, 83.5pt, and 1024pt entries. The catalog declaration alone does not prove the referenced PNG files are present, valid, opaque, or included in the submitted archive; Apple’s blank-icon finding means the actual archive/catalog still needs verification.

`AppTrackingTransparency.swift` explicitly does not import AppTrackingTransparency or AdSupport and states that the app does not use cross-app or cross-company advertising tracking. This is consistent with an app that does not track for advertising, but the App Store Connect privacy answers must match the actual submitted build’s data collection and tracking declarations. The rejection may be a metadata mismatch rather than evidence that ATT code should be added.

The current web project and the available native project are separate locations. Any native fixes must be applied to the native Xcode project and rebuilt; updating the web preview alone cannot change the already-submitted iOS binary.
