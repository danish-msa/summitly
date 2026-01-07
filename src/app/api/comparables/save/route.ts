import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { mlsNumber } = await request.json()

    if (!mlsNumber) {
      return NextResponse.json(
        { error: 'MLS number is required' },
        { status: 400 }
      )
    }

    // Check if already saved
    const existing = await prisma.savedComparable.findUnique({
      where: {
        userId_mlsNumber: {
          userId: session.user.id,
          mlsNumber: mlsNumber.toString(),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Property already saved as comparable' },
        { status: 400 }
      )
    }

    // Save the comparable
    const savedComparable = await prisma.savedComparable.create({
      data: {
        userId: session.user.id,
        mlsNumber: mlsNumber.toString(),
      },
    })

    return NextResponse.json(
      { success: true, savedComparable },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error saving comparable:', error)
    
    // Check if it's a Prisma error (table might not exist)
    if (error instanceof Error) {
      // Check for common Prisma errors
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
        return NextResponse.json(
          { error: 'Database table not found. Please run migrations: npx prisma migrate dev' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to save comparable' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to save comparable' },
      { status: 500 }
    )
  }
}

