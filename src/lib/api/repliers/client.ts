/**
 * Unified Repliers API Client
 * 
 * Production-ready API client with:
 * - Dual authentication support (header & query param)
 * - Rate limiting and request queuing
 * - Automatic retry with exponential backoff
 * - Response caching with TTL
 * - Comprehensive error handling
 * - Request prioritization
 * - Performance monitoring
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_CONFIG = {
  baseUrl: 'https://api.repliers.io',
  cdnUrl: 'https://cdn.repliers.io',
  apiKey: process.env.NEXT_PUBLIC_REPLIERS_API_KEY || '',
  
  // Performance settings
  maxConcurrentRequests: 5,
  rateLimitPerMinute: 60,
  defaultTimeout: 30000,
  defaultMaxRetries: 3,
  retryDelay: 1000,
  
  // Caching
  defaultCacheDuration: 5 * 60 * 1000, // 5 minutes
  cacheDurations: {
    propertyTypes: 24 * 60 * 60 * 1000, // 24 hours
    listings: 2 * 60 * 1000, // 2 minutes
    cities: 10 * 60 * 1000, // 10 minutes
    analytics: 15 * 60 * 1000, // 15 minutes (increased for market trends - data doesn't change frequently)
    locations: 60 * 60 * 1000, // 1 hour
  },
};

// ============================================================================
// TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
  cached: boolean;
  timestamp: number;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  retryable: boolean;
}

export interface RequestConfig {
  endpoint: string;
  params?: Record<string, unknown>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  authMethod?: 'header' | 'query';
  cache?: boolean;
  cacheDuration?: number;
  retry?: boolean;
  maxRetries?: number;
  timeout?: number;
  priority?: 'high' | 'normal' | 'low';
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

interface QueuedRequest {
  config: RequestConfig;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  priority: 'high' | 'normal' | 'low';
  attempts: number;
}

// ============================================================================
// CORE API CLIENT
// ============================================================================

class RepliersAPIClient {
  private cache = new Map<string, CacheEntry>();
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private requestTimestamps: number[] = [];
  
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedRequests: 0,
    averageResponseTime: 0,
  };

  constructor() {
    if (!API_CONFIG.apiKey) {
      console.warn('⚠️ Repliers API key not configured. Set NEXT_PUBLIC_REPLIERS_API_KEY in .env.local');
    }
    setInterval(() => this.cleanupCache(), 60000);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  async request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
    this.stats.totalRequests++;

    if (!API_CONFIG.apiKey) {
      return this.createErrorResponse('API_KEY_MISSING', 'API key not configured', false) as ApiResponse<T>;
    }

    // Check cache
    if (config.cache !== false) {
      const cached = this.getFromCache(config);
      if (cached) {
        this.stats.cachedRequests++;
        return { data: cached as T, error: null, cached: true, timestamp: Date.now() };
      }
    }

    // Add to queue
    return new Promise<ApiResponse<T>>((resolve, reject) => {
      this.requestQueue.push({
        config,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority: config.priority || 'normal',
        attempts: 0,
      });
      
      this.requestQueue.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
      this.processQueue();
    });
  }

  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      queueLength: this.requestQueue.length,
      rateLimitUsage: `${this.requestTimestamps.length}/${API_CONFIG.rateLimitPerMinute}`,
    };
  }

  clearCache() {
    this.cache.clear();
    console.log('✅ API cache cleared');
  }

  configure(newConfig: Partial<typeof API_CONFIG>) {
    Object.assign(API_CONFIG, newConfig);
  }

  // ==========================================================================
  // QUEUE PROCESSING
  // ==========================================================================

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      if (!this.canMakeRequest()) {
        await this.wait(1000);
        continue;
      }

      const queuedRequest = this.requestQueue.shift();
      if (!queuedRequest) continue;

      try {
        const result = await this.executeRequest(queuedRequest);
        queuedRequest.resolve(result);
      } catch (error) {
        if (
          queuedRequest.config.retry !== false &&
          queuedRequest.attempts < (queuedRequest.config.maxRetries || API_CONFIG.defaultMaxRetries)
        ) {
          queuedRequest.attempts++;
          await this.wait(this.calculateRetryDelay(queuedRequest.attempts));
          this.requestQueue.unshift(queuedRequest);
        } else {
          queuedRequest.reject(error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  // ==========================================================================
  // REQUEST EXECUTION
  // ==========================================================================

  private async executeRequest<T>(queuedRequest: QueuedRequest): Promise<ApiResponse<T>> {
    const { config } = queuedRequest;
    const startTime = Date.now();

    try {
      const url = this.buildUrl(config);
      const headers = this.buildHeaders(config);
      
      // Debug logging for analytics requests
      if (config.endpoint === '/listings' && config.params?.statistics) {
        // Convert headers to a record for safe access
        const headersRecord = headers instanceof Headers 
          ? Object.fromEntries(headers.entries())
          : Array.isArray(headers)
          ? Object.fromEntries(headers)
          : headers;
        const apiKey = headersRecord['REPLIERS-API-KEY'] as string | undefined;
        console.log('[Repliers Client] Analytics Request:', {
          url,
          authMethod: config.authMethod,
          hasApiKeyInHeader: !!apiKey,
          apiKeyLength: apiKey?.length || 0,
          apiKeyPreview: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
          params: config.params,
        });
      }
      
      this.requestTimestamps.push(Date.now());
      
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        config.timeout || API_CONFIG.defaultTimeout
      );

      const response = await fetch(url, {
        method: config.method || 'GET',
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        // Log detailed error for analytics requests
        if (config.endpoint === '/listings' && config.params?.statistics) {
          const errorText = await response.text();
          console.error('[Repliers Client] Analytics Request Failed:', {
            status: response.status,
            statusText: response.statusText,
            url,
            errorBody: errorText,
            headers: Object.fromEntries(response.headers.entries()),
          });
        }
        throw this.createHttpError(response.status, response.statusText);
      }

      const data = await response.json();
      
      if (config.cache !== false) {
        this.saveToCache(config, data);
      }

      this.updateStats(true, Date.now() - startTime);

      return { data, error: null, cached: false, timestamp: Date.now() };

    } catch (error) {
      this.updateStats(false, Date.now() - startTime);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createErrorResponse('TIMEOUT', 'Request timed out', true);
      }

      throw this.handleError(error);
    }
  }

  // ==========================================================================
  // URL & HEADERS
  // ==========================================================================

  private buildUrl(config: RequestConfig): string {
    const url = new URL(`${API_CONFIG.baseUrl}${config.endpoint}`);

    // Add API key via query param if specified
    if (config.authMethod === 'query') {
      url.searchParams.append('key', API_CONFIG.apiKey);
    }

    // Add other params
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, v.toString()));
          } else {
            url.searchParams.append(key, value.toString());
          }
        }
      });
    }

    return url.toString();
  }

  private buildHeaders(config: RequestConfig): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Add API key via header if not using query param
    if (config.authMethod !== 'query') {
      headers['REPLIERS-API-KEY'] = API_CONFIG.apiKey;
    }

    return headers;
  }

  // ==========================================================================
  // CACHING
  // ==========================================================================

  private getCacheKey(config: RequestConfig): string {
    return `${config.endpoint}:${JSON.stringify(config.params || {})}`;
  }

  private getFromCache(config: RequestConfig): unknown | null {
    const key = this.getCacheKey(config);
    const entry = this.cache.get(key);

    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private saveToCache(config: RequestConfig, data: unknown): void {
    const key = this.getCacheKey(config);
    const duration = config.cacheDuration || API_CONFIG.defaultCacheDuration;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  private createHttpError(status: number, statusText: string): ApiError {
    const errorMap: Record<number, { code: string; message: string; retryable: boolean }> = {
      400: { code: 'BAD_REQUEST', message: 'Invalid request', retryable: false },
      401: { code: 'UNAUTHORIZED', message: 'Invalid API key', retryable: false },
      403: { code: 'FORBIDDEN', message: 'Access denied', retryable: false },
      404: { code: 'NOT_FOUND', message: 'Resource not found', retryable: false },
      429: { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryable: true },
      500: { code: 'SERVER_ERROR', message: 'Server error', retryable: true },
      502: { code: 'BAD_GATEWAY', message: 'Bad gateway', retryable: true },
      503: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable', retryable: true },
    };

    return errorMap[status] || {
      code: 'UNKNOWN_ERROR',
      message: `HTTP ${status}: ${statusText}`,
      retryable: status >= 500,
      status,
    };
  }

  private handleError(error: unknown): ApiResponse {
    if (error && typeof error === 'object' && 'code' in error) {
      return { data: null, error: error as ApiError, cached: false, timestamp: Date.now() };
    }

    return this.createErrorResponse(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network error',
      true
    );
  }

  private createErrorResponse(code: string, message: string, retryable: boolean): ApiResponse {
    return {
      data: null,
      error: { code, message, retryable },
      cached: false,
      timestamp: Date.now(),
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private canMakeRequest(): boolean {
    const oneMinuteAgo = Date.now() - 60000;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);
    return this.requestTimestamps.length < API_CONFIG.rateLimitPerMinute;
  }

  private calculateRetryDelay(attempt: number): number {
    return API_CONFIG.retryDelay * Math.pow(2, attempt - 1);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateStats(success: boolean, responseTime: number): void {
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    const total = this.stats.successfulRequests + this.stats.failedRequests;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (total - 1) + responseTime) / total;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const repliersClient = new RepliersAPIClient();
export { API_CONFIG };

// Expose for debugging
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).repliersClient = repliersClient;
}

