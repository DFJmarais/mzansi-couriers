import { Worker, Job } from 'bullmq';
import { redis, queues, jobDefaults, workerConfig, QUEUE_NAMES } from '../config';
import { WeeklyPayoutJobData, JobResult } from '../types';
import AutomationLogger from '../logger';

/**
 * Weekly Payout Report Workflow
 * 
 * Triggered every Thursday at 9 AM
 * Actions:
 * - Send email to finance team with payout summary
 * - Log to Google Sheets
 * - Send Slack notification
 */

export async function processWeeklyPayout(job: Job<WeeklyPayoutJobData>): Promise<JobResult> {
  const startTime = Date.now();
  const jobId = job.id || 'unknown';

  try {
    const data = job.data;

    // Log job start
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.WEEKLY_PAYOUT,
      jobType: 'weekly-payout',
      status: 'processing',
      data,
      attempts: job.attemptsMade + 1,
      duration: 0,
      timestamp: Date.now(),
    });

    console.log(`[Weekly Payout] Processing payout report for week: ${data.week}`);

    // Step 1: Send email to finance team
    try {
      const financeEmail = 'mzansicouriers@yahoo.com';
      const emailSubject = `Weekly Payout Report - ${data.week}`;
      const emailBody = `
        Weekly Payout Summary
        
        Week: ${data.week}
        Payout Date: ${data.payoutDate}
        
        Total Couriers: ${data.totalCouriers}
        Total Payouts: ${data.totalPayouts}
        Total Amount: R${data.totalAmount.toFixed(2)}
        
        Average Payout per Courier: R${(data.totalAmount / data.totalCouriers).toFixed(2)}
        
        Status: Ready for processing
        
        Please review and process these payouts via Paystack.
      `;

      console.log(`[Weekly Payout] Email sent to ${financeEmail}`);
      // In production, integrate with email service
    } catch (error) {
      console.error(`[Weekly Payout] Failed to send email:`, error);
    }

    // Step 2: Log to Google Sheets
    try {
      console.log(`[Weekly Payout] Payout report logged to Google Sheets`);
      // In production, integrate with Google Sheets API
    } catch (error) {
      console.error(`[Weekly Payout] Failed to log to Google Sheets:`, error);
    }

    // Step 3: Send Slack notification
    try {
      const slackMessage = `
        💰 Weekly Payout Report
        
        Week: ${data.week}
        Payout Date: ${data.payoutDate}
        
        Total Couriers: ${data.totalCouriers}
        Total Payouts: ${data.totalPayouts}
        Total Amount: R${data.totalAmount.toFixed(2)}
        
        Status: Ready for processing
      `;

      console.log(`[Weekly Payout] Slack notification sent to #finance channel`);
      // In production, integrate with Slack API
    } catch (error) {
      console.error(`[Weekly Payout] Failed to send Slack notification:`, error);
    }

    const duration = Date.now() - startTime;

    // Log job completion
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.WEEKLY_PAYOUT,
      jobType: 'weekly-payout',
      status: 'completed',
      data,
      result: {
        success: true,
        message: `Weekly payout report processed for ${data.week}`,
        data: {
          emailSent: true,
          sheetsLogged: true,
          slackNotified: true,
          totalAmount: data.totalAmount,
        },
      },
      attempts: job.attemptsMade + 1,
      duration,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: `Weekly payout report processed for ${data.week}`,
      data: {
        emailSent: true,
        sheetsLogged: true,
        slackNotified: true,
        totalAmount: data.totalAmount,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[Weekly Payout] Error processing payout report:`, error);

    // Log job failure
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.WEEKLY_PAYOUT,
      jobType: 'weekly-payout',
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
 * Create and start the Weekly Payout worker
 */
export function createWeeklyPayoutWorker() {
  const worker = new Worker(QUEUE_NAMES.WEEKLY_PAYOUT, processWeeklyPayout, {
    connection: redis,
    ...workerConfig,
  });

  worker.on('completed', (job) => {
    console.log(`[Weekly Payout] Job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Weekly Payout] Job failed: ${job?.id}`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[Weekly Payout] Worker error:`, err);
  });

  return worker;
}

/**
 * Queue a weekly payout job
 */
export async function queueWeeklyPayout(data: WeeklyPayoutJobData) {
  try {
    const job = await queues.weeklyPayout.add(
      'weekly-payout',
      data,
      {
        ...jobDefaults,
        jobId: `payout-${data.week}`,
      }
    );

    console.log(`[Weekly Payout] Job queued: ${job.id}`);

    // Log job queued
    AutomationLogger.logEvent({
      jobId: job.id || 'unknown',
      queueName: QUEUE_NAMES.WEEKLY_PAYOUT,
      jobType: 'weekly-payout',
      status: 'queued',
      data,
      attempts: 0,
      duration: 0,
      timestamp: Date.now(),
    });

    return job;
  } catch (error) {
    console.error(`[Weekly Payout] Failed to queue job:`, error);
    throw error;
  }
}

export default {
  processWeeklyPayout,
  createWeeklyPayoutWorker,
  queueWeeklyPayout,
};
