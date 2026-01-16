import { NextRequest, NextResponse } from 'next/server'
import { handleCors } from '@/lib/api/cors'

/**
 * API v1 Middleware
 * 
 * This middleware runs for all /api/v1/* routes
 * Handles CORS, versioning, etc.
 */

export function middleware(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) {
    return corsResponse
  }

  // For non-OPTIONS requests, we'll apply CORS in individual routes
  // This is just for preflight
  return NextResponse.next()
}

export const config = {
  matcher: '/api/v1/:path*',
}

