import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
})

async function handler(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)

  if (!auth || !auth.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in to update your profile')
  }

  if (request.method === 'GET') {
    // Get user profile
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

    return successResponse({ user })
  }

  if (request.method === 'PATCH' || request.method === 'PUT') {
    // Update user profile
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        ...validatedData,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        emailVerified: true,
        updatedAt: true,
      },
    })

    return successResponse({ user })
  }

  return ApiErrors.BAD_REQUEST('Method not allowed')
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

export async function PATCH(request: NextRequest) {
  return apiMiddleware(request, async (context) => {
    try {
      return await handler(context.request)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiErrors.VALIDATION_ERROR(
          error.errors[0].message,
          error.errors
        )
      }
      console.error('[API v1] Error updating user:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to update user',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}

export async function PUT(request: NextRequest) {
  return PATCH(request)
}
