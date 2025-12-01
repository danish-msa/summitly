import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { DeveloperType, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.DevelopmentTeamWhereInput = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type && Object.values(DeveloperType).includes(type as DeveloperType)) {
      where.type = type as DeveloperType
    }

    // Get development team members and total count sequentially to avoid prepared statement errors
    const developers = await prisma.developmentTeam.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.developmentTeam.count({ where })

    return NextResponse.json({
      developers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching development team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch development team members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, type, description, website, image, email, phone } = body

    // Validation
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    if (!Object.values(DeveloperType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid developer type' },
        { status: 400 }
      )
    }

    // Create development team member
    const developer = await prisma.developmentTeam.create({
      data: {
        name,
        type: type as DeveloperType,
        description: description || null,
        website: website || null,
        image: image || null,
        email: email || null,
        phone: phone || null,
      },
    })

    return NextResponse.json(developer, { status: 201 })
  } catch (error) {
    console.error('Error creating development team member:', error)
    return NextResponse.json(
      { error: 'Failed to create development team member' },
      { status: 500 }
    )
  }
}

