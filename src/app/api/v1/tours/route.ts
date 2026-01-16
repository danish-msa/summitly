import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, TourStatus } from '@prisma/client'
import { z } from 'zod'

const createTourSchema = z.object({
  mlsNumber: z.string().min(1, 'MLS number is required'),
  tourType: z.enum(['IN_PERSON', 'VIDEO_CHAT']).default('IN_PERSON'),
  scheduledDate: z.string().datetime(),
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  preApproval: z.boolean().default(false),
  notes: z.string().optional(),
})

async function handler(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in to schedule tours')
  }

  if (request.method === 'GET') {
    // Get all tours for user
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const where: Prisma.TourWhereInput = { userId: session.user.id }
    if (status) {
      where.status = status as TourStatus
    }

    const [tours, total] = await Promise.all([
      prisma.tour.findMany({
        where,
        orderBy: { scheduledDate: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.tour.count({ where }),
    ])

    return successResponse(
      { tours },
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
    // Create a new tour
    const body = await request.json()
    const validatedData = createTourSchema.parse(body)

    const tour = await prisma.tour.create({
      data: {
        userId: session.user.id,
        mlsNumber: validatedData.mlsNumber,
        tourType: validatedData.tourType,
        scheduledDate: new Date(validatedData.scheduledDate),
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email,
        preApproval: validatedData.preApproval,
        notes: validatedData.notes || null,
      },
    })

    return successResponse({ tour }, 201)
  }

  return ApiErrors.BAD_REQUEST('Method not allowed')
}

export async function GET(request: NextRequest) {
  return apiMiddleware(request, async (context) => {
    try {
      return await handler(context.request)
    } catch (error) {
      console.error('[API v1] Error fetching tours:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch tours',
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
      console.error('[API v1] Error creating tour:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to create tour',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
