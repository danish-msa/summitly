import { NextRequest } from 'next/server'
import { apiMiddleware } from '@/lib/api/middleware'
import { successResponse, ApiErrors } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { convertToS3Url } from '@/lib/image-url'
import { Prisma } from '@prisma/client'

// Re-export the original route logic but with standardized responses
export const dynamic = 'force-dynamic'
export const revalidate = 60

async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const city = searchParams.get('city') || ''
  const propertyType = searchParams.get('propertyType') || ''
  const subPropertyType = searchParams.get('subPropertyType') || ''
  const completionYear = searchParams.get('completionYear') || ''
  const developer = searchParams.get('developer') || ''
  const featured = searchParams.get('featured')
  const limit = searchParams.get('limit')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('limit') || '20')

  // Build where clause
  const whereConditions: Prisma.PreConstructionProjectWhereInput[] = [
    { isPublished: true },
  ]

  if (status) {
    whereConditions.push({ status })
  }
  if (city) {
    whereConditions.push({ city: { contains: city, mode: 'insensitive' } })
  }
  if (propertyType) {
    whereConditions.push({
      propertyType: {
        in: [propertyType, propertyType.toLowerCase(), propertyType.toUpperCase()],
      },
    })
  }
  if (subPropertyType) {
    whereConditions.push({
      subPropertyType: {
        contains: subPropertyType,
        mode: 'insensitive',
      },
    })
  }
  if (completionYear) {
    whereConditions.push({
      occupancyDate: {
        contains: completionYear,
      },
    })
  }
  if (developer) {
    whereConditions.push({
      developer: {
        contains: developer,
        mode: 'insensitive',
      },
    })
  }
  if (featured === 'true') {
    whereConditions.push({ featured: true })
  }

  const where = whereConditions.length > 0
    ? { AND: whereConditions }
    : { isPublished: true }

  // Get total count for pagination
  const total = await prisma.preConstructionProject.count({ where })

  // Fetch projects with pagination
  const projects = await prisma.preConstructionProject.findMany({
    where,
    take: pageSize,
    skip: (page - 1) * pageSize,
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  // Format projects
  const formattedProjects = projects.map((project) => ({
    id: project.id,
    mlsNumber: project.mlsNumber,
    projectName: project.projectName,
    developer: project.developer,
    location: {
      address: project.streetNumber && project.streetName
        ? `${project.streetNumber} ${project.streetName}`
        : null,
      city: project.city,
      state: project.state,
      zip: project.zip,
      neighborhood: project.neighborhood,
      coordinates: project.latitude && project.longitude
        ? { lat: project.latitude, lng: project.longitude }
        : null,
    },
    pricing: {
      starting: project.startingPrice,
      ending: project.endingPrice,
      range: {
        min: project.startingPrice || project.endingPrice || null,
        max: project.endingPrice || project.startingPrice || null,
      },
      avgPricePerSqft: project.avgPricePerSqft,
    },
    status: project.status,
    completion: {
      date: project.occupancyDate,
      progress: project.completionProgress,
    },
    details: {
      propertyType: project.propertyType,
      subPropertyType: project.subPropertyType,
      bedroomRange: project.bedroomRange,
      bathroomRange: project.bathroomRange,
      sqftRange: project.sqftRange,
      totalUnits: project.totalUnits,
      availableUnits: project.availableUnits,
      storeys: project.storeys,
      height: project.height,
    },
    amenities: project.amenities || [],
    features: project.features || [],
    images: (project.images || []).map((img) => convertToS3Url(img)),
    videos: project.videos || [],
    featured: project.featured,
  }))

  return successResponse(
    {
      projects: formattedProjects,
    },
    200,
    {
      pagination: {
        page,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  )
}

export async function GET(request: NextRequest) {
  return apiMiddleware(request, async () => {
    try {
      return await handler(request)
    } catch (error) {
      console.error('[API v1] Error fetching pre-con projects:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch projects',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}

