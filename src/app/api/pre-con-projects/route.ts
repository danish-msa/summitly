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

    // Get projects
    const projects = await prisma.preConstructionProject.findMany({
      where,
      take: limit ? parseInt(limit) : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        units: {
          select: {
            id: true,
            name: true,
            beds: true,
            baths: true,
            sqft: true,
            price: true,
            status: true,
          },
        },
      },
    })

    // Parse JSON fields and convert to PropertyListing format
    const parseJsonField = (field: string | null) => {
      if (!field) return null
      try {
        return JSON.parse(field)
      } catch {
        return null
      }
    }

    const formattedProjects = projects.map((project) => {
      const documents = parseJsonField(project.documents)
      const developerInfo = parseJsonField(project.developerInfo)
      const architectInfo = parseJsonField(project.architectInfo)
      const builderInfo = parseJsonField(project.builderInfo)
      const interiorDesignerInfo = parseJsonField(project.interiorDesignerInfo)
      const landscapeArchitectInfo = parseJsonField(project.landscapeArchitectInfo)
      const marketingInfo = parseJsonField(project.marketingInfo)

      // Build development team object
      const developmentTeam: any = {}
      if (developerInfo) developmentTeam.developer = developerInfo
      if (architectInfo) developmentTeam.architect = architectInfo
      if (builderInfo) developmentTeam.builder = builderInfo
      if (interiorDesignerInfo) developmentTeam.interiorDesigner = interiorDesignerInfo
      if (landscapeArchitectInfo) developmentTeam.landscapeArchitect = landscapeArchitectInfo
      if (marketingInfo) developmentTeam.marketing = marketingInfo

      // Convert to PropertyListing format (matching mock data structure)
      return {
        mlsNumber: project.mlsNumber,
        status: project.status,
        class: 'residential',
        type: 'Sale',
        listPrice: project.startingPrice,
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
          features: project.features.join(', '),
          taxLot: '',
        },
        boardId: 0,
        images: {
          imageUrl: project.images[0] || '/images/p1.jpg',
          allImages: project.images.length > 0 ? project.images : ['/images/p1.jpg'],
        },
        preCon: {
          projectName: project.projectName,
          developer: project.developer,
          startingPrice: project.startingPrice,
          priceRange: {
            min: project.startingPrice,
            max: project.startingPrice * 2, // Estimate max price
          },
          status: project.status,
          completion: {
            date: project.completionDate,
            progress: project.completionProgress,
          },
          details: {
            bedroomRange: project.bedroomRange,
            bathroomRange: project.bathroomRange,
            sqftRange: project.sqftRange,
            totalUnits: project.totalUnits,
            availableUnits: project.availableUnits,
            storeys: project.storeys || undefined,
          },
          features: project.features,
          amenities: project.amenities,
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

