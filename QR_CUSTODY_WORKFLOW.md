# Mzansi Couriers — QR custody and private delivery notifications

## Sender flow

1. The booking receives a unique parcel identification code.
2. The sender sees a QR code on the booking confirmation, can download it, and places it on the parcel.
3. Recipient details are captured for delivery-completed in-app, WhatsApp/SMS, and email notifications.
4. The sender must also upload a photo showing the parcel with the correct identification code.

The QR download is shown only on the authenticated sender booking-confirmation surface. The QR itself contains only the parcel code; it does not expose another user's location.

## Courier flow

1. The courier photographs/scans the parcel QR at pickup. The server verifies the code belongs to a parcel assigned to that courier and route stop, then records an immutable custody scan.
2. At the destination, the courier scans the same QR again. The server verifies the assigned courier and records the delivery scan before delivery proof is completed.
3. The sender and recipient receive a persisted in-app status notification. WhatsApp/SMS is attempted through the configured Twilio integration, and email is attempted through the server-only Resend integration when `RESEND_API_KEY` is configured.
4. The recipient confirms receipt and can rate the completed delivery from the confirmation screen.

## Relay flow

1. Courier 1 marks the relay leg ready for handoff; Courier 2 accepts the offer.
2. Courier 2 scans the parcel QR. The server requires the scan to match the delivery and the `handoff_pending` relay leg.
3. Courier 2 completes the short checklist: sealed, label matches, and no visible damage. If the condition is not accepted, they add a note and can upload up to five defect photos.
4. Courier 1 receives an in-app approval notification. Custody cannot transfer until the receiving QR scan and inspection record exist.
5. The relay handoff is then recorded against the next courier and the parcel remains visible only to authorized users.

## Tracking privacy

Tracking is scoped to the parcel code and authorized delivery participants. The app does not expose a list of other users' parcels or locations. Live location is associated with the specific delivery workflow, not a public courier directory.

## Configuration boundary

- In-app notifications work from the database.
- WhatsApp/SMS requires the existing Twilio server secrets.
- Email requires server-side `RESEND_API_KEY` and `EMAIL_FROM`; neither is bundled in the client or Android/iOS source.
