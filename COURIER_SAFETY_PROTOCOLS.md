# Mzansi Couriers — Courier Safety Protocols

## Implemented controls

The courier mobile workspace now includes a dedicated **Safety Centre** at `/courier/safety`. It provides large, touch-friendly emergency controls for **SAPS 10111** and **mobile emergency 112**, records an urgent SOS incident with the courier's available device location, and opens the device dialler. The screen clearly states that Mzansi Couriers is not an emergency service.

Couriers can save a trusted contact, choose a preferred emergency route, acknowledge the vehicle-insurance boundary, acknowledge the goods-in-transit policy boundary, and acknowledge the prohibited-items rule. These acknowledgements are persisted per courier rather than being displayed as untracked text.

Couriers can start a time-bounded route safety check-in for 15 minutes to six hours. A current check-in can be completed when the courier reaches a safe point or cancelled when no longer needed. If the check-in becomes overdue, the API marks it overdue and creates a high-urgency operations incident for follow-up.

Couriers can report an accident, threat, medical concern, vehicle breakdown, parcel-security issue, roadside hazard, or other safety concern. Reports may include the courier's current device location and are stored as auditable incidents. The owner can review, acknowledge, place an incident in review, resolve it, or cancel it from `/admin/safety-incidents`.

## Parcel and vehicle responsibility

Mzansi Couriers' platform responsibility is limited to goods-in-transit cover according to the published policy, limits, exclusions, and claims process. Couriers remain responsible for their own vehicle insurance, roadworthiness, maintenance, and legal compliance. The app does not represent that Mzansi Couriers insures courier vehicles.

The courier onboarding material continues to require secure packaging, a visible parcel identification code, pickup and delivery evidence, and confirmation that prohibited or dangerous items will not be carried.

## Operating-radius consistency

The approved courier operating radius is **120 km**. The dispatch assignment engine, SmartStack eligibility logic, courier onboarding text, and Safety Centre now use the same 120 km standard. The separate local same-day service rule remains a pricing/service-level rule and may be restricted to its shorter local threshold.

## Existing custody protections retained

The safety centre complements, rather than replaces, the existing controls: ID and licence uploads, vehicle registration, owner approval, route and location records, parcel-code verification, proof photos, customer receipt confirmation, relay handoff confirmation, approved handoff locations, offline route access, and courier help requests.

## Important operational setup

The app now records and escalates safety events, but the owner team must still maintain the real-world operating procedures behind the controls. Before launch, the owner should nominate the person responsible for monitoring the incident queue during operating hours, publish the goods-in-transit policy and claims contact, confirm the background-verification provider and approval checklist, and ensure the courier onboarding approval process is completed before a courier receives live work.

Emergency incidents must be handled through the relevant emergency service. The app's incident record is an operational audit trail and must not be treated as a replacement for calling emergency services.

## Reviewer test path

1. Sign in as an approved courier and open **Courier workspace → Open Safety Centre**.
2. Enter a trusted contact and save the safety details.
3. Start a 30-minute route check-in, then select **I’m safe**.
4. Submit a non-urgent vehicle or parcel-safety report and confirm that it appears under Recent reports.
5. Review the emergency screen without activating an SOS, or use a controlled test only when the phone dialler action is appropriate.
6. Sign in as the owner and open `/admin/safety-incidents` to acknowledge and resolve the report.
7. Confirm that the iOS build includes the updated route and native bundle, then validate emergency dialler behavior on a physical iPhone before submission.
