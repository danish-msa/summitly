import { NextRequest, NextResponse } from 'next/server'
import { handleCors, applyCorsHeaders } from './cors'
import { ApiErrors } from './response'

/**
 * API Middleware
 * 
 * Common middleware for all API routes
 */

export interface ApiContext {
  request: NextRequest
  params?: Record<string, string>
}

/**
 * Combined middleware function
 * Handles CORS, authentication, rate limiting, etc.
 */
export async function apiMiddleware(
  request: NextRequest,
  handler: (context: ApiContext) => Promise<NextResponse>
): Promise<NextResponse> {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) {
    return corsResponse
  }

  try {
    // Extract origin for CORS
    const origin = request.headers.get('origin')

    // Call the actual handler
    const response = await handler({
      request,
    })

    // Apply CORS headers to response
    return applyCorsHeaders(response, origin)
  } catch (error) {
    console.error('[API Middleware] Error:', error)
    
    const origin = request.headers.get('origin')
    const errorResponse = ApiErrors.INTERNAL_ERROR(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    )
    
    return applyCorsHeaders(errorResponse, origin)
  }
}

/**
 * Rate limiting (simple in-memory version)
 * For production, use Redis or a proper rate limiting service
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(request: NextRequest): string {
  // Use IP address or user ID
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  return ip
}

