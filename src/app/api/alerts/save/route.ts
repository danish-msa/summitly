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
        userId: auth.user.id,
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
          userId: auth.user.id,
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
  } catch (error) {
    console.error('Error saving alert:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to save alert'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

