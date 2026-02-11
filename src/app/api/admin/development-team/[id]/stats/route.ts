import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api/auth-utils'
import { isAdmin } from '@/lib/roles'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request)
    
    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(auth.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id: developerId } = await params

    // Get development team member
    const developer = await prisma.developmentTeam.findUnique({
      where: { id: developerId },
    })

    if (!developer) {
      return NextResponse.json(
        { error: 'Development team member not found' },
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
        p.status && ['new-release-coming-soon', 'coming-soon', 'register-now'].includes(p.status)
      ).length,
      registrationPhase: allProjects.filter(p => 
        p.status && ['platinum-access', 'register-now'].includes(p.status)
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
    console.error('Error fetching development team member stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch development team member stats' },
      { status: 500 }
    )
  }
}

