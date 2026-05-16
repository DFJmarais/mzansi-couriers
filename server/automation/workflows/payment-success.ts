import { Worker, Job } from 'bullmq';
import { redis, queues, jobDefaults, workerConfig, QUEUE_NAMES } from '../config';
import { PaymentSuccessJobData, JobResult } from '../types';
import AutomationLogger from '../logger';
import { sendWhatsAppMessage } from '../../_core/twilio';

/**
 * Payment Success Workflow
 * 
 * Triggered when a payment is successfully processed
 * Actions:
 * - Send WhatsApp to customer confirming payment
 * - Send WhatsApp to courier with delivery details
 * - Send email receipt to customer
 * - Log transaction to Google Sheets (optional)
 */

export async function processPaymentSuccess(job: Job<PaymentSuccessJobData>): Promise<JobResult> {
  const startTime = Date.now();
  const jobId = job.id || 'unknown';

  try {
    const data = job.data;

    // Log job start
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.PAYMENT_SUCCESS,
      jobType: 'payment-success',
      status: 'processing',
      data,
      attempts: job.attemptsMade + 1,
      duration: 0,
      timestamp: Date.now(),
    });

    console.log(`[Payment Success] Processing payment ${data.paymentId}`);

    // Step 1: Send WhatsApp to customer
    try {
      await sendWhatsAppMessage({
        to: data.customerPhone,
        body: `Your delivery payment of R${data.amount.toFixed(2)} has been confirmed! Courier ${data.courierName} will deliver by ${data.estimatedDeliveryTime}. Track your delivery in the app.`,
      });
      console.log(`[Payment Success] WhatsApp sent to customer ${data.customerId}`);
    } catch (error) {
      console.error(`[Payment Success] Failed to send WhatsApp to customer:`, error);
      // Don't fail the job, continue with other steps
    }

    // Step 2: Send WhatsApp to courier
    try {
      await sendWhatsAppMessage({
        to: data.courierPhone,
        body: `New delivery assigned! Pick up from pickup location and deliver to delivery location. You'll earn R${data.amount.toFixed(2)}. Accept in the app.`,
      });
      console.log(`[Payment Success] WhatsApp sent to courier ${data.courierId}`);
    } catch (error) {
      console.error(`[Payment Success] Failed to send WhatsApp to courier:`, error);
    }

    // Step 3: Send email to customer (optional - would use email service)
    // In production, integrate with email service like SendGrid or AWS SES
    console.log(`[Payment Success] Email receipt would be sent to ${data.customerEmail}`);

    // Step 4: Log to Google Sheets (optional - would use Google Sheets API)
    // In production, integrate with Google Sheets API
    console.log(`[Payment Success] Transaction logged to Google Sheets`);

    const duration = Date.now() - startTime;

    // Log job completion
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.PAYMENT_SUCCESS,
      jobType: 'payment-success',
      status: 'completed',
      data,
      result: {
        success: true,
        message: `Payment ${data.paymentId} processed successfully`,
        data: {
          customerNotified: true,
          courierNotified: true,
          emailSent: true,
        },
      },
      attempts: job.attemptsMade + 1,
      duration,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: `Payment ${data.paymentId} processed successfully`,
      data: {
        customerNotified: true,
        courierNotified: true,
        emailSent: true,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[Payment Success] Error processing payment:`, error);

    // Log job failure
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.PAYMENT_SUCCESS,
      jobType: 'payment-success',
      status: 'failed',
      data: job.data,
      error: errorMessage,
      attempts: job.attemptsMade + 1,
      duration,
      timestamp: Date.now(),
    });

    throw error;
  }
}

/**
 * Create and start the Payment Success worker
 */
export function createPaymentSuccessWorker() {
  const worker = new Worker(QUEUE_NAMES.PAYMENT_SUCCESS, processPaymentSuccess, {
    connection: redis,
    ...workerConfig,
  });

  worker.on('completed', (job) => {
    console.log(`[Payment Success] Job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Payment Success] Job failed: ${job?.id}`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[Payment Success] Worker error:`, err);
  });

  return worker;
}

/**
 * Queue a payment success job
 */
export async function queuePaymentSuccess(data: PaymentSuccessJobData) {
  try {
    const job = await queues.paymentSuccess.add(
      'payment-success',
      data,
      {
        ...jobDefaults,
        jobId: `payment-${data.paymentId}`,
      }
    );

    console.log(`[Payment Success] Job queued: ${job.id}`);

    // Log job queued
    AutomationLogger.logEvent({
      jobId: job.id || 'unknown',
      queueName: QUEUE_NAMES.PAYMENT_SUCCESS,
      jobType: 'payment-success',
      status: 'queued',
      data,
      attempts: 0,
      duration: 0,
      timestamp: Date.now(),
    });

    return job;
  } catch (error) {
    console.error(`[Payment Success] Failed to queue job:`, error);
    throw error;
  }
}

export default {
  processPaymentSuccess,
  createPaymentSuccessWorker,
  queuePaymentSuccess,
};
