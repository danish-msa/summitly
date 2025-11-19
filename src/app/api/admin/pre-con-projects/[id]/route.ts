import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

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

    // Parse JSON fields
    const parsedProject = {
      ...project,
      documents: project.documents ? JSON.parse(project.documents) : null,
      developerInfo: project.developerInfo ? JSON.parse(project.developerInfo) : null,
      architectInfo: project.architectInfo ? JSON.parse(project.architectInfo) : null,
      builderInfo: project.builderInfo ? JSON.parse(project.builderInfo) : null,
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
      status?: string
      streetNumber?: string | null
      streetName?: string | null
      city?: string
      state?: string
      zip?: string | null
      country?: string
      neighborhood?: string | null
      majorIntersection?: string | null
      latitude?: number | null
      longitude?: number | null
      propertyType?: string
      bedroomRange?: string
      bathroomRange?: string
      sqftRange?: string
      totalUnits?: number
      availableUnits?: number
      storeys?: number | null
      completionDate?: string
      completionProgress?: number
      images?: string[]
      features?: string[]
      amenities?: string[]
      depositStructure?: string | null
      description?: string | null
      documents?: string | null
      developerInfo?: string | null
      architectInfo?: string | null
      builderInfo?: string | null
      mlsNumber?: string
    } = {}
    if (body.projectName !== undefined) updateData.projectName = body.projectName
    if (body.developer !== undefined) updateData.developer = body.developer
    if (body.startingPrice !== undefined) updateData.startingPrice = parseFloat(body.startingPrice)
    if (body.status !== undefined) updateData.status = body.status
    if (body.streetNumber !== undefined) updateData.streetNumber = body.streetNumber
    if (body.streetName !== undefined) updateData.streetName = body.streetName
    if (body.city !== undefined) updateData.city = body.city
    if (body.state !== undefined) updateData.state = body.state
    if (body.zip !== undefined) updateData.zip = body.zip
    if (body.country !== undefined) updateData.country = body.country
    if (body.neighborhood !== undefined) updateData.neighborhood = body.neighborhood
    if (body.majorIntersection !== undefined) updateData.majorIntersection = body.majorIntersection
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? parseFloat(body.latitude) : null
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? parseFloat(body.longitude) : null
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType
    if (body.bedroomRange !== undefined) updateData.bedroomRange = body.bedroomRange
    if (body.bathroomRange !== undefined) updateData.bathroomRange = body.bathroomRange
    if (body.sqftRange !== undefined) updateData.sqftRange = body.sqftRange
    if (body.totalUnits !== undefined) updateData.totalUnits = parseInt(body.totalUnits)
    if (body.availableUnits !== undefined) updateData.availableUnits = parseInt(body.availableUnits)
    if (body.storeys !== undefined) updateData.storeys = body.storeys ? parseInt(body.storeys) : null
    if (body.completionDate !== undefined) updateData.completionDate = body.completionDate
    if (body.completionProgress !== undefined) updateData.completionProgress = parseInt(body.completionProgress) || 0
    if (body.images !== undefined) updateData.images = Array.isArray(body.images) ? body.images : []
    if (body.features !== undefined) updateData.features = Array.isArray(body.features) ? body.features : []
    if (body.amenities !== undefined) updateData.amenities = Array.isArray(body.amenities) ? body.amenities : []
    if (body.depositStructure !== undefined) updateData.depositStructure = body.depositStructure
    if (body.description !== undefined) updateData.description = body.description
    if (body.documents !== undefined) updateData.documents = body.documents ? JSON.stringify(body.documents) : null
    if (body.developerInfo !== undefined) updateData.developerInfo = body.developerInfo ? JSON.stringify(body.developerInfo) : null
    if (body.architectInfo !== undefined) updateData.architectInfo = body.architectInfo ? JSON.stringify(body.architectInfo) : null
    if (body.builderInfo !== undefined) updateData.builderInfo = body.builderInfo ? JSON.stringify(body.builderInfo) : null
    if (body.mlsNumber !== undefined) updateData.mlsNumber = body.mlsNumber

    const project = await prisma.preConstructionProject.update({
      where: { id },
      data: updateData,
      include: {
        units: true,
      },
    })

    // Parse JSON fields
    const parsedProject = {
      ...project,
      documents: project.documents ? JSON.parse(project.documents) : null,
      developerInfo: project.developerInfo ? JSON.parse(project.developerInfo) : null,
      architectInfo: project.architectInfo ? JSON.parse(project.architectInfo) : null,
      builderInfo: project.builderInfo ? JSON.parse(project.builderInfo) : null,
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

