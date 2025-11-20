import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/roles'
import { Prisma, UserRole } from '@prisma/client'

// Force dynamic rendering to ensure fresh Prisma client with SSL config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - List all users (with pagination and filters)
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('🔍 [USERS API] GET request started')
  
  try {
    console.log('🔍 [USERS API] Getting session...')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.warn('⚠️ [USERS API] No session or user ID')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔍 [USERS API] Session found:', {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    })

    if (!isSuperAdmin(session.user.role)) {
      console.warn('⚠️ [USERS API] User is not super admin:', session.user.role)
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      )
    }

    console.log('✅ [USERS API] Authorization passed')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''

    console.log('🔍 [USERS API] Query params:', { page, limit, search, role })

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.UserWhereInput = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role && (role === 'SUBSCRIBER' || role === 'ADMIN' || role === 'SUPER_ADMIN')) {
      where.role = role as UserRole
    }

    console.log('🔍 [USERS API] Where clause:', JSON.stringify(where, null, 2))
    console.log('🔍 [USERS API] Executing Prisma query...')

    // Get users and total count (sequential to avoid prepared statement errors)
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log('✅ [USERS API] Users fetched:', users.length)

    const total = await prisma.user.count({ where })
    console.log('✅ [USERS API] Total count:', total)

    const duration = Date.now() - startTime
    console.log(`✅ [USERS API] Request completed in ${duration}ms`)

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ [USERS API] Error fetching users:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

