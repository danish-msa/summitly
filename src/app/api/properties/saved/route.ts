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

    const { searchParams } = new URL(request.url)
    const mlsNumber = searchParams.get('mlsNumber')

    // If mlsNumber is provided, check if specific property is saved
    if (mlsNumber) {
      const savedProperty = await prisma.savedProperty.findUnique({
        where: {
          userId_mlsNumber: {
            userId: session.user.id,
            mlsNumber: mlsNumber.toString(),
          },
        },
      })

      return NextResponse.json({
        isSaved: !!savedProperty,
        savedProperty: savedProperty || null,
      })
    }

    // Otherwise, get all saved properties for the user
    const savedProperties = await prisma.savedProperty.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ savedProperties })
  } catch (error) {
    console.error('Error fetching saved properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved properties' },
      { status: 500 }
    )
  }
}

