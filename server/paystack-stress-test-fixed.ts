import { initializePayment } from './payments/paystack';

/**
 * Paystack Stress Test - Fixed Version
 * Simulate 1000 payments with valid email format
 */

interface TestResult {
  totalTests: number;
  successful: number;
  failed: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errors: Map<string, number>;
  successRate: number;
}

async function runPaystackStressTest(): Promise<TestResult> {
  console.log('🚀 Starting Paystack Stress Test - 1000 Payments (Fixed)');
  console.log('================================================');

  const results: TestResult = {
    totalTests: 1000,
    successful: 0,
    failed: 0,
    avgResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    errors: new Map(),
    successRate: 0,
  };

  const responseTimes: number[] = [];
  const batchSize = 50;
  const totalBatches = Math.ceil(1000 / batchSize);

  for (let batch = 0; batch < totalBatches; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, 1000);

    console.log(`\n📦 Batch ${batch + 1}/${totalBatches} (Tests ${batchStart + 1}-${batchEnd})`);

    const batchPromises = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const testPromise = (async () => {
        const startTime = Date.now();

        try {
          // Use valid email format
          const testEmail = `customer${i}@mzansi.test`;
          const testAmount = 5000 + (i % 50000); // R50 - R500
          const reference = `test-${i}-${Date.now()}`;

          const result = await initializePayment({
            email: testEmail,
            amount: testAmount,
            reference: reference,
            metadata: {
              test_id: i,
              batch: batch,
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
            if (i % 100 === 0) {
              console.log(`  ✅ Test ${i + 1}: R${(testAmount / 100).toFixed(2)} - ${responseTime}ms`);
            }
          } else {
            results.failed++;
            const errorMsg = result.error || 'Unknown error';
            results.errors.set(errorMsg, (results.errors.get(errorMsg) || 0) + 1);
          }
        } catch (error: any) {
          results.failed++;
          const errorMsg = error.message || String(error);
          results.errors.set(errorMsg, (results.errors.get(errorMsg) || 0) + 1);
        }
      })();

      batchPromises.push(testPromise);
    }

    await Promise.all(batchPromises);

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
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${results.successRate.toFixed(2)}%`);
  console.log(`\n⏱️  Response Times:`);
  console.log(`  Average: ${results.avgResponseTime.toFixed(2)}ms`);
  console.log(`  Min: ${results.minResponseTime === Infinity ? 'N/A' : results.minResponseTime + 'ms'}`);
  console.log(`  Max: ${results.maxResponseTime}ms`);

  if (results.errors.size > 0) {
    console.log(`\n⚠️  Error Summary:`);
    results.errors.forEach((count, error) => {
      console.log(`  - ${error}: ${count} occurrences`);
    });
  }

  console.log('\n================================================');
  
  if (results.successRate >= 90) {
    console.log('✅ Paystack Integration: WORKING PERFECTLY');
    console.log(`Your Paystack keys are valid and system can handle high load!`);
  } else if (results.successRate >= 70) {
    console.log('⚠️  Paystack Integration: MOSTLY WORKING');
    console.log(`Some issues detected but system is functional`);
  } else {
    console.log('❌ Paystack Integration: ISSUES DETECTED');
    console.log(`Please verify your Paystack keys and configuration`);
  }

  return results;
}

// Run the stress test
runPaystackStressTest()
  .then(results => {
    process.exit(results.successRate >= 90 ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Stress Test Error:', error);
    process.exit(1);
  });
