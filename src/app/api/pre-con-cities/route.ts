import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to convert city name to URL-friendly slug
function slugifyCityName(cityName: string): string {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// GET - Fetch cities with project counts for the city slider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    // Fetch all published projects with city and image data
    const projects = await prisma.preConstructionProject.findMany({
      where: {
        isPublished: true,
        city: {
          not: null,
        },
      },
      select: {
        city: true,
        images: true,
      },
    })

    // Count projects per city and collect images
    const cityData: Record<string, { count: number; images: string[] }> = {}
    
    projects.forEach(project => {
      const city = project.city
      if (city) {
        if (!cityData[city]) {
          cityData[city] = { count: 0, images: [] }
        }
        cityData[city].count++
        
        // Collect images from projects in this city
        if (project.images && project.images.length > 0) {
          // Add images that aren't already in the array
          project.images.forEach(image => {
            if (image && !cityData[city].images.includes(image)) {
              cityData[city].images.push(image)
            }
          })
        }
      }
    })

    // Convert to array format and sort by project count (descending)
    let cities = Object.entries(cityData)
      .map(([cityName, data]) => ({
        id: slugifyCityName(cityName),
        name: cityName,
        numberOfProjects: data.count,
        image: data.images.length > 0 
          ? data.images[0] // Use first available image
          : '/images/default-city.jpg', // Fallback image
      }))
      .sort((a, b) => b.numberOfProjects - a.numberOfProjects) // Sort by project count descending
    
    // Apply limit if provided, otherwise show all cities
    if (limit !== undefined && limit > 0) {
      cities = cities.slice(0, limit)
    }

    return NextResponse.json({
      cities,
    })
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch cities',
        cities: [],
      },
      { status: 500 }
    )
  }
}

