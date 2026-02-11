import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS Configuration for Mobile App Support
 * 
 * Allows your mobile app to make requests to the API
 */

// Allowed origins (add your mobile app domains/IPs here)
const ALLOWED_ORIGINS = [
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  
  // Production - Add your actual domains
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_API_URL,
  
  // Mobile app domains (add when you have them)
  // 'https://your-mobile-app-domain.com',
  
  // Common mobile development origins
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
].filter(Boolean) as string[]

// Allowed methods
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']

// Allowed headers
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Access-Control-Request-Method',
  'Access-Control-Request-Headers',
]

/**
 * CORS Middleware
 * 
 * Add this to your API routes to enable CORS
 */
export function corsHeaders(origin?: string | null): Record<string, string> {
  const requestOrigin = origin || '*'
  
  // Check if origin is allowed (or allow all in development)
  const isAllowed = process.env.NODE_ENV === 'development' 
    ? true 
    : ALLOWED_ORIGINS.includes(requestOrigin) || requestOrigin === '*'

  return {
    'Access-Control-Allow-Origin': isAllowed ? requestOrigin : ALLOWED_ORIGINS[0] || '*',
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(origin),
    })
  }
  
  return null
}

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(
  response: NextResponse,
  origin?: string | null
): NextResponse {
  const headers = corsHeaders(origin)
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

