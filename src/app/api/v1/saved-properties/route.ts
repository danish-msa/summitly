import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const savePropertySchema = z.object({
  mlsNumber: z.string().min(1, 'MLS number is required'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

async function handler(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return ApiErrors.UNAUTHORIZED('You must be logged in to save properties')
  }

  if (request.method === 'GET') {
    // Get all saved properties for user
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [savedProperties, total] = await Promise.all([
      prisma.savedProperty.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.savedProperty.count({
        where: { userId: session.user.id },
      }),
    ])

    return successResponse(
      { savedProperties },
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
    // Save a property
    const body = await request.json()
    const validatedData = savePropertySchema.parse(body)

    // Check if already saved
    const existing = await prisma.savedProperty.findUnique({
      where: {
        userId_mlsNumber: {
          userId: session.user.id,
          mlsNumber: validatedData.mlsNumber,
        },
      },
    })

    if (existing) {
      // Update existing
      const updated = await prisma.savedProperty.update({
        where: { id: existing.id },
        data: {
          notes: validatedData.notes || existing.notes,
          tags: validatedData.tags || existing.tags,
        },
      })
      return successResponse({ savedProperty: updated })
    }

    // Create new
    const savedProperty = await prisma.savedProperty.create({
      data: {
        userId: session.user.id,
        mlsNumber: validatedData.mlsNumber,
        notes: validatedData.notes || null,
        tags: validatedData.tags || [],
      },
    })

    return successResponse({ savedProperty }, 201)
  }

  return ApiErrors.BAD_REQUEST('Method not allowed')
}

export async function GET(request: NextRequest) {
  return apiMiddleware(request, async (context) => {
    try {
      return await handler(context.request)
    } catch (error) {
      console.error('[API v1] Error fetching saved properties:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch saved properties',
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
      console.error('[API v1] Error saving property:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to save property',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
