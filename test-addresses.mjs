const API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api';

async function testAddresses() {
  console.log('🧪 Testing address search and distance calculation...\n');

  // Test 1: Geocode pickup address
  console.log('📍 Test 1: Geocoding pickup address...');
  const pickupAddress = '50 2nd Avenue Kleinmond Western Cape South Africa';
  const pickupRes = await fetch(
    `${BASE_URL}/geocode/json?address=${encodeURIComponent(pickupAddress)}&key=${API_KEY}`
  );
  const pickupData = await pickupRes.json();
  
  if (pickupData.results.length === 0) {
    console.log('❌ Pickup address not found');
    return;
  }
  
  const pickupCoords = pickupData.results[0].geometry.location;
  console.log(`✅ Pickup: ${pickupData.results[0].formatted_address}`);
  console.log(`   Coordinates: ${pickupCoords.lat}, ${pickupCoords.lng}\n`);

  // Test 2: Geocode dropoff address
  console.log('📍 Test 2: Geocoding dropoff address...');
  const dropoffAddress = '3 Church Street Ladybrand Free State South Africa';
  const dropoffRes = await fetch(
    `${BASE_URL}/geocode/json?address=${encodeURIComponent(dropoffAddress)}&key=${API_KEY}`
  );
  const dropoffData = await dropoffRes.json();
  
  if (dropoffData.results.length === 0) {
    console.log('❌ Dropoff address not found');
    return;
  }
  
  const dropoffCoords = dropoffData.results[0].geometry.location;
  console.log(`✅ Dropoff: ${dropoffData.results[0].formatted_address}`);
  console.log(`   Coordinates: ${dropoffCoords.lat}, ${dropoffCoords.lng}\n`);

  // Test 3: Calculate distance
  console.log('📍 Test 3: Calculating distance...');
  const distanceRes = await fetch(
    `${BASE_URL}/distancematrix/json?origins=${pickupCoords.lat},${pickupCoords.lng}&destinations=${dropoffCoords.lat},${dropoffCoords.lng}&key=${API_KEY}`
  );
  const distanceData = await distanceRes.json();
  
  if (distanceData.rows[0].elements[0].status === 'OK') {
    const distance = distanceData.rows[0].elements[0].distance.value / 1000; // Convert to km
    const duration = distanceData.rows[0].elements[0].duration.text;
    console.log(`✅ Distance: ${distance.toFixed(2)} km`);
    console.log(`✅ Duration: ${duration}\n`);

    // Test 4: Calculate price
    console.log('📍 Test 4: Calculating price...');
    const basePrice = 40; // R40 base
    const localRate = 10; // R10/km for < 100km
    const longDistance = 6; // R6/km for >= 100km
    const packageMultiplier = 1; // Small package

    let price = basePrice;
    if (distance < 100) {
      price += distance * localRate;
    } else {
      price += distance * longDistance;
    }
    price *= packageMultiplier;

    console.log(`✅ Base price: R${basePrice}`);
    console.log(`✅ Distance charge: R${(distance * (distance < 100 ? localRate : longDistance)).toFixed(2)}`);
    console.log(`✅ Total price: R${price.toFixed(2)}\n`);
  } else {
    console.log(`❌ Distance calculation failed: ${distanceData.rows[0].elements[0].status}`);
  }

  console.log('✅ All tests completed!');
}

testAddresses().catch(console.error);
