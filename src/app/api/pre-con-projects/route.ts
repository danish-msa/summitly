import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertToS3Url } from '@/lib/image-url'
import { Prisma } from '@prisma/client'

// GET - Public endpoint to fetch all pre-con projects for website display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const city = searchParams.get('city') || ''
    const propertyType = searchParams.get('propertyType') || ''
    const subPropertyType = searchParams.get('subPropertyType') || ''
    const completionYear = searchParams.get('completionYear') || ''
    const developer = searchParams.get('developer') || ''
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')

    // Build where clause
    // Use Prisma's proper structure for AND/OR conditions
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
      // Check multiple case variations to handle different database values
      const propertyTypeLower = propertyType.toLowerCase()
      const propertyTypeCapitalized = propertyType.charAt(0).toUpperCase() + propertyType.slice(1).toLowerCase()
      const propertyTypeUpper = propertyType.toUpperCase()
      
      const propertyTypeCondition: Prisma.PreConstructionProjectWhereInput = {
        OR: [
          { propertyType: propertyType },
          { propertyType: propertyTypeCapitalized },
          { propertyType: propertyTypeUpper },
          { propertyType: propertyTypeLower },
        ]
      }
      whereConditions.push(propertyTypeCondition)
    }
    if (subPropertyType) {
      whereConditions.push({ subPropertyType })
    }
    if (completionYear) {
      // Filter by occupancy date containing the year (e.g., "Q4 2025" contains "2025")
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
          // If not found by name, try as ID or name match
          whereConditions.push({ developer: { contains: developer, mode: 'insensitive' } })
        }
      } catch {
        // Fallback to simple contains match
        whereConditions.push({ developer: { contains: developer, mode: 'insensitive' } })
      }
    }
    if (featured !== null && featured !== undefined) {
      // Convert string to boolean
      whereConditions.push({ featured: featured === 'true' || featured === '1' })
    }
    
    // Combine all conditions with AND
    const where: Prisma.PreConstructionProjectWhereInput = whereConditions.length > 0 
      ? { AND: whereConditions } 
      : { isPublished: true }

    // Retry logic for connection issues
    let retries = 3
    let projects
    let lastError: Error | null = null
    
    while (retries > 0) {
      try {
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
        break // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        retries--
        
        // Check if it's a connection error
        const isConnectionError = 
          lastError.message.includes('Connection terminated') ||
          lastError.message.includes('ECONNRESET') ||
          lastError.message.includes('ETIMEDOUT') ||
          lastError.message.includes('Connection closed')
        
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
          throw lastError // Not a connection error or out of retries
        }
      }
    }
    
    if (!projects) {
      throw lastError || new Error('Failed to fetch projects after retries')
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
    console.error('Error fetching pre-con projects:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

