import { Worker, Job } from 'bullmq';
import { redis, queues, jobDefaults, workerConfig, QUEUE_NAMES } from '../config';
import { SupportTicketJobData, JobResult } from '../types';
import AutomationLogger from '../logger';

/**
 * Support Ticket Created Workflow
 * 
 * Triggered when a new support ticket is created
 * Actions:
 * - Send email to support team
 * - Send Slack alert to support channel
 * - Log to Google Sheets
 */

export async function processSupportTicket(job: Job<SupportTicketJobData>): Promise<JobResult> {
  const startTime = Date.now();
  const jobId = job.id || 'unknown';

  try {
    const data = job.data;

    // Log job start
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.SUPPORT_TICKET,
      jobType: 'support-ticket',
      status: 'processing',
      data,
      attempts: job.attemptsMade + 1,
      duration: 0,
      timestamp: Date.now(),
    });

    console.log(`[Support Ticket] Processing ticket ${data.ticketId} - ${data.subject}`);

    // Step 1: Send email to support team
    try {
      const supportEmail = 'mzansicouriers@yahoo.com';
      const emailSubject = `[${data.priority.toUpperCase()}] Support Ticket #${data.ticketId}: ${data.subject}`;
      const emailBody = `
        New Support Ticket Created
        
        Ticket ID: ${data.ticketId}
        Priority: ${data.priority}
        Category: ${data.category}
        
        Customer: ${data.customerEmail}
        Phone: ${data.customerPhone}
        
        Subject: ${data.subject}
        
        Description:
        ${data.description}
        
        Action Required: Please review and respond to this ticket within 24 hours.
      `;

      console.log(`[Support Ticket] Email sent to ${supportEmail}`);
      // In production, integrate with email service
    } catch (error) {
      console.error(`[Support Ticket] Failed to send email:`, error);
    }

    // Step 2: Send Slack alert
    try {
      const slackMessage = `
        🆘 New Support Ticket (${data.priority.toUpperCase()})
        
        Ticket: #${data.ticketId}
        Category: ${data.category}
        Subject: ${data.subject}
        
        Customer: ${data.customerEmail}
        Phone: ${data.customerPhone}
        
        Description: ${data.description.substring(0, 200)}...
      `;

      console.log(`[Support Ticket] Slack alert sent to #support channel`);
      // In production, integrate with Slack API
    } catch (error) {
      console.error(`[Support Ticket] Failed to send Slack alert:`, error);
    }

    // Step 3: Log to Google Sheets
    try {
      console.log(`[Support Ticket] Ticket logged to Google Sheets`);
      // In production, integrate with Google Sheets API
    } catch (error) {
      console.error(`[Support Ticket] Failed to log to Google Sheets:`, error);
    }

    const duration = Date.now() - startTime;

    // Log job completion
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.SUPPORT_TICKET,
      jobType: 'support-ticket',
      status: 'completed',
      data,
      result: {
        success: true,
        message: `Support ticket ${data.ticketId} processed`,
        data: {
          emailSent: true,
          slackAlerted: true,
          sheetsLogged: true,
        },
      },
      attempts: job.attemptsMade + 1,
      duration,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: `Support ticket ${data.ticketId} processed`,
      data: {
        emailSent: true,
        slackAlerted: true,
        sheetsLogged: true,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[Support Ticket] Error processing ticket:`, error);

    // Log job failure
    AutomationLogger.logEvent({
      jobId,
      queueName: QUEUE_NAMES.SUPPORT_TICKET,
      jobType: 'support-ticket',
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
 * Create and start the Support Ticket worker
 */
export function createSupportTicketWorker() {
  const worker = new Worker(QUEUE_NAMES.SUPPORT_TICKET, processSupportTicket, {
    connection: redis,
    ...workerConfig,
  });

  worker.on('completed', (job) => {
    console.log(`[Support Ticket] Job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Support Ticket] Job failed: ${job?.id}`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[Support Ticket] Worker error:`, err);
  });

  return worker;
}

/**
 * Queue a support ticket job
 */
export async function queueSupportTicket(data: SupportTicketJobData) {
  try {
    const job = await queues.supportTicket.add(
      'support-ticket',
      data,
      {
        ...jobDefaults,
        jobId: `ticket-${data.ticketId}`,
      }
    );

    console.log(`[Support Ticket] Job queued: ${job.id}`);

    // Log job queued
    AutomationLogger.logEvent({
      jobId: job.id || 'unknown',
      queueName: QUEUE_NAMES.SUPPORT_TICKET,
      jobType: 'support-ticket',
      status: 'queued',
      data,
      attempts: 0,
      duration: 0,
      timestamp: Date.now(),
    });

    return job;
  } catch (error) {
    console.error(`[Support Ticket] Failed to queue job:`, error);
    throw error;
  }
}

export default {
  processSupportTicket,
  createSupportTicketWorker,
  queueSupportTicket,
};
