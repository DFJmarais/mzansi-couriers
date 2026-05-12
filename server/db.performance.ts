import { getDb } from './db';
import { courierRatings, courierMetrics, whatsappMessages } from '../drizzle/schema';
import { eq, avg, count, sql } from 'drizzle-orm';

export async function createCourierRating(data: {
  courierId: number;
  customerId: number;
  deliveryId: number;
  rating: number;
  review?: string;
  categories?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const result = await db.insert(courierRatings).values(data);
  
  // Update courier metrics
  await updateCourierMetrics(data.courierId);
  
  return result;
}

export async function getCourierRatings(courierId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return await db.select().from(courierRatings).where(eq(courierRatings.courierId, courierId));
}

export async function getCourierMetrics(courierId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return await db.select().from(courierMetrics).where(eq(courierMetrics.courierId, courierId));
}

export async function updateCourierMetrics(courierId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Get all ratings for this courier
  const ratings = await db.select().from(courierRatings).where(eq(courierRatings.courierId, courierId));
  
  const averageRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
    : '5.00';
  
  // Update or create metrics
  const existing = await db.select().from(courierMetrics).where(eq(courierMetrics.courierId, courierId));
  
  if (existing.length > 0) {
    await db.update(courierMetrics)
      .set({
        averageRating: parseFloat(averageRating) as any,
        totalRatings: ratings.length,
        updatedAt: new Date(),
      })
      .where(eq(courierMetrics.courierId, courierId));
  } else {
    await db.insert(courierMetrics).values({
      courierId: courierId,
      averageRating: parseFloat(averageRating),
      totalRatings: ratings.length,
      totalDeliveries: 0,
      completedDeliveries: 0,
      cancelledDeliveries: 0,
    } as any);
  }
}

export async function sendWhatsAppMessage(data: {
  recipientId: number;
  deliveryId?: number;
  messageType: 'delivery_confirmed' | 'courier_assigned' | 'in_transit' | 'delivery_completed' | 'delivery_failed' | 'courier_job_available' | 'earnings_summary';
  messageContent: string;
  mediaUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return await db.insert(whatsappMessages).values({
    recipientId: data.recipientId,
    deliveryId: data.deliveryId,
    messageType: data.messageType,
    messageContent: data.messageContent,
    mediaUrl: data.mediaUrl,
  } as any);
}

export async function getWhatsAppMessages(recipientId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return await db.select().from(whatsappMessages).where(eq(whatsappMessages.recipientId, recipientId));
}

export async function updateWhatsAppMessageStatus(messageId: number, status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed') {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return await db.update(whatsappMessages)
    .set({ status: status as any })
    .where(eq(whatsappMessages.id, messageId));
}

export async function getCourierPerformanceStats(courierId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const metrics = await db.select().from(courierMetrics).where(eq(courierMetrics.courierId, courierId));
  const ratings = await db.select().from(courierRatings).where(eq(courierRatings.courierId, courierId));
  
  if (metrics.length === 0) {
    return {
      courierId,
      averageRating: 5.0,
      totalRatings: 0,
      totalDeliveries: 0,
      completionRate: 100,
      cancellationRate: 0,
      totalEarnings: 0,
      responseTime: 0,
      recentReviews: [],
    };
  }
  
  const metric = metrics[0];
  
  return {
    courierId,
    averageRating: parseFloat(metric.averageRating?.toString() || '5.00'),
    totalRatings: metric.totalRatings || 0,
    totalDeliveries: metric.totalDeliveries || 0,
    completedDeliveries: metric.completedDeliveries || 0,
    cancelledDeliveries: metric.cancelledDeliveries || 0,
    completionRate: parseFloat(metric.completionRate?.toString() || '100'),
    cancellationRate: parseFloat(metric.cancellationRate?.toString() || '0'),
    totalEarnings: parseFloat(metric.totalEarnings?.toString() || '0'),
    responseTime: metric.responseTime || 0,
    lastDeliveryAt: metric.lastDeliveryAt,
    recentReviews: ratings.slice(-5),
  };
}
