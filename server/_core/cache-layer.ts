/**
 * Advanced Caching Layer for 500 Concurrent Users
 * Implements multi-level caching strategy:
 * 1. In-memory LRU cache (hot data)
 * 2. Query result caching
 * 3. Computed value caching
 */

import { LRUCache } from 'lru-cache';

// ============================================================
// LRU CACHE CONFIGURATION FOR 500 CONCURRENT USERS
// ============================================================

interface CacheOptions {
  max: number;           // Max items in cache
  maxSize: number;       // Max total size (bytes)
  ttl: number;           // Time to live (ms)
  updateAgeOnGet: boolean;
  updateAgeOnHas: boolean;
}

// Cache for user data (frequently accessed)
const userCacheOptions: CacheOptions = {
  max: 500,              // Cache up to 500 users
  maxSize: 50 * 1024 * 1024,  // 50MB max
  ttl: 5 * 60 * 1000,    // 5 minute TTL
  updateAgeOnGet: true,
  updateAgeOnHas: false
};

// Cache for delivery data (frequently accessed)
const deliveryCacheOptions: CacheOptions = {
  max: 1000,             // Cache up to 1000 deliveries
  maxSize: 100 * 1024 * 1024, // 100MB max
  ttl: 2 * 60 * 1000,    // 2 minute TTL
  updateAgeOnGet: true,
  updateAgeOnHas: false
};

// Cache for computed values (rarely changes)
const computedCacheOptions: CacheOptions = {
  max: 100,
  maxSize: 10 * 1024 * 1024,  // 10MB max
  ttl: 10 * 60 * 1000,   // 10 minute TTL
  updateAgeOnGet: true,
  updateAgeOnHas: false
};

// ============================================================
// CACHE INSTANCES
// ============================================================

class CacheManager {
  private userCache: LRUCache<string, any>;
  private deliveryCache: LRUCache<string, any>;
  private computedCache: LRUCache<string, any>;
  private stats = {
    userHits: 0,
    userMisses: 0,
    deliveryHits: 0,
    deliveryMisses: 0,
    computedHits: 0,
    computedMisses: 0
  };

  constructor() {
    this.userCache = new LRUCache(userCacheOptions as any);
    this.deliveryCache = new LRUCache(deliveryCacheOptions as any);
    this.computedCache = new LRUCache(computedCacheOptions as any);
  }

  // ============================================================
  // USER CACHE OPERATIONS
  // ============================================================

  getUser(userId: string): any | undefined {
    const cached = this.userCache.get(userId);
    if (cached) {
      this.stats.userHits++;
      return cached;
    }
    this.stats.userMisses++;
    return undefined;
  }

  setUser(userId: string, data: any): void {
    this.userCache.set(userId, data);
  }

  invalidateUser(userId: string): void {
    this.userCache.delete(userId);
  }

  // ============================================================
  // DELIVERY CACHE OPERATIONS
  // ============================================================

  getDelivery(deliveryId: string): any | undefined {
    const cached = this.deliveryCache.get(deliveryId);
    if (cached) {
      this.stats.deliveryHits++;
      return cached;
    }
    this.stats.deliveryMisses++;
    return undefined;
  }

  setDelivery(deliveryId: string, data: any): void {
    this.deliveryCache.set(deliveryId, data);
  }

  invalidateDelivery(deliveryId: string): void {
    this.deliveryCache.delete(deliveryId);
  }

  // ============================================================
  // COMPUTED VALUE CACHE OPERATIONS
  // ============================================================

  getComputed(key: string): any | undefined {
    const cached = this.computedCache.get(key);
    if (cached) {
      this.stats.computedHits++;
      return cached;
    }
    this.stats.computedMisses++;
    return undefined;
  }

  setComputed(key: string, data: any): void {
    this.computedCache.set(key, data);
  }

  invalidateComputed(key: string): void {
    this.computedCache.delete(key);
  }

  // ============================================================
  // CACHE STATISTICS
  // ============================================================

  getStats() {
    return {
      user: {
        hits: this.stats.userHits,
        misses: this.stats.userMisses,
        hitRate: this.stats.userHits + this.stats.userMisses > 0 
          ? (this.stats.userHits / (this.stats.userHits + this.stats.userMisses) * 100).toFixed(2) + '%'
          : 'N/A',
        size: this.userCache.size,
        maxSize: userCacheOptions.max
      },
      delivery: {
        hits: this.stats.deliveryHits,
        misses: this.stats.deliveryMisses,
        hitRate: this.stats.deliveryHits + this.stats.deliveryMisses > 0
          ? (this.stats.deliveryHits / (this.stats.deliveryHits + this.stats.deliveryMisses) * 100).toFixed(2) + '%'
          : 'N/A',
        size: this.deliveryCache.size,
        maxSize: deliveryCacheOptions.max
      },
      computed: {
        hits: this.stats.computedHits,
        misses: this.stats.computedMisses,
        hitRate: this.stats.computedHits + this.stats.computedMisses > 0
          ? (this.stats.computedHits / (this.stats.computedHits + this.stats.computedMisses) * 100).toFixed(2) + '%'
          : 'N/A',
        size: this.computedCache.size,
        maxSize: computedCacheOptions.max
      }
    };
  }

  // ============================================================
  // CACHE CLEARING
  // ============================================================

  clear(): void {
    this.userCache.clear();
    this.deliveryCache.clear();
    this.computedCache.clear();
    this.stats = {
      userHits: 0,
      userMisses: 0,
      deliveryHits: 0,
      deliveryMisses: 0,
      computedHits: 0,
      computedMisses: 0
    };
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const cacheManager = new CacheManager();

// ============================================================
// CACHE DECORATOR FOR FUNCTIONS
// ============================================================

export function cacheable(
  ttl: number = 5 * 60 * 1000,
  keyBuilder?: (...args: any[]) => string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = new Map<string, { value: any; expiry: number }>();

    descriptor.value = async function (...args: any[]) {
      const key = keyBuilder ? keyBuilder(...args) : JSON.stringify(args);
      const cached = cache.get(key);

      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(key, { value: result, expiry: Date.now() + ttl });
      return result;
    };

    return descriptor;
  };
}

// ============================================================
// BATCH OPERATION CACHE
// ============================================================

class BatchCache {
  private batches = new Map<string, Promise<any>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Batch multiple requests for the same resource
   * Reduces database queries by combining requests
   */
  async batch<T>(
    key: string,
    fn: () => Promise<T>,
    debounceMs: number = 10
  ): Promise<T> {
    // If batch already in progress, wait for it
    if (this.batches.has(key)) {
      return this.batches.get(key)!;
    }

    // Clear existing debounce timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    // Create new batch promise
    const batchPromise = new Promise<T>((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          const result = await fn();
          this.batches.delete(key);
          this.debounceTimers.delete(key);
          resolve(result);
        } catch (error) {
          this.batches.delete(key);
          this.debounceTimers.delete(key);
          reject(error);
        }
      }, debounceMs);

      this.debounceTimers.set(key, timer);
    });

    this.batches.set(key, batchPromise);
    return batchPromise;
  }
}

export const batchCache = new BatchCache();
