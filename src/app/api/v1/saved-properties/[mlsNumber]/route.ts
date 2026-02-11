import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePropertySchema = z.object({
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
})

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ mlsNumber: string }> }
) {
  const auth = await getAuthenticatedUser(request)

  if (!auth || !auth.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in')
  }

  const { mlsNumber } = await params

  if (request.method === 'GET') {
    // Get specific saved property
    const savedProperty = await prisma.savedProperty.findUnique({
      where: {
        userId_mlsNumber: {
          userId: auth.user.id,
          mlsNumber,
        },
      },
    })

    if (!savedProperty) {
      return ApiErrors.NOT_FOUND('Saved property not found')
    }

    return successResponse({ savedProperty })
  }

  if (request.method === 'PATCH' || request.method === 'PUT') {
    // Update saved property
    const body = await request.json()
    const validatedData = updatePropertySchema.parse(body)

    const savedProperty = await prisma.savedProperty.findUnique({
      where: {
        userId_mlsNumber: {
          userId: auth.user.id,
          mlsNumber,
        },
      },
    })

    if (!savedProperty) {
      return ApiErrors.NOT_FOUND('Saved property not found')
    }

    const updated = await prisma.savedProperty.update({
      where: { id: savedProperty.id },
      data: {
        notes: validatedData.notes !== undefined ? validatedData.notes : savedProperty.notes,
        tags: validatedData.tags || savedProperty.tags,
      },
    })

    return successResponse({ savedProperty: updated })
  }

  if (request.method === 'DELETE') {
    // Delete saved property
    const savedProperty = await prisma.savedProperty.findUnique({
      where: {
        userId_mlsNumber: {
          userId: auth.user.id,
          mlsNumber,
        },
      },
    })

    if (!savedProperty) {
      return ApiErrors.NOT_FOUND('Saved property not found')
    }

    await prisma.savedProperty.delete({
      where: { id: savedProperty.id },
    })

    return successResponse({ message: 'Property removed from saved list' })
  }

  return ApiErrors.BAD_REQUEST('Method not allowed')
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ mlsNumber: string }> }
) {
  return apiMiddleware(request, async () => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('[API v1] Error fetching saved property:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch saved property',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ mlsNumber: string }> }
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
      console.error('[API v1] Error updating saved property:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to update saved property',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ mlsNumber: string }> }
) {
  return PATCH(request, context)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ mlsNumber: string }> }
) {
  return apiMiddleware(request, async () => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('[API v1] Error deleting saved property:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to delete saved property',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
