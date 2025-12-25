import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertToS3Url } from '@/lib/image-url'
import { Prisma } from '@prisma/client'

// GET - Public endpoint to fetch all pre-con projects for website display
export async function GET(request: NextRequest) {
  try {
    // Log database connection info (masked for security)
    const dbUrl = process.env.DATABASE_URL || 'NOT SET'
    const maskedDbUrl = dbUrl !== 'NOT SET' 
      ? dbUrl.replace(/:([^:@]+)@/, ':****@').replace(/\/\/([^:]+):/, '//****:')
      : 'NOT SET'
    console.log('[API] Database connection:', {
      hasUrl: !!process.env.DATABASE_URL,
      urlPreview: maskedDbUrl,
      nodeEnv: process.env.NODE_ENV,
    })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const city = searchParams.get('city') || ''
    const propertyType = searchParams.get('propertyType') || ''
    const subPropertyType = searchParams.get('subPropertyType') || ''
    const completionYear = searchParams.get('completionYear') || ''
    const developer = searchParams.get('developer') || ''
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')

    console.log('[API] Fetching pre-con projects with params:', {
      status,
      city,
      propertyType,
      subPropertyType,
      completionYear,
      developer,
      featured,
      limit,
    })

    // Build where clause
    // Use array-based approach for better Prisma compatibility
    const whereConditions: Prisma.PreConstructionProjectWhereInput[] = [
      { isPublished: true }, // Only show published projects on public website
    ]
    
    if (status) {
      whereConditions.push({ status })
    }
    if (city) {
      whereConditions.push({ city: { contains: city, mode: 'insensitive' } })
    }
    if (propertyType) {
      // Use case-insensitive matching for propertyType
      // Check multiple case variations and common alternative names
      const propertyTypeLower = propertyType.toLowerCase()
      const propertyTypeCapitalized = propertyType.charAt(0).toUpperCase() + propertyType.slice(1).toLowerCase()
      const propertyTypeUpper = propertyType.toUpperCase()
      
      // Build list of variations to check
      const variations: string[] = [
        propertyType, // Exact match
        propertyTypeCapitalized, // Capitalized
        propertyTypeUpper, // Uppercase
        propertyTypeLower, // Lowercase
      ]
      
      // Add common alternative names for specific types
      if (propertyTypeLower === 'condos' || propertyTypeLower === 'condo') {
        variations.push('Condominium', 'condominium', 'CONDOMINIUM', 'Condo', 'condo')
      } else if (propertyTypeLower === 'houses' || propertyTypeLower === 'house') {
        variations.push('House', 'house', 'HOUSE', 'Houses')
      }
      
      const propertyTypeCondition: Prisma.PreConstructionProjectWhereInput = {
        OR: variations.map(variation => ({ propertyType: variation }))
      }
      whereConditions.push(propertyTypeCondition)
      
      console.log('[API] PropertyType filter variations:', variations)
    }
    if (subPropertyType) {
      whereConditions.push({ subPropertyType })
    }
    if (completionYear) {
      whereConditions.push({ occupancyDate: { contains: completionYear } })
    }
    if (developer) {
      // Try to find developer by name first, then fall back to ID
      try {
        const developerRecord = await prisma.developmentTeam.findFirst({
          where: { 
            name: { contains: developer, mode: 'insensitive' }
          },
          select: { id: true }
        })
        if (developerRecord) {
          whereConditions.push({ developer: developerRecord.id })
        } else {
          // Use StringFilter type for case-insensitive search
          whereConditions.push({ 
            developer: { 
              contains: developer, 
              mode: 'insensitive' 
            } as Prisma.StringFilter 
          })
        }
      } catch (error) {
        console.warn('[API] Error looking up developer, using contains match:', error)
        // Use StringFilter type for case-insensitive search
        whereConditions.push({ 
          developer: { 
            contains: developer, 
            mode: 'insensitive' 
          } as Prisma.StringFilter 
        })
      }
    }
    if (featured !== null && featured !== undefined) {
      whereConditions.push({ featured: featured === 'true' || featured === '1' })
    }
    
    // Combine all conditions with AND (only if we have multiple conditions)
    // If we only have isPublished, use it directly
    const where: Prisma.PreConstructionProjectWhereInput = whereConditions.length > 1
      ? { AND: whereConditions }
      : whereConditions[0] || { isPublished: true }
    
    console.log('[API] Built where clause:', JSON.stringify(where, null, 2))

    // Test database connection first
    try {
      await prisma.$connect()
      console.log('[API] Database connection: ✅ Connected')
    } catch (connectError) {
      console.error('[API] Database connection: ❌ Failed', connectError)
      throw new Error(`Database connection failed: ${connectError instanceof Error ? connectError.message : String(connectError)}`)
    }

    // Retry logic for connection issues
    let retries = 3
    let projects
    let lastError: Error | null = null
    
    while (retries > 0) {
      try {
        console.log('[API] Executing Prisma query, attempt:', 4 - retries)
        
        // Get projects
        // When filtering by featured, just order by createdAt
        // Otherwise, prioritize featured projects first
        let orderBy: Prisma.PreConstructionProjectOrderByWithRelationInput | Prisma.PreConstructionProjectOrderByWithRelationInput[]
        if (featured === 'true' || featured === '1') {
          orderBy = { createdAt: 'desc' }
        } else {
          // Use type assertion since featured field exists in schema but types may not be regenerated yet
          orderBy = [
            { featured: 'desc' } as Prisma.PreConstructionProjectOrderByWithRelationInput,
            { createdAt: 'desc' }
          ]
        }

        projects = await prisma.preConstructionProject.findMany({
          where,
          take: limit ? parseInt(limit) : undefined,
          orderBy,
          include: {
            units: {
              select: {
                id: true,
                unitName: true,
                beds: true,
                baths: true,
                sqft: true,
                price: true,
                status: true,
              },
            },
          },
        })
        
        console.log('[API] Query successful, found', projects.length, 'projects')
        
        // Log sample project data for debugging
        if (projects.length > 0) {
          console.log('[API] Sample project:', {
            mlsNumber: projects[0].mlsNumber,
            projectName: projects[0].projectName,
            propertyType: projects[0].propertyType,
            isPublished: projects[0].isPublished,
            status: projects[0].status,
          })
        } else {
          console.warn('[API] ⚠️ No projects found with current filters')
          // Check if there are any published projects at all
          const totalPublished = await prisma.preConstructionProject.count({
            where: { isPublished: true }
          })
          console.log('[API] Total published projects in database:', totalPublished)
        }
        
        break // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        retries--
        
        console.error('[API] Prisma query error:', {
          message: lastError.message,
          stack: lastError.stack,
          retriesLeft: retries,
        })
        
        // Check if it's a connection error
        const isConnectionError = 
          lastError.message.includes('Connection terminated') ||
          lastError.message.includes('ECONNRESET') ||
          lastError.message.includes('ETIMEDOUT') ||
          lastError.message.includes('Connection closed') ||
          lastError.message.includes('P1001') || // Prisma connection error code
          lastError.message.includes('Can\'t reach database server')
        
        if (isConnectionError && retries > 0) {
          console.warn(`⚠️ Connection error, retrying... (${retries} attempts left)`)
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)))
          // Try to reconnect
          try {
            await prisma.$disconnect()
            await prisma.$connect()
          } catch (_reconnectError) {
            console.warn('Reconnection attempt failed, will retry query')
          }
        } else {
          // Log the error and rethrow
          console.error('[API] Non-connection error or out of retries:', lastError)
          throw lastError
        }
      }
    }
    
    if (!projects) {
      const finalError = lastError || new Error('Failed to fetch projects after retries')
      console.error('[API] No projects returned after all retries:', finalError)
      throw finalError
    }

    // Parse JSON fields and convert to PropertyListing format
    const parseJsonField = (field: string | null) => {
      if (!field) return null
      try {
        return JSON.parse(field)
      } catch {
        return null
      }
    }

    // Helper function to fetch developer name by ID
    const getDeveloperName = async (developerId: string): Promise<string> => {
      if (!developerId) return 'Unknown Developer'
      try {
        const developer = await prisma.developmentTeam.findUnique({
          where: { id: developerId },
          select: { name: true },
        })
        return developer?.name || developerId
      } catch {
        return developerId
      }
    }

    // Fetch all developer names in parallel
    const developerIds = [...new Set(projects.map(p => p.developer).filter(Boolean))]
    const developerNamesMap = new Map<string, string>()
    
    await Promise.all(
      developerIds
        .filter((id): id is string => id !== null && id !== undefined)
        .map(async (id) => {
          const name = await getDeveloperName(id)
          developerNamesMap.set(id, name)
        })
    )

    const formattedProjects = projects.map((project) => {
      const documents = parseJsonField(project.documents)
      const developerInfo = parseJsonField(project.developerInfo)
      const architectInfo = parseJsonField(project.architectInfo)
      const builderInfo = parseJsonField(project.builderInfo)
      const interiorDesignerInfo = parseJsonField(project.interiorDesignerInfo)
      const landscapeArchitectInfo = parseJsonField(project.landscapeArchitectInfo)
      const marketingInfo = parseJsonField(project.marketingInfo)

      // Get developer name from map
      const developerName = project.developer 
        ? (developerNamesMap.get(project.developer) || project.developer)
        : null

      // Build development team object
      interface DevelopmentTeamMember {
        id?: string
        name: string
        description?: string
        website?: string
        image?: string
        email?: string
        phone?: string
        stats?: {
          totalProjects: number
          activelySelling: number
          launchingSoon: number
          registrationPhase: number
          soldOut: number
          resale: number
          cancelled: number
        }
      }

      interface DevelopmentTeam {
        overview?: string
        developer?: DevelopmentTeamMember
        architect?: DevelopmentTeamMember
        builder?: DevelopmentTeamMember
        interiorDesigner?: DevelopmentTeamMember
        landscapeArchitect?: DevelopmentTeamMember
        marketing?: DevelopmentTeamMember
      }

      // Helper function to convert image URLs in team member objects
      const convertTeamMemberImage = (member: DevelopmentTeamMember | null | undefined): DevelopmentTeamMember | undefined => {
        if (!member) return undefined
        return {
          ...member,
          image: member.image ? convertToS3Url(member.image) : undefined,
        }
      }

      const developmentTeam: DevelopmentTeam = {}
      if (developerInfo) developmentTeam.developer = convertTeamMemberImage(developerInfo) as DevelopmentTeamMember
      if (architectInfo) developmentTeam.architect = convertTeamMemberImage(architectInfo) as DevelopmentTeamMember
      if (builderInfo) developmentTeam.builder = convertTeamMemberImage(builderInfo) as DevelopmentTeamMember
      if (interiorDesignerInfo) developmentTeam.interiorDesigner = convertTeamMemberImage(interiorDesignerInfo) as DevelopmentTeamMember
      if (landscapeArchitectInfo) developmentTeam.landscapeArchitect = convertTeamMemberImage(landscapeArchitectInfo) as DevelopmentTeamMember
      if (marketingInfo) developmentTeam.marketing = convertTeamMemberImage(marketingInfo) as DevelopmentTeamMember

      // Convert to PropertyListing format (matching mock data structure)
      return {
        mlsNumber: project.mlsNumber,
        status: project.status || null,
        class: 'residential',
        type: 'Sale',
        listPrice: project.startingPrice || null,
        priceRange: {
          min: project.startingPrice || null,
          max: project.endingPrice || project.startingPrice || null,
        },
        listDate: project.createdAt.toISOString(),
        lastStatus: project.status || null,
        soldPrice: '',
        soldDate: '',
        address: {
          area: null,
          city: project.city || null,
          country: project.country || null,
          district: null,
          majorIntersection: project.majorIntersection || null,
          neighborhood: project.neighborhood || null,
          streetDirection: null,
          streetName: project.streetName || null,
          streetNumber: project.streetNumber || null,
          streetSuffix: null,
          unitNumber: null,
          zip: project.zip || null,
          state: project.state || null,
          communityCode: null,
          streetDirectionPrefix: null,
          addressKey: null,
          location: [
            project.streetNumber,
            project.streetName,
            project.city,
            project.state,
            project.zip,
          ]
            .filter(Boolean)
            .join(', '),
        },
        map: {
          latitude: project.latitude,
          longitude: project.longitude,
          point: null,
        },
        details: {
          numBathrooms: project.bathroomRange ? parseInt(project.bathroomRange.split('-')[0]) || 1 : 1,
          numBathroomsPlus: project.bathroomRange ? parseInt(project.bathroomRange.split('-')[1]) || 1 : 1,
          numBedrooms: project.bedroomRange ? parseInt(project.bedroomRange.split('-')[0]) || 1 : 1,
          numBedroomsPlus: project.bedroomRange ? parseInt(project.bedroomRange.split('-')[1]) || 1 : 1,
          propertyType: project.propertyType || null,
          sqft: project.sqftRange ? parseInt(project.sqftRange.split('-')[0]) || 0 : 0,
        },
        updatedOn: project.updatedAt.toISOString(),
        lot: {
          acres: 0,
          depth: 0,
          irregular: 0,
          legalDescription: project.description || '',
          measurement: '',
          width: 0,
          size: 0,
          source: '',
          dimensionsSource: '',
          dimensions: '',
          squareFeet: project.sqftRange ? parseInt(project.sqftRange.split('-')[0]) || 0 : 0,
          taxLot: '',
        },
        boardId: 0,
        images: {
          imageUrl: project.images[0] ? convertToS3Url(project.images[0]) : '/images/p1.jpg',
          allImages: project.images.length > 0 
            ? project.images.map(img => convertToS3Url(img))
            : ['/images/p1.jpg'],
        },
        preCon: {
          projectName: project.projectName,
          developer: developerName,
          startingPrice: project.startingPrice || null,
          endingPrice: project.endingPrice || null,
          avgPricePerSqft: project.avgPricePerSqft || null,
          priceRange: {
            min: project.startingPrice || null,
            max: project.endingPrice || project.startingPrice || null,
          },
          status: project.status || null,
          completion: {
            date: project.occupancyDate || null,
            progress: (() => {
              // Convert integer completionProgress to string for frontend
              if (project.completionProgress === null || project.completionProgress === undefined) {
                return 'Pre-construction'
              }
              const progressMap: Record<number, string> = {
                0: 'Pre-construction',
                1: 'Construction',
                2: 'Complete',
              }
              return progressMap[project.completionProgress] || 'Pre-construction'
            })(),
          },
          details: {
            bedroomRange: project.bedroomRange || null,
            bathroomRange: project.bathroomRange || null,
            sqftRange: project.sqftRange || null,
            totalUnits: project.totalUnits || null,
            availableUnits: project.availableUnits || null,
            storeys: project.storeys || undefined,
            height: project.height || undefined,
            propertyType: project.propertyType || null,
            subPropertyType: project.subPropertyType || undefined,
          },
          // Pricing fields
          parkingPrice: project.parkingPrice || null,
          parkingPriceDetail: project.parkingPriceDetail || null,
          lockerPrice: project.lockerPrice || null,
          lockerPriceDetail: project.lockerPriceDetail || null,
          assignmentFee: project.assignmentFee || null,
          developmentLevies: project.developmentLevies || null,
          developmentCharges: project.developmentCharges || null,
          maintenanceFeesPerSqft: project.maintenanceFeesPerSqft || null,
          maintenanceFeesDetail: project.maintenanceFeesDetail || null,
          floorPremiums: project.floorPremiums || null,
          promotions: project.promotions || null,
          amenities: project.amenities,
          features: project.features || [],
          videos: project.videos || [],
          depositStructure: project.depositStructure || undefined,
          description: project.description || undefined,
          documents: documents || undefined,
          developmentTeam: Object.keys(developmentTeam).length > 0 ? developmentTeam : undefined,
        },
      }
    })

    return NextResponse.json({ projects: formattedProjects })
  } catch (error) {
    // Enhanced error logging for debugging production issues
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    }
    
    console.error('[API] Error fetching pre-con projects:', {
      error: errorDetails,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    })
    
    // In production, don't expose full error details to client
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Failed to fetch projects. Please try again later.'
      : errorDetails.message
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
      },
      { status: 500 }
    )
  }
}

