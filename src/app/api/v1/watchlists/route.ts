import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createWatchlistSchema = z.object({
  mlsNumber: z.string().optional(),
  cityName: z.string().optional(),
  neighborhood: z.string().optional(),
  propertyType: z.string().optional(),
  watchProperty: z.boolean().default(false),
  newProperties: z.boolean().default(false),
  soldListings: z.boolean().default(false),
  expiredListings: z.boolean().default(false),
})

async function handler(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)

  if (!auth || !auth.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in to manage watchlists')
  }

  if (request.method === 'GET') {
    // Get all watchlists for user
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [watchlists, total] = await Promise.all([
      prisma.propertyWatchlist.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.propertyWatchlist.count({
        where: { userId: auth.user.id },
      }),
    ])

    return successResponse(
      { watchlists },
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
    // Create a new watchlist
    const body = await request.json()
    const validatedData = createWatchlistSchema.parse(body)

    const watchlist = await prisma.propertyWatchlist.create({
      data: {
        userId: auth.user.id,
        mlsNumber: validatedData.mlsNumber || null,
        cityName: validatedData.cityName || null,
        neighborhood: validatedData.neighborhood || null,
        propertyType: validatedData.propertyType || null,
        watchProperty: validatedData.watchProperty,
        newProperties: validatedData.newProperties,
        soldListings: validatedData.soldListings,
        expiredListings: validatedData.expiredListings,
      },
    })

    return successResponse({ watchlist }, 201)
  }

  return ApiErrors.BAD_REQUEST('Method not allowed')
}

export async function GET(request: NextRequest) {
  return apiMiddleware(request, async (context) => {
    try {
      return await handler(context.request)
    } catch (error) {
      console.error('[API v1] Error fetching watchlists:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch watchlists',
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
      console.error('[API v1] Error creating watchlist:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to create watchlist',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
