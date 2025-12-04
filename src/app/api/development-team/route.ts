import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DeveloperType } from '@prisma/client'

// GET - Public endpoint to fetch all development team members for website display
export async function GET(_request: NextRequest) {
  try {
    console.log('Fetching development team members...')
    
    // Fetch all development team members
    const teamMembers = await prisma.developmentTeam.findMany({
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })

    console.log(`Found ${teamMembers.length} development team members`)
    
    if (teamMembers.length === 0) {
      console.warn('No development team members found in database')
      return NextResponse.json({
        teams: [],
        total: 0,
        message: 'No development team members found',
      })
    }

    // Get project counts for each team member
    // Check both by ID and by name since developer field can be either
    const teamMembersWithCounts = await Promise.all(
      teamMembers.map(async (member) => {
        // Count projects where developer field matches ID or name
        const projectCount = await prisma.preConstructionProject.count({
          where: {
            OR: [
              { developer: member.id },
              { developer: { contains: member.name, mode: 'insensitive' } },
            ],
            isPublished: true,
          },
        })
        return {
          ...member,
          projectCount,
        }
      })
    )

    // Show all team members, not just those with projects
    // This allows users to see all available team members in the menu
    const filteredMembers = teamMembersWithCounts

    // Organize by type
    const organizedByType: Record<string, typeof filteredMembers> = {
      DEVELOPER: [],
      ARCHITECT: [],
      INTERIOR_DESIGNER: [],
      BUILDER: [],
      LANDSCAPE_ARCHITECT: [],
      MARKETING: [],
    }

    filteredMembers.forEach((member) => {
      if (organizedByType[member.type]) {
        organizedByType[member.type].push(member)
      }
    })

    // Type labels for display
    const typeLabels: Record<DeveloperType, string> = {
      DEVELOPER: 'Developers',
      ARCHITECT: 'Architects',
      INTERIOR_DESIGNER: 'Interior Designers',
      BUILDER: 'Builders',
      LANDSCAPE_ARCHITECT: 'Landscape Architects',
      MARKETING: 'Marketing',
    }

    // URL type mapping
    const typeUrlMap: Record<DeveloperType, string> = {
      DEVELOPER: 'developer',
      ARCHITECT: 'architect',
      INTERIOR_DESIGNER: 'interior-designer',
      BUILDER: 'builder',
      LANDSCAPE_ARCHITECT: 'landscape-architect',
      MARKETING: 'marketing',
    }

    // Convert to array format with type information
    // Include all types, even if they have no members (for future use)
    const result = Object.entries(organizedByType)
      .filter(([_, members]) => members.length > 0)
      .map(([type, members]) => ({
        type: type as DeveloperType,
        typeLabel: typeLabels[type as DeveloperType],
        typeUrl: typeUrlMap[type as DeveloperType],
        members: members.map((member) => ({
          id: member.id,
          name: member.name,
          slug: member.name.toLowerCase().replace(/\s+/g, '-'),
          description: member.description,
          image: member.image,
          projectCount: member.projectCount,
          url: `/${typeUrlMap[type as DeveloperType]}/${member.name.toLowerCase().replace(/\s+/g, '-')}`,
        })),
      }))

    console.log(`Returning ${result.length} team groups with ${filteredMembers.length} total members`)
    console.log('Team groups:', result.map(r => ({ type: r.type, count: r.members.length })))

    if (result.length === 0) {
      console.warn('No team groups after organization - all members may have been filtered out')
      // Return empty but valid response
      return NextResponse.json({
        teams: [],
        total: filteredMembers.length,
        message: 'No teams organized by type',
      })
    }

    return NextResponse.json({
      teams: result,
      total: filteredMembers.length,
    })
  } catch (error) {
    console.error('Error fetching development teams:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error details:', errorMessage)
    return NextResponse.json(
      { 
        error: 'Failed to fetch development teams', 
        errorDetails: errorMessage,
        teams: [], 
        total: 0 
      },
      { status: 500 }
    )
  }
}

