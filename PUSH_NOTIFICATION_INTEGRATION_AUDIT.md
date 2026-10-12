# Mzansi Couriers — Push Notification Integration Audit

**Audit date:** 11 October 2026
**Project:** `mzansi-couriers`
**Audited deployment:** `https://mzansicourier-nsebzqbt.manus.space`
**Project version inspected:** `9391e6ac`
**Scope:** Read-only inspection only. No source changes, database migrations, secret changes, notification sends, or deployment actions were performed.

## Executive conclusion

The current live backend is **not yet ready to receive the Android push-notification implementation** as a complete end-to-end feature.

The project already contains a useful notification lifecycle foundation and the Capacitor push plugin dependency, but the current application does **not** contain the server-side push-token registration, device-token persistence, push provider sender, or account-scoped push authorization required to make Android push notifications work safely.

The exact separate “local push implementation” referenced in the request was not present in the current sandbox/project checkout, so an exact file-by-file diff against that implementation could not be performed. The audit therefore compares the current live project against the stated four safety requirements and identifies the required integration contract. The local implementation/export should be supplied or copied into the project before implementation begins.

## What was verified

### 1. Live project and deployment

- The live site responded successfully over HTTPS with HTTP 200.
- The current Manus project/dev server was reachable and reported no TypeScript errors in the project health output.
- The deployed site was inspected without logging in, changing data, or invoking notification send operations.
- No deployment was performed.

### 2. Existing notification lifecycle schema

The live database contains:

- `notification_deliveries`
- `notification_delivery_events`
- `notifications`

The live `notification_deliveries` table includes lifecycle fields for:

- queued
- submitted
- provider acceptance
- delivered
- failed/rejected/undeliverable/expired
- provider message ID
- attempt count
- timestamps
- redacted recipient reference
- delivery/run/user associations

The live `notification_delivery_events` table includes:

- provider event ID
- provider status
- mapped status
- signature verification flag
- received timestamp

The live database also has these relevant unique indexes:

- `notification_deliveries_idempotency_key_uq` on `idempotencyKey`
- `notification_deliveries_provider_message_id_uq` on `(provider, providerMessageId)`
- `notification_delivery_events_delivery_event_uq` on `(notificationDeliveryId, providerEventId)`

These indexes provide a good foundation for duplicate suppression and webhook-event idempotency.

### 3. Migrations 0037 and 0038

The schema created by the migration files is present in the live database:

- Migration 0037’s lifecycle tables and lifecycle columns are present.
- Migration 0038’s idempotency column and unique indexes are present.

However, the live migration journal does **not** contain a normal one-row-per-migration record for the numbered SQL files. The journal currently contains only two generic rows, and its hashes do not provide a direct auditable mapping to `0037_notification_delivery_lifecycle.sql` and `0038_notification_idempotency.sql`.

**Conclusion:** 0037 and 0038 are verified at the live-schema level, but migration-journal reconciliation is still required before adding a new push migration. This is an operational migration-tracking risk, not evidence that the tables are absent.

### 4. Capacitor/native dependencies

The current project already includes:

- `@capacitor/push-notifications`
- `@capacitor/local-notifications`
- Android Capacitor wrapper source
- Conditional Google Services Gradle plugin support

The Android module currently reports that Google Services is only applied when `android/app/google-services.json` exists. That file was not present in the audited checkout, so a release build with FCM configuration cannot be treated as complete.

`client/src/main.tsx` currently registers listeners for:

- local notification actions
- push notification actions

Those listeners only route an already-received notification to a tracking or courier destination. They do **not**:

- request push permission
- call `PushNotifications.register()`
- receive and persist a registration token
- send the token to the hosted backend
- handle token refresh
- unregister or revoke the token on logout/account switch

### 5. Firebase/FCM references

The current source does not contain a Firebase SDK/FCM sender, Firebase Admin service, device-token table, push-token tRPC procedure, or server-side FCM delivery service.

The sandbox environment exposes names for a few `VITE_FIREBASE_*` values, but the audited application source does not consume them. They do not constitute a working push integration and must not be treated as proof that FCM is configured.

No Firebase service-account credentials were printed or inspected.

### 6. Push feature flags and allowlist

The current server environment declaration contains Twilio and Resend settings, but it does not declare:

- `PUSH_NOTIFICATIONS_ENABLED`
- `PUSH_ALLOWED_USER_IDS`
- server-side Firebase/FCM credentials

The current Twilio implementation is fail-closed on `NOTIFICATIONS_ENABLED !== 'true'`, which is a useful existing safeguard for SMS/WhatsApp. That safeguard does not implement the requested push-specific controls.

Therefore the requested statements cannot currently be confirmed:

- `PUSH_NOTIFICATIONS_ENABLED` defaulting to `false` — **not implemented as a named push flag**.
- `PUSH_ALLOWED_USER_IDS` being enforced server-side — **not implemented**.
- push activation watermark persistence — **not implemented in the audited current backend**.

### 7. Existing Twilio webhook wiring risk

The repository contains a signed, idempotent Twilio webhook handler at:

- `server/webhooks/twilio-webhook.ts`

It validates the Twilio signature, maps statuses, rejects duplicate provider events, and prevents non-progressing status transitions through the notification lifecycle service.

However, `server/_core/index.ts` does not mount the Twilio webhook router. The server startup mounts Paystack, OAuth, storage, MCP, and tRPC routes, but there is no live `/api/webhooks/twilio/messages` mount in the inspected source.

A safe GET probe to that public path returned the application shell through the normal catch-all rather than a dedicated webhook response. This does not prove what a POST would do, but it is consistent with the missing route mount.

**Impact:** Twilio provider status callbacks may not reach the lifecycle handler in the deployed backend. This is an existing notification-hardening gap that should be fixed separately or included in the controlled integration change, without altering business logic.

### 8. Existing push queue behavior

`advancedTracking.sendDeliveryNotification` accepts `channel: "push"` and records a notification delivery with provider `capacitor`, but no push sender consumes that queued record.

This means a caller can create a push delivery record that remains queued without a provider submission. The API therefore currently represents a queue entry, not a working push send.

Before enabling push, this route should either:

1. call the new guarded push service, or
2. clearly remain a queue-only operation with a separate worker/dispatcher and explicit status handling.

It must never mark a push as delivered merely because a database row was created.

## Current state against the four requested safety fixes

| Requirement | Current project finding | Status |
|---|---|---|
| Persistent activation notification watermark | No push activation watermark or durable server-side watermark table/service found | **Missing** |
| Server-side `PUSH_ALLOWED_USER_IDS` enforcement | No push-specific allowlist variable or authorization check found | **Missing** |
| `PUSH_NOTIFICATIONS_ENABLED` defaults to false | No push-specific flag found; Twilio has a separate fail-closed flag | **Missing** |
| Account-safe device registration / logout handling | No push registration, token table, token binding, revocation, refresh, or logout hook found | **Missing** |

## Security, duplicate-delivery, and account-switching assessment

### Positive controls already present

- Provider message IDs are persisted for the existing notification lifecycle.
- Notification event history is append-oriented.
- Unique indexes protect idempotency keys and provider events.
- Twilio callbacks use signature verification in the handler.
- Status transitions use a non-regressing lifecycle function.
- Recipient references in the current Twilio path are redacted before persistence/logging.
- Outbound Twilio sending is fail-closed unless the existing notification flag is explicitly enabled.

### Risks that must be addressed before push enablement

1. **No device-token persistence:** There is no server record tying a native push token to a user, installation, platform, app version, or revocation status.
2. **No account-switch protection:** Without user-bound token records and logout revocation, a device could receive notifications for a previous account after a new user signs in.
3. **No server-side allowlist:** A client-side feature flag would not be sufficient to restrict push activation to designated users.
4. **No push default-off switch:** Push could not be safely enabled or disabled independently from SMS/WhatsApp.
5. **No token refresh path:** FCM/APNs tokens can change; stale tokens would cause repeated failures or delivery to the wrong installation record.
6. **No invalid-token cleanup:** Provider responses such as unregistered/invalid token need durable revocation and retry suppression.
7. **No app acknowledgement:** Provider acceptance is not device receipt. If the product requires “received on device,” the app must explicitly acknowledge a notification ID through an authenticated endpoint.
8. **Push queue is currently incomplete:** `channel: "push"` can be recorded but is not dispatched by a provider service.
9. **Webhook wiring drift:** The existing Twilio callback handler appears unmounted, so the broader lifecycle system should not be declared production-complete until the mount is checked and repaired.
10. **Migration journal drift:** The live schema and numbered migration files are not currently represented by a normal migration journal trail. A new push migration should not be applied until this is reconciled.
11. **Concurrent idempotency race:** The unique index is protective, but read-then-insert code should handle a concurrent duplicate-key result deterministically rather than surfacing an internal error.
12. **Notification authorization scope:** Any push registration, unregister, send, or acknowledgement procedure must be protected and scoped to the authenticated user or an authorized admin/service workflow. A client must never be able to register a token for another user.

## Consolidated integration plan — approval required before implementation

### Phase A — Migration and contract reconciliation

1. Obtain the exact local push implementation/export or patch used for the Android 45-test build.
2. Reconcile the live migration journal with the source migration files without changing business data.
3. Confirm that 0037 and 0038 are the authoritative notification migrations.
4. Do not create or apply “0042” until the migration numbering and journal strategy are approved.
5. Add a new additive device-token migration only after the above check.

### Phase B — Durable device registration

Add a device-token table with at least:

- internal ID
- user ID
- installation ID generated by the app
- platform (`android`, later `ios`)
- provider (`fcm`, later `apns` if needed)
- token hash for lookup/deduplication
- encrypted or protected token value as appropriate for the selected provider architecture
- app version
- device metadata kept to the minimum necessary
- active/revoked state
- last-seen timestamp
- created/revoked timestamps
- unique constraint preventing duplicate active registrations

Required server procedures:

- `registerPushDevice`
- `refreshPushDevice`
- `revokePushDevice`
- `listMyPushDevices` only if needed for user settings
- authenticated `acknowledgePushNotification` if device receipt is required

All procedures must bind the row to `ctx.user.id`; no user ID supplied by the client should be trusted as the owner of a device token.

### Phase C — Guarded provider sender

Implement a server-only push service that:

- defaults `PUSH_NOTIFICATIONS_ENABLED` to `false`
- parses `PUSH_ALLOWED_USER_IDS` server-side
- refuses to send when disabled
- refuses to send to users outside the allowlist
- never logs raw tokens, provider credentials, message bodies containing unnecessary personal data, or full recipient identifiers
- persists queued/submitted/provider-accepted/failed states using `notification_deliveries`
- uses an idempotency key per business event, user, device, and notification purpose
- removes/revokes invalid tokens after provider rejection
- distinguishes provider acceptance from device acknowledgement
- never changes a notification directly to `delivered` merely because FCM accepted a request

Firebase server credentials must stay server-side. The Android `google-services.json` is application configuration, not a substitute for server credentials and must be handled separately from server secrets.

### Phase D — Native registration and account lifecycle

Transfer the relevant local native code into the current project, likely in a dedicated file such as:

- `client/src/lib/native-push.ts`

It should:

1. Check native platform.
2. Check/request permission.
3. Call `PushNotifications.register()` only after the user has opted in or the product’s approved permission flow requires it.
4. Handle `registration` and `registrationError`.
5. Send the token to the hosted backend over the existing tRPC client.
6. Handle token refresh by upserting the same installation record.
7. Handle notification actions using existing tracking/courier routing.
8. Revoke the installation on logout or account switch.
9. Clear native local state where the current auth flow clears the session.
10. Avoid logging the raw registration token.

The push registration must be triggered only after the app has an authenticated account if notifications are user-specific. Anonymous public visitors must not be able to create an account-bound push registration.

### Phase E — Android configuration

The current Android wrapper already has conditional Google Services Gradle support, but the release integration requires:

- a correctly matched `google-services.json` for application ID `com.mzansi.couriers`
- verified Firebase Android app configuration
- Android 13+ notification permission handling
- package/version alignment with the signed Android Studio build
- no keystores or signing credentials in the source export
- debug build validation
- release AAB build validation in Android Studio after the user supplies the Firebase app configuration

The user’s signing, keystore creation, and Play Store submission remain outside this audit.

### Phase F — Provider and regression verification

Before enabling any production push traffic:

- Run the existing local 45 push tests against the integrated source.
- Add backend tests for token registration, duplicate token registration, token refresh, logout revocation, account switching, allowlist enforcement, default-off behavior, provider failure, invalid-token cleanup, and idempotent event replay.
- Add an integration test proving a synthetic assignment event creates exactly one queued notification per intended user/device.
- Verify that disabled push does not call the provider.
- Verify that a user outside `PUSH_ALLOWED_USER_IDS` cannot trigger a provider call.
- Verify that repeated event delivery does not produce duplicate provider submissions.
- Verify that out-of-order delivery/acknowledgement does not regress lifecycle state.
- Verify that missing Firebase server configuration fails closed.
- Build the Android debug APK and release AAB without signing credentials in the export.
- Keep all test recipients synthetic or explicitly designated test accounts.

## Files currently relevant to the integration

### Existing files to preserve and likely modify

- `client/src/main.tsx` — preserve existing action listeners; add guarded registration wiring or import a dedicated native push module.
- `client/src/lib/native-auth.ts` — coordinate registration only after authenticated native sign-in if that is the selected lifecycle.
- `client/src/lib/native-secure-storage.ts` — preserve secure session handling; do not store push tokens as authentication tokens.
- `client/src/_core/hooks/useAuth.ts` — add the approved revocation hook to logout/account-switch flow.
- `server/_core/env.ts` — add server-only push flags and provider configuration with safe defaults.
- `server/routers.ts` or a split router such as `server/routers/push-notifications.ts` — add protected registration/revocation procedures.
- `server/db.ts` — add device-token query helpers.
- `server/services/notification-delivery.ts` — reuse lifecycle transitions and add push-specific state rules if required.
- `server/services/notification-delivery.test.ts` — extend lifecycle/idempotency coverage.
- `drizzle/schema.ts` — add the device-token schema only after migration reconciliation.
- `server/_core/index.ts` — verify/mount the existing Twilio webhook router separately; do not add a push endpoint unless the selected provider protocol requires one.
- `android/app/build.gradle` — preserve conditional Google Services support and verify release configuration.
- `android/app/src/main/AndroidManifest.xml` — verify notification permission and required native declarations.
- `package.json` / `pnpm-lock.yaml` — preserve existing Capacitor notification dependencies.

### Files expected from the separate local push implementation

The exact names are not available in the current checkout. The transfer should include only the source/config needed for the tested implementation, for example:

- native push registration module
- token registration and refresh client calls
- notification action handling changes
- Android Firebase configuration template or setup instructions
- local push unit/integration tests
- any provider adapter used by the local 45-test build

Do **not** transfer:

- server service-account keys
- keystores
- signing credentials
- `.env` files
- raw production tokens
- real recipient data
- production provider enablement flags

## Recommended implementation order

1. **Approval and source transfer:** supply/identify the exact local push implementation.
2. **Migration journal reconciliation:** no new migration yet.
3. **Backend device-token and authorization contract.**
4. **Server-side push sender with default-off and allowlist enforcement.**
5. **Native registration, refresh, logout, and account-switch handling.**
6. **Provider failure cleanup and optional authenticated receipt acknowledgement.**
7. **Fix/verify Twilio webhook route mounting as a separate notification lifecycle correction.**
8. **Run backend regression suite and the local 45 push tests.**
9. **Build Android debug APK/AAB; do not sign or publish.**
10. **Only after explicit approval, configure test-only provider credentials and run controlled delivery tests.**

## Approval gate

**Status: NOT READY FOR PUSH INTEGRATION OR ENABLEMENT.**

The next safe action is to obtain the exact local push implementation/export and approve the migration/contract plan above. Until then:

- outbound push remains disabled/not implemented;
- no production secrets should be changed;
- no database migration should be applied;
- no notification should be sent;
- existing courier, customer, payment, dispatch, and non-push notification logic should remain unchanged.
