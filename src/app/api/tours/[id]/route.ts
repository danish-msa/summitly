import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Verify the tour belongs to the user
    const tour = await prisma.tour.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      )
    }

    // Delete the tour
    await prisma.tour.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting tour:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete tour'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Verify the tour belongs to the user
    const existingTour = await prisma.tour.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingTour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      )
    }

    // Update the tour
    const tour = await prisma.tour.update({
      where: { id },
      data: {
        ...(body.scheduledDate && { scheduledDate: new Date(body.scheduledDate) }),
        ...(body.tourType && { tourType: body.tourType }),
        ...(body.status && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    })

    return NextResponse.json({ tour }, { status: 200 })
  } catch (error) {
    console.error('Error updating tour:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update tour'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

