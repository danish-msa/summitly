import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get authenticated user from request
 * Supports both NextAuth session cookies (web) and Bearer tokens (mobile)
 */
export async function getAuthenticatedUser(request: NextRequest) {
  // First, try to get session from cookies (web/browser)
  const session = await getServerSession(authOptions)
  
  if (session?.user) {
    return {
      user: session.user,
      method: 'session' as const,
    }
  }

  // If no session, try Bearer token (mobile app)
  const authHeader = request.headers.get('authorization')
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    try {
      // Decode JWT token manually (NextAuth JWT format)
      // Split JWT token (header.payload.signature)
      const parts = token.split('.')
      if (parts.length === 3) {
        // Decode payload (base64url)
        const payload = JSON.parse(
          Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
        )

        if (payload && payload.sub) {
          // Verify token hasn't expired
          if (payload.exp && payload.exp < Date.now() / 1000) {
            return null // Token expired
          }

          // Fetch user from database
          const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
            },
          })

          if (user) {
            return {
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
              },
              method: 'bearer' as const,
            }
          }
        }
      }
    } catch (error) {
      console.error('[Auth Utils] Error decoding Bearer token:', error)
      return null
    }
  }

  return null
}

/**
 * Check if request has valid authentication
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const auth = await getAuthenticatedUser(request)
  return auth !== null
}
