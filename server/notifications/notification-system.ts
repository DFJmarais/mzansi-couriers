/**
 * Real-time Notifications System
 * 
 * Manages notifications across multiple channels (push, in-app, email, SMS)
 */

export type NotificationType =
  | 'delivery-assigned'
  | 'delivery-picked-up'
  | 'delivery-in-transit'
  | 'delivery-completed'
  | 'payment-received'
  | 'payment-failed'
  | 'earnings-summary'
  | 'promotion'
  | 'system-alert'
  | 'support-response'
  | 'referral-bonus'
  | 'loyalty-reward';

export type NotificationChannel = 'push' | 'in-app' | 'email' | 'sms';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface NotificationPreferences {
  userId: string;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  notificationTypes: Record<NotificationType, boolean>;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
  language: string;
  timezone: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  status: NotificationStatus;
  createdAt: number;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  expiresAt: number;
}

export interface NotificationLog {
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: number;
  deliveredAt?: number;
  failureReason?: string;
  timestamp: number;
}

/**
 * Default notification preferences
 */
export const DEFAULT_PREFERENCES: NotificationPreferences = {
  userId: '',
  channels: {
    push: true,
    email: true,
    sms: false,
    inApp: true,
  },
  notificationTypes: {
    'delivery-assigned': true,
    'delivery-picked-up': true,
    'delivery-in-transit': true,
    'delivery-completed': true,
    'payment-received': true,
    'payment-failed': true,
    'earnings-summary': true,
    'promotion': true,
    'system-alert': true,
    'support-response': true,
    'referral-bonus': true,
    'loyalty-reward': true,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
  language: 'en',
  timezone: 'Africa/Johannesburg',
};

/**
 * Notification templates
 */
export const NOTIFICATION_TEMPLATES: Record<NotificationType, { title: string; body: string }> = {
  'delivery-assigned': {
    title: 'New Delivery Available',
    body: 'You have a new delivery from {{pickup}} to {{delivery}}. Earn R{{amount}}.',
  },
  'delivery-picked-up': {
    title: 'Delivery Picked Up',
    body: 'Your delivery from {{pickup}} has been picked up by {{courier}}.',
  },
  'delivery-in-transit': {
    title: 'Delivery In Transit',
    body: 'Your package is on the way. Estimated delivery: {{eta}}.',
  },
  'delivery-completed': {
    title: 'Delivery Completed',
    body: 'Your delivery to {{delivery}} has been completed. Thank you!',
  },
  'payment-received': {
    title: 'Payment Received',
    body: 'You received R{{amount}} for {{deliveryCount}} deliveries.',
  },
  'payment-failed': {
    title: 'Payment Failed',
    body: 'Payment processing failed. Please try again or contact support.',
  },
  'earnings-summary': {
    title: 'Daily Earnings Summary',
    body: 'You earned R{{amount}} from {{deliveryCount}} deliveries today.',
  },
  'promotion': {
    title: 'Special Promotion',
    body: '{{promoTitle}}: {{promoDescription}}',
  },
  'system-alert': {
    title: 'System Alert',
    body: '{{message}}',
  },
  'support-response': {
    title: 'Support Response',
    body: 'Your support ticket has been responded to. {{message}}',
  },
  'referral-bonus': {
    title: 'Referral Bonus Earned',
    body: 'You earned R{{amount}} for referring {{referralName}}.',
  },
  'loyalty-reward': {
    title: 'Loyalty Reward Unlocked',
    body: 'You unlocked {{rewardName}}. {{rewardDescription}}',
  },
};

/**
 * Check if notification should be sent based on preferences and quiet hours
 */
export function shouldSendNotification(
  preferences: NotificationPreferences,
  notificationType: NotificationType,
  priority: NotificationPriority
): boolean {
  try {
    // Check if notification type is enabled
    if (!preferences.notificationTypes[notificationType]) {
      return false;
    }

    // Urgent notifications bypass quiet hours
    if (priority === 'urgent') {
      return true;
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const startTime = preferences.quietHours.startTime;
      const endTime = preferences.quietHours.endTime;

      if (startTime < endTime) {
        // Normal case: quiet hours don't cross midnight
        if (currentTime >= startTime && currentTime <= endTime) {
          return false;
        }
      } else {
        // Quiet hours cross midnight
        if (currentTime >= startTime || currentTime <= endTime) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Error checking if should send:', error);
    return true; // Default to sending
  }
}

/**
 * Get enabled channels for a notification
 */
export function getEnabledChannels(
  preferences: NotificationPreferences,
  priority: NotificationPriority
): NotificationChannel[] {
  try {
    const channels: NotificationChannel[] = [];

    // Urgent notifications use all channels
    if (priority === 'urgent') {
      return ['push', 'email', 'sms', 'in-app'];
    }

    // High priority uses push, email, in-app
    if (priority === 'high') {
      if (preferences.channels.push) channels.push('push');
      if (preferences.channels.email) channels.push('email');
      if (preferences.channels.inApp) channels.push('in-app');
      return channels;
    }

    // Normal and low priority
    if (preferences.channels.push) channels.push('push');
    if (preferences.channels.email) channels.push('email');
    if (preferences.channels.inApp) channels.push('in-app');

    return channels;
  } catch (error) {
    console.error('[Notifications] Error getting enabled channels:', error);
    return ['in-app']; // Fallback to in-app
  }
}

/**
 * Create notification
 */
export function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  priority: NotificationPriority = 'normal',
  channels: NotificationChannel[] = ['push', 'email', 'in-app'],
  data?: Record<string, any>
): Notification {
  try {
    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      body,
      data,
      priority,
      channels,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error);
    throw error;
  }
}

/**
 * Log notification send attempt
 */
export function logNotificationAttempt(
  notificationId: string,
  userId: string,
  channel: NotificationChannel,
  status: NotificationStatus,
  failureReason?: string
): NotificationLog {
  try {
    return {
      notificationId,
      userId,
      channel,
      status,
      sentAt: status !== 'failed' ? Date.now() : undefined,
      failureReason,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[Notifications] Error logging notification:', error);
    throw error;
  }
}

/**
 * Get notification summary for user
 */
export function getNotificationSummary(notifications: Notification[]): {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
} {
  try {
    const summary = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.readAt).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
    };

    notifications.forEach((n) => {
      summary.byType[n.type] = (summary.byType[n.type] || 0) + 1;
      summary.byPriority[n.priority] = (summary.byPriority[n.priority] || 0) + 1;
    });

    return summary;
  } catch (error) {
    console.error('[Notifications] Error getting summary:', error);
    throw error;
  }
}

export default {
  shouldSendNotification,
  getEnabledChannels,
  createNotification,
  logNotificationAttempt,
  getNotificationSummary,
  DEFAULT_PREFERENCES,
  NOTIFICATION_TEMPLATES,
};
