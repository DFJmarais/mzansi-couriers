# Capacitor Build Scripts - Mzansi Couriers

Quick reference for common Capacitor commands.

---

## Build & Sync Commands

```bash
# Build web assets
pnpm run build

# Sync iOS with latest web assets
npx cap sync ios

# Sync Android with latest web assets
npx cap sync android

# Sync both platforms
npx cap sync

# Copy web assets only (no plugin updates)
npx cap copy ios
npx cap copy android

# Update iOS plugins
npx cap update ios

# Update Android plugins
npx cap update android
```

---

## Development Commands

```bash
# Start dev server
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm test

# Lint code
pnpm run lint

# Format code
pnpm run format
```

---

## iOS Specific Commands

```bash
# Open iOS project in Xcode
open ios/App/App.xcworkspace

# Build for simulator
npx cap run ios

# Build for device
npx cap run ios --device

# List available devices
npx cap run ios --list

# Build specific device
npx cap run ios --device="iPhone 15"

# Clean iOS build
rm -rf ios/App/Pods
rm -rf ios/Podfile.lock
cd ios && pod install && cd ..
npx cap sync ios
```

---

## Android Specific Commands

```bash
# Open Android project in Android Studio
open -a "Android Studio" android

# Build for emulator
npx cap run android

# Build for device
npx cap run android --device

# List available devices
npx cap run android --list

# Clean Android build
rm -rf android/build
rm -rf android/app/build
npx cap sync android
```

---

## Debugging Commands

```bash
# View iOS logs
npx cap run ios --logs

# View Android logs
npx cap run android --logs

# Open native IDE
npx cap open ios
npx cap open android

# Check Capacitor status
npx cap doctor

# List installed plugins
npx cap plugin ls
```

---

## Deployment Commands

```bash
# Build production web assets
pnpm run build

# Sync for production
npx cap sync ios
npx cap sync android

# Create iOS archive (in Xcode)
# Product → Archive

# Create Android release APK
# In Android Studio: Build → Build Bundle(s) / APK(s)

# Deploy frontend to Firebase
firebase deploy

# Deploy backend to Railway
git push origin main
```

---

## Troubleshooting Commands

```bash
# Check system requirements
npx cap doctor

# Verify iOS setup
npx cap doctor ios

# Verify Android setup
npx cap doctor android

# Clear cache
rm -rf node_modules dist
pnpm install
pnpm run build

# Reinstall dependencies
pnpm install
pnpm run build
npx cap sync

# Full clean rebuild
rm -rf node_modules dist ios/Pods ios/Podfile.lock android/build
pnpm install
pnpm run build
npx cap sync
```

---

## Full Deployment Workflow

```bash
# 1. Prepare code
git add .
git commit -m "Release v1.0.0"
git push origin main

# 2. Build web assets
pnpm run build

# 3. Sync platforms
npx cap sync ios
npx cap sync android

# 4. Deploy frontend
firebase deploy

# 5. Build iOS archive
# In Xcode: Product → Archive

# 6. Upload to App Store
# In Xcode Organizer: Distribute App → Upload

# 7. Submit for review
# In App Store Connect: Submit for Review

# 8. Build Android release
# In Android Studio: Build → Generate Signed Bundle/APK

# 9. Upload to Play Store
# In Google Play Console: Upload Release Bundle
```

---

## Environment Setup

```bash
# Install Capacitor CLI globally
npm install -g @capacitor/cli

# Verify installation
npx cap --version

# Update Capacitor
pnpm update @capacitor/core @capacitor/cli

# Update plugins
pnpm update @capacitor/*
```

---

## Common Issues & Solutions

### "No such module 'Capacitor'"

```bash
cd ios
pod install
cd ..
npx cap sync ios
```

### "Build failed with exit code 1"

```bash
# Clean and rebuild
rm -rf ios/Pods ios/Podfile.lock
npx cap sync ios
```

### "Code signing required"

```bash
# In Xcode:
# 1. Select App target
# 2. Go to Signing & Capabilities
# 3. Select your team
# 4. Let Xcode auto-generate provisioning profiles
```

### "Web assets directory not found"

```bash
# Ensure dist/public exists
pnpm run build
ls -la dist/public/index.html

# Update capacitor.config.json
# "webDir": "dist/public"
```

---

## Performance Tips

1. **Lazy load routes** - Reduce initial bundle size
2. **Code split** - Split large chunks
3. **Optimize images** - Use WebP format
4. **Cache assets** - Service worker caching
5. **Minimize dependencies** - Remove unused packages
6. **Tree shake** - Remove unused code

---

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use HTTPS only** - Enable in capacitor.config.json
3. **Validate input** - Sanitize user data
4. **Secure storage** - Use Capacitor Preferences plugin
5. **Update dependencies** - Keep packages current
6. **Code review** - Review changes before deploy

---

## Monitoring Commands

```bash
# Monitor app performance
# In Xcode: Debug → Gauges

# Monitor network requests
# In Xcode: Debug → Network Link Conditioner

# Monitor memory usage
# In Xcode: Debug → Memory Graph

# Monitor CPU usage
# In Xcode: Debug → System Trace

# View device logs
# On iPhone: Settings → Privacy → Analytics → Analytics Data
```

---

## Reference

- [Capacitor CLI Documentation](https://capacitorjs.com/docs/cli)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
