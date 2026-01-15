import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UnitDetailPageClient from './UnitDetailPageClient'
import { UnitListing } from '@/lib/types/units'
import { slugify } from '@/lib/utils/propertyUrl'
import { preConCities } from '@/components/PreCon/Search/preConSearchData'
import { 
  parseBedroomSlug, 
  parseBathroomSlug, 
  parsePriceRangeSlug, 
  parseSqftSlug 
} from '@/components/Properties/PropertyBasePage/utils'

interface UnitDetailPageProps {
  params: Promise<{
    slug: string;
    unitId: string; // This is now the unit name slug, not the ID
  }>;
}

// Helper to check if a string is a year (4-digit number)
const isYear = (str: string): boolean => {
  const yearRegex = /^\d{4}$/;
  if (!yearRegex.test(str)) return false;
  const year = parseInt(str, 10);
  return year >= 2020 && year <= 2100;
};

const UnitDetailPage: React.FC<UnitDetailPageProps> = async ({ params }) => {
  const { slug, unitId: unitNameSlug } = await params;

  // Known city slugs (from preConCities)
  const knownCitySlugs = preConCities.map(city => city.id);
  
  // Known status slugs
  const knownStatusSlugs = ['selling', 'coming-soon', 'sold-out'];
  
  // Known property type slugs
  const knownPropertyTypeSlugs = ['condos', 'houses', 'lofts', 'master-planned-communities', 'multi-family', 'offices'];
  
  // Known sub-property type slugs
  const knownSubPropertyTypeSlugs = [
    'high-rise-condos',
    'mid-rise-condos',
    'low-rise-condos',
    'link-houses',
    'townhouse-houses',
    'semi-detached-houses',
    'detached-houses',
  ];
  
  const isSubPropertyType = (slug: string): boolean => {
    return knownSubPropertyTypeSlugs.includes(slug.toLowerCase());
  };

  // CRITICAL: Synchronously check if this is a filter pattern BEFORE any async operations
  // If the second segment matches a filter pattern (bedroom, bathroom, price, sqft),
  // or is a known status/property type, this is a filter page, not a unit page
  const isKnownCity = knownCitySlugs.includes(slug.toLowerCase());
  const isYearPattern = isYear(unitNameSlug);
  
  // Check if second segment is a filter pattern (synchronously, no DB calls)
  const isBedroomFilter = parseBedroomSlug(unitNameSlug);
  const isBathroomFilter = parseBathroomSlug(unitNameSlug);
  const isPriceRangeFilter = parsePriceRangeSlug(unitNameSlug);
  const isSqftFilter = parseSqftSlug(unitNameSlug);
  const isStatusSlug = knownStatusSlugs.includes(unitNameSlug.toLowerCase());
  const isPropertyTypeSlug = knownPropertyTypeSlugs.includes(unitNameSlug.toLowerCase());
  const isSubPropertyTypeSlug = isSubPropertyType(unitNameSlug);
  const isFilterPattern = !!(isBedroomFilter || isBathroomFilter || isPriceRangeFilter || isSqftFilter || isStatusSlug || isPropertyTypeSlug || isSubPropertyTypeSlug);
  
  // BULLETPROOF: If it's a known city + ANY filter pattern (including year), return notFound() immediately
  // This ensures filter pages fall through to catch-all route
  // NOTE: Middleware should rewrite these URLs, but this is a backup check
  if (isKnownCity && (isFilterPattern || isYearPattern)) {
    console.log('[UnitDetailPage] Known city + filter/year pattern detected, returning notFound():', {
      slug,
      unitNameSlug,
      isBedroomFilter: !!isBedroomFilter,
      isBathroomFilter: !!isBathroomFilter,
      isPriceRangeFilter: !!isPriceRangeFilter,
      isSqftFilter: !!isSqftFilter,
      isYearPattern,
      note: 'Middleware should have rewritten this URL. This is a backup check.',
    });
    notFound();
  }
  
  // If it's a filter pattern (even without known city), check database first
  // If no project exists, it's likely a filter page
  if (isFilterPattern && !isKnownCity) {
    const projectCheck = await prisma.preConstructionProject.findUnique({
      where: { mlsNumber: slug },
      select: { id: true },
    });

    if (!projectCheck) {
      // No project found, likely a filter page
      console.log('[UnitDetailPage] Filter pattern detected, no project found - likely filter page:', {
        slug,
        unitNameSlug,
      });
      notFound();
    }
    // If project exists, continue - it might be a real unit page (unlikely but possible)
  }

  // If second segment is a year but not a known city, still check database first
  if (isYearPattern && !isKnownCity) {
    // Check if slug is a project - if not, it's likely a city+year pattern
    const projectCheck = await prisma.preConstructionProject.findUnique({
      where: { mlsNumber: slug },
      select: { id: true },
    });

    if (!projectCheck) {
      // No project found, likely a city+year pattern
      console.log('[UnitDetailPage] Year pattern detected, no project found - likely city+year page');
      notFound();
    }
  }

  try {
    // Get the project to verify it exists and get its ID and name
    const project = await prisma.preConstructionProject.findUnique({
      where: { mlsNumber: slug },
      select: { id: true, mlsNumber: true, projectName: true },
    });

    if (!project) {
      notFound();
    }

    // Get all units for this project
    const units = await prisma.preConstructionUnit.findMany({
      where: {
        projectId: project.id,
      },
    });

    // Find the unit by matching the slugified unit name
    const unit = units.find(u => {
      const unitNameSlugified = slugify(u.unitName);
      return unitNameSlugified === unitNameSlug;
    });

    // If not found by name, try to find by ID (for backward compatibility with old URLs)
    const unitById = !unit ? units.find(u => u.id === unitNameSlug) : null;
    const foundUnit = unit || unitById;

    if (!foundUnit) {
      notFound();
    }

    // Format unit to match UnitListing interface
    type UnitWithImages = typeof foundUnit & { images?: string[]; floorplanImage?: string | null; studio?: boolean };
    const unitWithImages = foundUnit as UnitWithImages;
    const unitImages = unitWithImages.images || (unitWithImages.floorplanImage ? [unitWithImages.floorplanImage] : []);

    // Normalize status
    let normalizedStatus: 'for-sale' | 'sold-out' = 'for-sale';
    if (foundUnit.status) {
      const statusLower = String(foundUnit.status).toLowerCase().trim();
      if (statusLower === 'sold-out' || statusLower === 'soldout' || statusLower === 'sold') {
        normalizedStatus = 'sold-out';
      } else {
        normalizedStatus = 'for-sale';
      }
    }

    const formattedUnit: UnitListing = {
      id: foundUnit.id,
      name: foundUnit.unitName,
      beds: foundUnit.beds,
      baths: foundUnit.baths,
      sqft: foundUnit.sqft,
      price: foundUnit.price,
      maintenanceFee: foundUnit.maintenanceFee || 0,
      status: normalizedStatus,
      images: unitImages && unitImages.length > 0 ? unitImages : ['/images/floorplan-placeholder.jpg'],
      description: foundUnit.description || undefined,
      features: foundUnit.features || [],
      amenities: foundUnit.amenities || [],
      studio: unitWithImages.studio ?? false,
    };

    return <UnitDetailPageClient unit={formattedUnit} propertyId={slug} projectName={project.projectName} />;
  } catch (error) {
    console.error('Error fetching unit:', error);
    notFound();
  }
}

export default UnitDetailPage

