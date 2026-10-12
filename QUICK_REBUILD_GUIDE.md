# ⚡ Quick Rebuild Guide (5 Minutes)

**If you already have the Xcode project open, just do this:**

---

## 🔄 Step 1: Update the Files (Copy-Paste)

1. **Download the checkpoint** (`bc2568de`) from Manus
2. **Extract the ZIP file**
3. **Copy these files** from the extracted folder:
   - `ios/App/App/BridgeViewController.swift`
   - `ios/App/App/AppTrackingTransparency.swift`
   - `ios/App/App/Info.plist`
   - `ios/App/App/capacitor.config.json`

4. **Paste them** into your existing Xcode project folder:
   - Replace the old files with the new ones
   - Say "Yes" when it asks to replace

---

## 🧹 Step 2: Clean & Rebuild in Xcode

1. **In Xcode**, go to: **Product** → **Clean Build Folder**
   - Wait for it to finish (30 seconds)

2. Then go to: **Product** → **Build**
   - Wait for it to finish (1-2 minutes)

3. If you see ✅ at the top, you're good!

---

## 📦 Step 3: Archive

1. Make sure "Generic iOS Device" is selected (top-left)
2. Go to: **Product** → **Archive**
3. Wait (5-10 minutes)
4. Organizer window opens

---

## 📤 Step 4: Upload

1. In Organizer, click **"Distribute App"**
2. Select **"App Store Connect"** → **"Upload"**
3. Sign in with your Apple ID
4. Click **"Upload"**
5. Wait (5-10 minutes)
6. Done! ✅

---

## 🖼️ Step 5: Update App Store Connect

1. Go to: https://appstoreconnect.apple.com
2. Click **"My Apps"** → **"Mzansi Couriers"**
3. Update:
   - App Icon: `mzansi-app-icon.png`
   - Screenshots: `appstore-screenshot-1-home.webp`, `appstore-screenshot-2-pricing.webp`, `appstore-screenshot-3-service-levels.webp`
4. Click **"Save"**

---

## ✅ Step 6: Submit

1. Click **"Submit for Review"**
2. Answer the questions
3. Click **"Submit"**
4. Done! 🎉

---

## That's It!

**Total time: About 30 minutes**

Just follow these 6 simple steps and your app will be submitted!
