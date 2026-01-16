import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const updateTourSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
  tourType: z.enum(['IN_PERSON', 'VIDEO_CHAT']).optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  preApproval: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
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
    // Get specific tour
    const tour = await prisma.tour.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!tour) {
      return ApiErrors.NOT_FOUND('Tour not found')
    }

    return successResponse({ tour })
  }

  if (request.method === 'PATCH' || request.method === 'PUT') {
    // Update tour
    const body = await request.json()
    const validatedData = updateTourSchema.parse(body)

    const tour = await prisma.tour.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!tour) {
      return ApiErrors.NOT_FOUND('Tour not found')
    }

    const updateData: Prisma.TourUpdateInput = {}
    if (validatedData.scheduledDate) updateData.scheduledDate = new Date(validatedData.scheduledDate)
    if (validatedData.tourType) updateData.tourType = validatedData.tourType
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.phone) updateData.phone = validatedData.phone
    if (validatedData.email) updateData.email = validatedData.email
    if (validatedData.preApproval !== undefined) updateData.preApproval = validatedData.preApproval
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.status) updateData.status = validatedData.status

    const updated = await prisma.tour.update({
      where: { id },
      data: updateData,
    })

    return successResponse({ tour: updated })
  }

  if (request.method === 'DELETE') {
    // Cancel/delete tour
    const tour = await prisma.tour.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!tour) {
      return ApiErrors.NOT_FOUND('Tour not found')
    }

    await prisma.tour.delete({
      where: { id },
    })

    return successResponse({ message: 'Tour cancelled successfully' })
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
      console.error('[API v1] Error fetching tour:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch tour',
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
      console.error('[API v1] Error updating tour:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to update tour',
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
      console.error('[API v1] Error deleting tour:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to delete tour',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
