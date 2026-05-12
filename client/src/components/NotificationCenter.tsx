import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X, Star, TrendingUp, Gift, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'referral' | 'surge' | 'milestone' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Mock notifications - in production, these would come from WebSocket or polling
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'referral',
        title: 'Referral Earned!',
        message: 'Thabo just signed up using your code. You earned 1 star!',
        timestamp: new Date(Date.now() - 5 * 60000),
        read: false,
        action: { label: 'View Profile', href: '/referral/stars' },
      },
      {
        id: '2',
        type: 'surge',
        title: 'Surge Pricing Active',
        message: 'Peak lunch hour pricing is now active (1.5x multiplier). Prices will return to normal at 2:00 PM.',
        timestamp: new Date(Date.now() - 15 * 60000),
        read: false,
        action: { label: 'Learn More', href: '/pricing/surge' },
      },
      {
        id: '3',
        type: 'milestone',
        title: 'Bronze Badge Unlocked!',
        message: 'Congratulations! You earned 10 stars and unlocked the Bronze badge.',
        timestamp: new Date(Date.now() - 1 * 60 * 60000),
        read: true,
      },
      {
        id: '4',
        type: 'alert',
        title: 'High Demand Alert',
        message: 'Delivery demand is 2x normal. Couriers are earning 1.8x rates right now.',
        timestamp: new Date(Date.now() - 2 * 60 * 60000),
        read: true,
      },
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'referral':
        return <Gift className="w-5 h-5 text-green-600" />;
      case 'surge':
        return <TrendingUp className="w-5 h-5 text-orange-600" />;
      case 'milestone':
        return <Star className="w-5 h-5 text-yellow-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-accent" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'referral':
        return 'bg-green-50 border-green-200';
      case 'surge':
        return 'bg-orange-50 border-orange-200';
      case 'milestone':
        return 'bg-yellow-50 border-yellow-200';
      case 'alert':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-background border-border';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-accent/10 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-muted-foreground hover:text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 bg-background border border-border rounded-lg shadow-lg z-50 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-accent/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 transition-all hover:bg-accent/5 ${
                    getNotificationColor(notification.type)
                  } ${!notification.read ? 'bg-accent/5 border-l-accent' : 'border-l-transparent'}`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                        <button
                          onClick={() => dismissNotification(notification.id)}
                          className="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.action && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              markAsRead(notification.id);
                              // Navigate to action href
                              window.location.href = notification.action!.href;
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="sticky bottom-0 bg-background border-t border-border p-3 text-center">
              <button className="text-sm text-accent hover:underline">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
