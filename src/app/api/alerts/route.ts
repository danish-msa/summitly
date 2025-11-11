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
    const cityName = searchParams.get('cityName')
    const neighborhood = searchParams.get('neighborhood')

    const where: any = {
      userId: session.user.id,
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
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

