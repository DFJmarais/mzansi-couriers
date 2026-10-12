/**
 * Automation Job Types
 * 
 * Type definitions for all BullMQ automation jobs
 */

// Payment Success Job
export interface PaymentSuccessJobData {
  paymentId: string;
  customerId: string;
  courierId: string;
  amount: number;
  parcelId: string;
  customerPhone: string;
  courierPhone: string;
  customerEmail: string;
  courierName: string;
  estimatedDeliveryTime: string;
  timestamp: number;
}

// Delivery Status Changed Job
export interface DeliveryStatusJobData {
  deliveryId: string;
  customerId: string;
  courierId: string;
  newStatus: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  previousStatus: string;
  location?: {
    lat: number;
    lng: number;
  };
  estimatedArrival?: string;
  customerPhone: string;
  customerEmail: string;
  timestamp: number;
}

// Courier Assigned Job
export interface CourierAssignedJobData {
  deliveryId: string;
  courierId: string;
  customerId: string;
  courierName: string;
  courierPhone: string;
  courierRating: number;
  customerPhone: string;
  customerEmail: string;
  pickupLocation: string;
  deliveryLocation: string;
  estimatedDeliveryTime: string;
  courierEarnings: number;
  timestamp: number;
}

// Daily Earnings Summary Job
export interface DailyEarningsSummaryJobData {
  courierId: string;
  courierName: string;
  courierEmail: string;
  courierPhone: string;
  date: string;
  totalDeliveries: number;
  totalEarnings: number;
  bonusEarnings: number;
  totalWithBonus: number;
  averageRating: number;
  timestamp: number;
}

// Support Ticket Created Job
export interface SupportTicketJobData {
  ticketId: string;
  customerId: string;
  courierId?: string;
  subject: string;
  description: string;
  category: 'payment' | 'delivery' | 'courier' | 'app' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  customerEmail: string;
  customerPhone: string;
  timestamp: number;
}

// Weekly Payout Report Job
export interface WeeklyPayoutJobData {
  week: string; // e.g., "2026-05-12 to 2026-05-18"
  totalCouriers: number;
  totalPayouts: number;
  totalAmount: number;
  payoutDate: string;
  timestamp: number;
}

// AI Route Optimization Job
export interface AIRouteOptimizationJobData {
  deliveryId: string;
  courierId: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
  otherDeliveries?: Array<{
    id: string;
    location: {
      lat: number;
      lng: number;
    };
    priority: number;
  }>;
  timestamp: number;
}

// AI Customer Support Job
export interface AICustomerSupportJobData {
  ticketId: string;
  customerId: string;
  query: string;
  context: {
    recentDeliveries?: Array<{
      id: string;
      status: string;
      date: string;
    }>;
    accountAge?: number;
    previousIssues?: string[];
  };
  timestamp: number;
}

// Job result types
export interface JobResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Automation event for logging
export interface AutomationEvent {
  jobId: string;
  queueName: string;
  jobType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retried';
  data: any;
  result?: JobResult;
  error?: string;
  attempts: number;
  duration: number;
  timestamp: number;
}


