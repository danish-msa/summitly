import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

// GET - List all pre-con projects (with pagination and filters)
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
    const status = searchParams.get('status') || ''
    const city = searchParams.get('city') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      OR?: Array<{
        projectName?: { contains: string; mode: 'insensitive' }
        developer?: { contains: string; mode: 'insensitive' }
        mlsNumber?: { contains: string; mode: 'insensitive' }
      }>
      status?: string
      city?: { contains: string; mode: 'insensitive' }
    } = {}
    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: 'insensitive' } },
        { developer: { contains: search, mode: 'insensitive' } },
        { mlsNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    // Get projects and total count
    // Using separate queries to avoid prepared statement conflicts
    const projects = await prisma.preConstructionProject.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        units: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    const total = await prisma.preConstructionProject.count({ where })

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching pre-con projects:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// POST - Create a new pre-con project
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
    const {
      mlsNumber,
      projectName,
      developer,
      startingPrice,
      status,
      streetNumber,
      streetName,
      city,
      state,
      zip,
      country = 'Canada',
      neighborhood,
      majorIntersection,
      latitude,
      longitude,
      propertyType,
      bedroomRange,
      bathroomRange,
      sqftRange,
      totalUnits,
      availableUnits,
      storeys,
      completionDate,
      completionProgress,
      images = [],
      features = [],
      amenities = [],
      depositStructure,
      description,
      documents,
      developerInfo,
      architectInfo,
      builderInfo,
      interiorDesignerInfo,
      landscapeArchitectInfo,
      marketingInfo,
    } = body

    // Validate required fields
    if (!mlsNumber || !projectName || !developer || !startingPrice || !status || !city || !state) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if mlsNumber already exists
    const existing = await prisma.preConstructionProject.findUnique({
      where: { mlsNumber },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Project with this MLS number already exists' },
        { status: 400 }
      )
    }

    // Create project
    const project = await prisma.preConstructionProject.create({
      data: {
        mlsNumber,
        projectName,
        developer,
        startingPrice: parseFloat(startingPrice),
        status,
        streetNumber,
        streetName,
        city,
        state,
        zip,
        country,
        neighborhood,
        majorIntersection,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        propertyType,
        bedroomRange,
        bathroomRange,
        sqftRange,
        totalUnits: parseInt(totalUnits),
        availableUnits: parseInt(availableUnits),
        storeys: storeys ? parseInt(storeys) : null,
        completionDate,
        completionProgress: parseInt(completionProgress) || 0,
        images: Array.isArray(images) ? images : [],
        features: Array.isArray(features) ? features : [],
        amenities: Array.isArray(amenities) ? amenities : [],
        depositStructure,
        description,
        documents: documents ? JSON.stringify(documents) : null,
        developerInfo: developerInfo ? JSON.stringify(developerInfo) : null,
        architectInfo: architectInfo ? JSON.stringify(architectInfo) : null,
        builderInfo: builderInfo ? JSON.stringify(builderInfo) : null,
        interiorDesignerInfo: interiorDesignerInfo ? JSON.stringify(interiorDesignerInfo) : null,
        landscapeArchitectInfo: landscapeArchitectInfo ? JSON.stringify(landscapeArchitectInfo) : null,
        marketingInfo: marketingInfo ? JSON.stringify(marketingInfo) : null,
      },
    })

    return NextResponse.json(
      { project },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating pre-con project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

