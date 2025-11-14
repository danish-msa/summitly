import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tours = await prisma.tour.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    })

    return NextResponse.json({ tours }, { status: 200 })
  } catch (error) {
    console.error('Error fetching tours:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tours'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      mlsNumber,
      tourType,
      scheduledDate,
      name,
      phone,
      email,
      preApproval,
      notes,
    } = body

    // Validate required fields
    if (!mlsNumber || !scheduledDate || !name || !phone || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create tour
    const tour = await prisma.tour.create({
      data: {
        userId: session.user.id,
        mlsNumber,
        tourType: tourType || 'IN_PERSON',
        scheduledDate: new Date(scheduledDate),
        name,
        phone,
        email,
        preApproval: preApproval || false,
        notes: notes || null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ tour }, { status: 201 })
  } catch (error) {
    console.error('Error creating tour:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create tour'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

