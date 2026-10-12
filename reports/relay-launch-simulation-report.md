# Mzansi Couriers Relay Launch Simulation

Generated from the production shared-pool allocator and live road-route geometry. Customer prices, fuel, toll, backhaul, and payment-processing values are explicit scenario assumptions; route distances are resolved through the configured Maps directions proxy.

> **Important accounting limitation:** “Mzansi estimated net contribution” means the 20% platform fee less modeled payment-processing costs only. It is not accounting profit: staff/support, insurance, tax, refunds/chargebacks, map/API charges, payout fees, marketing, fraud, vehicle recovery, and platform maintenance are excluded.

## Executive simulation summary

| Scenario | Revenue | Mzansi 20% | Courier pool | Couriers | Road km / legs | Route cost | Platform net | Decision |
| Sandton → Soweto · 1 parcel(s) | R180.00 | R36.00 | R144.00 | 1 | 41 / 1 | R277.30 | R29.28 | REJECT / CONSOLIDATE |
| Sandton → Soweto · 5 parcel(s) | R750.00 | R150.00 | R600.00 | 1 | 41 / 1 | R277.30 | R126.75 | DISPATCH |
| Sandton → Soweto · 10 parcel(s) | R1500.00 | R300.00 | R1200.00 | 1 | 41 / 1 | R277.30 | R255.00 | DISPATCH |
| Sandton → Soweto · 20 parcel(s) | R3000.00 | R600.00 | R2400.00 | 1 | 41 / 1 | R277.30 | R511.50 | DISPATCH |
| JHB → Bloemfontein · 1 parcel(s) | R650.00 | R130.00 | R520.00 | 2 | 510 / 2 | R3638.97 | R109.65 | REJECT / CONSOLIDATE |
| JHB → Bloemfontein · 5 parcel(s) | R3250.00 | R650.00 | R2600.00 | 2 | 510 / 2 | R3638.97 | R554.25 | REJECT / CONSOLIDATE |
| JHB → Bloemfontein · 10 parcel(s) | R4500.00 | R900.00 | R3600.00 | 2 | 510 / 2 | R3638.97 | R768.00 | REJECT / CONSOLIDATE |
| JHB → Bloemfontein · 20 parcel(s) | R9000.00 | R1800.00 | R7200.00 | 2 | 510 / 2 | R3638.97 | R1537.50 | DISPATCH |
| JHB → Bloemfontein · 50 parcel(s) | R22500.00 | R4500.00 | R18000.00 | 2 | 510 / 2 | R3638.97 | R3846.00 | REJECT / CONSOLIDATE |
| JHB → Bloemfontein · 100 parcel(s) | R45000.00 | R9000.00 | R36000.00 | 2 | 510 / 2 | R3638.97 | R7693.50 | DISPATCH |
| JHB → Cape Town · 5 legs · 1 parcel(s) | R2800.00 | R560.00 | R2240.00 | 5 | 1421 / 5 | R10051.75 | R477.30 | REJECT / CONSOLIDATE |
| JHB → Cape Town · 5 legs · 5 parcel(s) | R9500.00 | R1900.00 | R7600.00 | 5 | 1421 / 5 | R10051.75 | R1623.00 | REJECT / CONSOLIDATE |
| JHB → Cape Town · 5 legs · 10 parcel(s) | R19000.00 | R3800.00 | R15200.00 | 5 | 1421 / 5 | R10051.75 | R3247.50 | DISPATCH |
| JHB → Cape Town · 5 legs · 20 parcel(s) | R31000.00 | R6200.00 | R24800.00 | 5 | 1421 / 5 | R10051.75 | R5299.50 | DISPATCH |
| JHB → Cape Town · 5 legs · 50 parcel(s) | R65000.00 | R13000.00 | R52000.00 | 5 | 1421 / 5 | R10051.75 | R11113.50 | REJECT / CONSOLIDATE |
| JHB → Cape Town · 5 legs · 100 parcel(s) | R130000.00 | R26000.00 | R104000.00 | 5 | 1421 / 5 | R10051.75 | R22228.50 | DISPATCH |
| JHB → Cape Town · 5 legs · 120 parcel(s) | R156000.00 | R31200.00 | R124800.00 | 5 | 1421 / 5 | R10051.75 | R26674.50 | DISPATCH |
| JHB → Cape Town · uneven 4-leg split · 20 parcels | R33000.00 | R6600.00 | R26400.00 | 4 | 1420 / 4 | R9990.04 | R5641.50 | DISPATCH |
| JHB → Cape Town · 6 legs · 20 parcels | R36000.00 | R7200.00 | R28800.00 | 6 | 1519 / 6 | R10761.78 | R6154.50 | DISPATCH |
| JHB → Cape Town · high fuel + empty returns | R33000.00 | R6600.00 | R26400.00 | 5 | 1421 / 5 | R19392.91 | R5641.50 | DISPATCH |
| JHB → Cape Town · strong backhaul | R31000.00 | R6200.00 | R24800.00 | 5 | 1421 / 5 | R10801.75 | R5299.50 | DISPATCH |
| JHB → Cape Town · one courier cancels / recovery return | R33000.00 | R6600.00 | R26400.00 | 5 | 1421 / 5 | R15417.75 | R5641.50 | DISPATCH |
| JHB → Cape Town · 50% refund / failed delivery | R16500.00 | R3300.00 | R13200.00 | 5 | 1421 / 5 | R10051.75 | R2820.00 | REJECT / CONSOLIDATE |

## Sandton → Soweto · 1 parcel(s)

- Customer revenue: **R180.00**; Mzansi gross platform revenue: **R36.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R29.28**.
- Total courier pool: **R144.00**; route cost floor: **R277.30**; route surplus after courier cost floor: **R-133.30**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **fails**; dispatch-time gate: **REPRICE**; decision: **REJECT / CONSOLIDATE**.
- Minimum customer tariff at this parcel count: **R346.63 per parcel**; minimum courier pool: **R277.30**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R346.63 per parcel** (courier cost floor R346.63, positive platform net R8.77).
- Readiness reasons: Courier pool does not cover operating cost plus disruption reserve At least one courier is below the R150.00 net acceptance floor; warnings: Courier pool is R133.30 below the combined operating-cost floor after deadhead, return, and handover costs.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Soweto | 40.5 | 1 | 2 | 40.5 | R0.00 | 10 | none | 20 parcels / 150kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | local-1-leg-1 | 40.5 | R144.00 | R277.30 | R-133.30 | R100.00 | NO |

## Sandton → Soweto · 5 parcel(s)

- Customer revenue: **R750.00**; Mzansi gross platform revenue: **R150.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R126.75**.
- Total courier pool: **R600.00**; route cost floor: **R277.30**; route surplus after courier cost floor: **R322.70**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R69.33 per parcel**; minimum courier pool: **R277.30**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R69.33 per parcel** (courier cost floor R69.33, positive platform net R1.75).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Soweto | 40.5 | 5 | 10 | 40.5 | R0.00 | 10 | none | 20 parcels / 150kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | local-5-leg-1 | 40.5 | R600.00 | R277.30 | R322.70 | R100.00 | YES |

## Sandton → Soweto · 10 parcel(s)

- Customer revenue: **R1500.00**; Mzansi gross platform revenue: **R300.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R255.00**.
- Total courier pool: **R1200.00**; route cost floor: **R277.30**; route surplus after courier cost floor: **R922.70**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R34.67 per parcel**; minimum courier pool: **R277.30**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R34.66 per parcel** (courier cost floor R34.66, positive platform net R0.88).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Soweto | 40.5 | 10 | 20 | 40.5 | R0.00 | 10 | none | 20 parcels / 150kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | local-10-leg-1 | 40.5 | R1200.00 | R277.30 | R922.70 | R100.00 | YES |

## Sandton → Soweto · 20 parcel(s)

- Customer revenue: **R3000.00**; Mzansi gross platform revenue: **R600.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R511.50**.
- Total courier pool: **R2400.00**; route cost floor: **R277.30**; route surplus after courier cost floor: **R2122.70**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R17.34 per parcel**; minimum courier pool: **R277.30**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R17.33 per parcel** (courier cost floor R17.33, positive platform net R0.44).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Soweto | 40.5 | 20 | 40 | 40.5 | R0.00 | 10 | none | 20 parcels / 150kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | local-20-leg-1 | 40.5 | R2400.00 | R277.30 | R2122.70 | R100.00 | YES |

## JHB → Bloemfontein · 1 parcel(s)

- Customer revenue: **R650.00**; Mzansi gross platform revenue: **R130.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R109.65**.
- Total courier pool: **R520.00**; route cost floor: **R3638.97**; route surplus after courier cost floor: **R-3118.97**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **fails**; dispatch-time gate: **REPRICE**; decision: **REJECT / CONSOLIDATE**.
- Minimum customer tariff at this parcel count: **R4548.72 per parcel**; minimum courier pool: **R3638.97**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R4548.71 per parcel** (courier cost floor R4548.71, positive platform net R8.77).
- Readiness reasons: Courier pool does not cover operating cost plus disruption reserve At least one courier is below the R150.00 net acceptance floor; warnings: Courier pool is R3118.97 below the combined operating-cost floor after deadhead, return, and handover costs.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Pretoria | 55.8 | 1 | 3 | 55.8 | R35.00 | 15 | none | 20 parcels / 150kg |
| Pretoria → Bloemfontein | 454.6 | 1 | 3 | 454.6 | R160.00 | 25 | none | 20 parcels / 150kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | regional-1-leg-1 | 55.8 | R136.38 | R418.35 | R-281.97 | R100.00 | NO |
| courier-2 | regional-1-leg-2 | 454.6 | R383.62 | R3220.62 | R-2837.00 | R100.00 | NO |

## JHB → Bloemfontein · 5 parcel(s)

- Customer revenue: **R3250.00**; Mzansi gross platform revenue: **R650.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R554.25**.
- Total courier pool: **R2600.00**; route cost floor: **R3638.97**; route surplus after courier cost floor: **R-1038.97**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **fails**; dispatch-time gate: **REPRICE**; decision: **REJECT / CONSOLIDATE**.
- Minimum customer tariff at this parcel count: **R909.75 per parcel**; minimum courier pool: **R3638.97**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R909.74 per parcel** (courier cost floor R909.74, positive platform net R1.75).
- Readiness reasons: Courier pool does not cover operating cost plus disruption reserve At least one courier is below the R150.00 net acceptance floor; warnings: Courier pool is R1038.97 below the combined operating-cost floor after deadhead, return, and handover costs.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Pretoria | 55.8 | 5 | 15 | 55.8 | R35.00 | 15 | none | 20 parcels / 150kg |
| Pretoria → Bloemfontein | 454.6 | 5 | 15 | 454.6 | R160.00 | 25 | none | 20 parcels / 150kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | regional-5-leg-1 | 55.8 | R372.86 | R418.35 | R-45.49 | R100.00 | NO |
| courier-2 | regional-5-leg-2 | 454.6 | R2227.14 | R3220.62 | R-993.48 | R100.00 | NO |

## JHB → Bloemfontein · 10 parcel(s)

- Customer revenue: **R4500.00**; Mzansi gross platform revenue: **R900.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R768.00**.
- Total courier pool: **R3600.00**; route cost floor: **R3638.97**; route surplus after courier cost floor: **R-38.97**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **fails**; dispatch-time gate: **REPRICE**; decision: **REJECT / CONSOLIDATE**.
- Minimum customer tariff at this parcel count: **R454.88 per parcel**; minimum courier pool: **R3638.97**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R454.87 per parcel** (courier cost floor R454.87, positive platform net R0.88).
- Readiness reasons: Courier pool does not cover operating cost plus disruption reserve At least one courier is below the R150.00 net acceptance floor; warnings: Courier pool is R38.97 below the combined operating-cost floor after deadhead, return, and handover costs.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Pretoria | 55.8 | 10 | 30 | 55.8 | R35.00 | 15 | none | 20 parcels / 150kg |
| Pretoria → Bloemfontein | 454.6 | 10 | 30 | 454.6 | R160.00 | 25 | none | 20 parcels / 150kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | regional-10-leg-1 | 55.8 | R486.55 | R418.35 | R68.20 | R100.00 | YES |
| courier-2 | regional-10-leg-2 | 454.6 | R3113.45 | R3220.62 | R-107.17 | R100.00 | NO |

## JHB → Bloemfontein · 20 parcel(s)

- Customer revenue: **R9000.00**; Mzansi gross platform revenue: **R1800.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R1537.50**.
- Total courier pool: **R7200.00**; route cost floor: **R3638.97**; route surplus after courier cost floor: **R3561.03**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R227.44 per parcel**; minimum courier pool: **R3638.97**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R227.44 per parcel** (courier cost floor R227.44, positive platform net R0.44).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Pretoria | 55.8 | 20 | 60 | 55.8 | R35.00 | 15 | none | 20 parcels / 150kg |
| Pretoria → Bloemfontein | 454.6 | 20 | 60 | 454.6 | R160.00 | 25 | none | 20 parcels / 150kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | regional-20-leg-1 | 55.8 | R895.84 | R418.35 | R477.49 | R100.00 | YES |
| courier-2 | regional-20-leg-2 | 454.6 | R6304.16 | R3220.62 | R3083.54 | R100.00 | YES |

## JHB → Bloemfontein · 50 parcel(s)

- Customer revenue: **R22500.00**; Mzansi gross platform revenue: **R4500.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R3846.00**.
- Total courier pool: **R18000.00**; route cost floor: **R3638.97**; route surplus after courier cost floor: **R14361.03**.
- Capacity feasible: **no**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **CONSOLIDATE**; decision: **REJECT / CONSOLIDATE**.
- Parallel planning: **3 wave(s)**; wave decisions: W1 20 parcels / R7200.00 pool / R3561.03 courier net, W2 20 parcels / R7200.00 pool / R3561.03 courier net, W3 10 parcels / R3600.00 pool / R-38.97 courier net; planner result: **CONSOLIDATE**.
- Minimum customer tariff at this parcel count: **R90.98 per parcel**; minimum courier pool: **R3638.97**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R90.97 per parcel** (courier cost floor R90.97, positive platform net R0.18).
- Readiness reasons: Vehicle capacity, parcel count, weight, or volume is not feasible; warnings: One or more relay legs exceed the vehicle's verified parcel, weight, or volume capacity.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Pretoria | 55.8 | 50 | 150 | 55.8 | R35.00 | 15 | none | 20 parcels / 150kg |
| Pretoria → Bloemfontein | 454.6 | 50 | 150 | 454.6 | R160.00 | 25 | none | 20 parcels / 150kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | regional-50-leg-1 | 55.8 | R2123.70 | R418.35 | R1705.35 | R100.00 | YES |
| courier-2 | regional-50-leg-2 | 454.6 | R15876.30 | R3220.62 | R12655.68 | R100.00 | YES |

## JHB → Bloemfontein · 100 parcel(s)

- Customer revenue: **R45000.00**; Mzansi gross platform revenue: **R9000.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R7693.50**.
- Total courier pool: **R36000.00**; route cost floor: **R3638.97**; route surplus after courier cost floor: **R32361.03**.
- Capacity feasible: **no**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **CONSOLIDATE**; decision: **DISPATCH**.
- Parallel planning: **5 wave(s)**; wave decisions: W1 20 parcels / R7200.00 pool / R3561.03 courier net, W2 20 parcels / R7200.00 pool / R3561.03 courier net, W3 20 parcels / R7200.00 pool / R3561.03 courier net, W4 20 parcels / R7200.00 pool / R3561.03 courier net, W5 20 parcels / R7200.00 pool / R3561.03 courier net; planner result: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R45.49 per parcel**; minimum courier pool: **R3638.97**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R45.49 per parcel** (courier cost floor R45.49, positive platform net R0.09).
- Readiness reasons: Vehicle capacity, parcel count, weight, or volume is not feasible; warnings: One or more relay legs exceed the vehicle's verified parcel, weight, or volume capacity.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Pretoria | 55.8 | 100 | 300 | 55.8 | R35.00 | 15 | none | 20 parcels / 150kg |
| Pretoria → Bloemfontein | 454.6 | 100 | 300 | 454.6 | R160.00 | 25 | none | 20 parcels / 150kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | regional-100-leg-1 | 55.8 | R4170.14 | R418.35 | R3751.79 | R100.00 | YES |
| courier-2 | regional-100-leg-2 | 454.6 | R31829.86 | R3220.62 | R28609.24 | R100.00 | YES |

## JHB → Cape Town · 5 legs · 1 parcel(s)

- Customer revenue: **R2800.00**; Mzansi gross platform revenue: **R560.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R477.30**.
- Total courier pool: **R2240.00**; route cost floor: **R10051.75**; route surplus after courier cost floor: **R-7811.75**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **fails**; dispatch-time gate: **REPRICE**; decision: **REJECT / CONSOLIDATE**.
- Minimum customer tariff at this parcel count: **R12564.69 per parcel**; minimum courier pool: **R10051.75**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R12564.69 per parcel** (courier cost floor R12564.69, positive platform net R8.77).
- Readiness reasons: Courier pool does not cover operating cost plus disruption reserve At least one courier is below the R150.00 net acceptance floor; warnings: Courier pool is R7811.75 below the combined operating-cost floor after deadhead, return, and handover costs.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 1 | 4 | 412.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 1 | 4 | 543.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 1 | 4 | 198.9 | R0.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 1 | 4 | 156.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 1 | 4 | 110.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | jhb-cpt-5-1-leg-1 | 412.0 | R609.86 | R2963.94 | R-2354.08 | R100.00 | NO |
| courier-2 | jhb-cpt-5-1-leg-2 | 543.2 | R762.01 | R3825.32 | R-3063.31 | R100.00 | NO |
| courier-3 | jhb-cpt-5-1-leg-3 | 198.9 | R339.37 | R1372.87 | R-1033.50 | R100.00 | NO |
| courier-4 | jhb-cpt-5-1-leg-4 | 156.5 | R290.42 | R1092.83 | R-802.41 | R100.00 | NO |
| courier-5 | jhb-cpt-5-1-leg-5 | 110.1 | R238.34 | R796.79 | R-558.45 | R100.00 | NO |

## JHB → Cape Town · 5 legs · 5 parcel(s)

- Customer revenue: **R9500.00**; Mzansi gross platform revenue: **R1900.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R1623.00**.
- Total courier pool: **R7600.00**; route cost floor: **R10051.75**; route surplus after courier cost floor: **R-2451.75**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **fails**; dispatch-time gate: **REPRICE**; decision: **REJECT / CONSOLIDATE**.
- Minimum customer tariff at this parcel count: **R2512.94 per parcel**; minimum courier pool: **R10051.75**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R2512.94 per parcel** (courier cost floor R2512.94, positive platform net R1.75).
- Readiness reasons: Courier pool does not cover operating cost plus disruption reserve At least one courier is below the R150.00 net acceptance floor; warnings: Courier pool is R2451.75 below the combined operating-cost floor after deadhead, return, and handover costs.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 5 | 20 | 412.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 5 | 20 | 543.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 5 | 20 | 198.9 | R0.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 5 | 20 | 156.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 5 | 20 | 110.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | jhb-cpt-5-5-leg-1 | 412.0 | R2180.46 | R2963.94 | R-783.48 | R100.00 | NO |
| courier-2 | jhb-cpt-5-5-leg-2 | 543.2 | R2801.30 | R3825.32 | R-1024.02 | R100.00 | NO |
| courier-3 | jhb-cpt-5-5-leg-3 | 198.9 | R1076.75 | R1372.87 | R-296.12 | R100.00 | NO |
| courier-4 | jhb-cpt-5-5-leg-4 | 156.5 | R877.01 | R1092.83 | R-215.82 | R100.00 | NO |
| courier-5 | jhb-cpt-5-5-leg-5 | 110.1 | R664.48 | R796.79 | R-132.31 | R100.00 | NO |

## JHB → Cape Town · 5 legs · 10 parcel(s)

- Customer revenue: **R19000.00**; Mzansi gross platform revenue: **R3800.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R3247.50**.
- Total courier pool: **R15200.00**; route cost floor: **R10051.75**; route surplus after courier cost floor: **R5148.25**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R1256.47 per parcel**; minimum courier pool: **R10051.75**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R1256.47 per parcel** (courier cost floor R1256.47, positive platform net R0.88).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 10 | 40 | 412.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 10 | 40 | 543.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 10 | 40 | 198.9 | R0.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 10 | 40 | 156.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 10 | 40 | 110.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | jhb-cpt-5-10-leg-1 | 412.0 | R4407.44 | R2963.94 | R1443.50 | R100.00 | YES |
| courier-2 | jhb-cpt-5-10-leg-2 | 543.2 | R5692.83 | R3825.32 | R1867.51 | R100.00 | YES |
| courier-3 | jhb-cpt-5-10-leg-3 | 198.9 | R2122.28 | R1372.87 | R749.41 | R100.00 | YES |
| courier-4 | jhb-cpt-5-10-leg-4 | 156.5 | R1708.73 | R1092.83 | R615.90 | R100.00 | YES |
| courier-5 | jhb-cpt-5-10-leg-5 | 110.1 | R1268.72 | R796.79 | R471.93 | R100.00 | YES |

## JHB → Cape Town · 5 legs · 20 parcel(s)

- Customer revenue: **R31000.00**; Mzansi gross platform revenue: **R6200.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R5299.50**.
- Total courier pool: **R24800.00**; route cost floor: **R10051.75**; route surplus after courier cost floor: **R14748.25**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R628.24 per parcel**; minimum courier pool: **R10051.75**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R628.23 per parcel** (courier cost floor R628.23, positive platform net R0.44).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 20 | 80 | 412.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 20 | 80 | 543.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 20 | 80 | 198.9 | R0.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 20 | 80 | 156.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 20 | 80 | 110.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | jhb-cpt-5-20-leg-1 | 412.0 | R7220.46 | R2963.94 | R4256.52 | R100.00 | YES |
| courier-2 | jhb-cpt-5-20-leg-2 | 543.2 | R9345.30 | R3825.32 | R5519.98 | R100.00 | YES |
| courier-3 | jhb-cpt-5-20-leg-3 | 198.9 | R3442.96 | R1372.87 | R2070.09 | R100.00 | YES |
| courier-4 | jhb-cpt-5-20-leg-4 | 156.5 | R2759.33 | R1092.83 | R1666.50 | R100.00 | YES |
| courier-5 | jhb-cpt-5-20-leg-5 | 110.1 | R2031.95 | R796.79 | R1235.16 | R100.00 | YES |

## JHB → Cape Town · 5 legs · 50 parcel(s)

- Customer revenue: **R65000.00**; Mzansi gross platform revenue: **R13000.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R11113.50**.
- Total courier pool: **R52000.00**; route cost floor: **R10051.75**; route surplus after courier cost floor: **R41948.25**.
- Capacity feasible: **no**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **CONSOLIDATE**; decision: **REJECT / CONSOLIDATE**.
- Parallel planning: **3 wave(s)**; wave decisions: W1 20 parcels / R20800.00 pool / R10748.25 courier net, W2 20 parcels / R20800.00 pool / R10748.25 courier net, W3 10 parcels / R10400.00 pool / R348.25 courier net; planner result: **CONSOLIDATE**.
- Minimum customer tariff at this parcel count: **R251.30 per parcel**; minimum courier pool: **R10051.75**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R251.29 per parcel** (courier cost floor R251.29, positive platform net R0.18).
- Readiness reasons: Vehicle capacity, parcel count, weight, or volume is not feasible; warnings: One or more relay legs exceed the vehicle's verified parcel, weight, or volume capacity.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 50 | 200 | 412.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 50 | 200 | 543.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 50 | 200 | 198.9 | R0.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 50 | 200 | 156.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 50 | 200 | 110.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | jhb-cpt-5-50-leg-1 | 412.0 | R15190.68 | R2963.94 | R12226.74 | R100.00 | YES |
| courier-2 | jhb-cpt-5-50-leg-2 | 543.2 | R19693.94 | R3825.32 | R15868.62 | R100.00 | YES |
| courier-3 | jhb-cpt-5-50-leg-3 | 198.9 | R7184.87 | R1372.87 | R5812.00 | R100.00 | YES |
| courier-4 | jhb-cpt-5-50-leg-4 | 156.5 | R5736.04 | R1092.83 | R4643.21 | R100.00 | YES |
| courier-5 | jhb-cpt-5-50-leg-5 | 110.1 | R4194.47 | R796.79 | R3397.68 | R100.00 | YES |

## JHB → Cape Town · 5 legs · 100 parcel(s)

- Customer revenue: **R130000.00**; Mzansi gross platform revenue: **R26000.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R22228.50**.
- Total courier pool: **R104000.00**; route cost floor: **R10051.75**; route surplus after courier cost floor: **R93948.25**.
- Capacity feasible: **no**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **CONSOLIDATE**; decision: **DISPATCH**.
- Parallel planning: **5 wave(s)**; wave decisions: W1 20 parcels / R20800.00 pool / R10748.25 courier net, W2 20 parcels / R20800.00 pool / R10748.25 courier net, W3 20 parcels / R20800.00 pool / R10748.25 courier net, W4 20 parcels / R20800.00 pool / R10748.25 courier net, W5 20 parcels / R20800.00 pool / R10748.25 courier net; planner result: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R125.65 per parcel**; minimum courier pool: **R10051.75**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R125.65 per parcel** (courier cost floor R125.65, positive platform net R0.09).
- Readiness reasons: Vehicle capacity, parcel count, weight, or volume is not feasible; warnings: One or more relay legs exceed the vehicle's verified parcel, weight, or volume capacity.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 100 | 400 | 412.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 100 | 400 | 543.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 100 | 400 | 198.9 | R0.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 100 | 400 | 156.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 100 | 400 | 110.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | jhb-cpt-5-100-leg-1 | 412.0 | R30427.88 | R2963.94 | R27463.94 | R100.00 | YES |
| courier-2 | jhb-cpt-5-100-leg-2 | 543.2 | R39478.12 | R3825.32 | R35652.80 | R100.00 | YES |
| courier-3 | jhb-cpt-5-100-leg-3 | 198.9 | R14338.52 | R1372.87 | R12965.65 | R100.00 | YES |
| courier-4 | jhb-cpt-5-100-leg-4 | 156.5 | R11426.79 | R1092.83 | R10333.96 | R100.00 | YES |
| courier-5 | jhb-cpt-5-100-leg-5 | 110.1 | R8328.69 | R796.79 | R7531.90 | R100.00 | YES |

## JHB → Cape Town · 5 legs · 120 parcel(s)

- Customer revenue: **R156000.00**; Mzansi gross platform revenue: **R31200.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R26674.50**.
- Total courier pool: **R124800.00**; route cost floor: **R10051.75**; route surplus after courier cost floor: **R114748.25**.
- Capacity feasible: **no**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **CONSOLIDATE**; decision: **DISPATCH**.
- Parallel planning: **6 wave(s)**; wave decisions: W1 20 parcels / R20800.00 pool / R10748.25 courier net, W2 20 parcels / R20800.00 pool / R10748.25 courier net, W3 20 parcels / R20800.00 pool / R10748.25 courier net, W4 20 parcels / R20800.00 pool / R10748.25 courier net, W5 20 parcels / R20800.00 pool / R10748.25 courier net, W6 20 parcels / R20800.00 pool / R10748.25 courier net; planner result: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R104.71 per parcel**; minimum courier pool: **R10051.75**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R104.71 per parcel** (courier cost floor R104.71, positive platform net R0.07).
- Readiness reasons: Vehicle capacity, parcel count, weight, or volume is not feasible; warnings: One or more relay legs exceed the vehicle's verified parcel, weight, or volume capacity.

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 120 | 480 | 412.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 120 | 480 | 543.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 120 | 480 | 198.9 | R0.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 120 | 480 | 156.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 120 | 480 | 110.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | jhb-cpt-5-120-leg-1 | 412.0 | R36522.75 | R2963.94 | R33558.81 | R100.00 | YES |
| courier-2 | jhb-cpt-5-120-leg-2 | 543.2 | R47391.78 | R3825.32 | R43566.46 | R100.00 | YES |
| courier-3 | jhb-cpt-5-120-leg-3 | 198.9 | R17199.98 | R1372.87 | R15827.11 | R100.00 | YES |
| courier-4 | jhb-cpt-5-120-leg-4 | 156.5 | R13703.09 | R1092.83 | R12610.26 | R100.00 | YES |
| courier-5 | jhb-cpt-5-120-leg-5 | 110.1 | R9982.40 | R796.79 | R9185.61 | R100.00 | YES |

## JHB → Cape Town · uneven 4-leg split · 20 parcels

- Customer revenue: **R33000.00**; Mzansi gross platform revenue: **R6600.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R5641.50**.
- Total courier pool: **R26400.00**; route cost floor: **R9990.04**; route surplus after courier cost floor: **R16409.96**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R624.38 per parcel**; minimum courier pool: **R9990.04**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R624.38 per parcel** (courier cost floor R624.38, positive platform net R0.44).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 20 | 80 | 412.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 20 | 80 | 543.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Worcester | 355.1 | 20 | 80 | 355.1 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 20 | 80 | 110.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | jhb-cpt-4-20-leg-1 | 412.0 | R7763.44 | R2963.94 | R4799.50 | R100.00 | YES |
| courier-2 | jhb-cpt-4-20-leg-2 | 543.2 | R10050.31 | R3825.32 | R6224.99 | R100.00 | YES |
| courier-3 | jhb-cpt-4-20-leg-3 | 355.1 | R6406.97 | R2403.99 | R4002.98 | R100.00 | YES |
| courier-4 | jhb-cpt-4-20-leg-4 | 110.1 | R2179.28 | R796.79 | R1382.49 | R100.00 | YES |

## JHB → Cape Town · 6 legs · 20 parcels

- Customer revenue: **R36000.00**; Mzansi gross platform revenue: **R7200.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R6154.50**.
- Total courier pool: **R28800.00**; route cost floor: **R10761.78**; route surplus after courier cost floor: **R18038.22**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R672.62 per parcel**; minimum courier pool: **R10761.78**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R672.61 per parcel** (courier cost floor R672.61, positive platform net R0.44).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Pretoria | 55.8 | 20 | 80 | 55.8 | R220.00 | 25 | none | 20 parcels / 250kg |
| Pretoria → Bloemfontein | 454.6 | 20 | 80 | 454.6 | R180.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 20 | 80 | 543.2 | R0.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 20 | 80 | 198.9 | R0.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 20 | 80 | 156.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 20 | 80 | 110.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | jhb-cpt-6-20-leg-1 | 55.8 | R1597.80 | R613.35 | R984.45 | R100.00 | YES |
| courier-2 | jhb-cpt-6-20-leg-2 | 454.6 | R8571.37 | R3240.62 | R5330.75 | R100.00 | YES |
| courier-3 | jhb-cpt-6-20-leg-3 | 543.2 | R9733.44 | R3645.32 | R6088.12 | R100.00 | YES |
| courier-4 | jhb-cpt-6-20-leg-4 | 198.9 | R3722.36 | R1372.87 | R2349.49 | R100.00 | YES |
| courier-5 | jhb-cpt-6-20-leg-5 | 156.5 | R2981.60 | R1092.83 | R1888.77 | R100.00 | YES |
| courier-6 | jhb-cpt-6-20-leg-6 | 110.1 | R2193.43 | R796.79 | R1396.64 | R100.00 | YES |

## JHB → Cape Town · high fuel + empty returns

- Customer revenue: **R33000.00**; Mzansi gross platform revenue: **R6600.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R5641.50**.
- Total courier pool: **R26400.00**; route cost floor: **R19392.91**; route surplus after courier cost floor: **R7007.09**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R1212.06 per parcel**; minimum courier pool: **R19392.91**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R1212.06 per parcel** (courier cost floor R1212.06, positive platform net R0.44).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 20 | 80 | 627.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 20 | 80 | 758.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 20 | 80 | 413.9 | R0.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 20 | 80 | 371.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 20 | 80 | 325.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | stress-fuel-leg-1 | 412.0 | R6788.03 | R4947.20 | R1840.83 | R100.00 | YES |
| courier-2 | stress-fuel-leg-2 | 543.2 | R8217.56 | R5926.73 | R2290.83 | R100.00 | YES |
| courier-3 | stress-fuel-leg-3 | 198.9 | R4268.52 | R3164.40 | R1104.12 | R100.00 | YES |
| courier-4 | stress-fuel-leg-4 | 156.5 | R3808.40 | R2846.18 | R962.22 | R100.00 | YES |
| courier-5 | stress-fuel-leg-5 | 110.1 | R3317.49 | R2508.40 | R809.09 | R100.00 | YES |

## JHB → Cape Town · strong backhaul

- Customer revenue: **R31000.00**; Mzansi gross platform revenue: **R6200.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R5299.50**.
- Total courier pool: **R24800.00**; route cost floor: **R10801.75**; route surplus after courier cost floor: **R13998.25**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R675.11 per parcel**; minimum courier pool: **R10801.75**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R675.11 per parcel** (courier cost floor R675.11, positive platform net R0.44).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 20 | 80 | 462.0 | R220.00 | 25 | R180.00 | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 20 | 80 | 593.2 | R180.00 | 25 | R180.00 | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 20 | 80 | 248.9 | R0.00 | 25 | R180.00 | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 20 | 80 | 206.5 | R0.00 | 25 | R180.00 | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 20 | 80 | 160.1 | R0.00 | 35 | R180.00 | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | stress-backhaul-leg-1 | 412.0 | R7090.79 | R3113.94 | R3976.85 | R100.00 | YES |
| courier-2 | stress-backhaul-leg-2 | 543.2 | R9093.74 | R3975.32 | R5118.42 | R100.00 | YES |
| courier-3 | stress-backhaul-leg-3 | 198.9 | R3529.98 | R1522.87 | R2007.11 | R100.00 | YES |
| courier-4 | stress-backhaul-leg-4 | 156.5 | R2885.57 | R1242.83 | R1642.74 | R100.00 | YES |
| courier-5 | stress-backhaul-leg-5 | 110.1 | R2199.92 | R946.79 | R1253.13 | R100.00 | YES |

## JHB → Cape Town · one courier cancels / recovery return

- Customer revenue: **R33000.00**; Mzansi gross platform revenue: **R6600.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R5641.50**.
- Total courier pool: **R26400.00**; route cost floor: **R15417.75**; route surplus after courier cost floor: **R10982.25**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **DISPATCH**.
- Minimum customer tariff at this parcel count: **R1059.98 per parcel**; minimum courier pool: **R16959.53**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R963.61 per parcel** (courier cost floor R963.61, positive platform net R0.44).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 20 | 80 | 492.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 20 | 80 | 623.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 20 | 80 | 638.9 | R350.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 20 | 80 | 236.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 20 | 80 | 190.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | stress-cancel-leg-1 | 412.0 | R6160.27 | R3491.94 | R2668.33 | R100.00 | YES |
| courier-2 | stress-cancel-leg-2 | 543.2 | R7738.05 | R4353.32 | R3384.73 | R100.00 | YES |
| courier-3 | stress-cancel-leg-3 | 198.9 | R7346.40 | R4626.87 | R2719.53 | R100.00 | YES |
| courier-4 | stress-cancel-leg-4 | 156.5 | R2847.70 | R1620.83 | R1226.87 | R100.00 | YES |
| courier-5 | stress-cancel-leg-5 | 110.1 | R2307.58 | R1324.79 | R982.79 | R100.00 | YES |

## JHB → Cape Town · 50% refund / failed delivery

- Customer revenue: **R16500.00**; Mzansi gross platform revenue: **R3300.00**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **R2820.00**.
- Total courier pool: **R13200.00**; route cost floor: **R10051.75**; route surplus after courier cost floor: **R3148.25**.
- Capacity feasible: **yes**; minimum payouts funded: **yes**; courier acceptance test: **passes**; dispatch-time gate: **DISPATCH**; decision: **REJECT / CONSOLIDATE**.
- Minimum customer tariff at this parcel count: **R691.06 per parcel**; minimum courier pool: **R11056.92**; maximum viable vehicle capacity: **20 units**.
- Break-even tariff at this parcel count: **R628.23 per parcel** (courier cost floor R628.23, positive platform net R0.44).
- Readiness reasons: none; warnings: none

### Relay legs

| Leg | Road km | Parcels | Weight kg | Driven km | Tolls | Handover min | Backhaul | Capacity |
| Sandton → Bloemfontein | 412.0 | 20 | 80 | 412.0 | R220.00 | 25 | none | 20 parcels / 250kg |
| Bloemfontein → Beaufort West | 543.2 | 20 | 80 | 543.2 | R180.00 | 25 | none | 20 parcels / 250kg |
| Beaufort West → Laingsburg | 198.9 | 20 | 80 | 198.9 | R0.00 | 25 | none | 20 parcels / 250kg |
| Laingsburg → Worcester | 156.5 | 20 | 80 | 156.5 | R0.00 | 25 | none | 20 parcels / 250kg |
| Worcester → Cape Town | 110.1 | 20 | 80 | 110.1 | R0.00 | 35 | none | 20 parcels / 250kg |

### Courier settlements

| Courier | Leg | Road km | Gross | Operating cost | Net | Min payout | Accept? |
| courier-1 | stress-refund-leg-1 | 412.0 | R3821.39 | R2963.94 | R857.45 | R100.00 | YES |
| courier-2 | stress-refund-leg-2 | 543.2 | R4931.90 | R3825.32 | R1106.58 | R100.00 | YES |
| courier-3 | stress-refund-leg-3 | 198.9 | R1847.14 | R1372.87 | R474.27 | R100.00 | YES |
| courier-4 | stress-refund-leg-4 | 156.5 | R1489.86 | R1092.83 | R397.03 | R100.00 | YES |
| courier-5 | stress-refund-leg-5 | 110.1 | R1109.71 | R796.79 | R312.92 | R100.00 | YES |

## Features that are working correctly in the hardened model

- The 20% platform allocation and 80% courier pool are conserved once across all relay legs.
- Actual road-route geometry is resolved before the dispatch gate and the same route distances feed economics.
- Verified vehicle capacity, parcel weight/volume, operating costs, reserves, courier net floors, tolls, handovers, deadhead, returns, and confirmed backhaul are included.
- 50+ parcel requests are split into capacity-safe parallel waves; each wave receives its own economic decision.
- The append-only parcel ledger records payment, platform allocation, courier pool, reserves, allocations, refunds, cancellations, replacement costs, payment/payout costs, and final contributions.

## Model conclusions

### Critical launch findings

1. **Capacity is a hard constraint.** A single courier/leg cannot carry 50–100 parcels when verified capacity is 20; those scenarios correctly reject and must be dispatched as multiple waves or parallel legs.
2. **Long-distance one-parcel routes are commercially fragile.** The 20% platform fee can remain positive while courier net is negative; platform-positive does not mean network-viable.
3. **The 80% pool is conserved once across all couriers.** It is not paid 80% per courier.
4. **Road distance improves allocation accuracy, but route geometry is a dispatch prerequisite.** Missing geometry is rejected rather than estimated.
5. **Backhaul materially improves courier net only when it is real, confirmed work; it must not be treated as guaranteed revenue.**

### Required safeguards before launch

- Reject a route unless every leg has current road geometry, a verified vehicle-cost profile, and parcel/weight/volume capacity.
- Reject or consolidate when any courier’s estimated net is below zero, below the configured minimum payout, or below a launch target such as R150 per accepted leg.
- Require total courier pool >= max(total operating-cost floor, sum minimum payouts) plus a disruption reserve.
- Treat cancellations, refunds, failed handovers, and replacement legs as append-only ledger events. Never pay or count reserved funds as profit; require an immutable event key for every adjustment.
- Use multi-wave planning for parcel counts above a vehicle’s capacity; do not place 100 parcels on one relay leg.
- Reprice or delay dispatch when tolls, deadhead, return distance, fuel price, or handover time moves any leg below its acceptance floor.

### Minimum viable operating model

Start with local and regional routes, 5–20 parcels per corridor, verified cars/vans, low deadhead, pre-approved handover points, and confirmed backhaul only. Offer long-distance JHB→Cape Town only at a tariff above the scenario break-even tariff and with 4–6 pre-accepted couriers plus a recovery courier.

### Important technical gaps exposed

- Dispatch-time route, capacity, reserve, and courier-net checks are now hard gates; keep route results auditable with the dispatch run.
- Automated external payment-provider refund webhooks still need to call the append-only refund event path before automated payout is enabled.
- Replacement-leg reserve creation is wired to courier-reported failed handovers; the final replacement-leg cost must be recorded before settlement approval.
- Multi-wave planning is implemented as a readiness planner; production corridor execution still needs an operational wave/run record before live 50+ parcel dispatch.
