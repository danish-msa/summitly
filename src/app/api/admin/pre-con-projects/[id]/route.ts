import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import type { Prisma } from '@prisma/client'

// Helper function to fetch developer data by ID and return as JSON string
async function fetchDeveloperData(developerId: string): Promise<string | null> {
  if (!developerId) return null
  try {
    const developer = await prisma.developmentTeam.findUnique({
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

// GET - Get a single project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const project = await prisma.preConstructionProject.findUnique({
      where: { id },
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

    // Parse JSON fields safely
    const parseJsonField = (field: string | null) => {
      if (!field) return null
      try {
        return JSON.parse(field)
      } catch {
        return null
      }
    }

    // Extract developer ID from JSON (for form compatibility)
    const extractDeveloperId = (field: string | null): string | null => {
      const parsed = parseJsonField(field)
      return parsed?.id || null
    }

    // Fetch creator info separately if createdBy exists
    let creator = null
    if (project.createdBy) {
      try {
        const creatorUser = await prisma.user.findUnique({
          where: { id: project.createdBy },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
        creator = creatorUser
      } catch (error) {
        console.error('Error fetching creator:', error)
      }
    }

    // Type assertion to access all fields (Prisma types may not include all fields with include)
    const projectWithAllFields = project as typeof project & {
      interiorDesignerInfo: string | null
      landscapeArchitectInfo: string | null
      marketingInfo: string | null
      developmentTeamOverview: string | null
    }

    // Convert completionProgress integer back to string for form compatibility
    const progressToString = (progress: number | null | undefined): string => {
      const progressMap: Record<number, string> = {
        0: 'Pre-construction',
        1: 'Construction',
        2: 'Complete',
      }
      if (progress === null || progress === undefined) return ''
      return progressMap[progress] || 'Pre-construction'
    }

    const parsedProject = {
      ...project,
      completionProgress: progressToString(project.completionProgress as unknown as number),
      documents: parseJsonField(project.documents),
      developerInfo: extractDeveloperId(project.developerInfo ?? null),
      architectInfo: extractDeveloperId(project.architectInfo ?? null),
      builderInfo: extractDeveloperId(project.builderInfo ?? null),
      interiorDesignerInfo: extractDeveloperId(projectWithAllFields.interiorDesignerInfo ?? null),
      landscapeArchitectInfo: extractDeveloperId(projectWithAllFields.landscapeArchitectInfo ?? null),
      marketingInfo: extractDeveloperId(projectWithAllFields.marketingInfo ?? null),
      developmentTeamOverview: projectWithAllFields.developmentTeamOverview ?? null,
      creatorName: creator?.name || creator?.email || null,
    }

    return NextResponse.json({ project: parsedProject })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PUT - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    // Only projectName is required (for both drafts and published projects)
    if (body.projectName !== undefined && (!body.projectName || body.projectName.trim() === '')) {
      return NextResponse.json(
        { 
          error: 'Missing required field',
          missingFields: ['projectName'],
          message: 'Project Name is required. Please provide a project name.'
        },
        { status: 400 }
      )
    }

    // Check if project exists
    const existing = await prisma.preConstructionProject.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if mlsNumber is being changed and if it conflicts
    if (body.mlsNumber && body.mlsNumber !== existing.mlsNumber) {
      const mlsConflict = await prisma.preConstructionProject.findUnique({
        where: { mlsNumber: body.mlsNumber },
      })

      if (mlsConflict) {
        return NextResponse.json(
          { error: 'MLS number already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: {
      projectName?: string
      developer?: string
      startingPrice?: number
      endingPrice?: number
      avgPricePerSqft?: number | null
      status?: string
      parkingPrice?: number | null
      parkingPriceDetail?: string | null
      lockerPrice?: number | null
      lockerPriceDetail?: string | null
      assignmentFee?: number | null
      developmentLevies?: string | null
      developmentCharges?: number | null
      streetNumber?: string | null
      streetName?: string | null
      city?: string | null
      state?: string | null
      zip?: string | null
      country?: string | null
      neighborhood?: string | null
      majorIntersection?: string | null
      latitude?: number | null
      longitude?: number | null
      propertyType?: string | null
      subPropertyType?: string | null
      bedroomRange?: string | null
      bathroomRange?: string | null
      sqftRange?: string | null
      hasDen?: boolean
      hasStudio?: boolean
      hasLoft?: boolean
      hasWorkLiveLoft?: boolean
      totalUnits?: number | null
      availableUnits?: number | null
      suites?: number | null
      storeys?: number | null
      height?: string | null
      maintenanceFeesPerSqft?: number | null
      maintenanceFeesDetail?: string | null
      floorPremiums?: string | null
      occupancyDate?: string | null
      completionProgress?: number | null
      promotions?: string | null
      ownershipType?: string | null
      garage?: string | null
      basement?: string | null
      images?: string[]
      videos?: string[]
      amenities?: string[]
      depositStructure?: string | null
      description?: string | null
      metaTitle?: string | null
      metaDescription?: string | null
      keywords?: string[]
      documents?: string | null
      developerInfo?: string | null
      architectInfo?: string | null
      builderInfo?: string | null
      interiorDesignerInfo?: string | null
      landscapeArchitectInfo?: string | null
      marketingInfo?: string | null
      salesMarketingCompany?: string | null
      developmentTeamOverview?: string | null
      isPublished?: boolean
      mlsNumber?: string
    } = {}
    if (body.projectName !== undefined) updateData.projectName = body.projectName
    if (body.developer !== undefined) {
      updateData.developer = body.developer && body.developer.trim() !== '' ? body.developer : undefined
    }
    if (body.startingPrice !== undefined) {
      updateData.startingPrice = body.startingPrice && body.startingPrice !== '' ? parseFloat(body.startingPrice) : undefined
    }
    if (body.endingPrice !== undefined) {
      updateData.endingPrice = body.endingPrice && body.endingPrice !== '' ? parseFloat(body.endingPrice) : undefined
    }
    if (body.avgPricePerSqft !== undefined) {
      const parsed = body.avgPricePerSqft === '' || body.avgPricePerSqft === null ? null : parseFloat(String(body.avgPricePerSqft))
      updateData.avgPricePerSqft = isNaN(parsed as number) ? null : parsed
    }
    if (body.status !== undefined) {
      updateData.status = body.status && body.status.trim() !== '' ? body.status : undefined
    }
    if (body.parkingPrice !== undefined) {
      const parsed = body.parkingPrice === '' || body.parkingPrice === null ? null : parseFloat(String(body.parkingPrice))
      updateData.parkingPrice = isNaN(parsed as number) ? null : parsed
    }
    if (body.parkingPriceDetail !== undefined) updateData.parkingPriceDetail = body.parkingPriceDetail === '' ? null : (body.parkingPriceDetail || null)
    if (body.lockerPrice !== undefined) {
      const parsed = body.lockerPrice === '' || body.lockerPrice === null ? null : parseFloat(String(body.lockerPrice))
      updateData.lockerPrice = isNaN(parsed as number) ? null : parsed
    }
    if (body.lockerPriceDetail !== undefined) updateData.lockerPriceDetail = body.lockerPriceDetail === '' ? null : (body.lockerPriceDetail || null)
    if (body.assignmentFee !== undefined) {
      const parsed = body.assignmentFee === '' || body.assignmentFee === null ? null : parseFloat(String(body.assignmentFee))
      updateData.assignmentFee = isNaN(parsed as number) ? null : parsed
    }
    if (body.developmentLevies !== undefined) {
      updateData.developmentLevies = body.developmentLevies === '' || body.developmentLevies === null ? null : String(body.developmentLevies).trim()
    }
    if (body.developmentCharges !== undefined) {
      const parsed = body.developmentCharges === '' || body.developmentCharges === null ? null : parseFloat(String(body.developmentCharges))
      updateData.developmentCharges = isNaN(parsed as number) ? null : parsed
    }
    if (body.streetNumber !== undefined) updateData.streetNumber = body.streetNumber
    if (body.streetName !== undefined) updateData.streetName = body.streetName
    if (body.city !== undefined) updateData.city = body.city || null
    if (body.state !== undefined) updateData.state = body.state || null
    if (body.zip !== undefined) updateData.zip = body.zip
    if (body.country !== undefined) updateData.country = body.country
    if (body.neighborhood !== undefined) updateData.neighborhood = body.neighborhood
    if (body.majorIntersection !== undefined) updateData.majorIntersection = body.majorIntersection
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? parseFloat(body.latitude) : null
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? parseFloat(body.longitude) : null
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType || null
    if (body.subPropertyType !== undefined) updateData.subPropertyType = body.subPropertyType || null
    if (body.bedroomRange !== undefined) updateData.bedroomRange = body.bedroomRange || null
    if (body.bathroomRange !== undefined) updateData.bathroomRange = body.bathroomRange || null
    if (body.sqftRange !== undefined) updateData.sqftRange = body.sqftRange || null
    if (body.hasDen !== undefined) updateData.hasDen = body.hasDen === true || body.hasDen === 'true'
    if (body.hasStudio !== undefined) updateData.hasStudio = body.hasStudio === true || body.hasStudio === 'true'
    if (body.hasLoft !== undefined) updateData.hasLoft = body.hasLoft === true || body.hasLoft === 'true'
    if (body.hasWorkLiveLoft !== undefined) updateData.hasWorkLiveLoft = body.hasWorkLiveLoft === true || body.hasWorkLiveLoft === 'true'
    if (body.totalUnits !== undefined) updateData.totalUnits = body.totalUnits ? parseInt(body.totalUnits) : null
    if (body.availableUnits !== undefined) updateData.availableUnits = body.availableUnits ? parseInt(body.availableUnits) : null
    if (body.suites !== undefined) updateData.suites = body.suites ? parseInt(body.suites) : null
    if (body.storeys !== undefined) updateData.storeys = body.storeys ? parseInt(body.storeys) : null
    if (body.height !== undefined) updateData.height = body.height === '' ? null : (body.height || null)
    if (body.maintenanceFeesPerSqft !== undefined) {
      const parsed = body.maintenanceFeesPerSqft === '' || body.maintenanceFeesPerSqft === null ? null : parseFloat(String(body.maintenanceFeesPerSqft))
      updateData.maintenanceFeesPerSqft = isNaN(parsed as number) ? null : parsed
    }
    if (body.maintenanceFeesDetail !== undefined) updateData.maintenanceFeesDetail = body.maintenanceFeesDetail === '' ? null : (body.maintenanceFeesDetail || null)
    if (body.floorPremiums !== undefined) updateData.floorPremiums = body.floorPremiums === '' ? null : (body.floorPremiums || null)
    if (body.occupancyDate !== undefined) updateData.occupancyDate = body.occupancyDate || null
    if (body.completionProgress !== undefined) {
      // Convert completionProgress string to integer (database expects Int)
      if (!body.completionProgress) {
        updateData.completionProgress = null
      } else {
        const progressMap: Record<string, number> = {
          'Pre-construction': 0,
          'Construction': 1,
          'Complete': 2,
        }
        
        if (typeof body.completionProgress === 'number') {
          updateData.completionProgress = body.completionProgress
        } else {
          const progressString = String(body.completionProgress || '').trim()
          if (progressString in progressMap) {
            updateData.completionProgress = progressMap[progressString]
          } else {
            const parsed = parseInt(progressString, 10)
            updateData.completionProgress = !isNaN(parsed) ? parsed : null
          }
        }
      }
    }
    if (body.promotions !== undefined) updateData.promotions = body.promotions
    if (body.ownershipType !== undefined) updateData.ownershipType = body.ownershipType || null
    if (body.garage !== undefined) updateData.garage = body.garage || null
    if (body.basement !== undefined) updateData.basement = body.basement || null
    if (body.images !== undefined) updateData.images = Array.isArray(body.images) ? body.images : []
    if (body.videos !== undefined) updateData.videos = Array.isArray(body.videos) ? body.videos : []
    if (body.amenities !== undefined || body.customAmenities !== undefined) {
      const amenitiesArray = (() => {
        const amenityStrings: string[] = []
        
        // Handle predefined amenities (can be objects with { name, icon } or strings)
        if (Array.isArray(body.amenities)) {
          body.amenities.forEach((a: { name: string; icon: string } | string) => {
            if (typeof a === 'string' && a.trim().length > 0) {
              amenityStrings.push(a.trim())
            } else if (typeof a === 'object' && a !== null && 'name' in a && typeof a.name === 'string' && a.name.trim().length > 0) {
              amenityStrings.push(a.name.trim())
            }
          })
        }
        
        // Handle custom amenities (should be strings)
        if (Array.isArray(body.customAmenities)) {
          body.customAmenities.forEach((a: string) => {
            if (typeof a === 'string' && a.trim().length > 0) {
              amenityStrings.push(a.trim())
            }
          })
        }
        
        return amenityStrings
      })()
      
      updateData.amenities = amenitiesArray
    }
    if (body.depositStructure !== undefined) updateData.depositStructure = body.depositStructure
    if (body.description !== undefined) updateData.description = body.description
    if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle && body.metaTitle.trim() ? body.metaTitle.trim() : null
    if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription && body.metaDescription.trim() ? body.metaDescription.trim() : null
    if (body.keywords !== undefined) {
      updateData.keywords = Array.isArray(body.keywords) 
        ? body.keywords.filter((k: unknown) => k && String(k).trim()).map((k: unknown) => String(k).trim())
        : []
    }
    if (body.documents !== undefined) updateData.documents = body.documents ? JSON.stringify(body.documents) : null
    if (body.developerInfo !== undefined) updateData.developerInfo = body.developerInfo ? await fetchDeveloperData(body.developerInfo) : null
    if (body.architectInfo !== undefined) updateData.architectInfo = body.architectInfo ? await fetchDeveloperData(body.architectInfo) : null
    if (body.builderInfo !== undefined) updateData.builderInfo = body.builderInfo ? await fetchDeveloperData(body.builderInfo) : null
    if (body.interiorDesignerInfo !== undefined) updateData.interiorDesignerInfo = body.interiorDesignerInfo ? await fetchDeveloperData(body.interiorDesignerInfo) : null
    if (body.landscapeArchitectInfo !== undefined) updateData.landscapeArchitectInfo = body.landscapeArchitectInfo ? await fetchDeveloperData(body.landscapeArchitectInfo) : null
    if (body.marketingInfo !== undefined) updateData.marketingInfo = body.marketingInfo ? await fetchDeveloperData(body.marketingInfo) : null
    if (body.salesMarketingCompany !== undefined) updateData.salesMarketingCompany = body.salesMarketingCompany || null
    if (body.developmentTeamOverview !== undefined) updateData.developmentTeamOverview = body.developmentTeamOverview || null
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished === true || body.isPublished === 'true'
    if (body.mlsNumber !== undefined) updateData.mlsNumber = body.mlsNumber

    // Handle units update (delete all existing and create new ones)
    if (body.units !== undefined && Array.isArray(body.units)) {
      // Delete all existing units
      await prisma.preConstructionUnit.deleteMany({
        where: { projectId: id },
      })

      // Create new units if any
      if (body.units.length > 0) {
        await prisma.preConstructionUnit.createMany({
          data: body.units.map((unit: {
            id?: string
            unitName: string
            beds: number | string
            baths: number | string
            sqft: number | string
            price: number | string
            maintenanceFee?: number | string | null
            status: string
            studio?: boolean
            images?: string[]
            description?: string | null
            features?: string[]
            amenities?: string[]
          }) => ({
            projectId: id,
            unitName: unit.unitName,
            beds: String(unit.beds || ''),
            baths: String(unit.baths || ''),
            sqft: typeof unit.sqft === 'number' ? unit.sqft : parseInt(String(unit.sqft), 10),
            price: typeof unit.price === 'number' ? unit.price : parseFloat(String(unit.price)),
            maintenanceFee: unit.maintenanceFee ? (typeof unit.maintenanceFee === 'number' ? unit.maintenanceFee : parseFloat(String(unit.maintenanceFee))) : null,
            status: unit.status || 'for-sale',
            studio: unit.studio === true,
            images: Array.isArray(unit.images) ? unit.images.filter((img): img is string => typeof img === 'string' && img.length > 0) : [],
            description: unit.description || null,
            features: Array.isArray(unit.features) ? unit.features : [],
            amenities: Array.isArray(unit.amenities) ? unit.amenities : [],
          })),
        })
      }
    }

    const project = await prisma.preConstructionProject.update({
      where: { id },
      data: updateData as Prisma.PreConstructionProjectUncheckedUpdateInput,
      include: {
        units: true,
      },
    })

    // Parse JSON fields safely
    const parseJsonField = (field: string | null) => {
      if (!field) return null
      try {
        return JSON.parse(field)
      } catch {
        return null
      }
    }

    // Extract developer ID from JSON (for form compatibility)
    const extractDeveloperId = (field: string | null): string | null => {
      const parsed = parseJsonField(field)
      return parsed?.id || null
    }

    // Type assertion to access all fields (Prisma types may not include all fields with include)
    const projectWithAllFields = project as typeof project & {
      interiorDesignerInfo: string | null
      landscapeArchitectInfo: string | null
      marketingInfo: string | null
      developmentTeamOverview: string | null
    }

    // Convert completionProgress integer back to string for form compatibility
    const progressToString = (progress: number | null | undefined): string => {
      const progressMap: Record<number, string> = {
        0: 'Pre-construction',
        1: 'Construction',
        2: 'Complete',
      }
      if (progress === null || progress === undefined) return ''
      return progressMap[progress] || 'Pre-construction'
    }

    // Fetch creator info separately if createdBy exists
    let creator = null
    if (project.createdBy) {
      try {
        const creatorUser = await prisma.user.findUnique({
          where: { id: project.createdBy },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
        creator = creatorUser
      } catch (error) {
        console.error('Error fetching creator:', error)
      }
    }

    const parsedProject = {
      ...project,
      completionProgress: progressToString(project.completionProgress as unknown as number),
      documents: parseJsonField(project.documents),
      developerInfo: extractDeveloperId(project.developerInfo ?? null),
      architectInfo: extractDeveloperId(project.architectInfo ?? null),
      builderInfo: extractDeveloperId(project.builderInfo ?? null),
      interiorDesignerInfo: extractDeveloperId(projectWithAllFields.interiorDesignerInfo ?? null),
      landscapeArchitectInfo: extractDeveloperId(projectWithAllFields.landscapeArchitectInfo ?? null),
      marketingInfo: extractDeveloperId(projectWithAllFields.marketingInfo ?? null),
      developmentTeamOverview: projectWithAllFields.developmentTeamOverview ?? null,
      creatorName: creator?.name || creator?.email || null,
    }

    return NextResponse.json({ project: parsedProject })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Check if project exists
    const existing = await prisma.preConstructionProject.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Delete project (units will be cascade deleted)
    await prisma.preConstructionProject.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}

