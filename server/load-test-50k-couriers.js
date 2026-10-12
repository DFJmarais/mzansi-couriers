/**
 * Load Test: 50,000 Couriers
 * Tests system performance with massive scale
 */

/**
 * Generate mock couriers
 */
function generateCouriers(count) {
  const couriers = [];
  
  for (let i = 1; i <= count; i++) {
    couriers.push({
      id: i,
      name: `Courier ${i}`,
      email: `courier${i}@mzansi.com`,
      phone: `+27${String(i).padStart(9, '0')}`,
      rating: Math.random() * 5,
      responseTime: Math.random() * 300,
      completionRate: 0.7 + Math.random() * 0.3,
      lat: -25.7461 + (Math.random() - 0.5) * 10,
      lng: 28.2310 + (Math.random() - 0.5) * 10,
      capacity: 50 + Math.random() * 100,
      currentLoad: Math.random() * 50,
      status: Math.random() > 0.2 ? 'active' : 'inactive',
    });
  }
  
  return couriers;
}

/**
 * Generate mock parcels
 */
function generateParcels(count) {
  const parcels = [];
  
  for (let i = 1; i <= count; i++) {
    parcels.push({
      id: i,
      pickupLat: -25.7461 + (Math.random() - 0.5) * 10,
      pickupLng: 28.2310 + (Math.random() - 0.5) * 10,
      deliveryLat: -25.7461 + (Math.random() - 0.5) * 10,
      deliveryLng: 28.2310 + (Math.random() - 0.5) * 10,
      weight: 0.5 + Math.random() * 50,
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      customerId: Math.floor(Math.random() * 10000),
    });
  }
  
  return parcels;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate courier score
 */
function calculateCourierScore(courier, parcel) {
  // Skip inactive couriers
  if (courier.status !== 'active') return 0;

  // Skip if over capacity
  if (courier.currentLoad + parcel.weight > courier.capacity) return 0;

  const distance = calculateDistance(
    courier.lat,
    courier.lng,
    parcel.pickupLat,
    parcel.pickupLng
  );

  // Distance score (closer is better)
  const distanceScore = Math.max(0, 100 - distance * 2);

  // Rating score (0.30 weight)
  const ratingScore = (courier.rating / 5) * 100;

  // Response time score (0.25 weight)
  const responseScore = Math.max(0, 100 - courier.responseTime / 3);

  // Completion rate score (0.20 weight)
  const completionScore = courier.completionRate * 100;

  // Proximity score (0.15 weight)
  const proximityScore = Math.max(0, 100 - distance * 5);

  // Availability score (0.10 weight)
  const availabilityScore = ((courier.capacity - courier.currentLoad) / courier.capacity) * 100;

  // Weighted score
  const score =
    ratingScore * 0.3 +
    responseScore * 0.25 +
    completionScore * 0.2 +
    proximityScore * 0.15 +
    availabilityScore * 0.1 +
    distanceScore * 0.05;

  return score;
}

/**
 * Find best courier for parcel
 */
function findBestCourier(parcel, couriers) {
  let bestScore = 0;
  let bestCourier = null;
  let bestDistance = 0;

  for (const courier of couriers) {
    const score = calculateCourierScore(courier, parcel);
    if (score > bestScore) {
      bestScore = score;
      bestCourier = courier;
      bestDistance = calculateDistance(
        courier.lat,
        courier.lng,
        parcel.pickupLat,
        parcel.pickupLng
      );
    }
  }

  if (!bestCourier) return null;

  return {
    parcelId: parcel.id,
    courierId: bestCourier.id,
    score: bestScore,
    distance: bestDistance,
    estimatedTime: bestDistance * 2 + Math.random() * 30,
  };
}

/**
 * Calculate leaderboard rankings
 */
function calculateLeaderboards(couriers) {
  const leaderboards = new Map();

  // Rating leaderboard
  leaderboards.set(
    'rating',
    [...couriers].sort((a, b) => b.rating - a.rating).slice(0, 100)
  );

  // Response time leaderboard
  leaderboards.set(
    'responseTime',
    [...couriers].sort((a, b) => a.responseTime - b.responseTime).slice(0, 100)
  );

  // Completion rate leaderboard
  leaderboards.set(
    'completionRate',
    [...couriers].sort((a, b) => b.completionRate - a.completionRate).slice(0, 100)
  );

  return leaderboards;
}

/**
 * Run load test
 */
async function runLoadTest() {
  console.log('🚀 Starting 50,000 Courier Load Test...\n');

  // Test 1: Generate 50,000 couriers
  console.log('📊 Test 1: Generating 50,000 couriers...');
  let startTime = Date.now();
  const couriers = generateCouriers(50000);
  let duration = Date.now() - startTime;
  console.log(`✅ Generated 50,000 couriers in ${duration}ms`);
  const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  console.log(`   Memory: ${memUsage}MB\n`);

  // Test 2: Generate 10,000 parcels
  console.log('📦 Test 2: Generating 10,000 parcels...');
  startTime = Date.now();
  const parcels = generateParcels(10000);
  duration = Date.now() - startTime;
  console.log(`✅ Generated 10,000 parcels in ${duration}ms`);
  console.log(`   Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\n`);

  // Test 3: Match 10,000 parcels to couriers
  console.log('🎯 Test 3: Matching 10,000 parcels to best couriers...');
  startTime = Date.now();
  const matches = [];
  for (const parcel of parcels) {
    const match = findBestCourier(parcel, couriers);
    if (match) matches.push(match);
  }
  duration = Date.now() - startTime;
  console.log(`✅ Matched ${matches.length} parcels in ${duration}ms`);
  console.log(`   Average: ${(duration / matches.length).toFixed(3)}ms per parcel`);
  console.log(`   Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\n`);

  // Test 4: Calculate leaderboards
  console.log('🏆 Test 4: Calculating leaderboards for 50,000 couriers...');
  startTime = Date.now();
  const leaderboards = calculateLeaderboards(couriers);
  duration = Date.now() - startTime;
  console.log(`✅ Calculated leaderboards in ${duration}ms`);
  console.log(`   Leaderboards: ${leaderboards.size}`);
  console.log(`   Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\n`);

  // Test 5: Batch matching (1000 parcels at once)
  console.log('⚡ Test 5: Batch matching 1,000 parcels...');
  startTime = Date.now();
  const batchParcels = generateParcels(1000);
  const batchMatches = [];
  for (const parcel of batchParcels) {
    const match = findBestCourier(parcel, couriers);
    if (match) batchMatches.push(match);
  }
  duration = Date.now() - startTime;
  console.log(`✅ Batch matched 1,000 parcels in ${duration}ms`);
  console.log(`   Average: ${(duration / batchMatches.length).toFixed(3)}ms per parcel`);
  console.log(`   Throughput: ${(batchMatches.length / (duration / 1000)).toFixed(0)} parcels/sec\n`);

  // Test 6: Filter active couriers
  console.log('🔍 Test 6: Filtering active couriers...');
  startTime = Date.now();
  const activeCouriers = couriers.filter((c) => c.status === 'active');
  duration = Date.now() - startTime;
  console.log(`✅ Filtered ${activeCouriers.length} active couriers in ${duration}ms`);
  console.log(`   Active rate: ${((activeCouriers.length / couriers.length) * 100).toFixed(1)}%\n`);

  // Test 7: Calculate statistics
  console.log('📈 Test 7: Calculating courier statistics...');
  startTime = Date.now();
  const stats = {
    totalCouriers: couriers.length,
    activeCouriers: activeCouriers.length,
    avgRating: couriers.reduce((sum, c) => sum + c.rating, 0) / couriers.length,
    avgResponseTime: couriers.reduce((sum, c) => sum + c.responseTime, 0) / couriers.length,
    avgCompletionRate: couriers.reduce((sum, c) => sum + c.completionRate, 0) / couriers.length,
    totalCapacity: couriers.reduce((sum, c) => sum + c.capacity, 0),
    totalLoad: couriers.reduce((sum, c) => sum + c.currentLoad, 0),
  };
  duration = Date.now() - startTime;
  console.log(`✅ Calculated statistics in ${duration}ms`);
  console.log(`   Total Couriers: ${stats.totalCouriers}`);
  console.log(`   Active Couriers: ${stats.activeCouriers}`);
  console.log(`   Avg Rating: ${stats.avgRating.toFixed(2)}/5`);
  console.log(`   Avg Response Time: ${stats.avgResponseTime.toFixed(0)}s`);
  console.log(`   Avg Completion Rate: ${(stats.avgCompletionRate * 100).toFixed(1)}%`);
  console.log(`   Total Capacity: ${stats.totalCapacity.toFixed(0)}kg`);
  console.log(`   Total Load: ${stats.totalLoad.toFixed(0)}kg\n`);

  // Summary
  console.log('='.repeat(60));
  console.log('✅ LOAD TEST COMPLETE - 50,000 COURIERS');
  console.log('='.repeat(60));
  console.log(`Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Peak Memory: ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Matched Parcels: ${matches.length}`);
  console.log(`Success Rate: ${((matches.length / parcels.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');
}

// Run the test
runLoadTest().catch(console.error);
