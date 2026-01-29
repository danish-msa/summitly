import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const saveComparableSchema = z.object({
  basePropertyMlsNumber: z.string().min(1, 'Base property MLS number is required'),
  mlsNumber: z.string().min(1, 'Comparable property MLS number is required'),
})

async function handler(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)

  if (!auth || !auth.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in to save comparables')
  }

  if (request.method === 'GET') {
    // Get all comparables for user
    const { searchParams } = new URL(request.url)
    const basePropertyMlsNumber = searchParams.get('basePropertyMlsNumber')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Prisma.SavedComparableWhereInput = { userId: auth.user.id }
    if (basePropertyMlsNumber) {
      where.basePropertyMlsNumber = basePropertyMlsNumber
    }

    const [comparables, total] = await Promise.all([
      prisma.savedComparable.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.savedComparable.count({ where }),
    ])

    return successResponse(
      { comparables },
      200,
      {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    )
  }

  if (request.method === 'POST') {
    // Save a comparable
    const body = await request.json()
    const validatedData = saveComparableSchema.parse(body)

    // Check if already saved
    const existing = await prisma.savedComparable.findUnique({
      where: {
        userId_basePropertyMlsNumber_mlsNumber: {
          userId: auth.user.id,
          basePropertyMlsNumber: validatedData.basePropertyMlsNumber,
          mlsNumber: validatedData.mlsNumber,
        },
      },
    })

    if (existing) {
      return successResponse({ comparable: existing })
    }

    // Create new
    const comparable = await prisma.savedComparable.create({
      data: {
        userId: auth.user.id,
        basePropertyMlsNumber: validatedData.basePropertyMlsNumber,
        mlsNumber: validatedData.mlsNumber,
      },
    })

    return successResponse({ comparable }, 201)
  }

  return ApiErrors.BAD_REQUEST('Method not allowed')
}

export async function GET(request: NextRequest) {
  return apiMiddleware(request, async (context) => {
    try {
      return await handler(context.request)
    } catch (error) {
      console.error('[API v1] Error fetching comparables:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch comparables',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}

export async function POST(request: NextRequest) {
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
      console.error('[API v1] Error saving comparable:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to save comparable',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
