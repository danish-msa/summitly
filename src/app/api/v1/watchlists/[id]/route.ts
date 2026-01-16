import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateWatchlistSchema = z.object({
  watchProperty: z.boolean().optional(),
  newProperties: z.boolean().optional(),
  soldListings: z.boolean().optional(),
  expiredListings: z.boolean().optional(),
})

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in')
  }

  const { id } = await params

  if (request.method === 'GET') {
    // Get specific watchlist
    const watchlist = await prisma.propertyWatchlist.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!watchlist) {
      return ApiErrors.NOT_FOUND('Watchlist not found')
    }

    return successResponse({ watchlist })
  }

  if (request.method === 'PATCH' || request.method === 'PUT') {
    // Update watchlist
    const body = await request.json()
    const validatedData = updateWatchlistSchema.parse(body)

    const watchlist = await prisma.propertyWatchlist.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!watchlist) {
      return ApiErrors.NOT_FOUND('Watchlist not found')
    }

    const updated = await prisma.propertyWatchlist.update({
      where: { id },
      data: {
        watchProperty: validatedData.watchProperty ?? watchlist.watchProperty,
        newProperties: validatedData.newProperties ?? watchlist.newProperties,
        soldListings: validatedData.soldListings ?? watchlist.soldListings,
        expiredListings: validatedData.expiredListings ?? watchlist.expiredListings,
      },
    })

    return successResponse({ watchlist: updated })
  }

  if (request.method === 'DELETE') {
    // Delete watchlist
    const watchlist = await prisma.propertyWatchlist.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!watchlist) {
      return ApiErrors.NOT_FOUND('Watchlist not found')
    }

    await prisma.propertyWatchlist.delete({
      where: { id },
    })

    return successResponse({ message: 'Watchlist deleted successfully' })
  }

  return ApiErrors.BAD_REQUEST('Method not allowed')
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return apiMiddleware(request, async () => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('[API v1] Error fetching watchlist:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch watchlist',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return apiMiddleware(request, async () => {
    try {
      return await handler(request, context)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiErrors.VALIDATION_ERROR(
          error.errors[0].message,
          error.errors
        )
      }
      console.error('[API v1] Error updating watchlist:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to update watchlist',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return apiMiddleware(request, async () => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('[API v1] Error deleting watchlist:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to delete watchlist',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
