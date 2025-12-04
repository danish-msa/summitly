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
export async function GET(_request: NextRequest) {
  try {
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
    const cities = Object.entries(cityData)
      .map(([cityName, data]) => ({
        id: slugifyCityName(cityName),
        name: cityName,
        numberOfProjects: data.count,
        image: data.images.length > 0 
          ? data.images[0] // Use first available image
          : '/images/default-city.jpg', // Fallback image
      }))
      .sort((a, b) => b.numberOfProjects - a.numberOfProjects) // Sort by project count descending
      .slice(0, 20) // Limit to top 20 cities

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

