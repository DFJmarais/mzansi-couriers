import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb, getLatestDeliveryLocation } from '../db';
import { addresses, courierProfiles, deliveries, users, deliveryRelayLegs, relayExceptionEvents } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { validateTrackingCode } from '../services/tracking-code';
import { TRPCError } from '@trpc/server';

export const trackingRouter = router({
  /**
   * Get delivery details by tracking code (public - for customers)
   */
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      if (!validateTrackingCode(input.code)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enter a valid Mzansi tracking code.' });
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const delivery = await db
        .select()
        .from(deliveries)
        .where(eq(deliveries.trackingCode, input.code))
        .limit(1);

      if (!delivery || delivery.length === 0) {
        throw new Error('Tracking code not found');
      }

      const d = delivery[0];
      const [pickupRows, dropoffRows, courierRows, profileRows, latestLocation, relayLegRows, exceptionRows] = await Promise.all([
        db.select().from(addresses).where(eq(addresses.id, d.pickupAddressId)).limit(1),
        db.select().from(addresses).where(eq(addresses.id, d.dropoffAddressId)).limit(1),
        d.courierId
          ? db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, d.courierId)).limit(1)
          : Promise.resolve([]),
        d.courierId
          ? db.select({ vehicleType: courierProfiles.vehicleType, rating: courierProfiles.rating }).from(courierProfiles).where(eq(courierProfiles.userId, d.courierId)).limit(1)
          : Promise.resolve([]),
        getLatestDeliveryLocation(d.id),
        db.select().from(deliveryRelayLegs).where(eq(deliveryRelayLegs.deliveryId, d.id)).limit(50),
        db.select({ type: relayExceptionEvents.type, status: relayExceptionEvents.status, recoveryAction: relayExceptionEvents.recoveryAction, createdAt: relayExceptionEvents.createdAt }).from(relayExceptionEvents).where(eq(relayExceptionEvents.deliveryId, d.id)).limit(5),
      ]);
      relayLegRows.sort((a, b) => a.sequence - b.sequence);
      exceptionRows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const pickup = pickupRows[0];
      const dropoff = dropoffRows[0];
      const courier = courierRows[0];
      const courierProfile = profileRows[0];

      return {
        id: d.id,
        trackingCode: d.trackingCode,
        status: d.status,
        pickup: {
          street: pickup?.street ?? null,
          city: pickup?.city ?? null,
          postalCode: pickup?.postalCode ?? null,
          latitude: Number(d.pickupLatitude),
          longitude: Number(d.pickupLongitude),
        },
        dropoff: {
          street: dropoff?.street ?? null,
          city: dropoff?.city ?? null,
          postalCode: dropoff?.postalCode ?? null,
          latitude: Number(d.dropoffLatitude),
          longitude: Number(d.dropoffLongitude),
        },
        courier: courier
          ? {
              name: courier.name ?? 'Assigned courier',
              phone: courier.phone ?? null,
              vehicleType: courierProfile?.vehicleType ?? null,
              rating: courierProfile?.rating ? Number(courierProfile.rating) : null,
            }
          : null,
        latestLocation: latestLocation && d.status !== 'delivered'
          ? {
              latitude: Number(latestLocation.latitude),
              longitude: Number(latestLocation.longitude),
              accuracy: latestLocation.accuracy ? Number(latestLocation.accuracy) : null,
              timestamp: latestLocation.timestamp,
            }
          : null,
        packageSize: d.packageSize,
        packageWeight: Number(d.packageWeight),
        packageDescription: d.packageDescription,
        estimatedDeliveryTime: d.estimatedDeliveryTime,
        actualDeliveryTime: d.actualDeliveryTime,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        relay: relayLegRows.length ? {
          totalLegs: relayLegRows.length,
          currentLeg: relayLegRows.find((leg) => !["completed", "declined", "failed"].includes(leg.status))?.sequence ?? null,
          activeCustodianId: relayLegRows.find((leg) => !["completed", "declined", "failed"].includes(leg.status))?.currentCustodianId ?? null,
          legs: relayLegRows.map((leg) => ({ sequence: leg.sequence, originArea: leg.originArea, destinationArea: leg.destinationArea, status: leg.status, handoffMode: leg.handoffMode, meetingAddress: leg.meetingAddress, currentCustodianId: leg.currentCustodianId })),
        } : null,
        exceptions: exceptionRows.map((exception) => ({ type: exception.type, status: exception.status, recoveryAction: exception.recoveryAction, createdAt: exception.createdAt })),
      };
    }),

  /**
   * Verify tracking code at pickup (courier side)
   */
  verifyAtPickup: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!validateTrackingCode(input.code)) {
        throw new Error('Invalid tracking code format');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const delivery = await db
        .select()
        .from(deliveries)
        .where(eq(deliveries.trackingCode, input.code))
        .limit(1);

      if (!delivery || delivery.length === 0) {
        throw new Error('Tracking code not found');
      }

      const d = delivery[0];

      // Verify the delivery is in pending or assigned status
      if (d.status !== 'pending' && d.status !== 'assigned') {
        throw new Error(`Cannot verify pickup - delivery status is ${d.status}`);
      }

      return {
        trackingCode: d.trackingCode,
        status: d.status,
        packageSize: d.packageSize,
        packageWeight: d.packageWeight,
        packageDescription: d.packageDescription,
        verified: true,
      };
    }),

  /**
   * Confirm tracking code at delivery (courier side)
   */
  confirmAtDelivery: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!validateTrackingCode(input.code)) {
        throw new Error('Invalid tracking code format');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const delivery = await db
        .select()
        .from(deliveries)
        .where(eq(deliveries.trackingCode, input.code))
        .limit(1);

      if (!delivery || delivery.length === 0) {
        throw new Error('Tracking code not found');
      }

      const d = delivery[0];

      // Verify the delivery is in transit
      if (d.status !== 'in-transit') {
        throw new Error(`Cannot confirm delivery - delivery status is ${d.status}`);
      }

      return {
        trackingCode: d.trackingCode,
        status: d.status,
        packageSize: d.packageSize,
        packageWeight: d.packageWeight,
        confirmed: true,
      };
    }),
});
