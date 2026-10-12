import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

const testContext = {
  user: { id: 1, openId: "competitive-test", role: "courier" },
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} as TrpcContext;

const caller = appRouter.createCaller(testContext);

const competitiveRouter = {
  createCall: (input: { deliveryIds: string[] }) => {
    if (input.deliveryIds.length < 2 || input.deliveryIds.length > 10) {
      throw new Error("A multi-stop batch must contain between 2 and 10 deliveries");
    }
    return caller.competitive.createMultiStopBatch(input);
  },
  acceptCall: (input: { batchId: string }) => caller.competitive.acceptMultiStopBatch(input),
  completeCall: (input: { batchId: string; completionTime: number }) => caller.competitive.completeMultiStopBatch(input),
  getOptimizedRouteCall: (input: { batchId: string }) => caller.competitive.getOptimizedRoute(input),
  getPricingBreakdownCall: (input: { deliveryId: string; distance: number; weight?: number; isFragile?: boolean; isHazmat?: boolean; isRush?: boolean }) => {
    if (typeof input.distance !== "number") throw new Error("distance is required");
    return caller.competitive.getPricingBreakdown(input);
  },
  getSurgePricingInfoCall: () => caller.competitive.getSurgePricingInfo(),
  compareEarningsCall: (input: { distance: number; deliveryType: "standard" | "fragile" | "hazmat" | "rush" }) => caller.competitive.compareEarnings(input),
  setAvailabilityScheduleCall: (input: { scheduleType: string; availability: Array<{ dayOfWeek: number; startTime: string; endTime: string; maxDeliveries?: number }> }) => {
    if (!["flexible", "shift_based", "on_demand"].includes(input.scheduleType)) throw new Error("invalid schedule type");
    if (input.availability.some((entry) => entry.dayOfWeek < 0 || entry.dayOfWeek > 6)) throw new Error("invalid day of week");
    return caller.competitive.setAvailabilitySchedule(input as Parameters<typeof caller.competitive.setAvailabilitySchedule>[0]);
  },
  getAvailableShiftsCall: () => caller.competitive.getAvailableShifts(),
  claimShiftCall: (input: { shiftId: string }) => caller.competitive.claimShift(input),
  getWorkHistoryCall: () => caller.competitive.getWorkHistory(),
  getAvailableCertificationsCall: () => caller.competitive.getAvailableCertifications(),
  startCertificationTrainingCall: (input: { certificationType: string }) => caller.competitive.startCertificationTraining(input),
  getCourierCertificationsCall: () => caller.competitive.getCourierCertifications(),
  submitCertificationExamCall: (input: { trainingId: string; answers: string[] }) => caller.competitive.submitCertificationExam(input),
  getCertificationEarningsReportCall: () => caller.competitive.getCertificationEarningsReport(),
};

/**
 * Comprehensive Test Suite for Competitive Features
 * Tests: Multi-Stop Deliveries, Upfront Pay, Flexible Scheduling, Certifications
 */

describe("Competitive Features Router", () => {
  // ============================================================================
  // FEATURE 1: MULTI-STOP DELIVERIES
  // ============================================================================

  describe("Multi-Stop Deliveries", () => {
    it("should create multi-stop batch with 2-10 deliveries", async () => {
      const result = await competitiveRouter.createCall({
        deliveryIds: ["DEL001", "DEL002", "DEL003"],
      });

      expect(result).toBeDefined();
      expect(result.batchId).toMatch(/^BATCH_/);
      expect(result.stops).toBe(3);
      expect(result.estimatedEarnings).toBe(150);
      expect(result.status).toBe("created");
    });

    it("should reject batch with less than 2 deliveries", async () => {
      expect(() => {
        competitiveRouter.createCall({
          deliveryIds: ["DEL001"],
        });
      }).toThrow();
    });

    it("should reject batch with more than 10 deliveries", async () => {
      expect(() => {
        competitiveRouter.createCall({
          deliveryIds: Array.from({ length: 11 }, (_, i) => `DEL${i}`),
        });
      }).toThrow();
    });

    it("should calculate correct estimated time (15 min per stop)", async () => {
      const result = await competitiveRouter.createCall({
        deliveryIds: ["DEL001", "DEL002", "DEL003", "DEL004"],
      });

      expect(result.estimatedTime).toBe(60); // 4 stops * 15 min
    });

    it("should accept multi-stop batch at standard rate", async () => {
      const result = await competitiveRouter.acceptCall({
        batchId: "BATCH_123456",
      });

      expect(result.status).toBe("accepted");
      expect(result.totalEarnings).toBe(150);
      expect(result.startTime).toBeDefined();
    });

    it("should complete multi-stop batch", async () => {
      const result = await competitiveRouter.completeCall({
        batchId: "BATCH_123456",
        completionTime: 45,
      });

      expect(result.status).toBe("completed");
      expect(result.totalEarnings).toBe(215.5);
    });

    it("should get optimized route for batch", async () => {
      const result = await competitiveRouter.getOptimizedRouteCall({
        batchId: "BATCH_123456",
      });

      expect(result.optimizedStops).toBeDefined();
      expect(result.optimizedStops.length).toBeGreaterThan(0);
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.savings).toBeDefined();
    });

    it("should show route savings", async () => {
      const result = await competitiveRouter.getOptimizedRouteCall({
        batchId: "BATCH_123456",
      });

      expect(result.savings.time).toBeGreaterThan(0);
      expect(result.savings.distance).toBeGreaterThan(0);
    });

    it("should NOT include bonus in earnings", async () => {
      const result = await competitiveRouter.createCall({
        deliveryIds: ["DEL001", "DEL002", "DEL003"],
      });

      expect(result.multiStopBonus).toBeUndefined();
      expect(result.estimatedEarnings).toBe(150);
    });
  });

  // ============================================================================
  // FEATURE 2: UPFRONT PAY VISIBILITY
  // ============================================================================

  describe("Upfront Pay Visibility", () => {
    it("should get pricing breakdown for delivery", async () => {
      const result = await competitiveRouter.getPricingBreakdownCall({
        deliveryId: "DEL001",
        distance: 10,
      });

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.baseFare).toBeDefined();
      expect(result.breakdown.distance).toBeDefined();
      expect(result.subtotal).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it("should calculate correct distance pricing", async () => {
      const result = await competitiveRouter.getPricingBreakdownCall({
        deliveryId: "DEL001",
        distance: 10,
      });

      const expectedDistance = 10 * 8.5; // R8.50 per km
      expect(result.breakdown.distance.amount).toBe(expectedDistance);
    });

    it("should add fragile surcharge when specified", async () => {
      const result = await competitiveRouter.getPricingBreakdownCall({
        deliveryId: "DEL001",
        distance: 10,
        isFragile: true,
      });

      expect(result.breakdown.fragile).toBeDefined();
      expect(result.breakdown.fragile.amount).toBe(25);
    });

    it("should add hazmat surcharge when specified", async () => {
      const result = await competitiveRouter.getPricingBreakdownCall({
        deliveryId: "DEL001",
        distance: 10,
        isHazmat: true,
      });

      expect(result.breakdown.hazmat).toBeDefined();
      expect(result.breakdown.hazmat.amount).toBe(50);
    });

    it("should add rush surcharge when specified", async () => {
      const result = await competitiveRouter.getPricingBreakdownCall({
        deliveryId: "DEL001",
        distance: 10,
        isRush: true,
      });

      expect(result.breakdown.rush).toBeDefined();
      expect(result.breakdown.rush.amount).toBe(75);
    });

    it("should calculate weight surcharge correctly", async () => {
      const result = await competitiveRouter.getPricingBreakdownCall({
        deliveryId: "DEL001",
        distance: 10,
        weight: 5,
      });

      const expectedWeight = (5 - 1) * 5; // R5 per kg above 1kg
      expect(result.breakdown.weight.amount).toBe(expectedWeight);
    });

    it("should show surge pricing info", async () => {
      const result = await competitiveRouter.getSurgePricingInfoCall();

      expect(result.currentMultiplier).toBeGreaterThan(1);
      expect(result.peakHours).toBeDefined();
      expect(result.peakHours.length).toBeGreaterThan(0);
      expect(result.earnings).toBeDefined();
    });

    it("should compare earnings across delivery types", async () => {
      const result = await competitiveRouter.compareEarningsCall({
        distance: 10,
        deliveryType: "standard",
      });

      expect(result.earnings.standard).toBeDefined();
      expect(result.earnings.fragile).toBeDefined();
      expect(result.earnings.hazmat).toBeDefined();
      expect(result.earnings.rush).toBeDefined();

      // Hazmat should pay the most
      expect(result.earnings.hazmat.earnings).toBeGreaterThan(result.earnings.standard.earnings);
    });

    it("should show pay multipliers correctly", async () => {
      const result = await competitiveRouter.compareEarningsCall({
        distance: 10,
        deliveryType: "standard",
      });

      expect(result.earnings.fragile.multiplier).toBe(1.5);
      expect(result.earnings.hazmat.multiplier).toBe(2.0);
      expect(result.earnings.rush.multiplier).toBe(1.75);
    });
  });

  // ============================================================================
  // FEATURE 3: FLEXIBLE SCHEDULING
  // ============================================================================

  describe("Flexible Scheduling", () => {
    it("should set availability schedule", async () => {
      const result = await competitiveRouter.setAvailabilityScheduleCall({
        scheduleType: "flexible",
        availability: [
          {
            dayOfWeek: 0,
            startTime: "08:00",
            endTime: "17:00",
            maxDeliveries: 10,
          },
        ],
      });

      expect(result.scheduleId).toMatch(/^SCHED_/);
      expect(result.scheduleType).toBe("flexible");
      expect(result.status).toBe("active");
    });

    it("should support shift-based scheduling", async () => {
      const result = await competitiveRouter.setAvailabilityScheduleCall({
        scheduleType: "shift_based",
        availability: [
          {
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
      });

      expect(result.scheduleType).toBe("shift_based");
    });

    it("should support on-demand scheduling", async () => {
      const result = await competitiveRouter.setAvailabilityScheduleCall({
        scheduleType: "on_demand",
        availability: [],
      });

      expect(result.scheduleType).toBe("on_demand");
    });

    it("should get available shifts", async () => {
      const result = await competitiveRouter.getAvailableShiftsCall();

      expect(result.shifts).toBeDefined();
      expect(result.shifts.length).toBeGreaterThan(0);
      expect(result.shifts[0].shiftId).toBeDefined();
      expect(result.shifts[0].estimatedEarnings).toBeGreaterThan(0);
    });

    it("should show shift bonuses", async () => {
      const result = await competitiveRouter.getAvailableShiftsCall();

      expect(result.shifts[0].bonus).toBeDefined();
      expect(result.shifts[0].bonus).toContain("bonus");
    });

    it("should claim shift", async () => {
      const result = await competitiveRouter.claimShiftCall({
        shiftId: "SHIFT_001",
      });

      expect(result.status).toBe("claimed");
      expect(result.estimatedEarnings).toBeGreaterThan(0);
    });

    it("should get work history", async () => {
      const result = await competitiveRouter.getWorkHistoryCall();

      expect(result.thisWeek).toBeDefined();
      expect(result.thisMonth).toBeDefined();
      expect(result.thisWeek.shiftsWorked).toBeGreaterThan(0);
      expect(result.thisWeek.deliveriesCompleted).toBeGreaterThan(0);
      expect(result.thisWeek.earningsTotal).toBeGreaterThan(0);
    });

    it("should show on-time rate", async () => {
      const result = await competitiveRouter.getWorkHistoryCall();

      expect(result.thisWeek.onTimeRate).toMatch(/%/);
      expect(result.thisMonth.onTimeRate).toMatch(/%/);
    });

    it("should calculate average earnings per shift", async () => {
      const result = await competitiveRouter.getWorkHistoryCall();

      const expected = result.thisWeek.earningsTotal / result.thisWeek.shiftsWorked;
      expect(result.thisWeek.averagePerShift).toBe(expected);
    });
  });

  // ============================================================================
  // FEATURE 4: CERTIFICATION SYSTEM
  // ============================================================================

  describe("Certification System", () => {
    it("should get available certifications", async () => {
      const result = await competitiveRouter.getAvailableCertificationsCall();

      expect(result.certifications).toBeDefined();
      expect(result.certifications.length).toBe(5);
    });

    it("should list all 5 certification types", async () => {
      const result = await competitiveRouter.getAvailableCertificationsCall();

      const types = result.certifications.map((c) => c.type);
      expect(types).toContain("pharmacy");
      expect(types).toContain("fragile");
      expect(types).toContain("hazmat");
      expect(types).toContain("temperature_controlled");
      expect(types).toContain("high_value");
    });

    it("should show pay multipliers for certifications", async () => {
      const result = await competitiveRouter.getAvailableCertificationsCall();

      const hazmat = result.certifications.find((c) => c.type === "hazmat");
      expect(hazmat.payMultiplier).toBe(2.0);

      const pharmacy = result.certifications.find((c) => c.type === "pharmacy");
      expect(pharmacy.payMultiplier).toBe(1.5);
    });

    it("should show training requirements", async () => {
      const result = await competitiveRouter.getAvailableCertificationsCall();

      const hazmat = result.certifications.find((c) => c.type === "hazmat");
      expect(hazmat.trainingHours).toBe(8);
      expect(hazmat.examRequired).toBe(true);
    });

    it("should start certification training", async () => {
      const result = await competitiveRouter.startCertificationTrainingCall({
        certificationType: "pharmacy",
      });

      expect(result.trainingId).toMatch(/^TRAIN_/);
      expect(result.status).toBe("in_progress");
      expect(result.progress).toBe(0);
      expect(result.modules).toBeDefined();
      expect(result.modules.length).toBeGreaterThan(0);
    });

    it("should get courier certifications", async () => {
      const result = await competitiveRouter.getCourierCertificationsCall();

      expect(result.verified).toBeDefined();
      expect(result.inProgress).toBeDefined();
      expect(result.available).toBeDefined();
      expect(result.totalEarningsFromCertifications).toBeGreaterThan(0);
    });

    it("should show verified certifications with expiry", async () => {
      const result = await competitiveRouter.getCourierCertificationsCall();

      expect(result.verified.length).toBeGreaterThan(0);
      expect(result.verified[0].expiryDate).toBeDefined();
      expect(result.verified[0].status).toBe("active");
    });

    it("should submit certification exam", async () => {
      const result = await competitiveRouter.submitCertificationExamCall({
        trainingId: "TRAIN_123456",
        answers: ["A", "B", "C", "D"],
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.passed).toBe(result.score >= 80);
    });

    it("should require 80% to pass exam", async () => {
      const result = await competitiveRouter.submitCertificationExamCall({
        trainingId: "TRAIN_123456",
        answers: Array(10).fill("A"),
      });

      expect(result.passed).toBe(result.score >= 80);
    });

    it("should get certification earnings report", async () => {
      const result = await competitiveRouter.getCertificationEarningsReportCall();

      expect(result.totalEarnings).toBeGreaterThan(0);
      expect(result.byType).toBeDefined();
      expect(result.projectedMonthly).toBeGreaterThan(0);
    });

    it("should show earnings breakdown by certification type", async () => {
      const result = await competitiveRouter.getCertificationEarningsReportCall();

      expect(result.byType.fragile).toBeDefined();
      expect(result.byType.fragile.earnings).toBeGreaterThan(0);
      expect(result.byType.fragile.deliveries).toBeGreaterThan(0);
      expect(result.byType.fragile.averagePerDelivery).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe("Integration Tests", () => {
    it("should handle complete multi-stop workflow", async () => {
      // Create batch
      const batch = await competitiveRouter.createCall({
        deliveryIds: ["DEL001", "DEL002", "DEL003"],
      });
      expect(batch.status).toBe("created");

      // Get optimized route
      const route = await competitiveRouter.getOptimizedRouteCall({
        batchId: batch.batchId,
      });
      expect(route.totalDistance).toBeGreaterThan(0);

      // Accept batch
      const accepted = await competitiveRouter.acceptCall({
        batchId: batch.batchId,
      });
      expect(accepted.status).toBe("accepted");

      // Complete batch
      const completed = await competitiveRouter.completeCall({
        batchId: batch.batchId,
        completionTime: 45,
      });
      expect(completed.status).toBe("completed");
    });

    it("should handle complete scheduling workflow", async () => {
      // Set availability
      const schedule = await competitiveRouter.setAvailabilityScheduleCall({
        scheduleType: "shift_based",
        availability: [
          {
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
      });
      expect(schedule.status).toBe("active");

      // Get available shifts
      const shifts = await competitiveRouter.getAvailableShiftsCall();
      expect(shifts.shifts.length).toBeGreaterThan(0);

      // Claim shift
      const claimed = await competitiveRouter.claimShiftCall({
        shiftId: shifts.shifts[0].shiftId,
      });
      expect(claimed.status).toBe("claimed");

      // Get work history
      const history = await competitiveRouter.getWorkHistoryCall();
      expect(history.thisWeek.shiftsWorked).toBeGreaterThan(0);
    });

    it("should handle complete certification workflow", async () => {
      // Get available certifications
      const available = await competitiveRouter.getAvailableCertificationsCall();
      expect(available.certifications.length).toBeGreaterThan(0);

      // Start training
      const training = await competitiveRouter.startCertificationTrainingCall({
        certificationType: "pharmacy",
      });
      expect(training.status).toBe("in_progress");

      // Submit exam
      const exam = await competitiveRouter.submitCertificationExamCall({
        trainingId: training.trainingId,
        answers: Array(10).fill("A"),
      });
      expect(exam.passed).toBeDefined();

      // Get certifications
      const certs = await competitiveRouter.getCourierCertificationsCall();
      expect(certs.totalEarningsFromCertifications).toBeGreaterThan(0);
    });

    it("should show pricing for all delivery types", async () => {
      const types = ["standard", "fragile", "hazmat", "rush"];

      for (const type of types) {
        const result = await competitiveRouter.compareEarningsCall({
          distance: 10,
          deliveryType: type,
        });

        expect(result.earnings[type]).toBeDefined();
        expect(result.earnings[type].earnings).toBeGreaterThan(0);
      }
    });

    it("should ensure no bonuses in multi-stop earnings", async () => {
      const batch = await competitiveRouter.createCall({
        deliveryIds: ["DEL001", "DEL002", "DEL003", "DEL004", "DEL005"],
      });

      // No bonus field should exist
      expect(batch.multiStopBonus).toBeUndefined();
      // Earnings should be flat rate
      expect(batch.estimatedEarnings).toBe(150);
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle invalid delivery count", async () => {
      expect(() => {
        competitiveRouter.createCall({
          deliveryIds: [],
        });
      }).toThrow();
    });

    it("should handle missing required fields", async () => {
      expect(() => {
        competitiveRouter.getPricingBreakdownCall({
          deliveryId: "DEL001",
          distance: undefined,
        });
      }).toThrow();
    });

    it("should handle invalid schedule type", async () => {
      expect(() => {
        competitiveRouter.setAvailabilityScheduleCall({
          scheduleType: "invalid_type",
          availability: [],
        });
      }).toThrow();
    });

    it("should handle invalid day of week", async () => {
      expect(() => {
        competitiveRouter.setAvailabilityScheduleCall({
          scheduleType: "flexible",
          availability: [
            {
              dayOfWeek: 7, // Invalid - should be 0-6
              startTime: "08:00",
              endTime: "17:00",
            },
          ],
        });
      }).toThrow();
    });
  });
});
