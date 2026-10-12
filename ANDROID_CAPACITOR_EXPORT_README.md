# Mzansi Couriers — Android Capacitor Source Export

## Stack

- **Frontend:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS 4
- **Application API:** Express + tRPC 11
- **Database:** MySQL/TiDB through Drizzle ORM
- **Native wrapper:** Capacitor 8 Android
- **Android application ID:** `com.mzansi.couriers`
- **Android version:** `2.0.2` / version code `30`

## Public production URL

https://mzansicourier-nsebzqbt.manus.space

The Android application is a native Capacitor shell around the built web client. Its operational API, authentication, payments, tracking, and storage remain hosted; the public URL is the hosted web fallback and backend origin.

## Build on a development machine

Requirements: Node.js 22+, pnpm 10+, Android Studio, Android SDK, and a JDK supported by the installed Android Gradle Plugin.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm exec cap sync android
```

The web build output is:

```text
dist/public/
```

Capacitor copies that output into the Android project during `cap sync android`.

## Open and build in Android Studio

```bash
pnpm exec cap open android
```

Or open the `android/` directory directly in Android Studio. For a local debug APK:

```bash
cd android
./gradlew assembleDebug
```

For a Google Play App Bundle, configure your own upload keystore in Android Studio/Gradle and use:

```bash
cd android
./gradlew bundleRelease
```

Do not place the keystore, passwords, `google-services.json`, or signing credentials in this source export.

## Hosted backend requirements

The Android wrapper must keep these services hosted and reachable over HTTPS:

1. **Express/tRPC application server** — authentication, customer booking, courier workflows, relay routing, account deletion, safety controls, and tracking APIs.
2. **MySQL/TiDB database** — users, parcels, routes, payments, proof-of-delivery metadata, relay handoffs, and safety approvals.
3. **Paystack server integration** — secret keys, payment verification, webhooks, refunds, and courier payout operations must stay server-side.
4. **Manus authentication and MCP services** — OAuth/session handling and the private MCP bridge remain server-side.
5. **Object storage** — parcel images and proof-of-delivery photos remain in hosted storage; only references belong in the database.
6. **Maps/geocoding/routing proxy** — map requests and any protected credentials remain on the hosted backend or approved proxy.
7. **Background workers/queues** — notifications, webhook processing, and relay/dispatch jobs require the hosted worker infrastructure.

The mobile app should never receive database credentials, Paystack secret keys, Manus API keys, JWT signing secrets, storage credentials, or private MCP tokens.

## Environment setup

Copy `ENVIRONMENT_TEMPLATE.txt` to the hosting provider’s secret/configuration manager. Do not copy secrets into the Android project or commit an `.env` file.

## Export exclusions

This handoff excludes local environment files, generated build output, `node_modules`, Git metadata, local logs, test artifacts, signing keys, and private credentials. Run the build commands above after extraction.
