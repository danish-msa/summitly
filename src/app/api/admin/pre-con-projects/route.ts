import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { Prisma } from '@prisma/client'

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

    // Parse developerInfo JSON to extract developer name
    const parseDeveloperName = (developerInfo: string | null): string | null => {
      if (!developerInfo) return null
      try {
        const parsed = JSON.parse(developerInfo)
        return parsed?.name || null
      } catch {
        return null
      }
    }

    // Map projects to include developer name
    const projectsWithDeveloperName = projects.map((project: typeof projects[0]) => ({
      ...project,
      developerName: parseDeveloperName(project.developerInfo),
    }))

    return NextResponse.json({
      projects: projectsWithDeveloperName,
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
      avgPricePerSqft,
      status,
      parkingPrice,
      parkingPriceDetail,
      lockerPrice,
      lockerPriceDetail,
      assignmentFee,
      developmentLevies,
      developmentCharges,
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
      hasDen,
      hasStudio,
      hasLoft,
      hasWorkLiveLoft,
      totalUnits,
      availableUnits,
      suites,
      storeys,
      height,
      maintenanceFeesPerSqft,
      maintenanceFeesDetail,
      floorPremiums,
      occupancyDate,
      completionProgress,
      promotions,
      ownershipType,
      garage,
      basement,
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
      salesMarketingCompany,
      developmentTeamOverview,
      units = [],
    } = body

    // Validate required fields only if project is being published
    // Drafts can have missing fields
    const isPublished = body.isPublished === true
    if (isPublished) {
      const missingFields: string[] = []
      if (!projectName) missingFields.push('projectName')
      if (!developer) missingFields.push('developer')
      if (!startingPrice) missingFields.push('startingPrice')
      if (!endingPrice) missingFields.push('endingPrice')
      if (!status) missingFields.push('status')
      if (!city) missingFields.push('city')
      if (!state) missingFields.push('state')

      if (missingFields.length > 0) {
        return NextResponse.json(
          { 
            error: 'Missing required fields',
            missingFields: missingFields,
            message: `Missing required fields: ${missingFields.join(', ')}. Please fill all required fields before publishing.`
          },
          { status: 400 }
        )
      }
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

    // Map completionProgress string to integer (database expects Int, not String)
    // 0 = Pre-construction, 1 = Construction, 2 = Complete
    const completionProgressInt = (() => {
      const progressMap: Record<string, number> = {
        'Pre-construction': 0,
        'Construction': 1,
        'Complete': 2,
      }
      
      if (typeof completionProgress === 'number') {
        return completionProgress
      }
      
      const progressString = String(completionProgress || '').trim()
      if (progressString in progressMap) {
        return progressMap[progressString]
      }
      
      const parsed = parseInt(progressString, 10)
      if (!isNaN(parsed)) {
        return parsed
      }
      
      return 0 // Default to Pre-construction
    })()

    // Create project
    const project = await prisma.preConstructionProject.create({
      data: {
        mlsNumber,
        projectName,
        developer,
        startingPrice: typeof startingPrice === 'number' ? startingPrice : parseFloat(String(startingPrice)),
        endingPrice: typeof endingPrice === 'number' ? endingPrice : parseFloat(String(endingPrice)),
        avgPricePerSqft: avgPricePerSqft ? (typeof avgPricePerSqft === 'number' ? avgPricePerSqft : parseFloat(String(avgPricePerSqft))) : null,
        status,
        parkingPrice: parkingPrice ? (typeof parkingPrice === 'number' ? parkingPrice : parseFloat(String(parkingPrice))) : null,
        parkingPriceDetail: parkingPriceDetail && parkingPriceDetail.trim() ? parkingPriceDetail.trim() : null,
        lockerPrice: lockerPrice ? (typeof lockerPrice === 'number' ? lockerPrice : parseFloat(String(lockerPrice))) : null,
        lockerPriceDetail: lockerPriceDetail && lockerPriceDetail.trim() ? lockerPriceDetail.trim() : null,
        assignmentFee: assignmentFee ? (typeof assignmentFee === 'number' ? assignmentFee : parseFloat(String(assignmentFee))) : null,
        developmentLevies: developmentLevies ? (typeof developmentLevies === 'number' ? developmentLevies : parseFloat(String(developmentLevies))) : null,
        developmentCharges: developmentCharges ? (typeof developmentCharges === 'number' ? developmentCharges : parseFloat(String(developmentCharges))) : null,
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
        hasDen: hasDen === true || hasDen === 'true',
        hasStudio: hasStudio === true || hasStudio === 'true',
        hasLoft: hasLoft === true || hasLoft === 'true',
        hasWorkLiveLoft: hasWorkLiveLoft === true || hasWorkLiveLoft === 'true',
        totalUnits: typeof totalUnits === 'number' ? totalUnits : parseInt(String(totalUnits), 10),
        availableUnits: typeof availableUnits === 'number' ? availableUnits : parseInt(String(availableUnits), 10),
        suites: suites ? (typeof suites === 'number' ? suites : parseInt(String(suites), 10)) : null,
        storeys: storeys ? (typeof storeys === 'number' ? storeys : parseInt(String(storeys), 10)) : null,
        height: height && String(height).trim() ? String(height).trim() : null,
        maintenanceFeesPerSqft: maintenanceFeesPerSqft ? (typeof maintenanceFeesPerSqft === 'number' ? maintenanceFeesPerSqft : parseFloat(String(maintenanceFeesPerSqft))) : null,
        maintenanceFeesDetail: maintenanceFeesDetail && maintenanceFeesDetail.trim() ? maintenanceFeesDetail.trim() : null,
        floorPremiums: floorPremiums && floorPremiums.trim() ? floorPremiums.trim() : null,
        occupancyDate,
        completionProgress: completionProgressInt,
        promotions: promotions && promotions.trim() ? promotions.trim() : null,
        ownershipType: ownershipType && ownershipType.trim() ? ownershipType.trim() : null,
        garage: garage && garage.trim() ? garage.trim() : null,
        basement: basement && basement.trim() ? basement.trim() : null,
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
        salesMarketingCompany: salesMarketingCompany && salesMarketingCompany.trim() ? salesMarketingCompany.trim() : null,
        developmentTeamOverview: developmentTeamOverview && developmentTeamOverview.trim() ? developmentTeamOverview.trim() : null,
        isPublished: isPublished || false,
        units: Array.isArray(units) && units.length > 0 ? {
          create: units.map((unit: {
            unitName: string
            beds: number | string
            baths: number | string
            sqft: number | string
            price: number | string
            maintenanceFee?: number | string | null
            status: string
            floorplanImage?: string | null
            description?: string | null
            features?: string[]
            amenities?: string[]
          }) => ({
            unitName: unit.unitName,
            beds: typeof unit.beds === 'number' ? unit.beds : parseInt(String(unit.beds), 10),
            baths: typeof unit.baths === 'number' ? unit.baths : parseInt(String(unit.baths), 10),
            sqft: typeof unit.sqft === 'number' ? unit.sqft : parseInt(String(unit.sqft), 10),
            price: typeof unit.price === 'number' ? unit.price : parseFloat(String(unit.price)),
            maintenanceFee: unit.maintenanceFee ? (typeof unit.maintenanceFee === 'number' ? unit.maintenanceFee : parseFloat(String(unit.maintenanceFee))) : null,
            status: unit.status || 'for-sale',
            floorplanImage: unit.floorplanImage || null,
            description: unit.description || null,
            features: Array.isArray(unit.features) ? unit.features : [],
            amenities: Array.isArray(unit.amenities) ? unit.amenities : [],
          })),
        } : undefined,
      } as unknown as Prisma.PreConstructionProjectCreateInput,
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

