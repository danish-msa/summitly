import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    
    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { mlsNumber, notes, tags } = await request.json()

    if (!mlsNumber) {
      return NextResponse.json(
        { error: 'MLS number is required' },
        { status: 400 }
      )
    }

    // Check if already saved
    const existing = await prisma.savedProperty.findUnique({
      where: {
        userId_mlsNumber: {
          userId: session.user.id,
          mlsNumber: mlsNumber.toString(),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Property already saved' },
        { status: 400 }
      )
    }

    // Save the property
    const savedProperty = await prisma.savedProperty.create({
      data: {
        userId: auth.user.id,
        mlsNumber: mlsNumber.toString(),
        notes: notes || null,
        tags: tags || [],
      },
    })

    return NextResponse.json(
      { success: true, savedProperty },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error saving property:', error)
    return NextResponse.json(
      { error: 'Failed to save property' },
      { status: 500 }
    )
  }
}

