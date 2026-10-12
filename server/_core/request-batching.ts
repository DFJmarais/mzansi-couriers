/**
 * Request Batching & Debouncing for 500 Concurrent Users
 * Reduces database queries by combining similar requests
 */

// ============================================================
// REQUEST DEDUPLICATION
// ============================================================

class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Deduplicate identical requests
   * If same request is made multiple times, return same promise
   */
  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>,
    debounceMs: number = 5
  ): Promise<T> {
    // If request already pending, return existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    // Create new promise
    const promise = new Promise<T>((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          const result = await fn();
          this.pendingRequests.delete(key);
          this.debounceTimers.delete(key);
          resolve(result);
        } catch (error) {
          this.pendingRequests.delete(key);
          this.debounceTimers.delete(key);
          reject(error);
        }
      }, debounceMs);

      this.debounceTimers.set(key, timer);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Get stats on deduplication
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      activeTimers: this.debounceTimers.size
    };
  }
}

// ============================================================
// REQUEST BATCHING
// ============================================================

class RequestBatcher {
  private batches = new Map<string, any[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private batchSize = 10;        // Batch after 10 requests
  private batchTimeoutMs = 50;   // Or after 50ms

  /**
   * Add request to batch
   */
  async batch<T>(
    batchKey: string,
    item: any,
    processor: (items: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Get or create batch
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, []);
      }

      const batch = this.batches.get(batchKey)!;
      const itemIndex = batch.length;
      batch.push(item);

      // Process batch if full
      if (batch.length >= this.batchSize) {
        this.processBatch(batchKey, processor)
          .then(results => resolve(results[itemIndex]))
          .catch(reject);
        return;
      }

      // Set timer if first item
      if (batch.length === 1) {
        const timer = setTimeout(() => {
          this.processBatch(batchKey, processor)
            .then(results => resolve(results[itemIndex]))
            .catch(reject);
        }, this.batchTimeoutMs);

        this.batchTimers.set(batchKey, timer);
      }
    });
  }

  private async processBatch<T>(
    batchKey: string,
    processor: (items: any[]) => Promise<T[]>
  ): Promise<T[]> {
    const batch = this.batches.get(batchKey) || [];
    this.batches.delete(batchKey);

    if (this.batchTimers.has(batchKey)) {
      clearTimeout(this.batchTimers.get(batchKey)!);
      this.batchTimers.delete(batchKey);
    }

    if (batch.length === 0) {
      return [];
    }

    return processor(batch);
  }

  /**
   * Get stats
   */
  getStats() {
    let totalBatched = 0;
    this.batches.forEach(batch => {
      totalBatched += batch.length;
    });

    return {
      activeBatches: this.batches.size,
      totalBatchedItems: totalBatched,
      activeTimers: this.batchTimers.size
    };
  }
}

// ============================================================
// QUERY RESULT CACHING WITH INVALIDATION
// ============================================================

class QueryCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private invalidationPatterns = new Map<string, Set<string>>();

  /**
   * Get cached query result
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Set query result in cache
   */
  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Invalidate cache by pattern
   * Example: invalidate('user:*') invalidates all user queries
   */
  invalidate(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      cachedQueries: this.cache.size,
      cacheSize: Array.from(this.cache.values()).reduce(
        (sum, entry) => sum + JSON.stringify(entry.data).length,
        0
      )
    };
  }
}

// ============================================================
// SINGLETON INSTANCES
// ============================================================

export const requestDeduplicator = new RequestDeduplicator();
export const requestBatcher = new RequestBatcher();
export const queryCache = new QueryCache();

// ============================================================
// MIDDLEWARE FOR EXPRESS
// ============================================================

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add request deduplication
 */
export function deduplicationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate request key based on method + path + query
    const key = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    (req as any).deduplicationKey = key;
    next();
  };
}

/**
 * Middleware to add caching headers
 */
export function cacheHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Cache GET requests for 60 seconds
    if (req.method === 'GET') {
      res.set('Cache-Control', 'public, max-age=60');
    } else {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
  };
}
