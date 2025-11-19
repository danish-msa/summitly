import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

// Helper function to fetch developer data by ID and return as JSON string
async function fetchDeveloperData(developerId: string): Promise<string | null> {
  if (!developerId) return null
  try {
    const developer = await (prisma as any).developer.findUnique({
      where: { id: developerId },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        image: true,
        email: true,
        phone: true,
      },
    })
    return developer ? JSON.stringify(developer) : null
  } catch (error) {
    console.error('Error fetching developer:', error)
    return null
  }
}

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
      projectName,
      developer,
      startingPrice,
      endingPrice,
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
      subPropertyType,
      bedroomRange,
      bathroomRange,
      sqftRange,
      totalUnits,
      availableUnits,
      storeys,
      completionDate,
      completionProgress,
      promotions,
      images = [],
      videos = [],
      amenities = [],
      customAmenities = [],
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
    if (!projectName || !developer || !startingPrice || !endingPrice || !status || !city || !state) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique mlsNumber from project name (slugified)
    const generateMlsNumber = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    let mlsNumber = generateMlsNumber(projectName)
    let counter = 1
    let existing = await prisma.preConstructionProject.findUnique({
      where: { mlsNumber },
    })

    // If mlsNumber exists, append a number
    while (existing) {
      mlsNumber = `${generateMlsNumber(projectName)}-${counter}`
      existing = await prisma.preConstructionProject.findUnique({
        where: { mlsNumber },
      })
      counter++
    }

    // Create project
    const project = await prisma.preConstructionProject.create({
      data: {
        mlsNumber,
        projectName,
        developer,
        startingPrice: parseFloat(startingPrice),
        endingPrice: parseFloat(endingPrice),
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
        subPropertyType: subPropertyType || null,
        bedroomRange,
        bathroomRange,
        sqftRange,
        totalUnits: parseInt(totalUnits),
        availableUnits: parseInt(availableUnits),
        storeys: storeys ? parseInt(storeys) : null,
        completionDate,
        completionProgress,
        promotions: promotions || null,
        images: Array.isArray(images) ? images : [],
        videos: Array.isArray(videos) ? videos : [],
        amenities: Array.isArray(amenities) 
          ? [...amenities, ...(Array.isArray(customAmenities) ? customAmenities.map((a: string) => a) : [])]
          : Array.isArray(customAmenities) ? customAmenities : [],
        depositStructure,
        description,
        documents: documents ? JSON.stringify(documents) : null,
        // Store developer IDs, fetch developer data and store as JSON
        developerInfo: developerInfo ? await fetchDeveloperData(developerInfo) : null,
        architectInfo: architectInfo ? await fetchDeveloperData(architectInfo) : null,
        builderInfo: builderInfo ? await fetchDeveloperData(builderInfo) : null,
        interiorDesignerInfo: interiorDesignerInfo ? await fetchDeveloperData(interiorDesignerInfo) : null,
        landscapeArchitectInfo: landscapeArchitectInfo ? await fetchDeveloperData(landscapeArchitectInfo) : null,
        marketingInfo: marketingInfo ? await fetchDeveloperData(marketingInfo) : null,
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

