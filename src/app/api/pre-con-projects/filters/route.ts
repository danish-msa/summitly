import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch unique filter values for pre-construction projects
export async function GET(request: NextRequest) {
  try {
    // Fetch all projects to extract unique values
    const projects = await prisma.preConstructionProject.findMany({
      select: {
        propertyType: true,
        developer: true,
        status: true,
        occupancyDate: true,
      },
    })

    // Extract unique property types
    const propertyTypes = [...new Set(projects.map(p => p.propertyType).filter(Boolean))].sort()

    // Extract unique developer IDs and fetch their names
    const developerIds = [...new Set(projects.map(p => p.developer).filter(Boolean))]
    const developerNames = new Set<string>()
    
    // Fetch developer names from Developer table
    for (const developerId of developerIds) {
      try {
        // Check if it's already a name (not an ID format)
        if (!developerId.match(/^[a-z0-9]{25}$/)) {
          // It's likely already a name
          developerNames.add(developerId)
        } else {
          // It's an ID, fetch the name
          const developer = await prisma.developer.findUnique({
            where: { id: developerId },
            select: { name: true }
          })
          if (developer?.name) {
            developerNames.add(developer.name)
          } else {
            // If not found in Developer table, use the ID as fallback
            developerNames.add(developerId)
          }
        }
      } catch (error) {
        // If lookup fails, use the ID as fallback
        developerNames.add(developerId)
      }
    }
    const developers = Array.from(developerNames).sort()

    // Extract unique selling statuses
    const sellingStatuses = [...new Set(projects.map(p => p.status).filter(Boolean))].sort()

    // Extract unique occupancy years from occupancyDate
    const occupancyYears = new Set<number>()
    projects.forEach(project => {
      if (project.occupancyDate) {
        // Extract year from formats like "Q4 2025", "2025", etc.
        const yearMatch = project.occupancyDate.match(/\b(20\d{2})\b/)
        if (yearMatch) {
          occupancyYears.add(parseInt(yearMatch[1]))
        }
      }
    })
    const sortedOccupancyYears = Array.from(occupancyYears).sort()

    return NextResponse.json({
      propertyTypes,
      developers,
      sellingStatuses,
      occupancyYears: sortedOccupancyYears,
    })
  } catch (error) {
    console.error('Error fetching filter values:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch filter values',
        propertyTypes: [],
        developers: [],
        sellingStatuses: [],
        occupancyYears: [],
      },
      { status: 500 }
    )
  }
}

