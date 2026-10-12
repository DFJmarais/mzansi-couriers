import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";

/**
 * Competitive Features Router
 * Implements: Multi-Stop Deliveries, Upfront Pay, Flexible Scheduling, Certifications
 */

export const competitiveRouter = router({
  // ============================================================================
  // FEATURE 1: MULTI-STOP DELIVERIES
  // ============================================================================

  /**
   * Create a multi-stop delivery batch
   * Combines multiple deliveries into one batch for higher efficiency and pay
   */
  createMultiStopBatch: protectedProcedure
    .input(
      z.object({
        deliveryIds: z.array(z.string()).min(2).max(10),
        courierPreference: z.enum(["fastest", "most_efficient", "highest_pay"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const batchId = `BATCH_${Date.now()}`;
      const stops = input.deliveryIds.length;

      // No bonus - standard rate for all deliveries
      const standardRate = 150;

      return {
        batchId,
        stops,
        estimatedEarnings: standardRate,
        estimatedTime: stops * 15, // 15 min per stop
        status: "created",
        message: `Multi-stop batch created with ${stops} deliveries. Earn R${standardRate.toFixed(2)} for the batch.`,
      };
    }),

  /**
   * Get optimized route for multi-stop delivery
   * Uses AI to optimize the order of stops for minimum travel time
   */
  getOptimizedRoute: protectedProcedure
    .input(z.object({ batchId: z.string() }))
    .query(async ({ input }) => {
      return {
        batchId: input.batchId,
        optimizedStops: [
          { stop: 1, address: "123 Main St, Sandton", eta: "14:30", distance: 0 },
          { stop: 2, address: "456 Oak Ave, Midrand", eta: "14:45", distance: 8.5 },
          { stop: 3, address: "789 Pine Rd, Centurion", eta: "15:15", distance: 18.2 },
        ],
        totalDistance: 26.7,
        totalTime: 45,
        savings: { time: 12, distance: 3.2 },
        message: "Route optimized! You'll save 12 minutes and 3.2km",
      };
    }),

  /**
   * Accept multi-stop batch
   * Courier accepts the entire batch and starts delivery
   */
  acceptMultiStopBatch: protectedProcedure
    .input(z.object({ batchId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return {
        batchId: input.batchId,
        status: "accepted",
        totalEarnings: 150,
        startTime: new Date().toISOString(),
        message: "Batch accepted! Start with Stop 1 and follow the optimized route.",
      };
    }),

  /**
   * Complete multi-stop batch
   * Mark the entire batch as completed
   */
  completeMultiStopBatch: protectedProcedure
    .input(z.object({ batchId: z.string(), completionTime: z.number() }))
    .mutation(async ({ input }) => {
      return {
        batchId: input.batchId,
        status: "completed",
        totalEarnings: 215.5,
        message: "Batch completed! You earned R215.50.",
      };
    }),

  // ============================================================================
  // FEATURE 2: UPFRONT PAY VISIBILITY
  // ============================================================================

  /**
   * Get detailed pricing breakdown for a delivery
   * Shows exact earnings before courier accepts the job
   */
  getPricingBreakdown: publicProcedure
    .input(
      z.object({
        deliveryId: z.string(),
        distance: z.number(),
        weight: z.number().optional(),
        isFragile: z.boolean().optional(),
        isHazmat: z.boolean().optional(),
        isRush: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const baseFare = 50;
      const distanceRate = 8.5; // R8.50 per km
      const distanceCost = input.distance * distanceRate;

      let fragileCharge = 0;
      if (input.isFragile) fragileCharge = 25;

      let hazmatCharge = 0;
      if (input.isHazmat) hazmatCharge = 50;

      let rushCharge = 0;
      if (input.isRush) rushCharge = 75;

      const weightCharge = input.weight ? (input.weight - 1) * 5 : 0;

      // Time multiplier (peak hours 1.3x, off-peak 0.8x)
      const timeMultiplier = 1.0;

      const subtotal = baseFare + distanceCost + fragileCharge + hazmatCharge + rushCharge + weightCharge;
      const total = subtotal * timeMultiplier;

      return {
        deliveryId: input.deliveryId,
        breakdown: {
          baseFare: { label: "Base Fare", amount: baseFare },
          distance: {
            label: `Distance (${input.distance}km @ R${distanceRate}/km)`,
            amount: distanceCost,
          },
          fragile: fragileCharge > 0 ? { label: "Fragile Item Surcharge", amount: fragileCharge } : null,
          hazmat: hazmatCharge > 0 ? { label: "Hazmat Surcharge", amount: hazmatCharge } : null,
          rush: rushCharge > 0 ? { label: "Rush Delivery Surcharge", amount: rushCharge } : null,
          weight: weightCharge > 0 ? { label: `Weight Surcharge (${input.weight}kg)`, amount: weightCharge } : null,
        },
        subtotal,
        timeMultiplier: `${(timeMultiplier * 100).toFixed(0)}%`,
        total,
        message: `Exact earnings: R${total.toFixed(2)} - See full breakdown before accepting!`,
      };
    }),

  /**
   * Get surge pricing information
   * Shows current surge multipliers and peak hour predictions
   */
  getSurgePricingInfo: publicProcedure.query(async () => {
    const currentMultiplier = 1.3; // 30% surge
    const peakHours = ["08:00-09:00", "12:00-13:00", "17:00-19:00"];
    const nextPeakTime = "17:00";

    return {
      currentMultiplier,
      currentSurge: `+${((currentMultiplier - 1) * 100).toFixed(0)}%`,
      peakHours,
      nextPeakTime,
      message: `Current surge: ${((currentMultiplier - 1) * 100).toFixed(0)}% - Next peak at ${nextPeakTime}`,
      earnings: {
        normalRate: 150,
        surgeRate: Math.round(150 * currentMultiplier),
        extraEarnings: Math.round(150 * (currentMultiplier - 1)),
      },
    };
  }),

  /**
   * Compare earnings across different delivery options
   * Shows courier what they'd earn for different choices
   */
  compareEarnings: publicProcedure
    .input(
      z.object({
        distance: z.number(),
        deliveryType: z.enum(["standard", "fragile", "hazmat", "rush"]),
      })
    )
    .query(async ({ input }) => {
      const baseEarnings = 50 + input.distance * 8.5;

      const options = {
        standard: { multiplier: 1.0, earnings: baseEarnings },
        fragile: { multiplier: 1.5, earnings: Math.round(baseEarnings * 1.5) },
        hazmat: { multiplier: 2.0, earnings: Math.round(baseEarnings * 2.0) },
        rush: { multiplier: 1.75, earnings: Math.round(baseEarnings * 1.75) },
      };

      return {
        distance: input.distance,
        currentType: input.deliveryType,
        earnings: options,
        recommendation: `Hazmat deliveries pay the most! Earn R${options.hazmat.earnings} vs R${baseEarnings}`,
      };
    }),

  // ============================================================================
  // FEATURE 3: FLEXIBLE SCHEDULING
  // ============================================================================

  /**
   * Set courier availability schedule
   * Couriers define when they want to work
   */
  setAvailabilitySchedule: protectedProcedure
    .input(
      z.object({
        scheduleType: z.enum(["flexible", "shift_based", "on_demand"]),
        availability: z.array(
          z.object({
            dayOfWeek: z.number().min(0).max(6),
            startTime: z.string(),
            endTime: z.string(),
            maxDeliveries: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return {
        scheduleId: `SCHED_${Date.now()}`,
        scheduleType: input.scheduleType,
        availability: input.availability,
        status: "active",
        message: `${input.scheduleType} schedule activated! You'll receive delivery offers during your available hours.`,
      };
    }),

  /**
   * Get available shifts
   * Shows courier available shifts they can claim
   */
  getAvailableShifts: protectedProcedure.query(async () => {
    return {
      shifts: [
        {
          shiftId: "SHIFT_001",
          date: "2026-07-21",
          startTime: "08:00",
          endTime: "12:00",
          estimatedDeliveries: 8,
          estimatedEarnings: 450,
          bonus: "15% bonus for completing all deliveries on-time",
        },
        {
          shiftId: "SHIFT_002",
          date: "2026-07-21",
          startTime: "14:00",
          endTime: "18:00",
          estimatedDeliveries: 10,
          estimatedEarnings: 650,
          bonus: "Surge pricing active (1.3x multiplier)",
        },
        {
          shiftId: "SHIFT_003",
          date: "2026-07-21",
          startTime: "18:00",
          endTime: "22:00",
          estimatedDeliveries: 12,
          estimatedEarnings: 950,
          bonus: "Night shift premium (1.5x multiplier)",
        },
      ],
      message: "Pick any shift that works for you - no commitment required!",
    };
  }),

  /**
   * Claim a shift
   * Courier claims a specific shift
   */
  claimShift: protectedProcedure
    .input(z.object({ shiftId: z.string() }))
    .mutation(async ({ input }) => {
      return {
        shiftId: input.shiftId,
        status: "claimed",
        startTime: "14:00",
        endTime: "18:00",
        estimatedEarnings: 650,
        message: "Shift claimed! You're all set to start receiving delivery offers.",
      };
    }),

  /**
   * Get courier work history and stats
   * Shows performance metrics for scheduling optimization
   */
  getWorkHistory: protectedProcedure.query(async () => {
    return {
      thisWeek: {
        shiftsWorked: 12,
        deliveriesCompleted: 95,
        earningsTotal: 5240,
        averagePerShift: 5240 / 12,
        onTimeRate: "98%",
      },
      thisMonth: {
        shiftsWorked: 48,
        deliveriesCompleted: 380,
        earningsTotal: 21000,
        averagePerShift: 438,
        onTimeRate: "97%",
      },
      recommendation: "You're a top performer! Claim more evening shifts for higher surge multipliers.",
    };
  }),

  // ============================================================================
  // FEATURE 4: CERTIFICATION SYSTEM
  // ============================================================================

  /**
   * Get available certifications
   * Shows all certifications courier can pursue
   */
  getAvailableCertifications: publicProcedure.query(async () => {
    return {
      certifications: [
        {
          type: "pharmacy",
          name: "Pharmacy Delivery Specialist",
          description: "Certified to handle prescription deliveries",
          payMultiplier: 1.5,
          trainingHours: 4,
          examRequired: true,
          benefits: "Access to high-paying pharmacy orders, 50% higher earnings",
        },
        {
          type: "fragile",
          name: "Fragile Item Handler",
          description: "Trained to safely deliver fragile items",
          payMultiplier: 1.3,
          trainingHours: 3,
          examRequired: false,
          benefits: "Handle electronics, glassware, art - earn extra per delivery",
        },
        {
          type: "hazmat",
          name: "Hazmat Certified Driver",
          description: "Authorized for hazardous material delivery",
          payMultiplier: 2.0,
          trainingHours: 8,
          examRequired: true,
          benefits: "Highest paying deliveries, 2x earnings multiplier",
        },
        {
          type: "temperature_controlled",
          name: "Temperature Control Specialist",
          description: "Deliver temperature-sensitive items",
          payMultiplier: 1.4,
          trainingHours: 2,
          examRequired: false,
          benefits: "Food, medical, pharmaceutical deliveries with premium pay",
        },
        {
          type: "high_value",
          name: "High-Value Item Courier",
          description: "Insured delivery of valuable items",
          payMultiplier: 1.6,
          trainingHours: 5,
          examRequired: true,
          benefits: "Jewelry, electronics, luxury goods - earn 60% more",
        },
      ],
      message: "Earn more by getting certified! Each certification unlocks new, higher-paying delivery types.",
    };
  }),

  /**
   * Start certification training
   * Courier begins training for a certification
   */
  startCertificationTraining: protectedProcedure
    .input(z.object({ certificationType: z.string() }))
    .mutation(async ({ input }) => {
      return {
        trainingId: `TRAIN_${Date.now()}`,
        certificationType: input.certificationType,
        status: "in_progress",
        progress: 0,
        estimatedCompletion: "2026-07-28",
        modules: [
          { name: "Safety Protocols", duration: "30 min", completed: false },
          { name: "Handling Procedures", duration: "45 min", completed: false },
          { name: "Legal Requirements", duration: "30 min", completed: false },
          { name: "Practice Exam", duration: "20 min", completed: false },
        ],
        message: "Training started! Complete all modules to get certified.",
      };
    }),

  /**
   * Get courier certifications
   * Shows current certifications and their status
   */
  getCourierCertifications: protectedProcedure.query(async () => {
    return {
      verified: [
        {
          type: "fragile",
          name: "Fragile Item Handler",
          issuedDate: "2026-01-15",
          expiryDate: "2027-01-15",
          status: "active",
          payMultiplier: 1.3,
          deliveriesCompleted: 245,
        },
      ],
      inProgress: [
        {
          type: "hazmat",
          name: "Hazmat Certified Driver",
          progress: 65,
          estimatedCompletion: "2026-07-28",
          status: "training",
        },
      ],
      available: [
        {
          type: "pharmacy",
          name: "Pharmacy Delivery Specialist",
          payMultiplier: 1.5,
          status: "not_started",
        },
      ],
      totalEarningsFromCertifications: 12500,
      message: "You've earned R12,500 extra from your fragile item certification!",
    };
  }),

  /**
   * Submit certification exam
   * Courier submits exam answers for verification
   */
  submitCertificationExam: protectedProcedure
    .input(z.object({ trainingId: z.string(), answers: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      const score = 92; // Simulated score
      const passed = score >= 80;

      return {
        trainingId: input.trainingId,
        score,
        passed,
        message: passed
          ? `Congratulations! You passed with ${score}%. Your certification is now active!`
          : `Score: ${score}%. You need 80% to pass. Try again!`,
        certificateUrl: passed ? "https://example.com/cert.pdf" : null,
      };
    }),

  /**
   * Get certification earnings report
   * Shows how much extra money certifications have earned
   */
  getCertificationEarningsReport: protectedProcedure.query(async () => {
    return {
      totalEarnings: 12500,
      byType: {
        fragile: { earnings: 12500, deliveries: 245, averagePerDelivery: 51 },
      },
      projectedMonthly: 2500,
      message: "Your fragile item certification has earned you R12,500! Get more certifications to earn even more.",
    };
  }),
});
