# Shared-Pool Relay Courier Model

**Mzansi Couriers implementation design**  
**Example corridor:** Johannesburg → Cape Town  
**Example relay:** 5 couriers, 5 legs, 100 parcels sharing the corridor

## Executive rule

A long-distance parcel is charged once. Mzansi takes **20% of the final customer charge once**. The remaining **80% is one shared courier pool**.

> The 80% is never applied independently to every relay leg. Each courier receives only an allocation from the same shared pool.

The pool is divided using four inputs:

1. **Linehaul distance** completed by the courier.
2. **Operating-cost exposure**, including fuel, vehicle allowance, driver compensation, route overhead, deadhead kilometres, and return kilometres.
3. **Leg value**, which can reflect difficult handovers, time-critical work, remote corridors, or specialist vehicle requirements.
4. **Minimum payout protection**, so each courier reaches the configured minimum when the pool is large enough.

The implemented allocator is in `server/services/relay-pool-pricing.ts`. It is exposed to administrators through `relayPricing.calculateSharedRelayPool` in `server/routers/relay-pricing.ts`.

## 1. Money flow for one relay shipment

```text
Customer charge = final price charged once for the shipment
Mzansi platform fee = customer charge × 20%
Shared courier pool = customer charge − Mzansi platform fee
```

For a customer charge of R15,000 across 100 parcels:

| Amount | Calculation | Result |
|---|---:|---:|
| Customer revenue | — | R15,000.00 |
| Mzansi gross platform fee | R15,000 × 20% | R3,000.00 |
| Shared courier pool | R15,000 × 80% | R12,000.00 |
| Customer revenue per parcel | R15,000 ÷ 100 | R150.00 |
| Platform fee per parcel | R3,000 ÷ 100 | R30.00 |
| Courier pool per parcel | R12,000 ÷ 100 | R120.00 |

The platform fee remains R3,000 even though five different couriers carry the parcels. There is no 20% fee per courier.

## 2. Leg cost model

Each leg calculates a cost floor before assigning earnings:

```text
Total driven kilometres = leg distance + deadhead kilometres + return kilometres
Fuel cost = total driven km × fuel litres/100 km ÷ 100 × fuel price/litre
Operating cost = fuel cost + driver compensation + vehicle allowance + route overhead
Leg cost floor = operating cost + handover fee
```

The default assumptions are:

| Cost item | Default |
|---|---:|
| Fuel price | R26/litre |
| Fuel consumption | 10 litres/100 km |
| Driver compensation | R2.50/km |
| Vehicle allowance | R1.00/km |
| Route overhead | R0.50/km |
| Handover fee | R35 for relay handovers after the first leg |
| Minimum payout | R100 per courier allocation |

These are defaults, not guaranteed commercial rates. Each leg can override the fuel, vehicle, compensation, overhead, handover, and minimum-payout inputs.

## 3. Fair-pool allocation algorithm

The allocator processes the route in this order:

### Step 1: Calculate the one shared pool

The customer charge is split once into the 20% platform fee and 80% courier pool.

### Step 2: Calculate every leg’s cost floor

Deadhead and return kilometres are included. This prevents a courier from being paid only for the parcel’s linehaul while personally absorbing the cost of reaching the handover point or returning home.

### Step 3: Reserve minimum courier payouts

If a courier has multiple legs, the configured minimum is applied once to that courier’s route allocation, not once per leg. If the pool cannot fund all courier minimums, the allocator pro-rates the available pool and marks the route as requiring repricing, additional parcels, or an operating subsidy.

### Step 4: Allocate the remaining pool by value score

Each leg receives a normalized value score:

```text
Value score =
  55% × paid linehaul distance
+ 35% × leg cost exposure
+ 10% × handover/complexity value
```

A `legValueMultiplier` can increase or decrease the score for difficult, urgent, remote, or specialist legs. The courier’s total score is the sum of the scores of their legs.

### Step 5: Conserve the pool exactly

Rounding differences are corrected on the final leg for each courier and on the final courier overall. The sum of all leg allocations and courier allocations therefore equals the one shared 80% pool.

### Step 6: Report gross and estimated net earnings

```text
Courier gross earnings = shared-pool allocation
Courier estimated net = gross earnings − operating cost − handover fees
```

The output also reports earnings per parcel and gross earnings per driven kilometre.

## 4. Worked Johannesburg → Cape Town example

This example uses a 790 km linehaul divided into five legs. It assumes 100 parcels share the corridor and the total customer charge is R15,000.

| Leg | Courier | Corridor | Linehaul | Deadhead | Return | Driven km |
|---:|---|---|---:|---:|---:|---:|
| 1 | C1 | Johannesburg → Bloemfontein | 140 km | 12 km | 35 km | 187 km |
| 2 | C2 | Bloemfontein → Beaufort West | 190 km | 18 km | 40 km | 248 km |
| 3 | C3 | Beaufort West → Laingsburg | 170 km | 15 km | 30 km | 215 km |
| 4 | C4 | Laingsburg → Worcester | 190 km | 15 km | 32 km | 237 km |
| 5 | C5 | Worcester → Cape Town | 100 km | 10 km | 25 km | 135 km |
| **Total** | **5 couriers** | — | **790 km** | **70 km** | **162 km** | **1,022 km** |

### Corridor financial summary

| Metric | Result |
|---|---:|
| Customer charge | R15,000.00 |
| Mzansi gross platform fee | R3,000.00 |
| Payment-processing example at 2.9% | R435.00 |
| Estimated platform net after payment fee | R2,565.00 |
| Shared courier pool | R12,000.00 |
| Total operating cost | R6,745.20 |
| Handover fees | R140.00 |
| Courier pool surplus after cost floors | R5,114.80 |
| Route status | Viable |

The platform remains positive after the example payment-processing cost, before support, insurance, claims, tax, software, and other business costs.

### Courier allocations

| Courier | Linehaul | Driven km | Gross earnings | Gross per parcel | Estimated net | Estimated net per parcel |
|---|---:|---:|---:|---:|---:|---:|
| C1 | 140 km | 187 km | R2,100.15 | R21.00 | R865.95 | R8.66 |
| C2 | 190 km | 248 km | R2,960.05 | R29.60 | R1,288.25 | R12.88 |
| C3 | 170 km | 215 km | R2,481.06 | R24.81 | R1,027.06 | R10.27 |
| C4 | 190 km | 237 km | R2,855.20 | R28.55 | R1,256.00 | R12.56 |
| C5 | 100 km | 135 km | R1,603.54 | R16.04 | R677.54 | R6.78 |
| **Total** | **790 km** | **1,022 km** | **R12,000.00** | **R120.00** | **R5,114.80** | **R51.15** |

C2 and C4 receive more because they carry longer and more cost-exposed legs. C5 receives less because the linehaul is shorter, even though the courier still receives the same minimum-payout protection when the pool supports it. The allocation is not five separate 80% payouts; it is one R12,000 pool allocated across five courier roles.

## 5. Why the model can support sustainable courier income

Relay work gives couriers access to long-distance earnings without requiring one courier to drive Johannesburg to Cape Town. A courier can earn from a 100–200 km corridor that fits their normal working area, while another courier handles the next corridor.

The model also makes hidden kilometres visible. A courier who travels 20 km to collect a parcel and 35 km back after handover is not treated as if they only drove the parcel’s 100 km leg. This makes route acceptance more realistic and gives operations a reason to consolidate parcels or adjust the customer tariff.

The model supports multiple income profiles:

- A local courier can take shorter legs and build repeat work in a known region.
- A regional courier can earn more from longer legs and higher cost exposure.
- A specialist or urgent-leg courier can receive a controlled value multiplier.
- Couriers can carry more than one parcel on the same leg, improving earnings per driven kilometre when the route is loaded.

## 6. Why the model can remain profitable for Mzansi

Mzansi’s fee is calculated once from total customer revenue. The platform does not pay 20% to each courier. In the worked example:

```text
Mzansi gross fee = R3,000
Payment-processing example = R435
Estimated platform net before other overheads = R2,565
```

The platform’s actual net contribution is lower after support, claims, insurance, technology, communications, tax, and refunds. The allocator therefore reports **gross platform fee** and **estimated platform net after configured payment costs** separately.

## 7. Operational controls required before live settlement

The new allocator is safe for route preview and admin review, but the existing weekly payout router is still structured around a single courier/run. It should not be allowed to settle a multi-courier relay until the following migration is complete:

1. Store one immutable financial ledger row per parcel and relay allocation.
2. Link each ledger row to the delivery, relay leg, courier, Paystack reference, and settlement status.
3. Replace single-run payout aggregation with leg/courier allocation from the shared pool.
4. Prevent a courier handover from creating a second independent 80% pool.
5. Persist deadhead kilometres, return kilometres, handover fees, and cost assumptions used at dispatch time.
6. Show couriers gross earnings, estimated costs, estimated net earnings, and payment status separately.
7. Reconcile refunds, chargebacks, failed transfers, and payout retries idempotently.
8. Mark routes underfunded when the pool cannot fund minimum payouts or cost floors.

## Final recommendation

Use the shared-pool allocator for relay planning immediately, but migrate settlement only after the parcel-level financial ledger is in place. The recommended commercial rule is:

> **One customer charge, one 20% Mzansi fee, one 80% courier pool, many fair leg allocations, and no payout without cost and custody records.**

## References

1. `server/services/relay-pool-pricing.ts` — Shared courier-pool allocation engine.
2. `server/routers/relay-pricing.ts` — Protected admin pricing endpoint.
3. `server/services/courier-pricing.ts` — Customer tariff and platform-fee constant.
4. `server/routers/payoutRouter.ts` — Existing weekly payout workflow requiring migration for multi-courier settlement.
5. `drizzle/schema.ts` — Existing relay-leg and handover data structures.
