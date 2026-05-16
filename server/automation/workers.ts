import { Worker } from 'bullmq';
import { createPaymentSuccessWorker } from './workflows/payment-success';
import { createDeliveryStatusWorker } from './workflows/delivery-status';
import { createCourierAssignedWorker } from './workflows/courier-assigned';
import { createDailyEarningsWorker } from './workflows/daily-earnings';
import { createSupportTicketWorker } from './workflows/support-ticket';
import { createWeeklyPayoutWorker } from './workflows/weekly-payout';

/**
 * Automation Workers Manager
 * 
 * Initializes and manages all BullMQ workers for automation workflows
 */

let workers: Worker[] = [];

/**
 * Initialize all automation workers
 */
export async function initializeWorkers() {
  try {
    console.log('[Automation] Initializing workers...');

    // Create all workers
    const paymentSuccessWorker = createPaymentSuccessWorker();
    const deliveryStatusWorker = createDeliveryStatusWorker();
    const courierAssignedWorker = createCourierAssignedWorker();
    const dailyEarningsWorker = createDailyEarningsWorker();
    const supportTicketWorker = createSupportTicketWorker();
    const weeklyPayoutWorker = createWeeklyPayoutWorker();

    // Store workers for later cleanup
    workers = [
      paymentSuccessWorker,
      deliveryStatusWorker,
      courierAssignedWorker,
      dailyEarningsWorker,
      supportTicketWorker,
      weeklyPayoutWorker,
    ];

    console.log('[Automation] ✅ All 6 workers initialized successfully');
    console.log('[Automation] Workers running:');
    console.log('  - Payment Success');
    console.log('  - Delivery Status Changed');
    console.log('  - Courier Assigned');
    console.log('  - Daily Earnings Summary');
    console.log('  - Support Ticket Created');
    console.log('  - Weekly Payout Report');

    return workers;
  } catch (error) {
    console.error('[Automation] Failed to initialize workers:', error);
    throw error;
  }
}

/**
 * Close all workers gracefully
 */
export async function closeWorkers() {
  try {
    console.log('[Automation] Closing all workers...');

    await Promise.all(workers.map(worker => worker.close()));

    console.log('[Automation] ✅ All workers closed');
  } catch (error) {
    console.error('[Automation] Error closing workers:', error);
  }
}

/**
 * Get all active workers
 */
export function getWorkers(): Worker[] {
  return workers;
}

/**
 * Get worker count
 */
export function getWorkerCount(): number {
  return workers.length;
}

export default {
  initializeWorkers,
  closeWorkers,
  getWorkers,
  getWorkerCount,
};
