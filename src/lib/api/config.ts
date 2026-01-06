/**
 * API Configuration
 * 
 * Manages API base URL for different environments
 * Allows switching between local API and external API service
 */

/**
 * Get the API base URL based on environment
 * 
 * Priority:
 * 1. NEXT_PUBLIC_API_URL (explicit external API)
 * 2. Same origin (if not set, uses relative URLs for same deployment)
 */
export function getApiBaseUrl(): string {
  // If explicit API URL is set, use it (for separate API deployment)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') // Remove trailing slash
  }

  // For server-side, we can use absolute URL if needed
  if (typeof window === 'undefined') {
    // Server-side: use same origin or explicit URL
    const serverUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL
    if (serverUrl) {
      return serverUrl.replace(/\/$/, '')
    }
  }

  // Client-side: use relative URLs (same origin)
  return ''
}

/**
 * Get full API endpoint URL
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // Ensure endpoint starts with /api
  const apiEndpoint = cleanEndpoint.startsWith('/api') 
    ? cleanEndpoint 
    : `/api${cleanEndpoint}`
  
  return `${baseUrl}${apiEndpoint}`
}

/**
 * API Version
 */
export const API_VERSION = 'v1'

/**
 * API Base Path
 */
export const API_BASE_PATH = `/api/${API_VERSION}`

/**
 * Check if we're using external API
 */
export function isUsingExternalApi(): boolean {
  return !!process.env.NEXT_PUBLIC_API_URL
}

