/**
 * Advanced Reporting System
 * 
 * Generates comprehensive financial, operational, and performance reports
 */

export type ReportType =
  | 'financial-summary'
  | 'courier-performance'
  | 'customer-analytics'
  | 'operational-metrics'
  | 'revenue-breakdown'
  | 'delivery-analytics'
  | 'user-growth'
  | 'payment-reconciliation';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type ExportFormat = 'pdf' | 'csv' | 'excel' | 'json';

export interface FinancialReport {
  period: ReportPeriod;
  startDate: number;
  endDate: number;
  totalRevenue: number;
  totalPayouts: number;
  platformFees: number;
  netProfit: number;
  averageOrderValue: number;
  transactionCount: number;
  paymentMethods: Record<string, number>;
  topCouriers: Array<{ courierId: string; earnings: number; deliveries: number }>;
  topCustomers: Array<{ customerId: string; spending: number; orders: number }>;
}

export interface CourierPerformanceReport {
  period: ReportPeriod;
  startDate: number;
  endDate: number;
  totalCouriers: number;
  activeCouriers: number;
  totalDeliveries: number;
  averageDeliveriesPerCourier: number;
  averageRating: number;
  topPerformers: Array<{
    courierId: string;
    name: string;
    deliveries: number;
    rating: number;
    earnings: number;
  }>;
  performanceDistribution: {
    excellent: number; // 4.5-5.0 stars
    good: number; // 4.0-4.4 stars
    average: number; // 3.0-3.9 stars
    poor: number; // <3.0 stars
  };
  earningsDistribution: {
    under5k: number;
    '5k-10k': number;
    '10k-20k': number;
    '20k-50k': number;
    over50k: number;
  };
}

export interface CustomerAnalyticsReport {
  period: ReportPeriod;
  startDate: number;
  endDate: number;
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  totalOrders: number;
  averageOrdersPerCustomer: number;
  averageSpendingPerCustomer: number;
  customerRetentionRate: number;
  churnRate: number;
  topCategories: Array<{ category: string; orders: number; revenue: number }>;
  geographicDistribution: Record<string, number>;
  satisfactionScore: number;
}

export interface OperationalMetricsReport {
  period: ReportPeriod;
  startDate: number;
  endDate: number;
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  cancelledDeliveries: number;
  successRate: number;
  averageDeliveryTime: number; // minutes
  averagePickupTime: number; // minutes
  peakHours: Array<{ hour: number; deliveries: number }>;
  geographicCoverage: Record<string, number>;
  supportTickets: number;
  averageResolutionTime: number; // hours
}

export interface RevenueBreakdownReport {
  period: ReportPeriod;
  startDate: number;
  endDate: number;
  totalRevenue: number;
  byDeliveryType: Record<string, number>;
  byLocation: Record<string, number>;
  byTimeOfDay: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  topDeliveryRoutes: Array<{ from: string; to: string; revenue: number; count: number }>;
}

export interface DeliveryAnalyticsReport {
  period: ReportPeriod;
  startDate: number;
  endDate: number;
  totalDeliveries: number;
  averageDistance: number; // km
  averageWeight: number; // kg
  deliveryTimeBreakdown: {
    under30min: number;
    '30-60min': number;
    '1-2hours': number;
    '2-4hours': number;
    over4hours: number;
  };
  delayReasons: Record<string, number>;
  weatherImpact: Record<string, number>;
  trafficImpact: Record<string, number>;
}

export interface UserGrowthReport {
  period: ReportPeriod;
  startDate: number;
  endDate: number;
  courierGrowth: {
    startCount: number;
    endCount: number;
    netGrowth: number;
    growthRate: number;
  };
  customerGrowth: {
    startCount: number;
    endCount: number;
    netGrowth: number;
    growthRate: number;
  };
  monthlyTrend: Array<{
    month: string;
    couriers: number;
    customers: number;
    deliveries: number;
  }>;
  acquisitionChannels: Record<string, number>;
  retentionCohorts: Record<string, number>;
}

export interface PaymentReconciliationReport {
  period: ReportPeriod;
  startDate: number;
  endDate: number;
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refunds: number;
  refundAmount: number;
  paymentMethods: Record<string, { count: number; amount: number }>;
  discrepancies: Array<{
    transactionId: string;
    expectedAmount: number;
    actualAmount: number;
    difference: number;
  }>;
}

export interface Report {
  id: string;
  type: ReportType;
  period: ReportPeriod;
  startDate: number;
  endDate: number;
  generatedAt: number;
  generatedBy: string;
  data:
    | FinancialReport
    | CourierPerformanceReport
    | CustomerAnalyticsReport
    | OperationalMetricsReport
    | RevenueBreakdownReport
    | DeliveryAnalyticsReport
    | UserGrowthReport
    | PaymentReconciliationReport;
  status: 'pending' | 'completed' | 'failed';
  exportFormats: ExportFormat[];
}

export interface ScheduledReport {
  id: string;
  type: ReportType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  exportFormat: ExportFormat;
  enabled: boolean;
  createdAt: number;
  lastGeneratedAt?: number;
  nextGenerationAt: number;
}

/**
 * Create a new report
 */
export function createReport(
  type: ReportType,
  period: ReportPeriod,
  startDate: number,
  endDate: number,
  generatedBy: string,
  data: any
): Report {
  try {
    return {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      period,
      startDate,
      endDate,
      generatedAt: Date.now(),
      generatedBy,
      data,
      status: 'completed',
      exportFormats: ['pdf', 'csv', 'excel', 'json'],
    };
  } catch (error) {
    console.error('[Reporting] Error creating report:', error);
    throw error;
  }
}

/**
 * Calculate financial metrics
 */
export function calculateFinancialMetrics(
  totalRevenue: number,
  totalPayouts: number,
  platformFeePercentage: number = 15
): {
  platformFees: number;
  netProfit: number;
  profitMargin: number;
} {
  try {
    const platformFees = Math.round(totalRevenue * (platformFeePercentage / 100));
    const netProfit = totalRevenue - totalPayouts - platformFees;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    return {
      platformFees,
      netProfit,
      profitMargin,
    };
  } catch (error) {
    console.error('[Reporting] Error calculating financial metrics:', error);
    throw error;
  }
}

/**
 * Calculate performance metrics
 */
export function calculatePerformanceMetrics(
  completedDeliveries: number,
  failedDeliveries: number,
  cancelledDeliveries: number
): {
  successRate: number;
  failureRate: number;
  cancellationRate: number;
} {
  try {
    const totalDeliveries = completedDeliveries + failedDeliveries + cancelledDeliveries;

    return {
      successRate: totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0,
      failureRate: totalDeliveries > 0 ? Math.round((failedDeliveries / totalDeliveries) * 100) : 0,
      cancellationRate: totalDeliveries > 0 ? Math.round((cancelledDeliveries / totalDeliveries) * 100) : 0,
    };
  } catch (error) {
    console.error('[Reporting] Error calculating performance metrics:', error);
    throw error;
  }
}

/**
 * Calculate growth metrics
 */
export function calculateGrowthMetrics(
  startCount: number,
  endCount: number
): {
  netGrowth: number;
  growthRate: number;
  growthPercentage: number;
} {
  try {
    const netGrowth = endCount - startCount;
    const growthRate = startCount > 0 ? (netGrowth / startCount) * 100 : 0;

    return {
      netGrowth,
      growthRate: Math.round(growthRate * 100) / 100,
      growthPercentage: Math.round(growthRate),
    };
  } catch (error) {
    console.error('[Reporting] Error calculating growth metrics:', error);
    throw error;
  }
}

/**
 * Create scheduled report
 */
export function createScheduledReport(
  type: ReportType,
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
  recipients: string[],
  exportFormat: ExportFormat
): ScheduledReport {
  try {
    const nextGenerationAt = calculateNextGenerationDate(frequency);

    return {
      id: `sched-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      frequency,
      recipients,
      exportFormat,
      enabled: true,
      createdAt: Date.now(),
      nextGenerationAt,
    };
  } catch (error) {
    console.error('[Reporting] Error creating scheduled report:', error);
    throw error;
  }
}

/**
 * Calculate next generation date
 */
function calculateNextGenerationDate(frequency: string): number {
  const now = new Date();
  let nextDate = new Date(now);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(6, 0, 0, 0); // 6 AM
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (1 + 7 - nextDate.getDay()) % 7);
      nextDate.setHours(6, 0, 0, 0);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(1);
      nextDate.setHours(6, 0, 0, 0);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      nextDate.setDate(1);
      nextDate.setHours(6, 0, 0, 0);
      break;
  }

  return nextDate.getTime();
}

export default {
  createReport,
  calculateFinancialMetrics,
  calculatePerformanceMetrics,
  calculateGrowthMetrics,
  createScheduledReport,
};
