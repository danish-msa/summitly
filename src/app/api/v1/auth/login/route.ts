import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth-utils'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

async function handler(request: NextRequest) {
  const body = await request.json()
  const validatedData = loginSchema.parse(body)

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: validatedData.email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      phone: true,
      image: true,
    },
  })

  if (!user || !user.password) {
    return ApiErrors.UNAUTHORIZED('Invalid email or password')
  }

  // Verify password
  const isValid = await verifyPassword(validatedData.password, user.password)
  if (!isValid) {
    return ApiErrors.UNAUTHORIZED('Invalid email or password')
  }

  // Return user info (session will be handled by NextAuth)
  return successResponse({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      image: user.image,
    },
    message: 'Login successful. Use NextAuth session for authentication.',
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
      console.error('[API v1] Error logging in:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to login',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}
