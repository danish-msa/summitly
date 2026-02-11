import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthenticatedUser(request)

  if (!auth || !auth.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in')
  }

  const { id } = await params

  if (request.method === 'GET') {
    // Get specific saved search
    const search = await prisma.searchHistory.findFirst({
      where: {
        id,
        userId: auth.user.id,
      },
    })

    if (!search) {
      return ApiErrors.NOT_FOUND('Saved search not found')
    }

    return successResponse({ search })
  }

  if (request.method === 'DELETE') {
    // Delete saved search
    const search = await prisma.searchHistory.findFirst({
      where: {
        id,
        userId: auth.user.id,
      },
    })

    if (!search) {
      return ApiErrors.NOT_FOUND('Saved search not found')
    }

    await prisma.searchHistory.delete({
      where: { id },
    })

    return successResponse({ message: 'Saved search deleted successfully' })
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
      console.error('[API v1] Error fetching saved search:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch saved search',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return apiMiddleware(request, async () => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('[API v1] Error deleting saved search:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to delete saved search',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
