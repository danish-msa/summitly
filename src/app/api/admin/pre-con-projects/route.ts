import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

// Helper function to fetch developer data by ID and return as JSON string
async function fetchDeveloperData(developerId: string): Promise<string | null> {
  if (!developerId) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Prepare data with proper type conversions
    const imagesArray = Array.isArray(images) 
      ? images.filter((img): img is string => typeof img === 'string' && img.length > 0)
      : []
    
    const videosArray = Array.isArray(videos) 
      ? videos.filter((vid): vid is string => typeof vid === 'string' && vid.length > 0)
      : []
    
    const amenitiesArray = (() => {
      const amenityStrings: string[] = []
      
      if (Array.isArray(amenities)) {
        amenities.forEach((a: { name: string; icon: string } | string) => {
          if (typeof a === 'string' && a.trim().length > 0) {
            amenityStrings.push(a.trim())
          } else if (typeof a === 'object' && a !== null && 'name' in a && typeof a.name === 'string' && a.name.trim().length > 0) {
            amenityStrings.push(a.name.trim())
          }
        })
      }
      
      if (Array.isArray(customAmenities)) {
        customAmenities.forEach((a: string) => {
          if (typeof a === 'string' && a.trim().length > 0) {
            amenityStrings.push(a.trim())
          }
        })
      }
      
      return amenityStrings
    })()

    // Log data for debugging (remove sensitive info)
    console.log('Creating project with data:', {
      mlsNumber,
      projectName,
      imagesCount: imagesArray.length,
      videosCount: videosArray.length,
      amenitiesCount: amenitiesArray.length,
      hasDocuments: !!documents,
    })

    // Create project
    const project = await prisma.preConstructionProject.create({
      data: {
        mlsNumber,
        projectName,
        developer,
        startingPrice: typeof startingPrice === 'number' ? startingPrice : parseFloat(String(startingPrice)),
        endingPrice: typeof endingPrice === 'number' ? endingPrice : parseFloat(String(endingPrice)),
        status,
        streetNumber: streetNumber || null,
        streetName: streetName || null,
        city,
        state,
        zip: zip || null,
        country,
        neighborhood: neighborhood || null,
        majorIntersection: majorIntersection || null,
        latitude: latitude ? (typeof latitude === 'number' ? latitude : parseFloat(String(latitude))) : null,
        longitude: longitude ? (typeof longitude === 'number' ? longitude : parseFloat(String(longitude))) : null,
        propertyType,
        subPropertyType: subPropertyType || null,
        bedroomRange,
        bathroomRange,
        sqftRange,
        totalUnits: typeof totalUnits === 'number' ? totalUnits : parseInt(String(totalUnits), 10),
        availableUnits: typeof availableUnits === 'number' ? availableUnits : parseInt(String(availableUnits), 10),
        storeys: storeys ? (typeof storeys === 'number' ? storeys : parseInt(String(storeys), 10)) : null,
        completionDate,
        completionProgress,
        promotions: promotions && promotions.trim() ? promotions.trim() : null,
        images: imagesArray.length > 0 ? imagesArray : [],
        videos: videosArray.length > 0 ? videosArray : [],
        amenities: amenitiesArray.length > 0 ? amenitiesArray : [],
        features: [], // Explicitly set features array (required by schema)
        depositStructure: depositStructure && depositStructure.trim() ? depositStructure.trim() : null,
        description: description && description.trim() ? description.trim() : null,
        documents: documents ? (() => {
          try {
            // If documents is already a string, parse and re-stringify to ensure it's valid JSON
            if (typeof documents === 'string') {
              const parsed = JSON.parse(documents)
              return JSON.stringify(parsed)
            }
            // If it's an object/array, stringify it
            return JSON.stringify(documents)
          } catch (e) {
            console.error('Error stringifying documents:', e)
            return null
          }
        })() : null,
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to create project'
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

