import { and, count, desc, eq, inArray, or } from "drizzle-orm";
import { router, adminProcedure } from "../_core/trpc";
import {
  courierHandoffOffers,
  courierProfiles,
  courierVerification,
  deliveries,
  deliveryRelayLegs,
  deliveryReviews,
  deliveryRunStops,
  deliveryRuns,
  deliveryTracking,
  parcelCustodyScans,
  relayExceptionEvents,
  relayHandoffInspections,
  relayHandoffPoints,
  smartMatchAudits,
  users,
  courierInterestLeads,
  courierApplicationActivity,
  notifications,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { z } from "zod";
import { calculateCourierSafety, calculatePathDrivingMinutes, calculatePathKilometres, COURIER_SAFETY_LIMITS } from "../safety/courier-safety";
import { sendDeliveryEmail } from "../_core/email";

function mapCounts(rows: Array<{ key: string | null; count: number }>) {
  return Object.fromEntries(rows.map((row) => [row.key ?? "unknown", Number(row.count)]));
}

export const adminAuditRouter = router({
  applicationEnquiries: adminProcedure.input(z.object({ vehicleType: z.string().trim().max(40).optional(), province: z.string().trim().max(80).optional(), verificationStatus: z.enum(["all", "pending", "approved", "replacement_required"]).optional(), reviewStatus: z.enum(["all", "new", "reviewed"]).optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const enquiries = await db.select({
      id: courierInterestLeads.id,
      fullName: courierInterestLeads.fullName,
      email: courierInterestLeads.email,
      phone: courierInterestLeads.phone,
      age: courierInterestLeads.age,
      vehicleType: courierInterestLeads.vehicleType,
      vehicleMakeModel: courierInterestLeads.vehicleMakeModel,
      vehicleYear: courierInterestLeads.vehicleYear,
      vehicleOwnership: courierInterestLeads.vehicleOwnership,
      hasValidLicense: courierInterestLeads.hasValidLicense,
      hasVehicleInsurance: courierInterestLeads.hasVehicleInsurance,
      wantsFleet: courierInterestLeads.wantsFleet,
      fleetSize: courierInterestLeads.fleetSize,
      fleetDetails: courierInterestLeads.fleetDetails,
      licenseDocumentUrl: courierInterestLeads.licenseDocumentUrl,
      licenseExpiryDate: courierInterestLeads.licenseExpiryDate,
      licenseVerificationStatus: courierInterestLeads.licenseVerificationStatus,
      idDocumentUrl: courierInterestLeads.idDocumentUrl,
      idVerificationStatus: courierInterestLeads.idVerificationStatus,
      insuranceDocumentUrl: courierInterestLeads.insuranceDocumentUrl,
      insuranceExpiryDate: courierInterestLeads.insuranceExpiryDate,
      insuranceVerificationStatus: courierInterestLeads.insuranceVerificationStatus,
      reviewNote: courierInterestLeads.reviewNote,
      reviewedAt: courierInterestLeads.reviewedAt,
      emailConsent: courierInterestLeads.emailConsent,
      source: courierInterestLeads.source,
      province: courierInterestLeads.province,
      reviewStatus: courierInterestLeads.reviewStatus,
      createdAt: courierInterestLeads.createdAt,
    }).from(courierInterestLeads).where(and(
      input?.vehicleType && input.vehicleType !== "all" ? eq(courierInterestLeads.vehicleType, input.vehicleType) : undefined,
      input?.province && input.province !== "all" ? eq(courierInterestLeads.province, input.province) : undefined,
      input?.reviewStatus && input.reviewStatus !== "all" ? eq(courierInterestLeads.reviewStatus, input.reviewStatus) : undefined,
      input?.verificationStatus && input.verificationStatus !== "all" ? or(eq(courierInterestLeads.licenseVerificationStatus, input.verificationStatus), eq(courierInterestLeads.idVerificationStatus, input.verificationStatus), eq(courierInterestLeads.insuranceVerificationStatus, input.verificationStatus)) : undefined,
    )).orderBy(desc(courierInterestLeads.createdAt));
    return {
      total: enquiries.length,
      newCount: enquiries.filter((enquiry) => enquiry.reviewStatus === "new").length,
      enquiries,
    };
  }),

  markApplicationReviewed: adminProcedure.input(z.object({ leadId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.update(courierInterestLeads).set({ reviewStatus: "reviewed", reviewedAt: new Date(), reviewedBy: ctx.user.id }).where(and(eq(courierInterestLeads.id, input.leadId), eq(courierInterestLeads.reviewStatus, "new")));
    if (Number(result[0]?.affectedRows ?? 0) > 0) await db.insert(courierApplicationActivity).values({ leadId: input.leadId, eventType: "application_reviewed", title: "Application marked as reviewed", detail: "An administrator marked this courier application as reviewed.", actorUserId: ctx.user.id });
    return { success: true, alreadyReviewed: Number(result[0]?.affectedRows ?? 0) === 0 };
  }),

  applicationTimeline: adminProcedure.input(z.object({ leadId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [lead] = await db.select({ email: courierInterestLeads.email }).from(courierInterestLeads).where(eq(courierInterestLeads.id, input.leadId)).limit(1);
    if (!lead) throw new Error("Courier application not found");
    const [activity, matchedUser] = await Promise.all([
      db.select().from(courierApplicationActivity).where(eq(courierApplicationActivity.leadId, input.leadId)).orderBy(desc(courierApplicationActivity.createdAt)),
      db.select({ id: users.id }).from(users).where(eq(users.email, lead.email)).limit(1),
    ]);
    const inApp = matchedUser[0] ? await db.select({ id: notifications.id, title: notifications.title, message: notifications.message, createdAt: notifications.createdAt }).from(notifications).where(eq(notifications.userId, matchedUser[0].id)).orderBy(desc(notifications.createdAt)).limit(50) : [];
    return [...activity.map((event) => ({ id: `activity-${event.id}`, kind: event.eventType, title: event.title, detail: event.detail, createdAt: event.createdAt })), ...inApp.map((notification) => ({ id: `notification-${notification.id}`, kind: "in_app_notification", title: `Notification: ${notification.title}`, detail: notification.message, createdAt: notification.createdAt }))].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }),

  reviewApplicationDocument: adminProcedure
    .input(z.object({
      leadId: z.number().int().positive(),
      documentType: z.enum(["license", "id", "insurance"]),
      status: z.enum(["approved", "replacement_required"]),
      reviewNote: z.string().trim().max(1000).nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [lead] = await db.select().from(courierInterestLeads).where(eq(courierInterestLeads.id, input.leadId)).limit(1);
      if (!lead) throw new Error("Courier application not found");
      const statusField = `${input.documentType}VerificationStatus` as "licenseVerificationStatus" | "idVerificationStatus" | "insuranceVerificationStatus";
      await db.update(courierInterestLeads).set({
        [statusField]: input.status,
        reviewNote: input.reviewNote,
        reviewedAt: new Date(),
        reviewedBy: ctx.user.id,
      } as Record<string, unknown>).where(eq(courierInterestLeads.id, input.leadId));
      const documentLabel = input.documentType === "license" ? "driver’s licence" : input.documentType === "id" ? "South African ID" : "vehicle insurance";
      const approved = input.status === "approved";
      await db.insert(courierApplicationActivity).values({ leadId: input.leadId, eventType: "document_reviewed", title: `${documentLabel} ${approved ? "approved" : "replacement requested"}`, detail: input.reviewNote ?? `Document status changed to ${input.status}.`, actorUserId: ctx.user.id });
      const title = approved ? "Courier document approved" : "Courier document needs replacement";
      const message = approved
        ? `Your ${documentLabel} has been approved. ${input.reviewNote ?? "No further action is needed for this document."}`
        : `Please replace your ${documentLabel} document. ${input.reviewNote ?? "The review team needs a clearer or more current document."}`;
      const emailResult = lead.emailConsent ? await sendDeliveryEmail(lead.email, title, `Hi ${lead.fullName},\n\n${message}\n\nMzansi Couriers\nmzansicouriers@yahoo.com`) : { sent: false as const, reason: "email_consent_not_granted" as const };
      const [matchedUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, lead.email)).limit(1);
      if (matchedUser) await db.insert(notifications).values({ userId: matchedUser.id, type: "system", title, message });
      await db.insert(courierApplicationActivity).values({ leadId: input.leadId, eventType: "notification_created", title: "Applicant notification recorded", detail: matchedUser ? `${title} was recorded in the applicant's in-app notifications.` : emailResult.sent ? "Email notification accepted by the configured provider." : "Notification was not delivered because no matched account or email consent/provider was available.", actorUserId: ctx.user.id });
      return { success: true, emailSent: emailResult.sent, inAppSent: Boolean(matchedUser) };
    }),

  summary: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        available: false as const,
        generatedAt: new Date().toISOString(),
        message: "The operations database is not available in this environment.",
      };
    }

    const [
      deliveryStatusRows,
      offerStatusRows,
      exceptionStatusRows,
      custodyScanRows,
      inspectionRows,
      runStatusRows,
      stopStatusRows,
      smartMatchRows,
      courierRows,
      relayLegRows,
      reviewCountRows,
    ] = await Promise.all([
      db.select({ key: deliveries.status, count: count() }).from(deliveries).groupBy(deliveries.status),
      db.select({ key: courierHandoffOffers.status, count: count() }).from(courierHandoffOffers).groupBy(courierHandoffOffers.status),
      db.select({ key: relayExceptionEvents.status, count: count() }).from(relayExceptionEvents).groupBy(relayExceptionEvents.status),
      db.select({ key: parcelCustodyScans.scanType, count: count() }).from(parcelCustodyScans).groupBy(parcelCustodyScans.scanType),
      db.select({ key: relayHandoffInspections.conditionAccepted, count: count() }).from(relayHandoffInspections).groupBy(relayHandoffInspections.conditionAccepted),
      db.select({ key: deliveryRuns.status, count: count() }).from(deliveryRuns).groupBy(deliveryRuns.status),
      db.select({ key: deliveryRunStops.status, count: count() }).from(deliveryRunStops).groupBy(deliveryRunStops.status),
      db.select({ key: smartMatchAudits.decision, count: count() }).from(smartMatchAudits).groupBy(smartMatchAudits.decision),
      db.select({ key: courierProfiles.isAvailable, count: count() }).from(courierProfiles).groupBy(courierProfiles.isAvailable),
      db.select({ key: deliveryRelayLegs.status, count: count() }).from(deliveryRelayLegs).groupBy(deliveryRelayLegs.status),
      db.select({ count: count() }).from(deliveryReviews),
    ]);

    const inspections = mapCounts(inspectionRows.map((row) => ({ key: row.key ? "accepted" : "defect_or_rejected", count: Number(row.count) })));
    return {
      available: true as const,
      generatedAt: new Date().toISOString(),
      deliveries: mapCounts(deliveryStatusRows.map((row) => ({ key: row.key, count: Number(row.count) }))),
      relay: {
        legs: mapCounts(relayLegRows.map((row) => ({ key: row.key, count: Number(row.count) }))),
        handoffOffers: mapCounts(offerStatusRows.map((row) => ({ key: row.key, count: Number(row.count) }))),
        inspections,
      },
      custodyScans: mapCounts(custodyScanRows.map((row) => ({ key: row.key, count: Number(row.count) }))),
      exceptions: mapCounts(exceptionStatusRows.map((row) => ({ key: row.key, count: Number(row.count) }))),
      routes: {
        runs: mapCounts(runStatusRows.map((row) => ({ key: row.key, count: Number(row.count) }))),
        stops: mapCounts(stopStatusRows.map((row) => ({ key: row.key, count: Number(row.count) }))),
      },
      smartMatch: mapCounts(smartMatchRows.map((row) => ({ key: row.key, count: Number(row.count) }))),
      couriers: mapCounts(courierRows.map((row) => ({ key: row.key ? "available" : "paused", count: Number(row.count) }))),
      reviewCount: Number(reviewCountRows[0]?.count ?? 0),
    };
  }),

  packages: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select({
      id: deliveries.id,
      trackingCode: deliveries.trackingCode,
      status: deliveries.status,
      courierId: deliveries.courierId,
      courierName: users.name,
      createdAt: deliveries.createdAt,
      updatedAt: deliveries.updatedAt,
    }).from(deliveries).leftJoin(users, eq(deliveries.courierId, users.id)).orderBy(desc(deliveries.updatedAt)).limit(200);
  }),

  courierSafety: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const profiles = await db.select().from(courierProfiles);
    const courierIds = profiles.map((profile) => profile.userId);
    if (!courierIds.length) return { limits: COURIER_SAFETY_LIMITS, couriers: [] };
    const [userRows, trackingRows, packageRows, verificationRows] = await Promise.all([
      db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone }).from(users).where(inArray(users.id, courierIds)),
      db.select().from(deliveryTracking).where(inArray(deliveryTracking.courierId, courierIds)).orderBy(desc(deliveryTracking.timestamp)),
      db.select({ delivery: deliveries }).from(deliveries).where(inArray(deliveries.courierId, courierIds)).orderBy(desc(deliveries.updatedAt)),
      db.select({ userId: courierVerification.userId, documentType: courierVerification.documentType, fileUrl: courierVerification.fileUrl }).from(courierVerification).where(and(inArray(courierVerification.userId, courierIds), inArray(courierVerification.documentType, ["selfie", "sa_id"]), eq(courierVerification.verificationStatus, "verified"))),
    ]);
    const userById = new Map(userRows.map((user) => [user.id, user]));
    const trackingByCourier = new Map<number, typeof trackingRows>();
    for (const point of trackingRows) trackingByCourier.set(point.courierId, [...(trackingByCourier.get(point.courierId) ?? []), point]);
    const packagesByCourier = new Map<number, typeof packageRows>();
    for (const row of packageRows) if (row.delivery.courierId) packagesByCourier.set(row.delivery.courierId, [...(packagesByCourier.get(row.delivery.courierId) ?? []), row]);
    const avatarByCourier = new Map<number, string>();
    for (const verification of verificationRows) if (verification.documentType === "selfie" || !avatarByCourier.has(verification.userId)) avatarByCourier.set(verification.userId, verification.fileUrl);
    return {
      limits: COURIER_SAFETY_LIMITS,
      couriers: profiles.map((profile) => {
        const points = trackingByCourier.get(profile.userId) ?? [];
        const safety = calculateCourierSafety(points.map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude), timestamp: point.timestamp })));
        const assignedPackages = packagesByCourier.get(profile.userId) ?? [];
        const user = userById.get(profile.userId);
        const latestPoint = points[0];
        return {
          userId: profile.userId,
          name: user?.name ?? `Courier ${profile.userId}`,
          email: user?.email ?? null,
          phone: user?.phone ?? null,
          vehicleType: profile.vehicleType,
          vehicleRegistration: profile.vehicleRegistration,
          province: profile.province,
          region: profile.region,
          rating: profile.rating ? Number(profile.rating) : null,
          totalDeliveries: profile.totalDeliveries ?? 0,
          avatarUrl: avatarByCourier.get(profile.userId) ?? null,
          isAvailable: profile.isAvailable,
          currentLocation: latestPoint ? { latitude: Number(latestPoint.latitude), longitude: Number(latestPoint.longitude), timestamp: latestPoint.timestamp } : null,
          movementPath: points.slice(0, 200).reverse().map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude), timestamp: point.timestamp })),
          activePackageCount: assignedPackages.filter(({ delivery }) => ["assigned", "in-transit"].includes(delivery.status)).length,
          recentPackages: assignedPackages.slice(0, 5).map(({ delivery }) => ({ trackingCode: delivery.trackingCode, status: delivery.status, updatedAt: delivery.updatedAt })),
          safety,
        };
      }),
    };
  }),

  courierProfile: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [profile] = await db.select().from(courierProfiles).where(eq(courierProfiles.userId, input.userId)).limit(1);
      if (!profile) throw new Error("Courier profile not found");
      const [user, trackingPoints, packageRows, relayLegs, handoffOffers, inspections, custodyScans] = await Promise.all([
        db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone }).from(users).where(eq(users.id, input.userId)).limit(1),
        db.select().from(deliveryTracking).where(eq(deliveryTracking.courierId, input.userId)).orderBy(deliveryTracking.timestamp),
        db.select().from(deliveries).where(eq(deliveries.courierId, input.userId)).orderBy(desc(deliveries.updatedAt)),
        db.select().from(deliveryRelayLegs).where(or(eq(deliveryRelayLegs.fromCourierId, input.userId), eq(deliveryRelayLegs.toCourierId, input.userId), eq(deliveryRelayLegs.currentCustodianId, input.userId))).orderBy(desc(deliveryRelayLegs.updatedAt)),
        db.select().from(courierHandoffOffers).where(or(eq(courierHandoffOffers.offeredByCourierId, input.userId), eq(courierHandoffOffers.offeredToCourierId, input.userId))).orderBy(desc(courierHandoffOffers.createdAt)),
        db.select().from(relayHandoffInspections).where(eq(relayHandoffInspections.inspectorCourierId, input.userId)).orderBy(desc(relayHandoffInspections.createdAt)),
        db.select().from(parcelCustodyScans).where(eq(parcelCustodyScans.scannedByUserId, input.userId)).orderBy(desc(parcelCustodyScans.scannedAt)),
      ]);
      const points = trackingPoints.map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude), timestamp: point.timestamp }));
      return {
        profile: { ...profile, rating: profile.rating ? Number(profile.rating) : null, totalEarnings: profile.totalEarnings ? Number(profile.totalEarnings) : null },
        user: user[0] ?? null,
        metrics: { totalKilometres: calculatePathKilometres(points), totalDrivingMinutes: calculatePathDrivingMinutes(points), safety: calculateCourierSafety(points) },
        trackingPoints: trackingPoints.map((point) => ({ id: point.id, deliveryId: point.deliveryId, latitude: Number(point.latitude), longitude: Number(point.longitude), speed: point.speed ? Number(point.speed) : null, timestamp: point.timestamp })),
        packages: packageRows.map((delivery) => ({ id: delivery.id, trackingCode: delivery.trackingCode, status: delivery.status, distance: delivery.distance ? Number(delivery.distance) : null, createdAt: delivery.createdAt, updatedAt: delivery.updatedAt })),
        relayLegs,
        handoffOffers,
        inspections,
        custodyScans,
      };
    }),

  movement: adminProcedure
    .input(z.object({ deliveryId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, input.deliveryId)).limit(1);
      if (!delivery) throw new Error("Parcel not found");

      const [trackingPoints, scans, legs, offers, inspections, stopRows, handoffPoints] = await Promise.all([
        db.select().from(deliveryTracking).where(eq(deliveryTracking.deliveryId, delivery.id)).orderBy(deliveryTracking.timestamp),
        db.select().from(parcelCustodyScans).where(eq(parcelCustodyScans.deliveryId, delivery.id)).orderBy(parcelCustodyScans.scannedAt),
        db.select().from(deliveryRelayLegs).where(eq(deliveryRelayLegs.deliveryId, delivery.id)).orderBy(deliveryRelayLegs.sequence),
        db.select().from(courierHandoffOffers).where(inArray(courierHandoffOffers.relayLegId, db.select({ id: deliveryRelayLegs.id }).from(deliveryRelayLegs).where(eq(deliveryRelayLegs.deliveryId, delivery.id)))),
        db.select().from(relayHandoffInspections).where(eq(relayHandoffInspections.deliveryId, delivery.id)).orderBy(relayHandoffInspections.createdAt),
        db.select({ stop: deliveryRunStops, run: deliveryRuns }).from(deliveryRunStops).innerJoin(deliveryRuns, eq(deliveryRunStops.runId, deliveryRuns.id)).where(eq(deliveryRunStops.deliveryId, delivery.id)).orderBy(deliveryRunStops.sequence),
        db.select().from(relayHandoffPoints).where(inArray(relayHandoffPoints.id, db.select({ id: deliveryRelayLegs.handoffPointId }).from(deliveryRelayLegs).where(and(eq(deliveryRelayLegs.deliveryId, delivery.id))))),
      ]);

      const userIds = new Set<number>();
      if (delivery.courierId) userIds.add(delivery.courierId);
      trackingPoints.forEach((point) => userIds.add(point.courierId));
      scans.forEach((scan) => userIds.add(scan.scannedByUserId));
      legs.forEach((leg) => [leg.fromCourierId, leg.toCourierId, leg.currentCustodianId].forEach((id) => { if (id) userIds.add(id); }));
      offers.forEach((offer) => { userIds.add(offer.offeredByCourierId); userIds.add(offer.offeredToCourierId); });
      inspections.forEach((inspection) => userIds.add(inspection.inspectorCourierId));
      stopRows.forEach(({ run }) => userIds.add(run.courierId));
      const people = userIds.size ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, Array.from(userIds))) : [];
      const peopleById = new Map(people.map((person) => [person.id, person]));
      const pointById = new Map(handoffPoints.map((point) => [point.id, point]));
      const person = (id: number | null | undefined) => id ? peopleById.get(id) ?? { id, name: null, email: null } : null;

      return {
        delivery: {
          id: delivery.id,
          trackingCode: delivery.trackingCode,
          status: delivery.status,
          courier: person(delivery.courierId),
          pickup: { latitude: Number(delivery.pickupLatitude), longitude: Number(delivery.pickupLongitude) },
          dropoff: { latitude: Number(delivery.dropoffLatitude), longitude: Number(delivery.dropoffLongitude) },
          createdAt: delivery.createdAt,
          updatedAt: delivery.updatedAt,
          actualDeliveryTime: delivery.actualDeliveryTime,
        },
        trackingPoints: trackingPoints.map((point) => ({
          id: point.id,
          courier: person(point.courierId),
          latitude: Number(point.latitude),
          longitude: Number(point.longitude),
          accuracy: point.accuracy ? Number(point.accuracy) : null,
          speed: point.speed ? Number(point.speed) : null,
          heading: point.heading ? Number(point.heading) : null,
          timestamp: point.timestamp,
        })),
        scans: scans.map((scan) => ({ ...scan, scannedBy: person(scan.scannedByUserId) })),
        relayLegs: legs.map((leg) => ({ ...leg, fromCourier: person(leg.fromCourierId), toCourier: person(leg.toCourierId), currentCustodian: person(leg.currentCustodianId), handoffPoint: leg.handoffPointId ? pointById.get(leg.handoffPointId) ?? null : null })),
        handoffOffers: offers.map((offer) => ({ ...offer, offeredBy: person(offer.offeredByCourierId), offeredTo: person(offer.offeredToCourierId) })),
        inspections: inspections.map((inspection) => ({ ...inspection, inspector: person(inspection.inspectorCourierId) })),
        routeStops: stopRows.map(({ stop, run }) => ({ ...stop, runStatus: run.status, runCourier: person(run.courierId) })),
      };
    }),
});
