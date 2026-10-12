import { Response } from 'express';

// Response size optimization
export class ResponseOptimizer {
  static stripUnnecessaryFields(data: any, allowedFields?: string[]): any {
    if (!data) return data;
    if (Array.isArray(data)) {
      return data.map(item => this.stripUnnecessaryFields(item, allowedFields));
    }
    if (typeof data !== 'object') return data;

    const result: any = {};
    const fieldsToKeep = allowedFields || Object.keys(data);
    for (const field of fieldsToKeep) {
      if (field in data) result[field] = data[field];
    }
    return result;
  }

  static paginate<T>(
    items: T[],
    page: number = 1,
    pageSize: number = 50
  ): { items: T[]; total: number; page: number; pageSize: number } {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: items.slice(start, end),
      total: items.length,
      page,
      pageSize
    };
  }
}

// Response streaming
export class StreamingResponse {
  static streamJSON(res: Response, data: any[], chunkSize: number = 100): void {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.write('[');
    for (let i = 0; i < data.length; i++) {
      if (i > 0) res.write(',');
      // Flush every chunkSize items
      if ((i + 1) % chunkSize === 0 && (res as any).flush) {
        (res as any).flush();
      }
    }
    res.write(']');
    res.end();
  }
}

// Cache headers
export class CacheHeaders {
  static setHeaders(
    res: Response,
    type: 'public' | 'private' | 'no-cache',
    maxAge: number = 3600
  ): void {
    switch (type) {
      case 'public':
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
        break;
      case 'private':
        res.setHeader('Cache-Control', `private, max-age=${maxAge}`);
        break;
      case 'no-cache':
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        break;
    }
  }
}

// Compression optimization
export class CompressionOptimizer {
  static shouldCompress(data: any, minSize: number = 1024): boolean {
    return JSON.stringify(data).length > minSize;
  }

  static getCompressionLevel(): number {
    return 6;
  }
}

// Response metrics
export class ResponseMetrics {
  private metrics = {
    totalResponses: 0,
    totalBytes: 0,
    averageSize: 0,
    largestResponse: 0,
    smallestResponse: Infinity
  };

  track(data: any): void {
    const size = JSON.stringify(data).length;
    this.metrics.totalResponses++;
    this.metrics.totalBytes += size;
    this.metrics.averageSize = this.metrics.totalBytes / this.metrics.totalResponses;
    this.metrics.largestResponse = Math.max(this.metrics.largestResponse, size);
    this.metrics.smallestResponse = Math.min(this.metrics.smallestResponse, size);
  }

  getMetrics() {
    return {
      totalResponses: this.metrics.totalResponses,
      totalBytes: `${(this.metrics.totalBytes / 1024).toFixed(2)}KB`,
      averageSize: `${(this.metrics.averageSize / 1024).toFixed(2)}KB`,
      largestResponse: `${(this.metrics.largestResponse / 1024).toFixed(2)}KB`,
      smallestResponse: `${(this.metrics.smallestResponse / 1024).toFixed(2)}KB`
    };
  }
}

export const responseOptimizer = new ResponseOptimizer();
export const streamingResponse = new StreamingResponse();
export const cacheHeaders = new CacheHeaders();
export const compressionOptimizer = new CompressionOptimizer();
export const responseMetrics = new ResponseMetrics();
