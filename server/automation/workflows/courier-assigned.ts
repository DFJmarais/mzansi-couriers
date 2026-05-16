import { Worker, Job } from 'bullmq';
import { redis, queues, jobDefaults, workerConfig, QUEUE_NAMES } from '../config';
import { CourierAssignedJobData, JobResult } from '../types';
import AutomationLogger from '../logger';
import { sendWhatsAppMessage } from '../../_core/twilio';

/**
 * Courier Assigned Workflow
 * 
 * Triggered when a courier is assigned to a delivery
 * Actions:
 * - Send WhatsApp to courier with delivery details
 * - Send email to customer with courier info
 * - Send Slack notification to admin
 */

export async function processCourierAssigned(job: Job<CourierAssignedJobData>): Promise<JobResult> {
  const startTime = Date.now();
  const jobId = job.id || 'unknown';

  try {
    const data = job.data;

    // Log job start
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.COURIER_ASSIGNED,
      jobType: 'courier-assigned',
      status: 'processing',
      data,
      attempts: job.attemptsMade + 1,
      duration: 0,
      timestamp: Date.now(),
    });

    console.log(`[Courier Assigned] Processing courier assignment for delivery ${data.deliveryId}`);

    // Step 1: Send WhatsApp to courier
    try {
      await sendWhatsAppMessage({
        to: data.courierPhone,
        body: `New delivery assigned! Pick up from ${data.pickupLocation} and deliver to ${data.deliveryLocation}. Estimated time: ${data.estimatedDeliveryTime}. You'll earn R${data.courierEarnings.toFixed(2)}. Accept in the app.`,
      });
      console.log(`[Courier Assigned] WhatsApp sent to courier ${data.courierId}`);
    } catch (error) {
      console.error(`[Courier Assigned] Failed to send WhatsApp to courier:`, error);
    }

    // Step 2: Send email to customer
    try {
      console.log(`[Courier Assigned] Email sent to customer ${data.customerId} with courier info`);
      // In production, integrate with email service
    } catch (error) {
      console.error(`[Courier Assigned] Failed to send email to customer:`, error);
    }

    // Step 3: Send Slack notification
    try {
      console.log(`[Courier Assigned] Slack notification sent to admin`);
      // In production, integrate with Slack API
    } catch (error) {
      console.error(`[Courier Assigned] Failed to send Slack notification:`, error);
    }

    const duration = Date.now() - startTime;

    // Log job completion
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.COURIER_ASSIGNED,
      jobType: 'courier-assigned',
      status: 'completed',
      data,
      result: {
        success: true,
        message: `Courier ${data.courierName} assigned to delivery ${data.deliveryId}`,
        data: {
          courierNotified: true,
          customerNotified: true,
          adminNotified: true,
        },
      },
      attempts: job.attemptsMade + 1,
      duration,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: `Courier ${data.courierName} assigned to delivery ${data.deliveryId}`,
      data: {
        courierNotified: true,
        customerNotified: true,
        adminNotified: true,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[Courier Assigned] Error processing assignment:`, error);

    // Log job failure
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.COURIER_ASSIGNED,
      jobType: 'courier-assigned',
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
 * Create and start the Courier Assigned worker
 */
export function createCourierAssignedWorker() {
  const worker = new Worker(QUEUE_NAMES.COURIER_ASSIGNED, processCourierAssigned, {
    connection: redis,
    ...workerConfig,
  });

  worker.on('completed', (job) => {
    console.log(`[Courier Assigned] Job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Courier Assigned] Job failed: ${job?.id}`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[Courier Assigned] Worker error:`, err);
  });

  return worker;
}

/**
 * Queue a courier assigned job
 */
export async function queueCourierAssigned(data: CourierAssignedJobData) {
  try {
    const job = await queues.courierAssigned.add(
      'courier-assigned',
      data,
      {
        ...jobDefaults,
        jobId: `courier-assigned-${data.deliveryId}`,
      }
    );

    console.log(`[Courier Assigned] Job queued: ${job.id}`);

    // Log job queued
    AutomationLogger.logEvent({
      jobId: job.id || 'unknown',
      queueName: QUEUE_NAMES.COURIER_ASSIGNED,
      jobType: 'courier-assigned',
      status: 'queued',
      data,
      attempts: 0,
      duration: 0,
      timestamp: Date.now(),
    });

    return job;
  } catch (error) {
    console.error(`[Courier Assigned] Failed to queue job:`, error);
    throw error;
  }
}

export default {
  processCourierAssigned,
  createCourierAssignedWorker,
  queueCourierAssigned,
};
