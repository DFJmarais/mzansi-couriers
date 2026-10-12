import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const bookingDuration = new Trend('booking_duration');
const jobFeedDuration = new Trend('jobfeed_duration');
const pricingDuration = new Trend('pricing_duration');
const notificationDuration = new Trend('notification_duration');
const successfulBookings = new Counter('successful_bookings');
const successfulJobFetches = new Counter('successful_jobs');

// Load test configuration
export const options = {
  stages: [
    { duration: '2m', target: 5000 },    // Ramp up to 5k users over 2 minutes
    { duration: '5m', target: 10000 },   // Ramp up to 10k users over 5 minutes
    { duration: '5m', target: 15000 },   // Ramp up to 15k users over 5 minutes
    { duration: '5m', target: 20000 },   // Ramp up to 20k users over 5 minutes
    { duration: '10m', target: 20000 },  // Stay at 20k users for 10 minutes
    { duration: '5m', target: 0 },       // Ramp down to 0 users over 5 minutes
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.1'],
    'errors': ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3000/api/trpc';

export default function () {
  const userId = `user_${__VU}_${__ITER}`;
  
  // Test 1: Booking endpoint
  testBooking(userId);
  sleep(1);
  
  // Test 2: Job feed endpoint
  testJobFeed(userId);
  sleep(1);
  
  // Test 3: Pricing calculation
  testPricing(userId);
  sleep(1);
  
  // Test 4: Notification endpoint
  testNotifications(userId);
  sleep(2);
}

function testBooking(userId) {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'deliveries.createBooking',
    params: {
      pickupLat: -25.7461,
      pickupLng: 28.2313,
      dropoffLat: -25.7580,
      dropoffLng: 28.2413,
      packageSize: 'medium',
      weight: 5,
      description: 'Test package',
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId,
    },
  };

  const startTime = new Date();
  const res = http.post(`${BASE_URL}/deliveries.createBooking`, payload, params);
  const duration = new Date() - startTime;

  bookingDuration.add(duration);

  const success = check(res, {
    'booking status is 200': (r) => r.status === 200,
    'booking has delivery ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result?.data?.id > 0;
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successfulBookings.add(1);
  } else {
    errorRate.add(1);
  }
}

function testJobFeed(userId) {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'deliveries.getAvailableJobs',
    params: {
      lat: -25.7461,
      lng: 28.2313,
      radius: 10,
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId,
    },
  };

  const startTime = new Date();
  const res = http.post(`${BASE_URL}/deliveries.getAvailableJobs`, payload, params);
  const duration = new Date() - startTime;

  jobFeedDuration.add(duration);

  const success = check(res, {
    'job feed status is 200': (r) => r.status === 200,
    'job feed returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.result?.data);
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successfulJobFetches.add(1);
  } else {
    errorRate.add(1);
  }
}

function testPricing(userId) {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'pricing.calculatePrice',
    params: {
      distance: 10,
      packageSize: 'medium',
      weight: 5,
      zoneId: 1,
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId,
    },
  };

  const startTime = new Date();
  const res = http.post(`${BASE_URL}/pricing.calculatePrice`, payload, params);
  const duration = new Date() - startTime;

  pricingDuration.add(duration);

  check(res, {
    'pricing status is 200': (r) => r.status === 200,
    'pricing has amount': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result?.data?.amount > 0;
      } catch {
        return false;
      }
    },
  });
}

function testNotifications(userId) {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: 4,
    method: 'notifications.sendSMS',
    params: {
      phone: '+27123456789',
      message: 'Test notification',
      deliveryId: 1,
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId,
    },
  };

  const startTime = new Date();
  const res = http.post(`${BASE_URL}/notifications.sendSMS`, payload, params);
  const duration = new Date() - startTime;

  notificationDuration.add(duration);

  check(res, {
    'notification status is 200': (r) => r.status === 200,
  });
}
