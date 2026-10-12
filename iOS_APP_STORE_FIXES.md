# iOS App Store Rejection Fixes - Mzansi Couriers

## Status: IN PROGRESS
Submission ID: 7d11acea-44b5-47fe-bf5a-b8a88e856507
Review Date: June 28, 2026
Device: iPad Air 11-inch (M3) - iPadOS 26.5

---

## Issue 1: App Crash at Launch (2.1.0 - App Completeness)

**Problem:** App crashes immediately on iPad Air 11-inch (iPadOS 26.5)

**Root Cause:** BridgeViewController.swift is looking for `index.html` in bundle paths that may not exist on iPad or may have different path resolution.

**Solution:** 
- Simplify the web view setup to use Capacitor's standard server loading
- Remove custom path logic that may fail on iPad
- Use `self.loadApp()` from CAPBridgeViewController instead of manual file loading

**File to Fix:** `/home/ubuntu/mzansi-couriers/ios/App/App/BridgeViewController.swift`

---

## Issue 2: Placeholder App Icons (2.3.3 - Accurate Metadata)

**Problem:** App icons appear to be placeholder icons, not finalized Mzansi Couriers branding

**Root Cause:** iOS asset catalog (`Assets.xcassets/AppIcon.appiconset`) is missing or contains generic placeholder icons

**Solution:**
- Generate finalized Mzansi Couriers app icons (1024x1024px base)
- Create all required iOS icon sizes (120x120, 152x152, 167x167, 180x180, etc.)
- Upload to Xcode asset catalog
- Ensure icons match Mzansi brand (Green + Gold + Orange colors)

**Icon Requirements:**
- App Icon: 1024x1024px (primary)
- iPhone: 120x120, 180x180
- iPad: 152x152, 167x167
- All icons must be PNG with no transparency

---

## Issue 3: iPad Screenshots from App Store (2.3.8 - Accurate Metadata)

**Problem:** 13-inch iPad screenshots are from App Store mockups, not actual app UI

**Root Cause:** Screenshots were generated from App Store templates instead of actual app running on iPad

**Solution:**
- Take actual screenshots from iPad Air 11-inch running the app
- Use correct dimensions: 1242x2688px or 1284x2778px
- Show real app UI, not mockups or marketing materials
- Ensure screenshots show core features: booking, tracking, earnings

**Screenshot Requirements:**
- Dimensions: 1242x2688px (iPhone) or 1284x2778px (iPhone Pro)
- For iPad: 2048x2732px or 2732x2048px
- Must show actual app UI in use
- Majority should show main features, not splash/login screens

---

## Issue 4: App Tracking Transparency (5.1.2 - Legal: Privacy)

**Problem:** App collects tracking data but doesn't request ATT permission via AppTrackingTransparency framework

**Root Cause:** ATT permission request is attempted via webkit bridge but not through native AppTrackingTransparency framework

**Solution:**
- Ensure `NSUserTrackingUsageDescription` is in Info.plist (✓ already present)
- Call `ATTrackingManager.requestTrackingAuthorization` on app launch
- Update privacy policy to explain tracking and IDFA usage
- Implement proper consent flow before collecting tracking data

**Files to Update:**
- `ios/App/App/AppTrackingTransparency.swift` - Ensure called on launch
- `ios/App/App/Info.plist` - Verify `NSUserTrackingUsageDescription` is present
- `client/src/pages/Privacy.tsx` - Add tracking/ATT explanation

---

## Implementation Plan

### Phase 1: Fix App Crash
1. Simplify BridgeViewController.swift to use standard Capacitor loading
2. Remove custom path resolution logic
3. Test on iPad simulator and device

### Phase 2: Create App Icons
1. Generate 1024x1024px Mzansi Couriers icon
2. Create all required iOS sizes
3. Add to Xcode asset catalog
4. Verify in Xcode build

### Phase 3: Update Screenshots
1. Run app on iPad Air 11-inch
2. Take screenshots showing: booking flow, tracking, earnings, profile
3. Ensure dimensions match App Store requirements
4. Upload to App Store Connect

### Phase 4: Verify ATT
1. Confirm AppTrackingTransparency.swift is called on launch
2. Test ATT permission prompt on device
3. Update privacy policy with tracking explanation
4. Verify user can grant/deny tracking

### Phase 5: Resubmit
1. Archive and upload new build to App Store
2. Update screenshots in App Store Connect
3. Add review notes explaining fixes
4. Submit for review

---

## Testing Checklist

- [ ] App launches without crash on iPad Air 11-inch
- [ ] App launches without crash on iPhone 15 Pro
- [ ] App icons display correctly (not placeholder)
- [ ] Screenshots show actual app UI (not mockups)
- [ ] ATT permission prompt appears on first launch
- [ ] Privacy policy is accessible and complete
- [ ] All features work on iPad (responsive layout)
- [ ] No console errors in Xcode debugger
- [ ] App passes all automated App Store checks

---

## Notes

- Submission was reviewed on iPad Air 11-inch (M3) running iPadOS 26.5
- App must function on all supported devices (iPhone + iPad)
- Screenshots must be from actual app, not marketing materials
- Privacy policy must explain all data collection and tracking
- ATT is required for any tracking/analytics/advertising
