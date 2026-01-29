import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'

async function handler(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)

  if (!auth || !auth.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in to access this resource')
  }

  // Get full user data
  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      agentProfile: {
        select: {
          bio: true,
          phone: true,
          license: true,
          specialties: true,
          languages: true,
          rating: true,
          reviewCount: true,
          isActive: true,
        },
      },
    },
  })

  if (!user) {
    return ApiErrors.NOT_FOUND('User not found')
  }

  return successResponse({
    user,
  })
}

export async function GET(request: NextRequest) {
  return apiMiddleware(request, async (context) => {
    try {
      return await handler(context.request)
    } catch (error) {
      console.error('[API v1] Error fetching user:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch user',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
