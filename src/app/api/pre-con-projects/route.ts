import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Public endpoint to fetch all pre-con projects for website display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const city = searchParams.get('city') || ''
    const limit = searchParams.get('limit')

    // Build where clause
    const where: {
      status?: string
      city?: { contains: string; mode: 'insensitive' }
    } = {}
    
    if (status) {
      where.status = status
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    // Retry logic for connection issues
    let retries = 3
    let projects
    let lastError: Error | null = null
    
    while (retries > 0) {
      try {
        // Get projects
        projects = await prisma.preConstructionProject.findMany({
          where,
          take: limit ? parseInt(limit) : undefined,
          orderBy: { createdAt: 'desc' },
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
          } catch (reconnectError) {
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
        const developer = await prisma.developer.findUnique({
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
      developerIds.map(async (id) => {
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
      const developerName = developerNamesMap.get(project.developer) || project.developer

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

      const developmentTeam: DevelopmentTeam = {}
      if (developerInfo) developmentTeam.developer = developerInfo as DevelopmentTeamMember
      if (architectInfo) developmentTeam.architect = architectInfo as DevelopmentTeamMember
      if (builderInfo) developmentTeam.builder = builderInfo as DevelopmentTeamMember
      if (interiorDesignerInfo) developmentTeam.interiorDesigner = interiorDesignerInfo as DevelopmentTeamMember
      if (landscapeArchitectInfo) developmentTeam.landscapeArchitect = landscapeArchitectInfo as DevelopmentTeamMember
      if (marketingInfo) developmentTeam.marketing = marketingInfo as DevelopmentTeamMember

      // Convert to PropertyListing format (matching mock data structure)
      return {
        mlsNumber: project.mlsNumber,
        status: project.status,
        class: 'residential',
        type: 'Sale',
        listPrice: project.startingPrice,
        priceRange: {
          min: project.startingPrice,
          max: project.endingPrice || project.startingPrice,
        },
        listDate: project.createdAt.toISOString(),
        lastStatus: project.status,
        soldPrice: '',
        soldDate: '',
        address: {
          area: null,
          city: project.city,
          country: project.country,
          district: null,
          majorIntersection: project.majorIntersection || null,
          neighborhood: project.neighborhood || null,
          streetDirection: null,
          streetName: project.streetName || null,
          streetNumber: project.streetNumber || null,
          streetSuffix: null,
          unitNumber: null,
          zip: project.zip || null,
          state: project.state,
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
          numBathrooms: parseInt(project.bathroomRange.split('-')[0]) || 1,
          numBathroomsPlus: parseInt(project.bathroomRange.split('-')[1]) || 1,
          numBedrooms: parseInt(project.bedroomRange.split('-')[0]) || 1,
          numBedroomsPlus: parseInt(project.bedroomRange.split('-')[1]) || 1,
          propertyType: project.propertyType,
          sqft: parseInt(project.sqftRange.split('-')[0]) || 0,
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
          squareFeet: parseInt(project.sqftRange.split('-')[0]) || 0,
          taxLot: '',
        },
        boardId: 0,
        images: {
          imageUrl: project.images[0] || '/images/p1.jpg',
          allImages: project.images.length > 0 ? project.images : ['/images/p1.jpg'],
        },
        preCon: {
          projectName: project.projectName,
          developer: developerName,
          startingPrice: project.startingPrice,
          endingPrice: project.endingPrice || null,
          avgPricePerSqft: project.avgPricePerSqft || null,
          priceRange: {
            min: project.startingPrice,
            max: project.endingPrice || project.startingPrice,
          },
          status: project.status,
          completion: {
            date: project.completionDate,
            progress: (() => {
              // Convert integer completionProgress to string for frontend
              const progressMap: Record<number, string> = {
                0: 'Pre-construction',
                1: 'Construction',
                2: 'Complete',
              }
              return progressMap[project.completionProgress] || 'Pre-construction'
            })(),
          },
          details: {
            bedroomRange: project.bedroomRange,
            bathroomRange: project.bathroomRange,
            sqftRange: project.sqftRange,
            totalUnits: project.totalUnits,
            availableUnits: project.availableUnits,
            storeys: project.storeys || undefined,
            height: project.height || undefined,
            propertyType: project.propertyType,
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

