import { calculateRelayPrice, formatPrice } from './server/services/relay-pricing.ts';

console.log('🧪 Testing Relay-Based Pricing System\n');

// Test 1: Kleinmond to Ladybrand (1,146 km)
console.log('📍 Test 1: Kleinmond → Ladybrand (1,146 km)');
const result1 = calculateRelayPrice({
  distanceKm: 1146.55,
  weight: 0.5,
  serviceLevel: 'economy',
});
console.log(`  Estimated legs: ${result1.estimatedLegs}`);
console.log(`  Pickup fee: ${formatPrice(result1.pickupFee)}`);
console.log(`  Legs cost: ${formatPrice(result1.legsCost)}`);
console.log(`  Weight cost: ${formatPrice(result1.weightCost)}`);
console.log(`  Subtotal: ${formatPrice(result1.subtotal)}`);
console.log(`  Service multiplier: ${result1.serviceMultiplier}x`);
console.log(`  Final price: ${formatPrice(result1.finalPrice)}\n`);

// Test 2: Short distance (50 km)
console.log('📍 Test 2: Short distance (50 km)');
const result2 = calculateRelayPrice({
  distanceKm: 50,
  weight: 2,
  serviceLevel: 'economy',
});
console.log(`  Final price: ${formatPrice(result2.finalPrice)}\n`);

// Test 3: Express service
console.log('📍 Test 3: Express service (1,146 km)');
const result3 = calculateRelayPrice({
  distanceKm: 1146.55,
  weight: 0.5,
  serviceLevel: 'express',
});
console.log(`  Final price: ${formatPrice(result3.finalPrice)}`);
console.log(`  Multiplier: ${result3.serviceMultiplier}x\n`);

// Test 4: With surcharges
console.log('📍 Test 4: With surcharges (fragile + insurance)');
const result4 = calculateRelayPrice({
  distanceKm: 100,
  weight: 5,
  serviceLevel: 'economy',
  isFragile: true,
  hasInsurance: true,
});
console.log(`  Surcharges: ${formatPrice(result4.surcharges)}`);
console.log(`  Final price: ${formatPrice(result4.finalPrice)}\n`);

console.log('✅ All tests completed!');
