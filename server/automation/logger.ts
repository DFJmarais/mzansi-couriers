import { AutomationEvent } from './types';

/**
 * Automation Logging System
 * 
 * Tracks all automation events for monitoring, debugging, and analytics
 */

// In-memory event log (in production, use a database)
const eventLog: AutomationEvent[] = [];
const MAX_LOG_SIZE = 10000;

export class AutomationLogger {
  /**
   * Log an automation event
   */
  static logEvent(event: AutomationEvent): void {
    eventLog.push(event);

    // Keep log size manageable
    if (eventLog.length > MAX_LOG_SIZE) {
      eventLog.splice(0, eventLog.length - MAX_LOG_SIZE);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logLevel = event.status === 'failed' ? 'error' : 'info';
      console[logLevel as 'error' | 'info'](
        `[Automation] ${event.status.toUpperCase()} - ${event.queueName}:${event.jobType} (${event.jobId})`,
        event.data
      );
    }
  }

  /**
   * Get all events for a specific queue
   */
  static getQueueEvents(queueName: string): AutomationEvent[] {
    return eventLog.filter(e => e.queueName === queueName);
  }

  /**
   * Get all failed events
   */
  static getFailedEvents(): AutomationEvent[] {
    return eventLog.filter(e => e.status === 'failed');
  }

  /**
   * Get events by status
   */
  static getEventsByStatus(status: AutomationEvent['status']): AutomationEvent[] {
    return eventLog.filter(e => e.status === status);
  }

  /**
   * Get event statistics
   */
  static getStats() {
    const stats = {
      total: eventLog.length,
      queued: eventLog.filter(e => e.status === 'queued').length,
      processing: eventLog.filter(e => e.status === 'processing').length,
      completed: eventLog.filter(e => e.status === 'completed').length,
      failed: eventLog.filter(e => e.status === 'failed').length,
      retried: eventLog.filter(e => e.status === 'retried').length,
      avgDuration: eventLog.length > 0 ? eventLog.reduce((sum, e) => sum + e.duration, 0) / eventLog.length : 0,
      successRate: eventLog.length > 0 ? (eventLog.filter(e => e.status === 'completed').length / eventLog.length) * 100 : 0,
    };

    return stats;
  }

  /**
   * Get recent events
   */
  static getRecentEvents(limit: number = 100): AutomationEvent[] {
    return eventLog.slice(-limit);
  }

  /**
   * Clear all events (use with caution)
   */
  static clearEvents(): void {
    eventLog.length = 0;
    console.log('[Automation] Event log cleared');
  }

  /**
   * Export events as JSON
   */
  static exportEvents(): string {
    return JSON.stringify(eventLog, null, 2);
  }
}

export default AutomationLogger;
