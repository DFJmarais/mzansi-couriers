import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

/**
 * BullMQ Automation Engine Configuration
 * 
 * This module sets up the job queue infrastructure for all automation workflows:
 * - Payment Success notifications
 * - Delivery Status updates
 * - Courier Assignment alerts
 * - Daily Earnings summaries
 * - Support Ticket escalations
 * - Weekly Payout reports
 * 
 * IMPORTANT: All Redis/Queue initialization is LAZY - only happens when first accessed.
 * This prevents connection errors during server startup if Redis is unavailable.
 */

// Redis connection configuration
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err: any) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
};

// Lazy Redis connection - only create when needed
let redisInstance: Redis | null = null;

function getRedisInstance(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(redisConfig);
    redisInstance.on('error', (err) => {
      console.warn('[Automation] Redis connection error (non-blocking):', err.message);
    });
  }
  return redisInstance;
}

// Queue names
export const QUEUE_NAMES = {
  PAYMENT_SUCCESS: 'payment-success',
  DELIVERY_STATUS: 'delivery-status',
  COURIER_ASSIGNED: 'courier-assigned',
  DAILY_EARNINGS: 'daily-earnings',
  SUPPORT_TICKET: 'support-ticket',
  WEEKLY_PAYOUT: 'weekly-payout',
  AI_ROUTE_OPTIMIZATION: 'ai-route-optimization',
  AI_CUSTOMER_SUPPORT: 'ai-customer-support',
} as const;

// Lazy queue instances
let queuesInstance: Record<string, Queue> | null = null;

function getQueuesInstance(): Record<string, Queue> {
  if (!queuesInstance) {
    const redis = getRedisInstance();
    queuesInstance = {
      paymentSuccess: new Queue(QUEUE_NAMES.PAYMENT_SUCCESS, { connection: redis }),
      deliveryStatus: new Queue(QUEUE_NAMES.DELIVERY_STATUS, { connection: redis }),
      courierAssigned: new Queue(QUEUE_NAMES.COURIER_ASSIGNED, { connection: redis }),
      dailyEarnings: new Queue(QUEUE_NAMES.DAILY_EARNINGS, { connection: redis }),
      supportTicket: new Queue(QUEUE_NAMES.SUPPORT_TICKET, { connection: redis }),
      weeklyPayout: new Queue(QUEUE_NAMES.WEEKLY_PAYOUT, { connection: redis }),
      aiRouteOptimization: new Queue(QUEUE_NAMES.AI_ROUTE_OPTIMIZATION, { connection: redis }),
      aiCustomerSupport: new Queue(QUEUE_NAMES.AI_CUSTOMER_SUPPORT, { connection: redis }),
    };
  }
  return queuesInstance;
}

// Lazy queue events
let queueEventsInstance: Record<string, QueueEvents> | null = null;

function getQueueEventsInstance(): Record<string, QueueEvents> {
  if (!queueEventsInstance) {
    const redis = getRedisInstance();
    queueEventsInstance = Object.entries(QUEUE_NAMES).reduce((acc, [key, queueName]) => {
      acc[key as keyof typeof QUEUE_NAMES] = new QueueEvents(queueName, { connection: redis });
      return acc;
    }, {} as Record<keyof typeof QUEUE_NAMES, QueueEvents>);
  }
  return queueEventsInstance;
}

// Export as Proxy objects for backward compatibility
// These allow code to use: queues.paymentSuccess.add() instead of getQueues().paymentSuccess.add()
export const redis = new Proxy({} as any, {
  get: (target, prop) => {
    const instance = getRedisInstance();
    return (instance as any)[prop];
  },
});

export const queues = new Proxy({} as any, {
  get: (target, prop) => {
    const instance = getQueuesInstance();
    return (instance as any)[prop];
  },
});

export const queueEvents = new Proxy({} as any, {
  get: (target, prop) => {
    const instance = getQueueEventsInstance();
    return (instance as any)[prop];
  },
});

// Job configuration defaults
export const jobDefaults = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600, // Keep completed jobs for 1 hour
  },
  removeOnFail: {
    age: 86400, // Keep failed jobs for 24 hours
  },
};

// Worker configuration
export const workerConfig = {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
  lockDuration: 30000, // 30 seconds
  lockRenewTime: 15000, // 15 seconds
};

/**
 * Initialize all queues and event listeners
 */
export async function initializeQueues() {
  try {
    // Test Redis connection
    const redisInst = getRedisInstance();
    await redisInst.ping();
    console.log('[Automation] Redis connection established');

    // Set up event listeners for monitoring
    const events = getQueueEventsInstance();
    Object.entries(events).forEach(([key, eventEmitter]) => {
      eventEmitter.on('added', (job: any) => {
        console.log(`[Automation] Job added to ${key}: ${job.jobId}`);
      });

      eventEmitter.on('completed', (job: any) => {
        console.log(`[Automation] Job completed in ${key}: ${job.jobId}`);
      });

      eventEmitter.on('failed', (job: any, err: any) => {
        console.error(`[Automation] Job failed in ${key}: ${job.jobId}`, typeof err === 'string' ? err : (err as Error).message);
      });

      eventEmitter.on('error', (err: any) => {
        console.error(`[Automation] Queue error in ${key}:`, err);
      });
    });

    console.log('[Automation] Queue event listeners initialized');
  } catch (error) {
    console.error('[Automation] Failed to initialize queues:', error);
    throw error;
  }
}

/**
 * Clean up queue connections
 */
export async function closeQueues() {
  try {
    if (queueEventsInstance) {
      // Close all queue event listeners
      await Promise.all(Object.values(queueEventsInstance).map(events => events.close()));
    }

    if (queuesInstance) {
      // Close all queues
      await Promise.all(Object.values(queuesInstance).map(queue => queue.close()));
    }

    if (redisInstance) {
      // Close Redis connection
      await redisInstance.quit();
    }

    console.log('[Automation] All queues closed');
  } catch (error) {
    console.error('[Automation] Error closing queues:', error);
  }
}

export default {
  getRedisInstance,
  getQueuesInstance,
  getQueueEventsInstance,
  jobDefaults,
  workerConfig,
  initializeQueues,
  closeQueues,
};
