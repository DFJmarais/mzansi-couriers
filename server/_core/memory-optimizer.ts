/**
 * Memory Optimization for 500 Concurrent Users
 * Implements aggressive garbage collection and memory management
 */

// ============================================================
// MEMORY MONITORING
// ============================================================

class MemoryOptimizer {
  private memoryThreshold = 0.85;  // Trigger GC at 85% memory usage
  private checkInterval = 5000;    // Check every 5 seconds
  private lastGCTime = Date.now();
  private gcInterval = 30000;      // Force GC every 30 seconds

  start(): void {
    setInterval(() => {
      this.checkAndOptimize();
    }, this.checkInterval);

    console.log('[Memory] Memory optimizer started');
  }

  private checkAndOptimize(): void {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;

    // Force GC if needed
    if (heapUsedPercent > this.memoryThreshold) {
      this.forceGarbageCollection();
    }

    // Periodic GC
    if (Date.now() - this.lastGCTime > this.gcInterval) {
      this.forceGarbageCollection();
    }
  }

  private forceGarbageCollection(): void {
    if (global.gc) {
      const before = process.memoryUsage();
      global.gc();
      const after = process.memoryUsage();
      
      const heapFreed = (before.heapUsed - after.heapUsed) / 1024 / 1024;
      console.log(`[Memory] GC executed. Freed ${heapFreed.toFixed(2)}MB`);
      
      this.lastGCTime = Date.now();
    }
  }

  getStats() {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      heapUsedPercent: `${(memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)}%`
    };
  }
}

// ============================================================
// CONNECTION POOL OPTIMIZATION
// ============================================================

class ConnectionPoolOptimizer {
  /**
   * Optimize connection pool for 500 concurrent users
   * Target: 100-150 connections max
   */
  static getOptimalPoolSize(): number {
    const cpuCount = require('os').cpus().length;
    // Formula: (CPU cores * 25) for optimal throughput
    return Math.max(100, cpuCount * 25);
  }

  /**
   * Get connection pool configuration
   */
  static getPoolConfig() {
    return {
      min: 10,                          // Minimum connections
      max: this.getOptimalPoolSize(),   // Maximum connections
      idleTimeoutMillis: 30000,         // 30 second idle timeout
      connectionTimeoutMillis: 5000,    // 5 second connection timeout
      waitForConnections: true,
      enableKeepAlives: true,
      keepAliveInitialDelayMillis: 0
    };
  }
}

// ============================================================
// REQUEST POOLING & REUSE
// ============================================================

class RequestPool {
  private pool: Array<{ id: string; timestamp: number }> = [];
  private maxPoolSize = 500;

  /**
   * Get or create request context
   */
  getContext(requestId: string) {
    return {
      id: requestId,
      timestamp: Date.now(),
      startTime: Date.now()
    };
  }

  /**
   * Release request context for reuse
   */
  releaseContext(context: any): void {
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push({
        id: context.id,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Clean old contexts
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 60000; // 1 minute

    this.pool = this.pool.filter(ctx => now - ctx.timestamp < maxAge);
  }
}

// ============================================================
// STREAM OPTIMIZATION
// ============================================================

class StreamOptimizer {
  /**
   * Optimize response streaming for large payloads
   */
  static getStreamConfig() {
    return {
      highWaterMark: 64 * 1024,  // 64KB buffer
      encoding: 'utf8'
    };
  }

  /**
   * Chunk size for streaming responses
   */
  static getChunkSize(): number {
    return 64 * 1024; // 64KB chunks
  }
}

// ============================================================
// BUFFER POOLING
// ============================================================

class BufferPool {
  private pools = new Map<number, Buffer[]>();
  private maxBuffersPerSize = 100;

  /**
   * Get buffer from pool or create new
   */
  getBuffer(size: number): Buffer {
    const pool = this.pools.get(size) || [];
    
    if (pool.length > 0) {
      return pool.pop()!;
    }

    return Buffer.allocUnsafe(size);
  }

  /**
   * Return buffer to pool for reuse
   */
  returnBuffer(buffer: Buffer): void {
    const size = buffer.length;
    const pool = this.pools.get(size) || [];

    if (pool.length < this.maxBuffersPerSize) {
      buffer.fill(0); // Clear sensitive data
      pool.push(buffer);
      this.pools.set(size, pool);
    }
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.pools.clear();
  }
}

// ============================================================
// SINGLETON INSTANCES
// ============================================================

export const memoryOptimizer = new MemoryOptimizer();
export const connectionPoolOptimizer = ConnectionPoolOptimizer;
export const requestPool = new RequestPool();
export const streamOptimizer = StreamOptimizer;
export const bufferPool = new BufferPool();

// ============================================================
// STARTUP CONFIGURATION
// ============================================================

export function configureMemoryOptimization(): void {
  // Start memory monitoring
  memoryOptimizer.start();

  // Log memory stats every 30 seconds
  setInterval(() => {
    console.log('[Memory] Stats:', memoryOptimizer.getStats());
  }, 30000);

  // Cleanup request pool every minute
  setInterval(() => {
    requestPool.cleanup();
  }, 60000);

  console.log('[Memory] Optimization configured for 500 concurrent users');
}
