import { mkdir, writeFile } from "node:fs/promises";
import { calculateSharedRelayPool, type RelayPoolLegInput } from "../server/services/relay-pool-pricing";
import { getDrivingRoute } from "../server/services/route-geometry";
import { planParallelWaves, validateDispatchReadiness } from "../server/services/launch-readiness";

type Point = { name: string; lat: number; lng: number };
type Leg = { from: Point; to: Point; tolls: number; handoverMinutes: number; deadhead: number; returnKm: number; backhaul: number; backhaulAvailable: boolean };
type Scenario = { id: string; group: string; label: string; legs: Leg[]; parcels: number; tariffPerParcel: number; weightKg: number; volumeM3: number; capacityUnits: number; capacityWeightKg: number; capacityVolumeM3: number; fuelPrice?: number; returnMultiplier?: number; disruption?: string };

const P = (name: string, lat: number, lng: number): Point => ({ name, lat, lng });
const points = {
  sandton: P("Sandton", -26.1076, 28.0567),
  soweto: P("Soweto", -26.2485, 27.8546),
  pretoria: P("Pretoria", -25.7479, 28.2293),
  bloem: P("Bloemfontein", -29.0852, 26.1596),
  beaufort: P("Beaufort West", -32.3567, 22.5830),
  laingsburg: P("Laingsburg", -33.1975, 20.8569),
  worcester: P("Worcester", -33.6465, 19.4485),
  capeTown: P("Cape Town", -33.9249, 18.4241),
};
const leg = (from: Point, to: Point, options: Partial<Omit<Leg, "from" | "to">> = {}): Leg => ({ from, to, tolls: 0, handoverMinutes: 20, deadhead: 0, returnKm: 0, backhaul: 0, backhaulAvailable: false, ...options });
const jhbCapeTown = (count: 4 | 5 | 6): Leg[] => {
  const chain = count === 4 ? [points.sandton, points.bloem, points.beaufort, points.worcester, points.capeTown] : count === 5 ? [points.sandton, points.bloem, points.beaufort, points.laingsburg, points.worcester, points.capeTown] : [points.sandton, points.pretoria, points.bloem, points.beaufort, points.laingsburg, points.worcester, points.capeTown];
  return chain.slice(0, -1).map((from, i) => leg(from, chain[i + 1], { tolls: i === 0 ? 220 : i === 1 ? 180 : 0, handoverMinutes: i === chain.length - 2 ? 35 : 25 }));
};
const regional = [leg(points.sandton, points.pretoria, { tolls: 35, handoverMinutes: 15 }), leg(points.pretoria, points.bloem, { tolls: 160, handoverMinutes: 25 })];
const local = [leg(points.sandton, points.soweto, { handoverMinutes: 10 })];

const scenarios: Scenario[] = [];
for (const parcels of [1, 5, 10, 20]) scenarios.push({ id: `local-${parcels}`, group: "Local", label: `Sandton → Soweto · ${parcels} parcel(s)`, legs: local, parcels, tariffPerParcel: parcels === 1 ? 180 : 150, weightKg: 2, volumeM3: 0.01, capacityUnits: 20, capacityWeightKg: 150, capacityVolumeM3: 1 });
for (const parcels of [1, 5, 10, 20, 50, 100]) scenarios.push({ id: `regional-${parcels}`, group: "Regional", label: `JHB → Bloemfontein · ${parcels} parcel(s)`, legs: regional, parcels, tariffPerParcel: parcels < 10 ? 650 : 450, weightKg: 3, volumeM3: 0.018, capacityUnits: 20, capacityWeightKg: 150, capacityVolumeM3: 1 });
for (const parcels of [1, 5, 10, 20, 50, 100, 120]) scenarios.push({ id: `jhb-cpt-5-${parcels}`, group: "Long distance · 5-leg", label: `JHB → Cape Town · 5 legs · ${parcels} parcel(s)`, legs: jhbCapeTown(5), parcels, tariffPerParcel: parcels === 1 ? 2_800 : parcels < 20 ? 1_900 : parcels < 50 ? 1_550 : 1_300, weightKg: 4, volumeM3: 0.025, capacityUnits: 20, capacityWeightKg: 250, capacityVolumeM3: 1.2 });
scenarios.push({ id: "jhb-cpt-4-20", group: "Long distance · 4-leg", label: "JHB → Cape Town · uneven 4-leg split · 20 parcels", legs: jhbCapeTown(4), parcels: 20, tariffPerParcel: 1_650, weightKg: 4, volumeM3: 0.025, capacityUnits: 20, capacityWeightKg: 250, capacityVolumeM3: 1.2 });
scenarios.push({ id: "jhb-cpt-6-20", group: "Long distance · 6-leg", label: "JHB → Cape Town · 6 legs · 20 parcels", legs: jhbCapeTown(6), parcels: 20, tariffPerParcel: 1_800, weightKg: 4, volumeM3: 0.025, capacityUnits: 20, capacityWeightKg: 250, capacityVolumeM3: 1.2 });
scenarios.push({ id: "stress-fuel", group: "Stress", label: "JHB → Cape Town · high fuel + empty returns", legs: jhbCapeTown(5).map((item) => ({ ...item, returnKm: 180, deadhead: 35 })), parcels: 20, tariffPerParcel: 1_650, weightKg: 4, volumeM3: 0.025, capacityUnits: 20, capacityWeightKg: 250, capacityVolumeM3: 1.2, fuelPrice: 35 });
scenarios.push({ id: "stress-backhaul", group: "Stress", label: "JHB → Cape Town · strong backhaul", legs: jhbCapeTown(5).map((item) => ({ ...item, returnKm: 50, backhaulAvailable: true, backhaul: 180 })), parcels: 20, tariffPerParcel: 1_550, weightKg: 4, volumeM3: 0.025, capacityUnits: 20, capacityWeightKg: 250, capacityVolumeM3: 1.2 });
scenarios.push({ id: "stress-cancel", group: "Stress", label: "JHB → Cape Town · one courier cancels / recovery return", legs: jhbCapeTown(5).map((item, i) => ({ ...item, deadhead: i === 2 ? 220 : 20, returnKm: i === 2 ? 220 : 60, tolls: i === 2 ? 350 : item.tolls })), parcels: 20, tariffPerParcel: 1_650, weightKg: 4, volumeM3: 0.025, capacityUnits: 20, capacityWeightKg: 250, capacityVolumeM3: 1.2, disruption: "middle courier cancellation" });
scenarios.push({ id: "stress-refund", group: "Stress", label: "JHB → Cape Town · 50% refund / failed delivery", legs: jhbCapeTown(5), parcels: 20, tariffPerParcel: 1_650, weightKg: 4, volumeM3: 0.025, capacityUnits: 20, capacityWeightKg: 250, capacityVolumeM3: 1.2, disruption: "50% customer refund after failed delivery" });

const routeCache = new Map<string, Awaited<ReturnType<typeof getDrivingRoute>>>();
async function roadRoute(from: Point, to: Point) {
  const key = `${from.name}|${to.name}`;
  if (!routeCache.has(key)) routeCache.set(key, await getDrivingRoute(from, to));
  return routeCache.get(key)!;
}
const round = (value: number) => Math.round(value * 100) / 100;
const zar = (value: number) => `R${value.toFixed(2)}`;

async function runScenario(scenario: Scenario) {
  const routes = await Promise.all(scenario.legs.map((item) => roadRoute(item.from, item.to)));
  const legs: RelayPoolLegInput[] = scenario.legs.map((item, i) => ({
    legId: `${scenario.id}-leg-${i + 1}`, sequence: i + 1, courierId: `courier-${i + 1}`,
    origin: item.from.name, destination: item.to.name, distanceKm: routes[i].distanceKm,
    deadheadKm: item.deadhead, returnKm: item.returnKm, tollsZar: item.tolls,
    handoverTimeMinutes: item.handoverMinutes, availableBackhaul: item.backhaulAvailable, backhaulRevenueZar: item.backhaul,
    fuelPricePerLitre: scenario.fuelPrice ?? 26, fuelLitresPer100Km: 10, driverCompensationPerKm: 2.5, vehicleAllowancePerKm: 1, routeOverheadPerKm: 0.5,
    minimumPayoutZar: 100, parcelCountOnLeg: scenario.parcels, parcelWeightKg: scenario.parcels * scenario.weightKg, parcelVolumeM3: scenario.parcels * scenario.volumeM3,
    vehicleCapacityUnits: scenario.capacityUnits, vehicleCapacityWeightKg: scenario.capacityWeightKg, vehicleCapacityVolumeM3: scenario.capacityVolumeM3,
  }));
  const customerRevenue = scenario.parcels * scenario.tariffPerParcel * (scenario.disruption?.includes("refund") ? 0.5 : 1);
  const result = calculateSharedRelayPool({ customerChargeZar: customerRevenue, parcelCount: scenario.parcels, platformFeePct: 20, paymentProcessingFeePct: 2.9, paymentProcessingFixedZar: 1.5, legs });
  const readiness = validateDispatchReadiness({ customerChargeZar: customerRevenue, parcelCount: scenario.parcels, totalWeightKg: scenario.parcels * scenario.weightKg, totalVolumeM3: scenario.parcels * scenario.volumeM3, requiredReserveZar: scenario.disruption ? result.totalCourierCostFloorZar * 0.1 : 0, minimumCourierNetZar: 150, legs });
  const wavePlan = scenario.parcels > scenario.capacityUnits ? planParallelWaves({ parcelCount: scenario.parcels, parcelWeightKg: scenario.weightKg, parcelVolumeM3: scenario.volumeM3, maxParcelsPerVehicle: scenario.capacityUnits, maxWeightKg: scenario.capacityWeightKg, maxVolumeM3: scenario.capacityVolumeM3, courierIds: legs.map((item) => item.courierId), customerChargePerParcelZar: scenario.tariffPerParcel, routeFactory: (_waveNumber, count) => ({ customerChargeZar: count * scenario.tariffPerParcel, parcelCount: count, totalWeightKg: count * scenario.weightKg, totalVolumeM3: count * scenario.volumeM3, requiredReserveZar: 0, minimumCourierNetZar: 150, legs: legs.map((item) => ({ ...item, parcelCountOnLeg: count, parcelWeightKg: count * scenario.weightKg, parcelVolumeM3: count * scenario.volumeM3 })) }) }) : null;
  const totalCost = result.totalCourierCostFloorZar;
  const platformGross = result.platformFeeZar;
  const platformNet = round(result.estimatedPlatformNetZar);
  const courierAcceptance = result.couriers.every((courier) => courier.estimatedNetZar >= 0 && courier.grossEarningsZar >= courier.minimumPayoutZar);
  const dispatch = (wavePlan ? wavePlan.decision === "DISPATCH" : readiness.decision === "DISPATCH") && courierAcceptance && !scenario.disruption?.includes("refund");
  return { scenario, routes, result, readiness, wavePlan, customerRevenue, totalCost, platformGross, platformNet, courierAcceptance, dispatch };
}

function breakEven(result: Awaited<ReturnType<typeof runScenario>>, parcels: number) {
  const requiredPool = Math.max(result.result.totalCourierCostFloorZar, result.result.minimumPayoutRequirementZar);
  const minimumTariffForCourierCosts = requiredPool / 0.8 / parcels;
  const minimumTariffForPositivePlatformNet = 1.5 / (0.2 - 0.029) / parcels;
  return { minimumTariffForCourierCosts: round(minimumTariffForCourierCosts), minimumTariffForPositivePlatformNet: round(minimumTariffForPositivePlatformNet), bindingTariff: round(Math.max(minimumTariffForCourierCosts, minimumTariffForPositivePlatformNet)) };
}

function mdTable(rows: string[][]) { return rows.map((row) => `| ${row.join(" | ")} |`).join("\n"); }
async function main() {
  await mkdir("reports", { recursive: true });
  const outputs = [];
  for (const scenario of scenarios) outputs.push(await runScenario(scenario));
  const summaryRows = [["Scenario", "Revenue", "Mzansi 20%", "Courier pool", "Couriers", "Road km / legs", "Route cost", "Platform net", "Decision"]];
  for (const output of outputs) {
    const r = output.result;
    summaryRows.push([output.scenario.label, zar(output.customerRevenue), zar(r.platformFeeZar), zar(r.courierPoolZar), String(r.couriers.length), `${r.routeDistanceKm.toFixed(0)} / ${r.legs.length}`, zar(output.totalCost), zar(output.platformNet), output.dispatch ? "DISPATCH" : "REJECT / CONSOLIDATE"]);
  }
  const detailSections = outputs.map((output) => {
    const r = output.result;
    const courierRows = [["Courier", "Leg", "Road km", "Gross", "Operating cost", "Net", "Min payout", "Accept?"]];
    r.couriers.forEach((courier) => courierRows.push([courier.courierId, courier.legIds.join(","), courier.distanceKm.toFixed(1), zar(courier.grossEarningsZar), zar(courier.operatingCostZar + courier.handoverFeesZar), zar(courier.estimatedNetZar), zar(courier.minimumPayoutZar), courier.estimatedNetZar >= 0 && courier.minimumPayoutMet ? "YES" : "NO"]));
    const legRows = [["Leg", "Road km", "Parcels", "Weight kg", "Driven km", "Tolls", "Handover min", "Backhaul", "Capacity"]];
    r.legs.forEach((item, i) => { const input = output.scenario.legs[i]; legRows.push([`${item.origin} → ${item.destination}`, item.distanceKm.toFixed(1), String(output.scenario.parcels), String(output.scenario.parcels * output.scenario.weightKg), item.totalDrivenKm.toFixed(1), zar(input.tolls), String(input.handoverMinutes), input.backhaulAvailable ? zar(input.backhaul) : "none", `${output.scenario.capacityUnits} parcels / ${output.scenario.capacityWeightKg}kg`]); });
    const be = breakEven(output, output.scenario.parcels);
    const waveSummary = output.wavePlan ? `\n- Parallel planning: **${output.wavePlan.waves.length} wave(s)**; wave decisions: ${output.wavePlan.waves.map((wave) => `W${wave.waveNumber} ${wave.parcelCount} parcels / ${zar(wave.courierPoolZar)} pool / ${zar(wave.courierNetZar)} courier net`).join(", ")}; planner result: **${output.wavePlan.decision}**.` : "";
    return `## ${output.scenario.label}\n\n- Customer revenue: **${zar(output.customerRevenue)}**; Mzansi gross platform revenue: **${zar(output.platformGross)}**; estimated Mzansi net contribution after 2.9% + R1.50 payment cost: **${zar(output.platformNet)}**.\n- Total courier pool: **${zar(r.courierPoolZar)}**; route cost floor: **${zar(output.totalCost)}**; route surplus after courier cost floor: **${zar(r.poolSurplusAfterCostZar)}**.\n- Capacity feasible: **${r.capacityFeasible ? "yes" : "no"}**; minimum payouts funded: **${r.minimumPayoutsFunded ? "yes" : "no"}**; courier acceptance test: **${output.courierAcceptance ? "passes" : "fails"}**; dispatch-time gate: **${output.readiness.decision}**; decision: **${output.dispatch ? "DISPATCH" : "REJECT / CONSOLIDATE"}**.${waveSummary}\n- Minimum customer tariff at this parcel count: **${zar(Math.max(be.bindingTariff, output.readiness.minimumCustomerTariff))} per parcel**; minimum courier pool: **${zar(output.readiness.pool.totalCourierCostFloorZar + (output.scenario.disruption ? output.readiness.pool.totalCourierCostFloorZar * 0.1 : 0))}**; maximum viable vehicle capacity: **${output.readiness.maximumViableCapacity === Number.MAX_SAFE_INTEGER ? "not capped" : `${output.readiness.maximumViableCapacity} units`}**.\n- Break-even tariff at this parcel count: **${zar(be.bindingTariff)} per parcel** (courier cost floor ${zar(be.minimumTariffForCourierCosts)}, positive platform net ${zar(be.minimumTariffForPositivePlatformNet)}).\n- Readiness reasons: ${output.readiness.reasons.length ? output.readiness.reasons.join(" ") : "none"}; warnings: ${r.warnings.length ? r.warnings.join(" ") : "none"}\n\n### Relay legs\n\n${mdTable(legRows)}\n\n### Courier settlements\n\n${mdTable(courierRows)}`;
  }).join("\n\n");
  const report = `# Mzansi Couriers Relay Launch Simulation\n\nGenerated from the production shared-pool allocator and live road-route geometry. Customer prices, fuel, toll, backhaul, and payment-processing values are explicit scenario assumptions; route distances are resolved through the configured Maps directions proxy.\n\n> **Important accounting limitation:** “Mzansi estimated net contribution” means the 20% platform fee less modeled payment-processing costs only. It is not accounting profit: staff/support, insurance, tax, refunds/chargebacks, map/API charges, payout fees, marketing, fraud, vehicle recovery, and platform maintenance are excluded.\n\n## Executive simulation summary\n\n${mdTable(summaryRows)}\n\n${detailSections}\n\n## Features that are working correctly in the hardened model\n\n- The 20% platform allocation and 80% courier pool are conserved once across all relay legs.\n- Actual road-route geometry is resolved before the dispatch gate and the same route distances feed economics.\n- Verified vehicle capacity, parcel weight/volume, operating costs, reserves, courier net floors, tolls, handovers, deadhead, returns, and confirmed backhaul are included.\n- 50+ parcel requests are split into capacity-safe parallel waves; each wave receives its own economic decision.\n- The append-only parcel ledger records payment, platform allocation, courier pool, reserves, allocations, refunds, cancellations, replacement costs, payment/payout costs, and final contributions.\n\n## Model conclusions\n\n### Critical launch findings\n\n1. **Capacity is a hard constraint.** A single courier/leg cannot carry 50–100 parcels when verified capacity is 20; those scenarios correctly reject and must be dispatched as multiple waves or parallel legs.\n2. **Long-distance one-parcel routes are commercially fragile.** The 20% platform fee can remain positive while courier net is negative; platform-positive does not mean network-viable.\n3. **The 80% pool is conserved once across all couriers.** It is not paid 80% per courier.\n4. **Road distance improves allocation accuracy, but route geometry is a dispatch prerequisite.** Missing geometry is rejected rather than estimated.\n5. **Backhaul materially improves courier net only when it is real, confirmed work; it must not be treated as guaranteed revenue.**\n\n### Required safeguards before launch\n\n- Reject a route unless every leg has current road geometry, a verified vehicle-cost profile, and parcel/weight/volume capacity.\n- Reject or consolidate when any courier’s estimated net is below zero, below the configured minimum payout, or below a launch target such as R150 per accepted leg.\n- Require total courier pool >= max(total operating-cost floor, sum minimum payouts) plus a disruption reserve.\n- Treat cancellations, refunds, failed handovers, and replacement legs as append-only ledger events. Never pay or count reserved funds as profit; require an immutable event key for every adjustment.\n- Use multi-wave planning for parcel counts above a vehicle’s capacity; do not place 100 parcels on one relay leg.\n- Reprice or delay dispatch when tolls, deadhead, return distance, fuel price, or handover time moves any leg below its acceptance floor.\n\n### Minimum viable operating model\n\nStart with local and regional routes, 5–20 parcels per corridor, verified cars/vans, low deadhead, pre-approved handover points, and confirmed backhaul only. Offer long-distance JHB→Cape Town only at a tariff above the scenario break-even tariff and with 4–6 pre-accepted couriers plus a recovery courier.\n\n### Important technical gaps exposed\n\n- Dispatch-time route, capacity, reserve, and courier-net checks are now hard gates; keep route results auditable with the dispatch run.\n- Automated external payment-provider refund webhooks still need to call the append-only refund event path before automated payout is enabled.\n- Replacement-leg reserve creation is wired to courier-reported failed handovers; the final replacement-leg cost must be recorded before settlement approval.\n- Multi-wave planning is implemented as a readiness planner; production corridor execution still needs an operational wave/run record before live 50+ parcel dispatch.\n`;
  await writeFile("reports/relay-launch-simulation-report.md", report);
  await writeFile("reports/relay-launch-simulation-results.json", JSON.stringify(outputs.map((output) => ({ id: output.scenario.id, label: output.scenario.label, routes: output.routes, revenue: output.customerRevenue, result: output.result, readiness: output.readiness, wavePlan: output.wavePlan, courierAcceptance: output.courierAcceptance, dispatch: output.dispatch, breakEven: breakEven(output, output.scenario.parcels) })), null, 2));
  console.log(JSON.stringify({ scenarios: outputs.length, routePairs: routeCache.size, report: "reports/relay-launch-simulation-report.md", results: "reports/relay-launch-simulation-results.json", dispatches: outputs.filter((item) => item.dispatch).length, rejects: outputs.filter((item) => !item.dispatch).length }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
