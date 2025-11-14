import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const activities: Array<{
      type: string;
      action: string;
      timestamp: Date;
      mlsNumber?: string;
      location?: string;
    }> = []

    // Get recent saved properties (last 10)
    const savedProperties = await prisma.savedProperty.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    savedProperties.forEach((saved) => {
      activities.push({
        id: `saved-${saved.id}`,
        type: 'property_saved',
        action: 'Property saved',
        mlsNumber: saved.mlsNumber,
        timestamp: saved.createdAt,
      })
    })

    // Get recent tours (last 10)
    const tours = await prisma.tour.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    tours.forEach((tour) => {
      activities.push({
        id: `tour-${tour.id}`,
        type: 'tour_scheduled',
        action: 'Tour scheduled',
        mlsNumber: tour.mlsNumber,
        timestamp: tour.createdAt,
        tourType: tour.tourType,
      })
    })

    // Get recent alerts (last 10)
    const alerts = await prisma.propertyWatchlist.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    alerts.forEach((alert) => {
      if (alert.watchProperty && alert.mlsNumber) {
        activities.push({
          id: `alert-watch-${alert.id}`,
          type: 'alert_watch',
          action: 'Started watching property',
          mlsNumber: alert.mlsNumber,
          timestamp: alert.updatedAt,
        })
      }
      if (alert.newProperties) {
        activities.push({
          id: `alert-new-${alert.id}`,
          type: 'alert_new',
          action: 'New listing alert set up',
          location: alert.cityName || alert.neighborhood || 'Unknown',
          timestamp: alert.updatedAt,
        })
      }
    })

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return dateB - dateA
    })

    // Return top 10 most recent activities
    return NextResponse.json({ activities: activities.slice(0, 10) })
  } catch (error) {
    console.error('Error fetching activity:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activity'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

