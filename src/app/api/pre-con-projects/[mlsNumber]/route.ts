import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertToS3Url } from '@/lib/image-url'

// GET - Public endpoint to fetch a single pre-con project by MLS number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlsNumber: string }> }
) {
  try {
    const { mlsNumber } = await params

    // Get project
    const project = await prisma.preConstructionProject.findUnique({
      where: { mlsNumber },
      include: {
        units: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
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

    const documents = parseJsonField(project.documents)
    const developerInfo = parseJsonField(project.developerInfo)
    const architectInfo = parseJsonField(project.architectInfo)
    const builderInfo = parseJsonField(project.builderInfo)
    const interiorDesignerInfo = parseJsonField(project.interiorDesignerInfo)
    const landscapeArchitectInfo = parseJsonField(project.landscapeArchitectInfo)
    const marketingInfo = parseJsonField(project.marketingInfo)

    // Get developer name
    const developerName = project.developer ? await getDeveloperName(project.developer) : null

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

    // Convert units to UnitListing format
    const formattedUnits = project.units.map((unit) => {
      // Handle both old floorplanImage and new images array for backward compatibility
      // Type assertion needed because Prisma types may not be fully updated yet
      type UnitWithImages = typeof unit & { images?: string[]; floorplanImage?: string | null; studio?: boolean }
      const unitWithImages = unit as UnitWithImages
      const unitImages = unitWithImages.images || (unitWithImages.floorplanImage ? [unitWithImages.floorplanImage] : [])
      // Convert image URLs to S3 format
      const convertedImages = unitImages.length > 0 
        ? unitImages.map(img => convertToS3Url(img))
        : ['/images/floorplan-placeholder.jpg']
      return {
        id: unit.id,
        name: unit.unitName,
        beds: unit.beds,
        baths: unit.baths,
        sqft: unit.sqft,
        price: unit.price,
        maintenanceFee: unit.maintenanceFee,
        status: unit.status === 'for-sale' ? 'for-sale' : unit.status === 'sold-out' ? 'sold-out' : 'reserved',
        images: convertedImages,
        description: unit.description,
        features: unit.features || [],
        amenities: unit.amenities || [],
        studio: unitWithImages.studio ?? false,
      }
    })

    // Convert to PropertyListing format
    const formattedProject = {
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
        numBathrooms: project.bathroomRange ? parseInt(project.bathroomRange.split('-')[0]) || 1 : 1,
        numBathroomsPlus: project.bathroomRange ? parseInt(project.bathroomRange.split('-')[1]) || 1 : 1,
        numBedrooms: project.bedroomRange ? parseInt(project.bedroomRange.split('-')[0]) || 1 : 1,
        numBedroomsPlus: project.bedroomRange ? parseInt(project.bedroomRange.split('-')[1]) || 1 : 1,
        propertyType: project.propertyType,
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
          startingPrice: project.startingPrice,
        endingPrice: project.endingPrice || null,
        avgPricePerSqft: project.avgPricePerSqft || null,
        priceRange: {
          min: project.startingPrice,
          max: project.endingPrice || project.startingPrice,
        },
        status: project.status,
        completion: {
          date: project.occupancyDate,
          progress: (() => {
            const progressMap: Record<number, string> = {
              0: 'Pre-construction',
              1: 'Construction',
              2: 'Complete',
            }
            return project.completionProgress !== null && project.completionProgress !== undefined 
              ? (progressMap[project.completionProgress] || 'Pre-construction')
              : 'Pre-construction'
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
        units: formattedUnits,
      },
    }

    return NextResponse.json({ project: formattedProject })
  } catch (error) {
    console.error('Error fetching pre-con project:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

