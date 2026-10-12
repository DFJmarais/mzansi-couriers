import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import http from "http";
import https from "https";
import cluster from "cluster";
import os from "os";
import path from "path";
// import compression from "compression"; // Will use manual compression
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { cachingMiddleware, getCacheStats } from "./advanced-caching";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handlePaystackWebhook, verifyPaystackWebhook } from "../payments/webhook";
import { handleReadonlyMcp } from "../mcp-readonly";
import { registerMcpOAuthRoutes } from "../mcp-oauth";
// Production-only static file serving (no vite dependency)
const serveStaticProduction = (app: any) => {
  // Use __dirname equivalent for ESM - the dist/index.js is in the dist directory
  const publicDir = path.join(process.cwd(), 'dist/public');
  app.use(express.static(publicDir));
  app.use('*', (req: any, res: any) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
};

let setupVite: any;

// ============================================================
// PRIORITY 1: CONNECTION POOLING CONFIGURATION
// ============================================================

// Global HTTP agent with AGGRESSIVE connection pooling for 500 concurrent users
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,   // Keep alive for 30 seconds
  maxSockets: 500,         // Max 500 sockets per agent
  maxFreeSockets: 250,     // Keep 250 free sockets ready
  timeout: 120000,         // 2 minute timeout
  freeSocketTimeout: 30000 // Free socket timeout
} as any);

// Global HTTPS agent with AGGRESSIVE connection pooling for 500 concurrent users
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,   // Keep alive for 30 seconds
  maxSockets: 500,         // Max 500 sockets per agent
  maxFreeSockets: 250,     // Keep 250 free sockets ready
  timeout: 120000,         // 2 minute timeout
  freeSocketTimeout: 30000 // Free socket timeout
} as any);

  // Set as global defaults
  (http as any).globalAgent = httpAgent;
  (https as any).globalAgent = httpsAgent;

// ============================================================
// PRIORITY 2: CLUSTERING FOR MULTI-PROCESS SUPPORT
// ============================================================

const numWorkers = parseInt(process.env.WORKERS || String(os.cpus().length), 10);
const isProduction = process.env.NODE_ENV === 'production';
// Disable clustering in production - Manus handles scaling automatically
const shouldCluster = process.env.CLUSTER === 'true' && !isProduction;

if (cluster.isMaster && shouldCluster) {
  console.log(`Master process ${process.pid} starting ${numWorkers} workers`);
  console.log(`Each worker can handle ~100-200 concurrent requests`);
  console.log(`Total capacity: ${numWorkers * 150} concurrent requests`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

  // Don't start server in master process
  process.on('SIGTERM', () => {
    console.log('Master received SIGTERM, shutting down gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill();
    }
    process.exit(0);
  });
}

// ============================================================
// PRIORITY 3: PERFORMANCE MONITORING & CIRCUIT BREAKER
// ============================================================

class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureThreshold = 100;     // PRIORITY 3: Fail after 100 errors
  private successThreshold = 10;      // PRIORITY 3: Reset after 10 successes
  private resetTimeout = 30000;       // PRIORITY 3: Reset after 30 seconds

  canExecute(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        return true;
      }
      return false;
    }
    return this.state === 'HALF_OPEN';
  }

  recordSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
      }
    }
  }

  recordFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: new Date(this.lastFailureTime).toISOString()
    };
  }
}

const circuitBreaker = new CircuitBreaker();

// ============================================================
// PERFORMANCE MONITORING
// ============================================================

class PerformanceMonitor {
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;
  private responseTimes: number[] = [];
  private startTime = Date.now();

  recordRequest(responseTime: number, error: boolean = false): void {
    this.requestCount++;
    if (error) this.errorCount++;
    this.totalResponseTime += responseTime;
    this.responseTimes.push(responseTime);
    
    // Keep only last 1000 requests for percentile calculation
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  getMetrics() {
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const uptime = Date.now() - this.startTime;
    
    return {
      uptime: `${(uptime / 1000).toFixed(1)}s`,
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: this.requestCount > 0 ? (this.totalResponseTime / this.requestCount).toFixed(0) + 'ms' : '0ms',
      p50ResponseTime: sorted[Math.floor(sorted.length * 0.50)]?.toFixed(0) + 'ms' || '0ms',
      p95ResponseTime: sorted[Math.floor(sorted.length * 0.95)]?.toFixed(0) + 'ms' || '0ms',
      p99ResponseTime: sorted[Math.floor(sorted.length * 0.99)]?.toFixed(0) + 'ms' || '0ms',
      throughput: ((this.requestCount / (uptime / 1000)).toFixed(2)) + ' req/s'
    };
  }
}

const performanceMonitor = new PerformanceMonitor();

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServerImpl() {
  if (cluster.isWorker) {
    console.log(`Starting worker process ${cluster.worker?.id}...`);
  }

  const app = express();
  const server = createServer(app);
  
  // ============================================================
  // PRIORITY 1: CONNECTION POOLING MIDDLEWARE
  // ============================================================
  app.use((req, res, next) => {
    // Attach agents to request for connection pooling
    (req as any).httpAgent = httpAgent;
    (req as any).httpsAgent = httpsAgent;
    next();
  });

  // ============================================================
  // PRIORITY 2: COMPRESSION MIDDLEWARE (Disabled for now)
  // ============================================================
  // Compression handled by CDN/reverse proxy in production

  // ============================================================
  // PRIORITY 3: PERFORMANCE MONITORING MIDDLEWARE
  // ============================================================
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      performanceMonitor.recordRequest(responseTime, res.statusCode >= 400);
      
      if (res.statusCode < 400) {
        circuitBreaker.recordSuccess();
      } else {
        circuitBreaker.recordFailure();
      }
    });

    next();
  });

  // ============================================================
  // CORS and OPTIONS preflight - MUST be FIRST before body parsers
  app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400');
    res.status(204).end();
  });

  // ADVANCED CACHING MIDDLEWARE
  // ============================================================
  app.use(cachingMiddleware());

  // Paystack signs the exact raw request body. Register this before JSON parsing.
  app.post('/api/paystack/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = String(req.headers['x-paystack-signature'] || '');
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    if (!rawBody || !verifyPaystackWebhook(rawBody, signature)) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }
    try {
      await handlePaystackWebhook(JSON.parse(rawBody));
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('[Paystack] Webhook processing failed:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Configure body parser with larger size limit for file uploads and default content-type
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Ensure Content-Type is set for tRPC requests
  app.use((req, res, next) => {
    if (!req.headers['content-type'] && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      req.headers['content-type'] = 'application/json';
    }
    next();
  });
  
  // ============================================================
  // HEALTH CHECK ENDPOINTS (PRIORITY 1, 2, 3 MONITORING)
  // ============================================================
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      performance: performanceMonitor.getMetrics(),
      circuitBreaker: circuitBreaker.getState(),
      connections: {
        httpSockets: Object.keys(httpAgent.sockets || {}).length,
        httpRequests: Object.keys(httpAgent.requests || {}).length,
        httpFreeSockets: Object.keys(httpAgent.freeSockets || {}).length
      },
      caching: getCacheStats()
    });
  });

  app.get('/health/quick', (req, res) => {
    res.json({ status: 'ok' });
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerMcpOAuthRoutes(app);
  // Read-only MCP bridge for ChatGPT. It fails closed until MCP_READ_ONLY_TOKEN is configured.
  app.all('/api/mcp', async (req, res) => {
    try {
      await handleReadonlyMcp(req, res, req.body);
    } catch (error) {
      console.error('[MCP] Read-only request failed:', error);
      if (!res.headersSent) res.status(500).json({ error: 'MCP request failed' });
    }
  });
  // tRPC API with custom error handling
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ path, error }) => {
        console.error(`[tRPC] Error at ${path}:`, error.message);
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    const { setupVite: setupViteModule } = await import("./vite");
    await setupViteModule(app, server);
  } else {
    serveStaticProduction(app);
  }



  // 404 handler for API requests
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  const port = Number(process.env.PORT ?? 3000);
  const workerId = cluster.isWorker ? cluster.worker?.id : 'main';
  
  server.listen(port, "0.0.0.0", () => {
    console.log(`[Worker ${workerId}] Server running on http://0.0.0.0:${port}/`);
  });
  
  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Exiting.`);
      process.exit(1);
    }
    throw err;
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log(`[Worker ${workerId}] Received SIGTERM, shutting down gracefully...`);
    server.close(() => {
      process.exit(0);
    });
  });
}

// Start server if not clustering or if in worker process
if (!shouldCluster || cluster.isWorker) {
  startServerImpl().catch(console.error);
}
