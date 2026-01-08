import { PropertyListing } from '@/lib/types'
import { slugify } from './propertyUrl'

/**
 * Convert property type to URL slug for property type pages
 * Maps API property types to URL slugs used in /properties/[citySlug]/[propertyType]
 */
export function propertyTypeToSlug(propertyType: string | null | undefined): string | null {
  if (!propertyType) return null
  
  const typeMap: Record<string, string> = {
    // Detached
    'detached': 'detached-homes',
    'house': 'houses',
    'homes': 'homes',
    
    // Condos
    'condo apartment': 'condos',
    'condo': 'condos',
    'apartment': 'condos',
    
    // Townhouses
    'att/row/townhouse': 'townhouses',
    'townhouse': 'townhouses',
    'townhome': 'townhouses',
    'row house': 'townhouses',
    
    // Condo Townhouses
    'condo townhouse': 'condo-townhouses',
    
    // Semi-Detached
    'semi-detached': 'semi-detached-homes',
    
    // Other
    'duplex': 'duplex',
    'triplex': 'triplex',
    'loft': 'lofts',
  }
  
  const normalized = propertyType.toLowerCase().trim()
  return typeMap[normalized] || slugify(propertyType)
}

/**
 * Generate property type page URL
 * Format: /properties/[citySlug]/[propertyType]
 */
export function getPropertyTypeUrl(
  propertyType: string | null | undefined,
  city: string | null | undefined
): string | null {
  if (!propertyType || !city) return null
  
  const typeSlug = propertyTypeToSlug(propertyType)
  if (!typeSlug) return null
  
  const citySlug = slugify(city)
  return `/properties/${citySlug}/${typeSlug}`
}

/**
 * Generate neighborhood/subdivision page URL
 * Format: /[citySlug]-real-estate/[areaName]/[neighborhoodName]
 * Note: This assumes the routing structure from ROUTING_STRUCTURE.md
 */
export function getNeighborhoodUrl(
  neighborhood: string | null | undefined,
  city: string | null | undefined
): string | null {
  if (!neighborhood || !city) return null
  
  const citySlug = slugify(city)
  const neighborhoodSlug = slugify(neighborhood)
  
  // For now, we'll use a simplified structure
  // If you have area information, you can enhance this
  return `/${citySlug}-real-estate/${neighborhoodSlug}`
}

/**
 * Generate property page URL (for clicking on property address)
 */
export function getPropertyUrlFromListing(property: PropertyListing): string {
  const city = property.address?.city
  const streetNumber = property.address?.streetNumber
  const streetName = property.address?.streetName
  const mlsNumber = property.mlsNumber

  if (city && streetNumber && streetName && mlsNumber) {
    const citySlug = slugify(city)
    const addressSlug = `${slugify(streetNumber)}-${slugify(streetName)}`
    return `/${citySlug}/${addressSlug}-${mlsNumber}`
  }

  if (city && streetNumber && streetName) {
    const citySlug = slugify(city)
    const addressSlug = `${slugify(streetNumber)}-${slugify(streetName)}`
    return `/${citySlug}/${addressSlug}`
  }

  if (mlsNumber) {
    return `/property/${mlsNumber}`
  }

  return '/listings'
}
