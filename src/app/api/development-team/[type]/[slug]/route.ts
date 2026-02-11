import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DeveloperType } from '@prisma/client'
import { convertToS3Url } from '@/lib/image-url'

// Map URL type to DeveloperType enum
const typeMap: Record<string, DeveloperType> = {
  'developer': DeveloperType.DEVELOPER,
  'architect': DeveloperType.ARCHITECT,
  'interior-designer': DeveloperType.INTERIOR_DESIGNER,
  'builder': DeveloperType.BUILDER,
  'landscape-architect': DeveloperType.LANDSCAPE_ARCHITECT,
  'marketing': DeveloperType.MARKETING,
}

// GET - Fetch development team member by type and slug (name)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  try {
    const { type, slug } = await params
    
    // Convert URL type to DeveloperType
    const developerType = typeMap[type.toLowerCase()]
    if (!developerType) {
      return NextResponse.json(
        { error: 'Invalid development team type' },
        { status: 400 }
      )
    }

    // Convert slug to name (replace hyphens with spaces and capitalize)
    const name = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    // Also try with slug format (hyphens) for flexibility
    const slugName = slug.replace(/-/g, ' ')

    // Find development team member by type and name (try both formats)
    const teamMember = await prisma.developmentTeam.findFirst({
      where: {
        type: developerType,
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { name: { contains: name, mode: 'insensitive' } },
          { name: { contains: slugName, mode: 'insensitive' } },
        ],
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Development team member not found' },
        { status: 404 }
      )
    }

    // Get project count for this team member
    const projectCount = await prisma.preConstructionProject.count({
      where: {
        developer: teamMember.id,
        isPublished: true,
      },
    })

    return NextResponse.json({
      teamMember: {
        ...teamMember,
        image: teamMember.image ? convertToS3Url(teamMember.image) : null,
        projectCount,
      },
    })
  } catch (error) {
    console.error('Error fetching development team member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch development team member' },
      { status: 500 }
    )
  }
}

