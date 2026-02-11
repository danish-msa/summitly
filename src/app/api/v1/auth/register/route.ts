import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth-utils'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
})

async function handler(request: NextRequest) {
  const body = await request.json()
  const validatedData = registerSchema.parse(body)

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email },
  })

  if (existingUser) {
    return ApiErrors.BAD_REQUEST('User with this email already exists')
  }

  // Hash password
  const hashedPassword = await hashPassword(validatedData.password)

  // Create user
  const user = await prisma.user.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      phone: validatedData.phone || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  })

  return successResponse(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    },
    201
  )
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
      console.error('[API v1] Error registering user:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to register user',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
