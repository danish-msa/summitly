import type { PropertyListing } from '@/lib/types';
import type { PreConstructionProperty } from '@/components/PreCon/PropertyCards/types';

// Helper function to convert slug back to city name
export const unslugifyCityName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Convert PropertyListing to PreConstructionProperty format
export const convertToPreConProperty = (property: PropertyListing): PreConstructionProperty | null => {
  if (!property.preCon) return null;

  const preCon = property.preCon;
  const address = property.address;

  return {
    id: property.mlsNumber,
    projectName: preCon.projectName,
    developer: preCon.developer,
    startingPrice: preCon.startingPrice,
    images: property.images?.allImages || [property.images?.imageUrl || '/images/p1.jpg'],
    address: {
      street: `${address.streetNumber || ''} ${address.streetName || ''}`.trim() || address.location?.split(',')[0] || '',
      city: address.city || '',
      province: address.state || '',
      latitude: property.map?.latitude ?? undefined,
      longitude: property.map?.longitude ?? undefined,
    },
    details: {
      propertyType: property.details?.propertyType || preCon.details?.propertyType || 'Condominium',
      bedroomRange: preCon.details.bedroomRange,
      bathroomRange: preCon.details.bathroomRange,
      sqftRange: preCon.details.sqftRange,
      totalUnits: preCon.details.totalUnits,
      availableUnits: preCon.details.availableUnits,
    },
    completion: {
      date: preCon.completion.date,
      progress: typeof preCon.completion.progress === 'string' ? 0 : (preCon.completion.progress || 0),
    },
    features: preCon.features || [],
    depositStructure: preCon.depositStructure,
    status: preCon.status,
  };
};

// Convert PreConstructionProperty to PropertyListing for map
export const convertToPropertyListing = (project: PreConstructionProperty): PropertyListing => {
  const streetParts = project.address.street.split(' ');
  return {
    mlsNumber: project.id,
    status: project.status === 'selling' ? 'A' : 'U',
    class: 'residential',
    type: 'Sale',
    listPrice: project.startingPrice || 0,
    listDate: new Date().toISOString(),
    lastStatus: project.status === 'selling' ? 'A' : 'U',
    soldPrice: '',
    soldDate: '',
    updatedOn: new Date().toISOString(),
    boardId: 0,
    address: {
      area: null,
      city: project.address.city || null,
      country: 'Canada',
      district: null,
      majorIntersection: null,
      neighborhood: null,
      streetDirection: null,
      streetName: streetParts.length > 1 ? streetParts.slice(1).join(' ') : null,
      streetNumber: streetParts[0] || null,
      streetSuffix: null,
      unitNumber: null,
      zip: null,
      state: project.address.province || null,
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: `${project.address.street}, ${project.address.city}, ${project.address.province}`,
    },
    map: {
      latitude: project.address.latitude || null,
      longitude: project.address.longitude || null,
      point: null,
    },
    images: {
      allImages: project.images,
      imageUrl: project.images[0],
    },
    details: {
      propertyType: project.details.propertyType || '',
      numBathrooms: project.details.bathroomRange ? parseInt(project.details.bathroomRange.split('-')[0]) || 1 : 1,
      numBathroomsPlus: project.details.bathroomRange ? parseInt(project.details.bathroomRange.split('-')[1] || project.details.bathroomRange.split('-')[0]) || 1 : 1,
      numBedrooms: project.details.bedroomRange ? parseInt(project.details.bedroomRange.split('-')[0]) || 1 : 1,
      numBedroomsPlus: project.details.bedroomRange ? parseInt(project.details.bedroomRange.split('-')[1] || project.details.bedroomRange.split('-')[0]) || 1 : 1,
      sqft: project.details.sqftRange || '',
    },
    lot: {
      acres: 0,
      depth: '',
      irregular: '',
      legalDescription: '',
      measurement: '',
      width: 0,
      size: 0,
      source: '',
      dimensionsSource: '',
      dimensions: '',
      squareFeet: 0,
      features: '',
      taxLot: '',
    },
    preCon: {
      projectName: project.projectName,
      developer: project.developer || '',
      startingPrice: project.startingPrice || 0,
      status: project.status,
      details: {
        bedroomRange: project.details.bedroomRange || '',
        bathroomRange: project.details.bathroomRange || '',
        sqftRange: project.details.sqftRange || '',
        totalUnits: project.details.totalUnits,
        availableUnits: project.details.availableUnits,
        propertyType: project.details.propertyType,
      },
      completion: {
        date: project.completion.date || '',
        progress: project.completion.progress,
      },
      features: project.features,
      depositStructure: project.depositStructure || undefined,
      description: '',
    },
  };
};

// Helper to format status for display
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'selling': 'Selling',
    'coming-soon': 'Coming Soon',
    'sold-out': 'Sold Out',
  };
  return statusMap[status.toLowerCase()] || status;
};

// Helper to format property type for display
export const formatPropertyType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'condos': 'Condos',
    'houses': 'Houses',
    'lofts': 'Lofts',
    'master-planned-communities': 'Master-Planned Communities',
    'multi-family': 'Multi Family',
    'offices': 'Offices',
  };
  return typeMap[type.toLowerCase()] || type;
};

// Helper to convert property type slug to database value
export const slugToPropertyType = (slug: string): string => {
  const typeMap: Record<string, string> = {
    'condos': 'Condos',
    'houses': 'Houses',
    'lofts': 'Lofts',
    'master-planned-communities': 'Master-Planned Communities',
    'multi-family': 'Multi Family',
    'offices': 'Offices',
  };
  return typeMap[slug.toLowerCase()] || slug;
};

// Helper to parse sub-property type slug (e.g., "high-rise-condos" -> { subPropertyType: "High-Rise", propertyType: "Condos" })
export const parseSubPropertyTypeSlug = (slug: string): { subPropertyType: string; propertyType: string } | null => {
  const slugLower = slug.toLowerCase();
  
  // Condos sub-types
  if (slugLower.endsWith('-condos')) {
    const subType = slugLower.replace('-condos', '');
    const subTypeMap: Record<string, string> = {
      'high-rise': 'High-Rise',
      'mid-rise': 'Mid-Rise',
      'low-rise': 'Low-Rise',
    };
    if (subTypeMap[subType]) {
      return { subPropertyType: subTypeMap[subType], propertyType: 'Condos' };
    }
  }
  
  // Houses sub-types
  if (slugLower.endsWith('-houses')) {
    const subType = slugLower.replace('-houses', '');
    const subTypeMap: Record<string, string> = {
      'link': 'Link',
      'townhouse': 'Townhouse',
      'semi-detached': 'Semi-Detached',
      'detached': 'Detached',
    };
    if (subTypeMap[subType]) {
      return { subPropertyType: subTypeMap[subType], propertyType: 'Houses' };
    }
  }
  
  return null;
};

// Helper to format sub-property type for display
export const formatSubPropertyType = (subType: string, mainType: string): string => {
  return `${subType} ${mainType}`;
};

// Helper to convert status slug to database value
export const slugToStatus = (slug: string): string => {
  const statusMap: Record<string, string> = {
    'selling': 'selling',
    'coming-soon': 'coming-soon',
    'sold-out': 'sold-out',
  };
  return statusMap[slug.toLowerCase()] || slug;
};

