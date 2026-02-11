/**
 * API Client
 * 
 * Helper functions for making API requests from the frontend
 * Automatically handles base URL, error handling, and response parsing
 */

import { getApiUrl } from './config'
import type { ApiResponse } from './response'

/**
 * API Request Options
 */
export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>
  version?: string
}

/**
 * Make an API request
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, version = 'v1', ...fetchOptions } = options

  // Build URL with query params
  let url = getApiUrl(`/${version}${endpoint}`)
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  // Default headers
  const headers = new Headers(fetchOptions.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Make request
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    // Parse JSON response
    const data: ApiResponse<T> = await response.json()

    // Check if response indicates error
    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error?.message || 'Request failed',
        data.error?.code || 'UNKNOWN_ERROR',
        response.status,
        data.error?.details
      )
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      'NETWORK_ERROR',
      0,
      error
    )
  }
}

/**
 * API Error Class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  /**
   * GET request
   */
  get: <T = unknown>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * PUT request
   */
  put: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  /**
   * PATCH request
   */
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  /**
   * DELETE request
   */
  delete: <T = unknown>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}

/**
 * Example usage:
 * 
 * ```typescript
 * // GET request
 * const { data } = await api.get('/pre-con-projects', {
 *   params: { city: 'Toronto', page: 1, limit: 20 }
 * })
 * 
 * // POST request
 * const { data } = await api.post('/properties/save', {
 *   mlsNumber: '12345',
 *   notes: 'Great property'
 * })
 * 
 * // With error handling
 * try {
 *   const response = await api.get('/pre-con-projects')
 *   console.log(response.data)
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error(error.code, error.message)
 *   }
 * }
 * ```
 */

