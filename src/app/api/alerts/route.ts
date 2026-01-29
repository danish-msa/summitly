import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    
    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mlsNumber = searchParams.get('mlsNumber')
    const cityName = searchParams.get('cityName')
    const neighborhood = searchParams.get('neighborhood')

    const where: {
      userId: string
      mlsNumber?: string
      cityName?: string
      neighborhood?: string
    } = {
      userId: auth.user.id,
    }

    if (mlsNumber) {
      where.mlsNumber = mlsNumber
    }
    if (cityName) {
      where.cityName = cityName
    }
    if (neighborhood) {
      where.neighborhood = neighborhood
    }

    const alerts = await prisma.propertyWatchlist.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ alerts }, { status: 200 })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alerts'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

