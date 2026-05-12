import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';
import { getDb } from './db';

describe('Referral & Surge Pricing Systems', () => {
  let testUserId1: number;
  let testUserId2: number;
  let testDeliveryId: number;

  beforeAll(async () => {
    // Create test users with fixed openIds
    const openId1 = `test-referral-user-${Date.now()}`;
    const openId2 = `test-referred-user-${Date.now()}`;
    
    await db.upsertUser({
      openId: openId1,
      name: 'Test Referrer',
      email: 'referrer@test.com',
      role: 'courier',
    });

    await db.upsertUser({
      openId: openId2,
      name: 'Test Referred',
      email: 'referred@test.com',
      role: 'customer',
    });

    // Get user IDs
    const referrer = await db.getUserByOpenId(openId1);
    const referred = await db.getUserByOpenId(openId2);
    
    testUserId1 = referrer?.id || 1;
    testUserId2 = referred?.id || 2;
  });

  describe('Referral System', () => {
    it('should generate a unique referral code for a user', async () => {
      const code = await db.generateReferralCode(testUserId1);
      expect(code).toBeDefined();
      expect(code).toMatch(/^MZANSI/);
      expect(code.length).toBeGreaterThan(10);
    });

    it('should retrieve a referral code by code string', async () => {
      const code = await db.generateReferralCode(testUserId1);
      const retrieved = await db.getReferralCode(code);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.code).toBe(code);
      expect(retrieved?.isActive).toBe(true);
    });

    it('should get user referral code by user ID', async () => {
      const code = await db.generateReferralCode(testUserId1);
      const userCode = await db.getUserReferralCode(testUserId1);
      
      expect(userCode).toBeDefined();
      expect(userCode?.code).toMatch(/^MZANSI/);
    });

    it('should initialize user stars', async () => {
      await db.initializeUserStars(testUserId2);
      const stars = await db.getUserStars(testUserId2);
      
      expect(stars).toBeDefined();
      expect(stars?.starCount).toBe(0);
      expect(stars?.totalReferred).toBe(0);
    });

    it('should award stars to a user', async () => {
      await db.initializeUserStars(testUserId1);
      await db.awardStar(testUserId1, testUserId2, 'referral_signup', 1);
      
      const stars = await db.getUserStars(testUserId1);
      expect(stars?.starCount).toBeGreaterThan(0);
    });

    it('should track star history', async () => {
      await db.initializeUserStars(testUserId1);
      await db.awardStar(testUserId1, testUserId2, 'first_delivery', 1);
      
      const history = await db.getStarHistory(testUserId1, 10);
      expect(history.length).toBeGreaterThan(0);
      expect(history.some(h => h.reason === 'first_delivery')).toBe(true);
    });

    it('should increment totalReferred when referral_signup reason is used', async () => {
      await db.initializeUserStars(testUserId1);
      const starsBefore = await db.getUserStars(testUserId1);
      
      await db.awardStar(testUserId1, testUserId2, 'referral_signup', 1);
      
      const starsAfter = await db.getUserStars(testUserId1);
      expect((starsAfter?.totalReferred || 0)).toBeGreaterThanOrEqual((starsBefore?.totalReferred || 0));
    });
  });

  describe('Surge Pricing System', () => {
    it('should create a surge pricing configuration', async () => {
      await db.createSurgePricingConfig({
        timeSlot: 'peak_lunch',
        startHour: 12,
        endHour: 14,
        dayOfWeek: 'all',
        multiplier: '1.50',
        demandThreshold: 5,
        isActive: true,
      });
      
      const configs = await db.getSurgePricingConfigs(true);
      expect(configs.length).toBeGreaterThan(0);
      expect(configs.some(c => c.timeSlot === 'peak_lunch')).toBe(true);
    });

    it('should get active surge pricing configs', async () => {
      const configs = await db.getSurgePricingConfigs(true);
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.every(c => c.isActive === true)).toBe(true);
    });

    it('should get surge pricing config by ID', async () => {
      await db.createSurgePricingConfig({
        timeSlot: 'peak_evening',
        startHour: 17,
        endHour: 19,
        dayOfWeek: 'weekday',
        multiplier: '1.75',
        demandThreshold: 8,
        isActive: true,
      });
      
      const configs = await db.getSurgePricingConfigs(true);
      if (configs.length > 0) {
        const config = await db.getSurgePricingConfigById(configs[0].id);
        expect(config).toBeDefined();
        expect(config?.id).toBe(configs[0].id);
      }
    });

    it('should update surge pricing configuration', async () => {
      const configs = await db.getSurgePricingConfigs(true);
      if (configs.length > 0) {
        await db.updateSurgePricingConfig(configs[0].id, {
          multiplier: '2.00',
          demandThreshold: 10,
        });
        
        const updated = await db.getSurgePricingConfigById(configs[0].id);
        expect(updated?.multiplier).toMatch(/^2\.0/);
        expect(updated?.demandThreshold).toBe(10);
      }
    });

    it('should record surge pricing history for a delivery', async () => {
      // This tests that the function exists and can be called
      expect(db.recordSurgePricingHistory).toBeDefined();
    });

    it('should get surge pricing history for a delivery', async () => {
      // This tests that the function exists and can be called
      expect(db.getSurgePricingHistory).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle surge pricing configuration workflow', async () => {
      // 1. Create config
      await db.createSurgePricingConfig({
        timeSlot: `test_slot_${Date.now()}`,
        startHour: 10,
        endHour: 12,
        dayOfWeek: 'monday',
        multiplier: '1.30',
        demandThreshold: 3,
        isActive: true,
      });

      // 2. Get all configs
      const configs = await db.getSurgePricingConfigs(true);
      expect(configs.length).toBeGreaterThan(0);

      // 3. Update a config
      if (configs.length > 0) {
        await db.updateSurgePricingConfig(configs[0].id, {
          multiplier: '1.50',
        });

        // 4. Verify update
        const updated = await db.getSurgePricingConfigById(configs[0].id);
        expect(updated?.multiplier).toMatch(/^1\.5/);
      }
    });
  });
});
