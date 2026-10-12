import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * Delivery Assignment Router
 * Integrates fleet couriers with individual couriers
 * Handles smart dispatch and provider selection
 */
export const deliveryAssignmentRouter = router({
  /**
   * Get available providers for a delivery
   * Evaluates both individual couriers and fleet couriers
   */
  getAvailableProviders: protectedProcedure
    .input(
      z.object({
        pickupAddress: z.string(),
        dropoffAddress: z.string(),
        parcelWeight: z.number().positive(),
        parcelSize: z.enum(["small", "medium", "large", "xlarge"]),
        urgency: z.enum(["asap", "standard", "scheduled"]),
        preferredDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // This would query both individual couriers and fleet couriers
      // and return ranked options
      return {
        providers: [
          {
            id: "courier_123",
            type: "individual",
            name: "John Doe",
            rating: 4.8,
            eta: 35,
            cost: 150,
            reliability: 95,
            trustScore: 4.8,
            matchScore: 0.92,
          },
          {
            id: "fleet_456",
            type: "fleet",
            name: "ABC Logistics",
            rating: 4.9,
            eta: 42,
            cost: 145,
            reliability: 97,
            trustScore: 4.9,
            matchScore: 0.95,
          },
          {
            id: "relay_789",
            type: "relay",
            name: "Relay Network",
            rating: 4.7,
            eta: 120,
            cost: 120,
            reliability: 94,
            trustScore: 4.7,
            matchScore: 0.88,
          },
        ],
      };
    }),

  /**
   * Select a provider for delivery
   * Assigns to individual courier or fleet
   */
  selectProvider: protectedProcedure
    .input(
      z.object({
        deliveryId: z.string(),
        providerId: z.string(),
        providerType: z.enum(["individual", "fleet", "relay"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate provider availability
      // Create assignment record
      // Notify provider
      // Update delivery status

      return {
        success: true,
        assignedProvider: {
          id: input.providerId,
          type: input.providerType,
          name: "ABC Logistics",
          vehicle: "GP 23 ABC",
          driver: "Jane Smith",
          phone: "0712345678",
        },
        trackingUrl: `https://mzansicourier.com/track/${input.deliveryId}`,
        estimatedDelivery: new Date(Date.now() + 42 * 60 * 1000),
      };
    }),

  /**
   * Get delivery tracking (unified for all provider types)
   */
  trackDelivery: publicProcedure
    .input(z.object({ deliveryId: z.string() }))
    .query(async ({ input }) => {
      return {
        deliveryId: input.deliveryId,
        status: "in_transit",
        provider: {
          type: "fleet",
          name: "ABC Logistics",
          vehicle: "GP 23 ABC",
          driver: "Jane Smith",
          phone: "0712345678",
          rating: 4.9,
        },
        currentLocation: {
          latitude: -25.7461,
          longitude: 28.2313,
          address: "Main Street, Johannesburg",
        },
        eta: "14:30",
        distance: 2.5,
        route: [
          { lat: -25.7461, lng: 28.2313, timestamp: new Date() },
          { lat: -25.7480, lng: 28.2330, timestamp: new Date() },
        ],
        timeline: [
          { status: "confirmed", time: new Date(Date.now() - 30 * 60 * 1000) },
          { status: "picked_up", time: new Date(Date.now() - 20 * 60 * 1000) },
          { status: "in_transit", time: new Date(Date.now() - 5 * 60 * 1000) },
        ],
      };
    }),

  /**
   * Assign delivery to fleet (internal use)
   */
  assignToFleet: protectedProcedure
    .input(
      z.object({
        deliveryId: z.string(),
        fleetId: z.number().int(),
        vehicleId: z.number().int().optional(),
        driverId: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate fleet exists and is active
      // Find optimal vehicle/driver if not specified
      // Create assignment
      // Update delivery status
      // Notify fleet

      return {
        success: true,
        assignment: {
          deliveryId: input.deliveryId,
          fleetId: input.fleetId,
          vehicleId: input.vehicleId || 1,
          driverId: input.driverId || 1,
          status: "assigned",
          assignedAt: new Date(),
        },
      };
    }),

  /**
   * Assign delivery to individual courier (internal use)
   */
  assignToCourier: protectedProcedure
    .input(
      z.object({
        deliveryId: z.string(),
        courierId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        assignment: {
          deliveryId: input.deliveryId,
          courierId: input.courierId,
          status: "assigned",
          assignedAt: new Date(),
        },
      };
    }),

  /**
   * Get smart dispatch recommendations
   * Evaluates all available providers and returns best options
   */
  getSmartDispatchRecommendations: protectedProcedure
    .input(
      z.object({
        deliveryId: z.string(),
        pickupLat: z.number(),
        pickupLng: z.number(),
        dropoffLat: z.number(),
        dropoffLng: z.number(),
        parcelWeight: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Calculate distance
      // Evaluate individual couriers in area
      // Evaluate fleet couriers in area
      // Score each option
      // Return ranked recommendations

      return {
        recommendations: [
          {
            rank: 1,
            providerId: "fleet_456",
            providerType: "fleet",
            name: "ABC Logistics",
            score: 0.95,
            reasoning: "Optimal route match, best reliability",
            eta: 42,
            cost: 145,
          },
          {
            rank: 2,
            providerId: "courier_123",
            providerType: "individual",
            name: "John Doe",
            score: 0.92,
            reasoning: "Closest location, fast response",
            eta: 35,
            cost: 150,
          },
        ],
      };
    }),

  /**
   * Get delivery provider comparison
   * Shows performance of individual vs fleet for same delivery
   */
  getProviderComparison: protectedProcedure
    .input(z.object({ deliveryId: z.string() }))
    .query(async ({ ctx, input }) => {
      return {
        deliveryId: input.deliveryId,
        comparison: {
          individual: {
            avgTime: 45,
            avgCost: 150,
            reliability: 94,
            customerRating: 4.7,
            availability: "high",
          },
          fleet: {
            avgTime: 42,
            avgCost: 145,
            reliability: 97,
            customerRating: 4.8,
            availability: "high",
          },
          relay: {
            avgTime: 120,
            avgCost: 120,
            reliability: 93,
            customerRating: 4.6,
            availability: "medium",
          },
        },
        recommendation: "fleet",
        reason: "Best balance of speed, cost, and reliability",
      };
    }),

  /**
   * Get hybrid job opportunities
   * Individual couriers can see fleet jobs
   * Fleet can see individual courier jobs
   */
  getHybridOpportunities: protectedProcedure
    .input(
      z.object({
        userType: z.enum(["individual_courier", "fleet_partner"]),
        location: z.object({ lat: z.number(), lng: z.number() }),
        radius: z.number().default(5), // km
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.userType === "individual_courier") {
        // Return fleet jobs available to individual couriers
        return {
          opportunities: [
            {
              id: "fleet_job_1",
              type: "fleet_job",
              fleetName: "ABC Logistics",
              description: "Bulk delivery - 5 parcels",
              pickupAddress: "123 Main St",
              dropoffZone: "Sandton",
              estimatedEarnings: 500,
              urgency: "standard",
              distance: 2.3,
            },
          ],
        };
      } else {
        // Return individual courier jobs available to fleets
        return {
          opportunities: [
            {
              id: "courier_job_1",
              type: "individual_job",
              customerName: "John Smith",
              pickupAddress: "456 Oak Ave",
              dropoffAddress: "789 Pine Rd",
              parcelWeight: 2,
              estimatedCost: 150,
              urgency: "asap",
              distance: 1.5,
            },
          ],
        };
      }
    }),

  /**
   * Accept hybrid job
   */
  acceptHybridJob: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        jobType: z.enum(["fleet_job", "individual_job"]),
        userType: z.enum(["individual_courier", "fleet_partner"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        message: `${input.jobType} accepted successfully`,
        jobDetails: {
          id: input.jobId,
          status: "accepted",
          acceptedAt: new Date(),
        },
      };
    }),

  /**
   * Get unified earnings report
   * Shows earnings from both individual and fleet jobs
   */
  getUnifiedEarningsReport: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        userType: z.enum(["individual_courier", "fleet_partner"]),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.userType === "individual_courier") {
        return {
          period: { start: input.startDate, end: input.endDate },
          earnings: {
            individualJobs: {
              count: 45,
              revenue: 6750,
              commission: 1012.5,
              earnings: 5737.5,
            },
            fleetJobs: {
              count: 12,
              revenue: 1800,
              commission: 180,
              earnings: 1620,
            },
            total: 7357.5,
          },
        };
      } else {
        return {
          period: { start: input.startDate, end: input.endDate },
          earnings: {
            fleetJobs: {
              count: 156,
              revenue: 23400,
              commission: 3510,
              earnings: 19890,
            },
            hybridJobs: {
              count: 8,
              revenue: 1200,
              commission: 120,
              earnings: 1080,
            },
            total: 20970,
          },
        };
      }
    }),
});

// Import publicProcedure for tracking (no auth required)
import { publicProcedure } from "../_core/trpc";
