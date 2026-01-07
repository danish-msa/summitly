import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering to ensure fresh Prisma client with SSL config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // If mlsNumber is provided, check if specific property is saved as comparable
    if (mlsNumber) {
      const savedComparable = await prisma.savedComparable.findUnique({
        where: {
          userId_mlsNumber: {
            userId: session.user.id,
            mlsNumber: mlsNumber.toString(),
          },
        },
      })

      return NextResponse.json({
        isSaved: !!savedComparable,
        savedComparable: savedComparable || null,
      })
    }

    // Otherwise, get all saved comparables for the user
    const savedComparables = await prisma.savedComparable.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ savedComparables })
  } catch (error) {
    console.error('Error fetching saved comparables:', error)
    
    // Check if it's a Prisma error (table might not exist)
    if (error instanceof Error) {
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
        return NextResponse.json(
          { error: 'Database table not found. Please run migrations: npx prisma migrate dev' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch saved comparables' },
      { status: 500 }
    )
  }
}

