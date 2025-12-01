import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

// PATCH - Toggle featured status for a project
export async function PATCH(
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
    const { featured } = body

    if (typeof featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid featured value. Must be a boolean.' },
        { status: 400 }
      )
    }

    // Check if project exists
    const project = await prisma.preConstructionProject.findUnique({
      where: { id },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Update the featured status
    const updatedProject = await prisma.preConstructionProject.update({
      where: { id },
      data: { featured },
      select: {
        id: true,
        featured: true,
      },
    })

    return NextResponse.json(
      { 
        message: `Project ${featured ? 'featured' : 'unfeatured'} successfully`,
        project: updatedProject 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating featured status:', error)
    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500 }
    )
  }
}

