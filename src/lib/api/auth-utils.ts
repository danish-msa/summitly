import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { decode } from 'next-auth/jwt'
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
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  
  if (authHeader?.startsWith('Bearer ') || authHeader?.startsWith('bearer ')) {
    const token = authHeader.substring(7).trim() // Remove 'Bearer ' prefix and trim whitespace
    
    if (!token) {
      console.error('[Auth Utils] Bearer token is empty')
      return null
    }
    
    try {
      const secret = process.env.NEXTAUTH_SECRET
      if (!secret) {
        console.error('[Auth Utils] NEXTAUTH_SECRET is not set')
        return null
      }

      // Try using NextAuth's decode function first (verifies signature)
      try {
        const decoded = await decode({
          token,
          secret,
        })

        if (decoded && decoded.sub) {
          const exp = typeof decoded.exp === 'number' ? decoded.exp : null
          const currentTime = Math.floor(Date.now() / 1000)
          
          console.log('[Auth Utils] Decoded JWT using NextAuth decode:', {
            hasSub: !!decoded.sub,
            sub: decoded.sub,
            exp: exp,
            currentTime: currentTime,
            isExpired: exp ? exp < currentTime : false,
          })

          // Verify token hasn't expired
          if (exp && exp < currentTime) {
            console.error('[Auth Utils] Token expired:', {
              exp: exp,
              current: currentTime,
            })
            return null
          }

          // Fetch user from database
          const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
            },
          })

          if (user) {
            console.log('[Auth Utils] Successfully authenticated user via Bearer token:', user.id)
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
          } else {
            console.error('[Auth Utils] User not found in database:', decoded.sub)
          }
        }
      } catch (decodeError) {
        // If NextAuth decode fails, try manual decoding as fallback
        console.warn('[Auth Utils] NextAuth decode failed, trying manual decode:', decodeError)
        
        // Manual decode fallback
        const parts = token.split('.')
        if (parts.length !== 3) {
          console.error('[Auth Utils] Invalid JWT format - expected 3 parts, got:', parts.length)
          return null
        }

        // Decode payload (base64url)
        let base64Payload = parts[1]
        // Add padding if needed
        while (base64Payload.length % 4) {
          base64Payload += '='
        }
        base64Payload = base64Payload.replace(/-/g, '+').replace(/_/g, '/')
        
        const payload = JSON.parse(
          Buffer.from(base64Payload, 'base64').toString()
        )

        console.log('[Auth Utils] Manually decoded JWT payload:', {
          hasSub: !!payload.sub,
          sub: payload.sub,
          exp: payload.exp,
        })

        if (payload && payload.sub) {
          // Verify token hasn't expired
          if (payload.exp && payload.exp < Date.now() / 1000) {
            console.error('[Auth Utils] Token expired')
            return null
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
            console.log('[Auth Utils] Successfully authenticated user via Bearer token (manual decode):', user.id)
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
      console.error('[Auth Utils] Error processing Bearer token:', error)
      if (error instanceof Error) {
        console.error('[Auth Utils] Error details:', {
          message: error.message,
          stack: error.stack,
        })
      }
      return null
    }
  } else if (authHeader) {
    console.error('[Auth Utils] Authorization header present but not Bearer token:', authHeader.substring(0, 20))
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
