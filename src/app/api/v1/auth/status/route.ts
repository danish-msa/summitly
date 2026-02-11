import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'

async function handler(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)

  if (!auth || !auth.user) {
    return successResponse({
      authenticated: false,
      user: null,
    })
  }

  return successResponse({
    authenticated: true,
    user: {
      id: auth.user.id,
      name: auth.user.name,
      email: auth.user.email,
      role: auth.user.role,
      image: auth.user.image,
    },
    method: auth.method, // Include auth method for debugging
  })
}

export async function GET(request: NextRequest) {
  return apiMiddleware(request, async (context) => {
    try {
      return await handler(context.request)
    } catch (error) {
      console.error('[API v1] Error checking auth status:', error)
      // Even on error, return unauthenticated status
      return successResponse({
        authenticated: false,
        user: null,
      })
    }
  })
}
