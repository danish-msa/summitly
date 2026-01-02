/**
 * Fetch Deduplication Utility
 * Prevents duplicate API calls within a short time window
 */

interface CachedRequest {
  data: unknown;
  timestamp: number;
  promise: Promise<Response>;
}

const requestCache = new Map<string, CachedRequest>();
const CACHE_DURATION = 5000; // 5 seconds - prevent duplicate calls within 5 seconds

/**
 * Deduplicated fetch - prevents multiple identical requests
 */
export async function deduplicatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const cacheKey = `${url}-${JSON.stringify(options || {})}`;
  const now = Date.now();
  
  // Check if we have a recent cached request
  const cached = requestCache.get(cacheKey);
  
  if (cached) {
    const age = now - cached.timestamp;
    
    // If request is still in progress (less than 5 seconds old), return the same promise
    if (age < CACHE_DURATION && cached.promise) {
      return cached.promise;
    }
    
    // If cached data is still fresh, return cached response
    if (age < CACHE_DURATION) {
      // Create a new Response from cached data
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Cache expired, remove it
    requestCache.delete(cacheKey);
  }
  
  // Make new request
  const promise = fetch(url, options).then(async (response) => {
    if (response.ok) {
      const data = await response.json();
      // Cache the response
      requestCache.set(cacheKey, {
        data,
        timestamp: now,
        promise: Promise.resolve(response),
      });
      
      // Clean up old cache entries
      cleanupCache();
    }
    return response;
  });
  
  // Store promise immediately to prevent duplicate calls
  requestCache.set(cacheKey, {
    data: null,
    timestamp: now,
    promise,
  });
  
  return promise;
}

/**
 * Clean up expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, cached] of requestCache.entries()) {
    if (now - cached.timestamp > CACHE_DURATION) {
      requestCache.delete(key);
    }
  }
}

/**
 * Clear all cached requests
 */
export function clearFetchCache() {
  requestCache.clear();
}

