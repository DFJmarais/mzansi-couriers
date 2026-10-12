/**
 * Advanced Caching for 500 Concurrent Users
 * Multi-level caching strategy for maximum performance
 */

// Simple in-memory cache for responses
class ResponseCache {
  private cache = new Map<string, { data: any; expiry: number; hits: number }>();
  private maxSize = 1000;
  private stats = { hits: 0, misses: 0, evictions: 0 };

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  set(key: string, data: any, ttlMs: number = 5000): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].hits - b[1].hits)[0];
      if (oldest) {
        this.cache.delete(oldest[0]);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
      hits: 0
    });
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : 'N/A',
      evictions: this.stats.evictions,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
    };
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }
}

// Request deduplication - combine identical concurrent requests
class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  getStats() {
    return {
      pendingRequests: this.pending.size
    };
  }
}

// Query result batching - combine multiple queries into one
class QueryBatcher {
  private batches = new Map<string, any[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private batchSize = 50;
  private batchTimeoutMs = 10;

  async batch<T>(
    batchKey: string,
    item: any,
    processor: (items: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, []);
      }

      const batch = this.batches.get(batchKey)!;
      const index = batch.length;
      batch.push(item);

      // Process if batch is full
      if (batch.length >= this.batchSize) {
        this.processBatch(batchKey, processor, resolve, reject, index);
        return;
      }

      // Set timer if first item
      if (batch.length === 1) {
        const timer = setTimeout(() => {
          this.processBatch(batchKey, processor, resolve, reject, index);
        }, this.batchTimeoutMs);
        this.timers.set(batchKey, timer);
      }
    });
  }

  private async processBatch<T>(
    batchKey: string,
    processor: (items: any[]) => Promise<T[]>,
    resolve: (value: T) => void,
    reject: (reason?: any) => void,
    index: number
  ): Promise<void> {
    const batch = this.batches.get(batchKey) || [];
    this.batches.delete(batchKey);

    if (this.timers.has(batchKey)) {
      clearTimeout(this.timers.get(batchKey)!);
      this.timers.delete(batchKey);
    }

    try {
      const results = await processor(batch);
      resolve(results[index]);
    } catch (error) {
      reject(error);
    }
  }

  getStats() {
    let totalBatched = 0;
    this.batches.forEach(batch => {
      totalBatched += batch.length;
    });
    return {
      activeBatches: this.batches.size,
      totalBatchedItems: totalBatched,
      activeTimers: this.timers.size
    };
  }
}

// Singleton instances
export const responseCache = new ResponseCache();
export const requestDeduplicator = new RequestDeduplicator();
export const queryBatcher = new QueryBatcher();

// Middleware for Express
import { Request, Response, NextFunction } from 'express';

export function cachingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    const cached = responseCache.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Intercept response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      res.setHeader('X-Cache', 'MISS');
      responseCache.set(cacheKey, data, 5000); // 5 second cache
      return originalJson(data);
    } as any;

    next();
  };
}

export function getCacheStats() {
  return {
    responseCache: responseCache.getStats(),
    requestDeduplicator: requestDeduplicator.getStats(),
    queryBatcher: queryBatcher.getStats()
  };
}
