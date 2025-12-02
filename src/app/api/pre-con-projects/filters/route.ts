import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch unique filter values for pre-construction projects
export async function GET(request: NextRequest) {
  try {
    // Fetch all projects to extract unique values
    const projects = await prisma.preConstructionProject.findMany({
      where: {
        isPublished: true, // Only count published projects
      },
      select: {
        propertyType: true,
        developer: true,
        status: true,
        occupancyDate: true,
        city: true,
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
        if (developerId && !developerId.match(/^[a-z0-9]{25}$/)) {
          // It's likely already a name
          developerNames.add(developerId)
        } else if (developerId) {
          // It's an ID, fetch the name
          const developer = await prisma.developmentTeam.findUnique({
            where: { id: developerId },
            select: { name: true }
          })
          if (developer?.name) {
            developerNames.add(developer.name)
          } else if (developerId) {
            // If not found in Developer table, use the ID as fallback
            developerNames.add(developerId)
          }
        }
      } catch (error) {
        // If lookup fails, use the ID as fallback (only if it's not null)
        if (developerId) {
          developerNames.add(developerId)
        }
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

    // Extract unique cities with project counts (top cities by project count)
    const cityCounts: Record<string, number> = {}
    projects.forEach(project => {
      if (project.city) {
        cityCounts[project.city] = (cityCounts[project.city] || 0) + 1
      }
    })
    
    // Sort cities by project count (descending) and get top cities
    const topCities = Object.entries(cityCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 12) // Top 12 cities
      .map(([cityName]) => cityName)
      .sort() // Alphabetical sort for display

    return NextResponse.json({
      propertyTypes,
      developers,
      sellingStatuses,
      occupancyYears: sortedOccupancyYears,
      cities: topCities,
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
        cities: [],
      },
      { status: 500 }
    )
  }
}

