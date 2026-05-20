# iOS Build Guide - Mzansi Couriers

## Overview

This guide walks you through building and submitting Mzansi Couriers to the Apple App Store using Capacitor.

**Timeline:** 2-3 hours for first build, 30 minutes for subsequent builds

---

## Prerequisites

### Required
- **Mac with Xcode 14+** installed
- **Apple Developer Account** ($99/year)
- **Xcode Command Line Tools**
- **CocoaPods** (for dependency management)
- **Node.js 18+**

### Check Prerequisites
```bash
# Verify Xcode
xcode-select --print-path

# Verify CocoaPods
pod --version

# Verify Node
node --version
```

---

## Step 1: Prepare Environment Variables

Before building, ensure all environment variables are set:

```bash
# Backend API URL (from Railway)
export VITE_FRONTEND_FORGE_API_URL=https://your-railway-app.railway.app

# Firebase config
export VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
export VITE_FIREBASE_API_KEY=your-firebase-api-key

# Paystack
export VITE_PAYSTACK_PUBLIC_KEY=your-paystack-public-key

# OAuth
export VITE_OAUTH_PORTAL_URL=https://your-oauth-url
```

---

## Step 2: Build Web Assets

```bash
# Install dependencies
pnpm install

# Build for production
pnpm run build

# Verify dist/public/index.html exists
ls -la dist/public/index.html
```

---

## Step 3: Sync Capacitor

```bash
# Sync iOS platform with latest web assets
npx cap sync ios

# Verify iOS project updated
ls -la ios/App/App/public/index.html
```

---

## Step 4: Open Xcode Project

```bash
# Open the iOS project in Xcode
open ios/App/App.xcworkspace

# IMPORTANT: Always use .xcworkspace, NOT .xcodeproj
```

---

## Step 5: Configure Xcode Project

### 5.1 Set App ID and Bundle Identifier

1. In Xcode, select **App** in Project Navigator
2. Select **App** target
3. Go to **Build Settings**
4. Search for "Bundle Identifier"
5. Set to: `com.mzansi.couriers`

### 5.2 Set Version and Build Number

1. Select **App** target
2. Go to **General** tab
3. Set **Version**: `1.0.0`
4. Set **Build**: `1`

### 5.3 Configure Signing

1. Select **App** target
2. Go to **Signing & Capabilities**
3. Select your team from dropdown
4. Xcode will automatically create provisioning profiles

### 5.4 Add Required Capabilities

1. Click **+ Capability**
2. Add these capabilities:
   - Push Notifications
   - Background Modes (select: Remote notifications)
   - Maps
   - Location Services

---

## Step 6: Configure Info.plist

Xcode automatically manages most settings, but verify these:

1. Select **App** → **Info**
2. Verify these keys exist:

```
NSLocationWhenInUseUsageDescription: "Mzansi Couriers needs your location for delivery tracking"
NSLocationAlwaysAndWhenInUseUsageDescription: "Mzansi Couriers needs your location for delivery tracking"
NSCameraUsageDescription: "Mzansi Couriers needs camera access for delivery photos"
NSPhotoLibraryUsageDescription: "Mzansi Couriers needs photo library access for delivery photos"
```

---

## Step 7: Build for Simulator (Testing)

```bash
# In Xcode:
# 1. Select Product → Scheme → App
# 2. Select Product → Destination → iPhone 15 (or your preferred simulator)
# 3. Click Product → Build (⌘B)
# 4. Click Product → Run (⌘R)
```

### Troubleshooting Build Errors

**Error: "No such module 'Capacitor'"**
```bash
# Clean build folder
rm -rf ios/Pods
rm -rf ios/Podfile.lock
cd ios
pod install
cd ..
npx cap sync ios
```

**Error: "Code signing required"**
- Go to Signing & Capabilities
- Select your team
- Let Xcode auto-generate provisioning profiles

**Error: "Build failed with exit code 1"**
```bash
# Clean and rebuild
npx cap sync ios
# Then rebuild in Xcode
```

---

## Step 8: Build for Device (Testing on Real iPhone)

1. Connect iPhone via USB
2. In Xcode, select your iPhone as destination
3. Click Product → Build (⌘B)
4. Click Product → Run (⌘R)

---

## Step 9: Create App Store Build

### 9.1 Create Archive

```bash
# In Xcode:
# 1. Select Product → Scheme → App
# 2. Select Product → Destination → Any iOS Device (arm64)
# 3. Click Product → Archive
# 4. Wait for archive to complete
```

### 9.2 Validate Archive

```bash
# In Xcode Organizer:
# 1. Window → Organizer
# 2. Select your archive
# 3. Click "Validate App"
# 4. Select your signing certificate
# 5. Wait for validation
```

### 9.3 Upload to App Store

```bash
# In Xcode Organizer:
# 1. Select your archive
# 2. Click "Distribute App"
# 3. Select "App Store Connect"
# 4. Select "Upload"
# 5. Follow the prompts
```

---

## Step 10: Submit to App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select **My Apps**
3. Click **Mzansi Couriers**
4. Go to **App Store** tab
5. Click **Build** section
6. Select your uploaded build
7. Fill in **App Information**:
   - Privacy Policy URL
   - Support URL
   - Promotional text
   - Description
   - Keywords
   - Screenshots (5 required per device)
   - Preview video (optional)

8. Set **Pricing and Availability**:
   - Select countries
   - Set price (or free)
   - Select availability date

9. Click **Submit for Review**

---

## App Store Review Checklist

Before submitting, ensure:

- ✅ App icon (1024x1024 PNG)
- ✅ Screenshots (5 per device type)
- ✅ Privacy Policy URL
- ✅ Support URL
- ✅ Terms of Service URL
- ✅ App description (clear and accurate)
- ✅ No fake reviews or testimonials
- ✅ No prohibited content
- ✅ Proper age rating
- ✅ All features working
- ✅ No console errors
- ✅ No hardcoded API keys
- ✅ No test accounts in app

---

## Deployment Environment Variables

### For Railway Backend

```bash
# In Railway project settings:
DATABASE_URL=mysql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
PAYSTACK_SECRET_KEY=your-paystack-secret
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_NUMBER=your-whatsapp-number
```

### For Firebase Frontend

```bash
# In .env.production (not committed):
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Troubleshooting

### App crashes on launch
- Check console for errors: `Console.app` → filter by "Mzansi"
- Verify all environment variables are set
- Check network connectivity
- Verify backend is running

### Location not working
- Ensure location permission is granted in Settings
- Verify `NSLocationWhenInUseUsageDescription` in Info.plist
- Check that location services are enabled on device

### Push notifications not working
- Verify APNs certificate in Apple Developer
- Check Firebase Cloud Messaging setup
- Verify device token is being sent to backend

### Build takes too long
- Close Xcode and reopen
- Clean build folder: `Product → Clean Build Folder`
- Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`

---

## Release Updates

For subsequent releases:

```bash
# 1. Update version in Xcode (General tab)
# 2. Build web assets
pnpm run build

# 3. Sync Capacitor
npx cap sync ios

# 4. Create new archive in Xcode
# 5. Upload to App Store Connect
# 6. Submit for review
```

---

## Support

For issues, contact:
- **Email:** support@mzansicouriers.com
- **In-App Support:** Available 24/7

---

## Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Xcode Documentation](https://developer.apple.com/xcode/)
- [Apple Developer Program](https://developer.apple.com/)
