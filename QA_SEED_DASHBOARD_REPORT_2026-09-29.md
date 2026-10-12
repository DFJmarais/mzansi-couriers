# Mzansi Couriers QA Seed and Dashboard Review

**Date:** 29 September 2026  
**Environment:** `QA_SEED_20260929` synthetic records in the current Mzansi Couriers database  
**Purpose:** Exercise customer, courier, relay, custody, exception, payment, payout, and administrative dashboard flows without using real customer or banking data.

## Conclusion

The platform now has a useful end-to-end synthetic dataset for operational review. The admin dashboard exposes a new **Operations audit report** that reads persisted records rather than displaying fabricated counters. It shows delivery status, relay volume, custody scans, inspections, route status, open exceptions, handoff outcomes, courier availability, and customer reviews.

The review also found and corrected a real navigation gap. The compatibility paths `/admin/dispatch`, `/admin/relay-exceptions`, and `/fleet/command-centre` now resolve to the existing operational dashboards instead of returning 404 responses. The primary fleet destination remains `/fleet/dashboard`.

The dataset is suitable for QA and dashboard review. It must not be treated as production traffic or real payment activity.

## Seeded coverage

The synthetic batch contains **30 users**: 10 courier accounts and 20 customer accounts. It contains 100 parcels with the following status split:

| Area | Seeded records |
|---|---:|
| Couriers | 10 |
| Customers | 20 |
| Deliveries | 100 |
| Delivered | 45 |
| In transit | 30 |
| Assigned | 15 |
| Pending | 10 |
| Relay legs | 50 |
| Accepted handoffs | 18 |
| Handoffs awaiting response | 4 |
| Declined handoffs | 3 |
| Custody scans | 160 |
| Relay inspections | 25 |
| Open relay exceptions | 4 |
| Customer reviews | 45 |

The relay records cover normal handoffs, declined offers, custody scans, inspection checklists, and exception cases. The exception queue includes delayed-courier, address-clarification, connectivity, and receiving-courier-delay scenarios.

## Payment, SmartStack, and payout coverage

The dataset now includes 100 synthetic payment sessions. Ninety are marked as paid and ten remain pending. The paid records allow the admin dispatch logic to identify eligible parcels without calling Paystack.

Each seeded courier has one synthetic SmartStack recommendation and one optional add-on opportunity. These records allow the courier dashboard to display route-fit, capacity, deadline-risk, fuel, estimated net earnings, and safe add-on decisions after a real courier session is used.

Each seeded courier also has a clearly synthetic, verified payout-settings record. The banking and recipient values are QA placeholders. No Paystack transfer was initiated, and no real banking information was added. The weekly payout review now displays candidates for delivered parcels that fall inside the review week. Selecting a test transfer remains a separate action and should not be used with live money.

The reusable supplement is saved at [`scripts/seed-qa-supplement-20260929.sql`](scripts/seed-qa-supplement-20260929.sql). It contains no API keys or real banking details.

## What is visible now

### Admin dashboard

Open `/admin/dashboard`. The new Operations audit report provides a quick control-room view of the seeded records. Below it, the dashboard shows:

- courier applications;
- weekly payout candidates;
- open relay exceptions with resolution controls;
- paid-parcel dispatch and relay analysis;
- courier operations, pricing, and tracking links.

This is the strongest dashboard for validating the seeded flow. The screenshot review confirmed the report and payout candidates render successfully.

### Courier dashboard

The courier dashboard code includes the route workflow, relay offers, SmartStack recommendations, exception reporting, earnings, and weekly payout status. The synthetic database contains the records needed by those panels.

A limitation remains for live visual testing: the seeded courier users are database QA identities, not interactive browser login credentials. An authenticated courier session is still required to view the courier-only panels. The admin preview intentionally shows an **Admin preview** label and hides courier actions; this is correct privilege behavior, not missing data.

### Customer and tracking flow

The 20 seeded customer accounts and 100 parcel records provide coverage for tracking, delivery status, reviews, and notification-related persistence. Public tracking can be tested with a seeded tracking code such as `QA260929-001`. The QR image URLs and defect-photo references in the seed are non-routable example references and do not represent uploaded production files.

### Fleet dashboard

The fleet dashboard routes now resolve, including the compatibility alias `/fleet/command-centre`. The requested seed creates independent courier accounts, not a fleet-owner account, vehicles, or fleet-driver assignments. Therefore the fleet dashboard will still show its registration or empty-fleet state until a separate fleet fixture is created. That is an accurate indication that fleet data was not part of this seed request.

## Remaining gaps found

1. **Courier browser session:** A real courier login is still needed to click through pickup, delivery, relay acceptance, SmartStack add-on decisions, and exception reporting. The records exist, but the QA seed does not create a bypass login.
2. **Fleet fixture:** Fleet-owner, vehicle, and fleet-driver records were not seeded. Fleet capacity-aware recommendations cannot be fully reviewed until that fixture exists.
3. **External notifications:** The seed creates persisted delivery and notification-related records, but it does not send real email, WhatsApp, or SMS messages. Those channels require their server-side provider configuration and a controlled test recipient.
4. **Paystack transfer execution:** The payout table can be reviewed safely, but no transfer was initiated. Processing a real transfer requires an explicit live-payment decision and live provider readiness.
5. **Database audit history:** The new dashboard aggregates operational records. A separate exportable, chronological audit-log screen for every admin action is not yet present in the main dashboard.

## Validation completed

The implementation was checked with the following results:

- TypeScript validation: passed.
- Production build: passed.
- Full regression suite: **66 test files passed; 1,404 tests passed; 5 tests skipped**.
- Focused admin, dispatch, relay, fleet, and assignment tests: **159 tests passed**.
- Browser screenshot review: admin audit report and weekly payout candidates rendered successfully.
- Database verification: all requested QA counts and supplement records were confirmed.

## Recommended next QA step

Use a dedicated test-only courier login, then review one courier through this sequence: open the route recommendation, accept or decline the add-on, scan a parcel, accept a relay handoff, submit an inspection, report an exception while safely stopped, and open earnings. After that, create a separate fleet fixture and repeat the capacity and owner-approval review from `/fleet/dashboard`.

## References

[1]: https://mzansicourier-nsebzqbt.manus.space "Mzansi Couriers public deployment"
