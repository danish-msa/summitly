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
  // Use limit if provided, otherwise default to 20 for pagination
  const pageSize = limit ? parseInt(limit) : 20
  
  // Filter parameters
  const bedrooms = searchParams.get('bedrooms')
  const bathrooms = searchParams.get('bathrooms')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const minSqft = searchParams.get('minSqft')
  const maxSqft = searchParams.get('maxSqft')

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
    // Use case-insensitive matching for propertyType
    // Check multiple case variations and common alternative names
    const propertyTypeLower = propertyType.toLowerCase()
    const propertyTypeCapitalized = propertyType.charAt(0).toUpperCase() + propertyType.slice(1).toLowerCase()
    const propertyTypeUpper = propertyType.toUpperCase()
    
    // Build list of variations to check
    const variations: string[] = [
      propertyType, // Exact match
      propertyTypeCapitalized, // Capitalized
      propertyTypeUpper, // Uppercase
      propertyTypeLower, // Lowercase
    ]
    
    // Add common alternative names for specific types
    if (propertyTypeLower === 'condos' || propertyTypeLower === 'condo') {
      variations.push('Condominium', 'condominium', 'CONDOMINIUM', 'Condo', 'condo')
    } else if (propertyTypeLower === 'houses' || propertyTypeLower === 'house') {
      variations.push('House', 'house', 'HOUSE', 'Houses')
    } else if (propertyTypeLower === 'lofts' || propertyTypeLower === 'loft') {
      variations.push('Loft', 'loft', 'LOFT', 'Lofts')
    } else if (propertyTypeLower === 'master-planned-communities' || propertyTypeLower === 'master planned communities') {
      variations.push('Master-Planned Communities', 'Master Planned Communities', 'master-planned-communities')
    } else if (propertyTypeLower === 'multi-family' || propertyTypeLower === 'multi family') {
      variations.push('Multi Family', 'Multi-Family', 'multi-family', 'multi family')
    } else if (propertyTypeLower === 'offices' || propertyTypeLower === 'office') {
      variations.push('Office', 'office', 'OFFICE', 'Offices')
    }
    
    const propertyTypeCondition: Prisma.PreConstructionProjectWhereInput = {
      OR: variations.map(variation => ({ propertyType: variation }))
    }
    whereConditions.push(propertyTypeCondition)
    
    console.log('[API v1] PropertyType filter variations:', variations)
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
    // Search for the year in occupancyDate field
    // The field might contain dates like "2025", "Q1 2025", "Fall 2025", etc.
    whereConditions.push({
      occupancyDate: {
        contains: completionYear,
        mode: 'insensitive',
      },
    })
    console.log('[API v1] CompletionYear filter:', completionYear)
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
  
  // Filter by bedrooms (check bedroomRange field)
  if (bedrooms) {
    const bedroomNum = parseInt(bedrooms)
    if (!isNaN(bedroomNum)) {
      // bedroomRange is a string like "1-2" or "2+" or "3"
      // We need to check if the range includes the requested number
      whereConditions.push({
        OR: [
          // Exact match in range (e.g., "2" or "2-3" for bedroomNum=2)
          { bedroomRange: { contains: bedroomNum.toString(), mode: Prisma.QueryMode.insensitive } },
          // Plus ranges (e.g., "3+" for bedroomNum=3 or higher)
          ...(bedroomNum >= 3 ? [{ bedroomRange: { contains: `${bedroomNum}+`, mode: Prisma.QueryMode.insensitive } }] : []),
        ],
      })
    }
  }
  
  // Filter by bathrooms (check bathroomRange field)
  if (bathrooms) {
    const bathroomNum = parseInt(bathrooms)
    if (!isNaN(bathroomNum)) {
      whereConditions.push({
        OR: [
          { bathroomRange: { contains: bathroomNum.toString(), mode: Prisma.QueryMode.insensitive } },
          ...(bathroomNum >= 3 ? [{ bathroomRange: { contains: `${bathroomNum}+`, mode: Prisma.QueryMode.insensitive } }] : []),
        ],
      })
    }
  }
  
  // Filter by price range (using startingPrice and endingPrice)
  if (minPrice || maxPrice) {
    const priceConditions: Prisma.PreConstructionProjectWhereInput[] = []
    
    if (minPrice) {
      const minPriceNum = parseFloat(minPrice)
      if (!isNaN(minPriceNum)) {
        // Project's startingPrice or endingPrice should be >= minPrice
        priceConditions.push({
          OR: [
            { startingPrice: { gte: minPriceNum } },
            { endingPrice: { gte: minPriceNum } },
          ],
        })
      }
    }
    
    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice)
      if (!isNaN(maxPriceNum)) {
        // Project's startingPrice should be <= maxPrice (or endingPrice if no startingPrice)
        priceConditions.push({
          OR: [
            { startingPrice: { lte: maxPriceNum } },
            { AND: [{ startingPrice: null }, { endingPrice: { lte: maxPriceNum } }] },
          ],
        })
      }
    }
    
    if (priceConditions.length > 0) {
      whereConditions.push({ AND: priceConditions })
    }
  }
  
  // Filter by sqft range (check sqftRange field)
  if (minSqft || maxSqft) {
    const sqftConditions: Prisma.PreConstructionProjectWhereInput[] = []
    
    if (minSqft) {
      const minSqftNum = parseInt(minSqft)
      if (!isNaN(minSqftNum)) {
        // sqftRange is a string like "500-800" or "1000+"
        // We need to check if the range's max is >= minSqft
        // For now, we'll do a simple contains check, but this could be improved
        sqftConditions.push({
          sqftRange: { contains: minSqftNum.toString(), mode: Prisma.QueryMode.insensitive },
        })
      }
    }
    
    if (maxSqft) {
      const maxSqftNum = parseInt(maxSqft)
      if (!isNaN(maxSqftNum)) {
        // Check if range's min is <= maxSqft
        sqftConditions.push({
          sqftRange: { contains: maxSqftNum.toString(), mode: Prisma.QueryMode.insensitive },
        })
      }
    }
    
    if (sqftConditions.length > 0) {
      whereConditions.push({ AND: sqftConditions })
    }
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

  // Fetch developer names for all projects
  const developerValues = [...new Set(projects.map(p => p.developer).filter(Boolean) as string[])]
  const developerNamesMap = new Map<string, string>()
  
  if (developerValues.length > 0) {
    try {
      // Separate IDs from names
      // CUIDs are typically 25 characters, alphanumeric, lowercase
      // But they can vary, so we check if it looks like an ID (not a name with spaces/special chars)
      const potentialIds = developerValues.filter(id => {
        // Check if it looks like a CUID: 20-30 chars, alphanumeric, lowercase
        return id.length >= 20 && id.length <= 30 && /^[a-z0-9]+$/.test(id)
      })
      const potentialNames = developerValues.filter(id => !potentialIds.includes(id))
      
      // Fetch developers by ID
      if (potentialIds.length > 0) {
        const developers = await prisma.developmentTeam.findMany({
          where: {
            id: { in: potentialIds },
          },
          select: {
            id: true,
            name: true,
          },
        })
        
        developers.forEach(dev => {
          developerNamesMap.set(dev.id, dev.name)
        })
        
        // Log missing developers for debugging
        const foundIds = new Set(developers.map(d => d.id))
        const missingIds = potentialIds.filter(id => !foundIds.has(id))
        if (missingIds.length > 0 && process.env.NODE_ENV === 'development') {
          console.warn(`[API v1] ${missingIds.length} developer IDs not found in DevelopmentTeam table. Sample:`, missingIds.slice(0, 3))
        }
      }
      
      // For potential names, check if they exist in the table (case-insensitive)
      // This handles cases where developer field already contains a name
      if (potentialNames.length > 0) {
        const developersByName = await prisma.developmentTeam.findMany({
          where: {
            name: {
              in: potentialNames,
              mode: 'insensitive',
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
        
        // Create a map from input name to canonical name from DB
        potentialNames.forEach(inputName => {
          const found = developersByName.find(d => d.name.toLowerCase() === inputName.toLowerCase())
          if (found) {
            developerNamesMap.set(inputName, found.name) // Use canonical name from DB
          }
        })
      }
    } catch (error) {
      console.error('[API v1] Error fetching developer names:', error)
    }
  }

  // Helper to get developer name
  const getDeveloperName = (developerValue: string | null): string => {
    if (!developerValue) return ''
    
    // Check if we already have a mapped name
    if (developerNamesMap.has(developerValue)) {
      return developerNamesMap.get(developerValue)!
    }
    
    // Check if it's already a name (contains spaces, special chars, or doesn't look like an ID)
    const looksLikeName = developerValue.includes(' ') || 
                          developerValue.includes('-') || 
                          developerValue.length < 20 ||
                          !/^[a-z0-9]+$/i.test(developerValue)
    
    if (looksLikeName) {
      return developerValue // It's already a name, use it as-is
    }
    
    // It's an ID that wasn't found in the database
    // This means the developer doesn't exist in DevelopmentTeam table
    // Return the ID but log a warning in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[API v1] Developer ID "${developerValue}" not found in DevelopmentTeam table. Consider adding this developer or updating the project's developer field.`)
    }
    return developerValue // Return ID as fallback
  }

  // Format projects
  const formattedProjects = projects.map((project) => ({
    id: project.id,
    mlsNumber: project.mlsNumber,
    projectName: project.projectName,
    developer: getDeveloperName(project.developer),
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
  return apiMiddleware(request, async (context) => {
    try {
      return await handler(context.request)
    } catch (error) {
      console.error('[API v1] Error fetching pre-con projects:', error)
      return ApiErrors.INTERNAL_ERROR(
        'Failed to fetch projects',
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  })
}

