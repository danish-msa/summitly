import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id: developerId } = await params

    // Get developer
    const developer = await prisma.developer.findUnique({
      where: { id: developerId },
    })

    if (!developer) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

    // Get all projects where developer field matches the developer ID
    // Note: The developer field in PreConstructionProject is a String (developer ID)
    // We also check developerInfo JSON field in case it contains the developer ID
    const allProjects = await prisma.preConstructionProject.findMany({
      where: {
        OR: [
          { developer: developerId },
          {
            developerInfo: {
              contains: developerId,
            },
          },
        ],
      },
    })

    // Map status values to categories
    const stats = {
      totalProjects: allProjects.length,
      activelySelling: allProjects.filter(p => 
        p.status && ['now-selling', 'assignments', 'platinum-access'].includes(p.status)
      ).length,
      launchingSoon: allProjects.filter(p => 
        p.status && ['new-release-coming-soon', 'coming-soon'].includes(p.status)
      ).length,
      registrationPhase: allProjects.filter(p => 
        p.status === 'platinum-access'
      ).length,
      soldOut: allProjects.filter(p => 
        p.status === 'sold-out'
      ).length,
      resale: allProjects.filter(p => 
        p.status === 'resale'
      ).length,
      cancelled: allProjects.filter(p => 
        p.status === 'cancelled'
      ).length,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching developer stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch developer stats' },
      { status: 500 }
    )
  }
}

