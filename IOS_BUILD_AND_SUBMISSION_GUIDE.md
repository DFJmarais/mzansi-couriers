# Mzansi Couriers iOS App - Build & App Store Submission Guide

## Overview

This guide walks you through building the Mzansi Couriers iOS app and submitting it to the Apple App Store. The app uses Capacitor to wrap the React web app in a native iOS container.

---

## Part 1: Prerequisites

### What You Need

1. **Mac with Xcode installed** (macOS 12.0 or later)
   - Download from: https://apps.apple.com/app/xcode/id497799835
   - Or install via: `xcode-select --install`

2. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/account
   - Create an App ID for: `com.mzansi.couriers`

3. **App Store Connect Access**
   - Log in at: https://appstoreconnect.apple.com
   - Create the app entry for "Mzansi Couriers"

4. **Provisioning Profile & Signing Certificate**
   - Create in: Xcode → Preferences → Accounts → Manage Certificates
   - Or via: Apple Developer → Certificates, Identifiers & Profiles

---

## Part 2: Recent Fixes Applied

The following fixes have been applied to address the asset loading issue:

### 1. Custom Bridge View Controller (`BridgeViewController.swift`)
- **Location:** `/ios/App/App/BridgeViewController.swift`
- **Purpose:** Explicitly handles loading bundled web files
- **Key Features:**
  - Sets the server base path to "public"
  - Enables file access from file URLs
  - Loads index.html from the bundle
  - Includes fallback paths for reliability

### 2. Updated Main Storyboard
- **Location:** `/ios/App/App/Base.lproj/Main.storyboard`
- **Change:** Now uses custom `BridgeViewController` instead of default `CAPBridgeViewController`
- **Effect:** Ensures proper initialization of the web view

### 3. Enhanced Capacitor Configuration
- **Location:** `/ios/App/App/capacitor.config.json`
- **Updates:**
  - Added `cleartext: true` for HTTP support
  - Added `allowNavigation: ["*"]` for URL routing
  - Added iOS-specific `scheme` and `hostname` settings
  - Configured for bundled file loading

---

## Part 3: Building the iOS App

### Step 1: Open the Project in Xcode

```bash
cd ~/path/to/mzansi-couriers/ios/App
open App.xcodeproj
```

### Step 2: Configure Signing

1. Select the **App** project in the left sidebar
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Under **Signing**, select your team from the dropdown
5. Xcode will automatically create a provisioning profile

### Step 3: Select Build Destination

1. At the top of Xcode, select **App** scheme (left dropdown)
2. Select **Generic iOS Device** (right dropdown) - NOT a simulator
   - This is required for App Store submission

### Step 4: Build the App

1. Go to **Product** → **Build**
   - Wait for the build to complete (should show "Build Successful")
   - If there are errors, see the **Troubleshooting** section below

### Step 5: Archive the App

1. Go to **Product** → **Archive**
   - Xcode will build and archive the app
   - The Organizer window will open automatically when complete
   - Your archive will appear in the list

---

## Part 4: Uploading to App Store Connect

### Step 1: Distribute the Archive

1. In the Organizer window, select your archive
2. Click **Distribute App**
3. Choose **App Store Connect** → **Upload**

### Step 2: Follow the Upload Wizard

1. **Select a Signing Certificate:** Choose your development team
2. **Select a Distribution Certificate:** Choose your distribution certificate
3. **Upload:** Click through to upload
   - Wait for the upload to complete (5-10 minutes)
   - You'll see "Upload Successful" when done

### Step 3: Verify in App Store Connect

1. Log in to https://appstoreconnect.apple.com
2. Go to **My Apps** → **Mzansi Couriers**
3. Go to **TestFlight** tab
4. Your build should appear in "Builds" section within 5-10 minutes
5. Wait for processing to complete (usually 5-15 minutes)

---

## Part 5: Testing Before App Store Submission

### Option A: Internal Testing (Recommended First Step)

1. In App Store Connect, go to **TestFlight** → **Internal Testing**
2. Add your Apple ID as a tester
3. Download TestFlight app on your iPhone
4. Accept the invite and download the build
5. Test the app thoroughly:
   - Load the home page
   - Try booking a delivery
   - Test delivery tracking
   - Check support links
   - Verify all navigation works

### Option B: External Testing

1. Create a TestFlight group
2. Add external testers (friends, colleagues)
3. They can test and provide feedback
4. Gather feedback for 2-3 days

### Collecting Crash Reports

If the app crashes during testing:

1. On your iPhone, go to **Settings** → **Privacy** → **Analytics**
2. Enable **Share iCloud Analytics**
3. Crashes will be reported to App Store Connect
4. Check **Xcode** → **Organizer** → **Crashes** tab for detailed logs

---

## Part 6: Submitting to App Store

### Prerequisites Checklist

Before submitting, ensure you have:

- [ ] App name: "Mzansi Couriers"
- [ ] Bundle ID: `com.mzansi.couriers`
- [ ] Version: `2.0.0`
- [ ] Build number: `1` (or higher if resubmitting)
- [ ] Privacy Policy URL: https://mzansicourier-nsebzqbt.manus.space/policies/privacy
- [ ] Support URL: https://mzansicourier-nsebzqbt.manus.space/support
- [ ] App Category: **Lifestyle** or **Business**
- [ ] Content Rating: Complete the questionnaire
- [ ] Screenshots: 5 professional screenshots (1284x2778px)
- [ ] App Icon: 1024x1024px (already provided)
- [ ] Description: Compelling app description (see below)
- [ ] Keywords: Relevant search terms
- [ ] Support Email: support@mzansicouriers.com

### App Description Template

```
Mzansi Couriers is South Africa's peer-to-peer delivery network, connecting senders, small businesses, and independent drivers through an AI-powered dispatch engine.

**For Customers:**
- Book deliveries across South Africa
- Real-time tracking with live courier location
- Transparent pricing with no hidden fees
- Fast, reliable service from independent drivers

**For Couriers:**
- Earn R14,000-16,000 per month
- Flexible work schedule
- No warehouse or equipment needed
- AI-powered job matching
- Real-time earnings tracking

**Features:**
- Real-time delivery tracking
- Multiple service levels (Economy, Express, Same-Day)
- WhatsApp support
- Secure payment processing
- Delivery proof with photos
- Relay-based pricing system

Mzansi Couriers - Connecting South Africa, one delivery at a time.
```

### Step 1: Complete App Information

1. In App Store Connect, go to **My Apps** → **Mzansi Couriers**
2. Go to **App Information** tab
3. Fill in all required fields:
   - App Name
   - Subtitle (optional)
   - Privacy Policy URL
   - Support URL
   - App Category
   - Content Rating

### Step 2: Add Screenshots

1. Go to **App Preview and Screenshots** section
2. For each device size (iPhone 6.7", iPhone 6.1", iPhone 5.5"):
   - Upload 2-5 professional screenshots
   - Add descriptions for each screenshot
   - Screenshots should be 1284x2778px

### Step 3: Complete Pricing and Availability

1. Go to **Pricing and Availability**
2. Set Price: **Free**
3. Select regions where the app is available
4. Set availability date (can be immediate)

### Step 4: Submit for Review

1. Go to **Version Release** section
2. Select your build
3. Review all information
4. Click **Submit for Review**
5. Apple will review within 24-48 hours

---

## Part 7: Troubleshooting

### Build Errors

#### Error: "Cannot find 'Capacitor' module"

**Solution:**
```bash
cd ~/path/to/mzansi-couriers/ios/App
rm -rf Pods
pod install
```

Then rebuild in Xcode.

#### Error: "Code signing required"

**Solution:**
1. Select the **App** project
2. Select the **App** target
3. Go to **Signing & Capabilities**
4. Ensure your team is selected
5. Let Xcode auto-generate the provisioning profile

#### Error: "Architecture mismatch"

**Solution:**
1. Go to **Build Settings**
2. Search for "Architectures"
3. Set to: `arm64` (for real devices) or `arm64 x86_64` (for simulators)

### Runtime Errors

#### App Shows "Unexpected Error" on Launch

**This should be fixed by the new BridgeViewController. If it still occurs:**

1. Check the console in Xcode:
   - **Xcode** → **Window** → **Console**
   - Look for error messages about file paths

2. Verify the public folder is in the bundle:
   - In Xcode, select the **App** target
   - Go to **Build Phases** → **Copy Bundle Resources**
   - Ensure "public" folder is listed

3. If not listed, add it:
   - Click **+** button
   - Select the "public" folder from the file browser
   - Ensure "Copy items if needed" is checked

#### App Loads but Shows Blank Screen

**Possible causes:**

1. **CSS/JavaScript not loading:**
   - Check browser console (Xcode → Debug → Console)
   - Look for 404 errors on asset files

2. **Relative paths issue:**
   - All paths in index.html should be relative: `./assets/...`
   - Check that index.html uses relative paths (already fixed)

3. **CORS issues:**
   - The BridgeViewController should handle this
   - If still occurring, check the console for CORS errors

### App Store Submission Issues

#### Rejection: "Guideline 4.2 - Design: Minimum Functionality"

**This means the app is too simple or just a web wrapper.**

**Solution:**
- Ensure the app provides real functionality
- The Mzansi Couriers app has: booking, tracking, payments, notifications
- Should not be rejected for this reason

#### Rejection: "Guideline 2.1 - Information Needed"

**Apple is asking for more information about the app.**

**Solution:**
- Respond with detailed explanation of features
- Provide test account credentials if needed
- Explain the business model

#### Rejection: "Guideline 5.1 - Legal: Privacy"

**Privacy policy issues.**

**Solution:**
- Ensure privacy policy is accessible and complete
- Already provided at: `/support` page
- Ensure it covers: location data, photos, user data

---

## Part 8: After Approval

### Launch Day

1. Go to **Version Release** section
2. Choose release date:
   - **Automatic:** Release immediately upon approval
   - **Manual:** Release on specific date
3. Click **Release This Version**

### Post-Launch Monitoring

1. Check **Trends** tab for downloads and ratings
2. Monitor **Crashes** tab for any issues
3. Read user reviews and respond to feedback
4. Plan updates based on user feedback

### Future Updates

To submit an update:

1. Increment version number (e.g., 2.0.1)
2. Make code changes
3. Rebuild and archive
4. Upload new build
5. Submit for review (same process as initial submission)

---

## Part 9: Key Files Reference

| File | Purpose |
|------|---------|
| `/ios/App/App/BridgeViewController.swift` | Custom view controller for asset loading |
| `/ios/App/App/Base.lproj/Main.storyboard` | Updated to use BridgeViewController |
| `/ios/App/App/capacitor.config.json` | Capacitor configuration |
| `/ios/App/App/Info.plist` | App metadata and permissions |
| `/ios/App/App/public/index.html` | Web app entry point |
| `/ios/App/App/public/assets/` | Built web assets (JS, CSS) |

---

## Part 10: Quick Reference

### Build Command (Terminal)

```bash
cd ~/path/to/mzansi-couriers/ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Release -derivedDataPath build
```

### Archive Command (Terminal)

```bash
xcodebuild -project App.xcodeproj -scheme App -configuration Release -archivePath build/App.xcarchive archive
```

### Export for App Store (Terminal)

```bash
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportPath build/export -exportOptionsPlist exportOptions.plist
```

---

## Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review the console logs in Xcode
3. Check Apple's documentation: https://developer.apple.com/documentation/
4. Visit Apple Developer Forums: https://developer.apple.com/forums/

---

**Last Updated:** June 30, 2026
**App Version:** 2.0.0
**Status:** Ready for App Store Submission
