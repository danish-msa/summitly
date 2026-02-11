import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering to ensure fresh Prisma client with SSL config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    
    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tours = await prisma.tour.findMany({
      where: {
        userId: auth.user.id,
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
    const auth = await getAuthenticatedUser(request)
    
    if (!auth?.user?.id) {
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
    const missingFields: string[] = []
    if (!mlsNumber) missingFields.push('mlsNumber')
    if (!scheduledDate) missingFields.push('scheduledDate')
    if (!name) missingFields.push('name')
    if (!phone) missingFields.push('phone')
    if (!email) missingFields.push('email')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields: missingFields,
          message: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Create tour
    const tour = await prisma.tour.create({
      data: {
        userId: auth.user.id,
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

