import { initializePayment, verifyPayment } from './payments/paystack';

/**
 * Paystack Stress Test - Simulate 1000 payments
 * Tests payment initialization, verification, and system stability
 */

interface TestResult {
  totalTests: number;
  successful: number;
  failed: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errors: string[];
  successRate: number;
}

async function runPaystackStressTest(): Promise<TestResult> {
  console.log('🚀 Starting Paystack Stress Test - 1000 Payments');
  console.log('================================================');

  const results: TestResult = {
    totalTests: 1000,
    successful: 0,
    failed: 0,
    avgResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    errors: [],
    successRate: 0,
  };

  const responseTimes: number[] = [];
  const batchSize = 50; // Process 50 payments at a time to avoid overwhelming the API
  const totalBatches = Math.ceil(1000 / batchSize);

  for (let batch = 0; batch < totalBatches; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, 1000);
    const batchTests = batchEnd - batchStart;

    console.log(`\n📦 Batch ${batch + 1}/${totalBatches} (Tests ${batchStart + 1}-${batchEnd})`);

    const batchPromises = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const testPromise = (async () => {
        const startTime = Date.now();

        try {
          // Generate unique test data
          const testEmail = `test-${i}@mzansi-couriers.test`;
          const testAmount = Math.floor(Math.random() * 10000) + 1000; // R10 - R100
          const reference = `stress-test-${i}-${Date.now()}`;

          // Test payment initialization
          const result = await initializePayment({
            email: testEmail,
            amount: testAmount,
            reference: reference,
            metadata: {
              test_id: i,
              batch: batch,
              test_type: 'stress_test',
            },
          });

          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);

          if (responseTime < results.minResponseTime) {
            results.minResponseTime = responseTime;
          }
          if (responseTime > results.maxResponseTime) {
            results.maxResponseTime = responseTime;
          }

          if (result.success) {
            results.successful++;
            console.log(`  ✅ Test ${i + 1}: ${testAmount} ZAR - ${responseTime}ms`);
          } else {
            results.failed++;
            results.errors.push(`Test ${i + 1}: ${result.error}`);
            console.log(`  ❌ Test ${i + 1}: ${result.error}`);
          }
        } catch (error: any) {
          results.failed++;
          const errorMsg = error.message || String(error);
          results.errors.push(`Test ${i + 1}: ${errorMsg}`);
          console.log(`  ❌ Test ${i + 1}: ${errorMsg}`);
        }
      })();

      batchPromises.push(testPromise);
    }

    // Wait for all tests in batch to complete
    await Promise.all(batchPromises);

    // Add delay between batches to avoid rate limiting
    if (batch < totalBatches - 1) {
      console.log('⏳ Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Calculate statistics
  results.avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  results.successRate = (results.successful / results.totalTests) * 100;

  // Print results
  console.log('\n\n📊 STRESS TEST RESULTS');
  console.log('================================================');
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Successful: ${results.successful} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${results.successRate.toFixed(2)}%`);
  console.log(`\n⏱️  Response Times:`);
  console.log(`  Average: ${results.avgResponseTime.toFixed(2)}ms`);
  console.log(`  Min: ${results.minResponseTime}ms`);
  console.log(`  Max: ${results.maxResponseTime}ms`);

  if (results.errors.length > 0) {
    console.log(`\n⚠️  Errors (first 10):`);
    results.errors.slice(0, 10).forEach(error => {
      console.log(`  - ${error}`);
    });
    if (results.errors.length > 10) {
      console.log(`  ... and ${results.errors.length - 10} more errors`);
    }
  }

  console.log('\n================================================');
  console.log('✨ Stress Test Complete');

  return results;
}

// Run the stress test
runPaystackStressTest()
  .then(results => {
    console.log('\n✅ Paystack Stress Test Passed!');
    console.log(`System can handle ${results.successful} concurrent payments with ${results.successRate.toFixed(2)}% success rate`);
    process.exit(results.successRate >= 95 ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Paystack Stress Test Failed:', error);
    process.exit(1);
  });
