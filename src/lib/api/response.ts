import { NextResponse } from 'next/server'

/**
 * Standard API Response Format
 * 
 * This ensures consistent response structure across all API endpoints
 * for both web and mobile app consumption.
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: string
    version?: string
  }
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  meta?: ApiResponse<T>['meta']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    },
    { status }
  )
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  code: string = 'UNKNOWN_ERROR',
  status: number = 500,
  details?: unknown
): NextResponse<ApiResponse> {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    },
    { status }
  )
}

/**
 * Common error responses
 */
export const ApiErrors = {
  UNAUTHORIZED: (message: string = 'Unauthorized') =>
    errorResponse(message, 'UNAUTHORIZED', 401),
  
  FORBIDDEN: (message: string = 'Forbidden') =>
    errorResponse(message, 'FORBIDDEN', 403),
  
  NOT_FOUND: (message: string = 'Resource not found') =>
    errorResponse(message, 'NOT_FOUND', 404),
  
  BAD_REQUEST: (message: string = 'Bad request') =>
    errorResponse(message, 'BAD_REQUEST', 400),
  
  VALIDATION_ERROR: (message: string = 'Validation failed', details?: unknown) =>
    errorResponse(message, 'VALIDATION_ERROR', 400, details),
  
  INTERNAL_ERROR: (message: string = 'Internal server error', details?: unknown) =>
    errorResponse(message, 'INTERNAL_ERROR', 500, details),
  
  RATE_LIMIT: (message: string = 'Rate limit exceeded') =>
    errorResponse(message, 'RATE_LIMIT', 429),
}

