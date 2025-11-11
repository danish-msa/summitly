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

    const body = await request.json()
    const {
      mlsNumber,
      cityName,
      neighborhood,
      propertyType,
      watchProperty,
      newProperties,
      soldListings,
      expiredListings,
    } = body

    // Check if alert already exists for this property/area
    const existingAlert = await prisma.propertyWatchlist.findFirst({
      where: {
        userId: session.user.id,
        ...(mlsNumber ? { mlsNumber } : {}),
        ...(cityName ? { cityName } : {}),
        ...(neighborhood ? { neighborhood } : {}),
      },
    })

    let alert
    if (existingAlert) {
      // Update existing alert
      alert = await prisma.propertyWatchlist.update({
        where: { id: existingAlert.id },
        data: {
          watchProperty: watchProperty ?? existingAlert.watchProperty,
          newProperties: newProperties ?? existingAlert.newProperties,
          soldListings: soldListings ?? existingAlert.soldListings,
          expiredListings: expiredListings ?? existingAlert.expiredListings,
          propertyType: propertyType ?? existingAlert.propertyType,
        },
      })
    } else {
      // Create new alert
      alert = await prisma.propertyWatchlist.create({
        data: {
          userId: session.user.id,
          mlsNumber: mlsNumber || null,
          cityName: cityName || null,
          neighborhood: neighborhood || null,
          propertyType: propertyType || null,
          watchProperty: watchProperty ?? false,
          newProperties: newProperties ?? false,
          soldListings: soldListings ?? false,
          expiredListings: expiredListings ?? false,
        },
      })
    }

    return NextResponse.json({ alert }, { status: 200 })
  } catch (error: any) {
    console.error('Error saving alert:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to save alert' },
      { status: 500 }
    )
  }
}

