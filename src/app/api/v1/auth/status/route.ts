import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse } from '@/lib/api/response'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function handler(_request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return successResponse({
      authenticated: false,
      user: null,
    })
  }

  return successResponse({
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      image: session.user.image,
    },
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
