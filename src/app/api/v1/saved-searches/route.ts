import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  propertyType: z.enum(['HOUSE', 'APARTMENT', 'CONDO', 'TOWNHOUSE', 'VILLA', 'OFFICE', 'COMMERCIAL', 'LAND', 'OTHER']).optional(),
})

async function handler(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)

  if (!auth || !auth.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in to save searches')
  }

  if (request.method === 'GET') {
    // Get all saved searches for user
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [searches, total] = await Promise.all([
      prisma.searchHistory.findMany({
        where: { userId: auth.user.id },
        orderBy: { searchedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.searchHistory.count({
        where: { userId: auth.user.id },
      }),
    ])

    return successResponse(
      { searches },
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
    // Create a new saved search
    const body = await request.json()
    const validatedData = createSearchSchema.parse(body)

    const search = await prisma.searchHistory.create({
      data: {
        userId: auth.user.id,
        query: validatedData.query || null,
        location: validatedData.location || null,
        minPrice: validatedData.minPrice || null,
        maxPrice: validatedData.maxPrice || null,
        bedrooms: validatedData.bedrooms || null,
        bathrooms: validatedData.bathrooms || null,
        propertyType: validatedData.propertyType || null,
      },
    })

    return successResponse({ search }, 201)
  }

  return ApiErrors.BAD_REQUEST('Method not allowed')
}

export async function GET(request: NextRequest) {
  return apiMiddleware(request, async (context) => {
    try {
      return await handler(context.request)
    } catch (error) {
      console.error('[API v1] Error fetching saved searches:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch saved searches',
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
      console.error('[API v1] Error creating saved search:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to create saved search',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
