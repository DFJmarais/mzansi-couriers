/**
 * Load Test: 20,000 Concurrent Users
 * Tests Mzansi Couriers platform under extreme load
 * Simulates realistic user behavior patterns
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const bookingDuration = new Trend("booking_duration");
const jobFeedDuration = new Trend("job_feed_duration");
const trackingDuration = new Trend("tracking_duration");
const paymentDuration = new Trend("payment_duration");
const totalRequests = new Counter("total_requests");
const activeUsers = new Gauge("active_users");

// Configuration
const BASE_URL = "http://localhost:3000";
const API_URL = `${BASE_URL}/api/trpc`;

export const options = {
  stages: [
    // Ramp up to 5,000 users over 5 minutes
    { duration: "5m", target: 5000, name: "Ramp up 5K" },
    // Stay at 5,000 for 2 minutes
    { duration: "2m", target: 5000, name: "Stay 5K" },
    // Ramp up to 10,000 users over 5 minutes
    { duration: "5m", target: 10000, name: "Ramp up 10K" },
    // Stay at 10,000 for 2 minutes
    { duration: "2m", target: 10000, name: "Stay 10K" },
    // Ramp up to 20,000 users over 5 minutes
    { duration: "5m", target: 20000, name: "Ramp up 20K" },
    // Stay at 20,000 for 5 minutes (peak load)
    { duration: "5m", target: 20000, name: "Peak 20K" },
    // Ramp down to 0 over 5 minutes
    { duration: "5m", target: 0, name: "Ramp down" },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.1"],
    errors: ["rate<0.05"],
  },
};

// Simulate customer booking flow
function customerBookingFlow() {
  group("Customer Booking Flow", () => {
    // Get price estimate
    const estimateRes = http.post(
      `${API_URL}/deliveries.getPriceEstimate`,
      JSON.stringify({
        json: {
          distance: Math.random() * 50 + 5, // 5-55 km
          packageSize: ["small", "medium", "large"][
            Math.floor(Math.random() * 3)
          ],
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    check(estimateRes, {
      "estimate status is 200": (r) => r.status === 200,
      "estimate has price": (r) => r.body.includes("price"),
    }) || errorRate.add(1);

    bookingDuration.add(estimateRes.timings.duration);
    totalRequests.add(1);
    sleep(1);

    // Create booking
    const bookingRes = http.post(
      `${API_URL}/deliveries.createDelivery`,
      JSON.stringify({
        json: {
          pickupAddress: "123 Main St, Johannesburg",
          deliveryAddress: "456 Park Ave, Johannesburg",
          packageSize: "medium",
          description: "Test package",
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    check(bookingRes, {
      "booking status is 200": (r) => r.status === 200,
      "booking has ID": (r) => r.body.includes("id"),
    }) || errorRate.add(1);

    bookingDuration.add(bookingRes.timings.duration);
    totalRequests.add(1);
    sleep(1);
  });
}

// Simulate courier job feed
function courierJobFeedFlow() {
  group("Courier Job Feed Flow", () => {
    const jobFeedRes = http.post(
      `${API_URL}/couriers.getAvailableJobs`,
      JSON.stringify({
        json: {
          area: "Johannesburg",
          limit: 10,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    check(jobFeedRes, {
      "job feed status is 200": (r) => r.status === 200,
      "job feed has jobs": (r) => r.body.includes("jobs"),
    }) || errorRate.add(1);

    jobFeedDuration.add(jobFeedRes.timings.duration);
    totalRequests.add(1);
    sleep(1);
  });
}

// Simulate delivery tracking
function deliveryTrackingFlow() {
  group("Delivery Tracking Flow", () => {
    const trackingRes = http.post(
      `${API_URL}/deliveries.getDeliveryStatus`,
      JSON.stringify({
        json: {
          deliveryId: "test-delivery-" + Math.random().toString(36).substr(2, 9),
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    check(trackingRes, {
      "tracking status is 200": (r) => r.status === 200 || r.status === 404,
    }) || errorRate.add(1);

    trackingDuration.add(trackingRes.timings.duration);
    totalRequests.add(1);
    sleep(1);
  });
}

// Simulate payment processing
function paymentFlow() {
  group("Payment Processing Flow", () => {
    const paymentRes = http.post(
      `${API_URL}/payments.initiatePayment`,
      JSON.stringify({
        json: {
          amount: Math.random() * 500 + 50, // R50-R550
          currency: "ZAR",
          type: "delivery",
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    check(paymentRes, {
      "payment status is 200": (r) => r.status === 200,
      "payment has reference": (r) => r.body.includes("reference"),
    }) || errorRate.add(1);

    paymentDuration.add(paymentRes.timings.duration);
    totalRequests.add(1);
    sleep(1);
  });
}

// Main test function
export default function () {
  activeUsers.add(__VU);

  // Distribute user behavior
  const userType = Math.random();

  if (userType < 0.4) {
    // 40% customers booking deliveries
    customerBookingFlow();
  } else if (userType < 0.7) {
    // 30% couriers checking jobs
    courierJobFeedFlow();
  } else if (userType < 0.85) {
    // 15% customers tracking deliveries
    deliveryTrackingFlow();
  } else {
    // 15% processing payments
    paymentFlow();
  }

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

// Teardown
export function teardown(data) {
  console.log("Load test completed");
  console.log(`Total requests: ${totalRequests.value}`);
  console.log(`Error rate: ${(errorRate.value * 100).toFixed(2)}%`);
}
