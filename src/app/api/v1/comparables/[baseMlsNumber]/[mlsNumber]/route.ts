import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ baseMlsNumber: string; mlsNumber: string }> }
) {
  const auth = await getAuthenticatedUser(request)

  if (!auth || !auth.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in')
  }

  const { baseMlsNumber, mlsNumber } = await params

  if (request.method === 'GET') {
    // Get specific comparable
    const comparable = await prisma.savedComparable.findUnique({
      where: {
        userId_basePropertyMlsNumber_mlsNumber: {
          userId: auth.user.id,
          basePropertyMlsNumber: baseMlsNumber,
          mlsNumber: mlsNumber,
        },
      },
    })

    if (!comparable) {
      return ApiErrors.NOT_FOUND('Comparable not found')
    }

    return successResponse({ comparable })
  }

  if (request.method === 'DELETE') {
    // Delete comparable
    const comparable = await prisma.savedComparable.findUnique({
      where: {
        userId_basePropertyMlsNumber_mlsNumber: {
          userId: auth.user.id,
          basePropertyMlsNumber: baseMlsNumber,
          mlsNumber: mlsNumber,
        },
      },
    })

    if (!comparable) {
      return ApiErrors.NOT_FOUND('Comparable not found')
    }

    await prisma.savedComparable.delete({
      where: { id: comparable.id },
    })

    return successResponse({ message: 'Comparable removed successfully' })
  }

  return ApiErrors.BAD_REQUEST('Method not allowed')
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ baseMlsNumber: string; mlsNumber: string }> }
) {
  return apiMiddleware(request, async () => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('[API v1] Error fetching comparable:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch comparable',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ baseMlsNumber: string; mlsNumber: string }> }
) {
  return apiMiddleware(request, async () => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('[API v1] Error deleting comparable:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to delete comparable',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
