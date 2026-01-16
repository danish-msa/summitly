import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';
import { generateKeyFacts } from './generateKeyFacts';
import { API_CONFIG } from '@/lib/api/repliers/client';

/**
 * Transform image path to full CDN URL
 */
function transformImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_CONFIG.cdnUrl}/${cleanPath}`;
}

// Extended details type that includes all possible properties from the API
type ExtendedPropertyDetails = {
  numBathrooms: number;
  numBathroomsPlus: number;
  numBedrooms: number;
  numBedroomsPlus: number | string;
  propertyType: string;
  sqft: number | string;
  description?: string | null;
} & {
  style?: string | null;
  yearBuilt?: string | number | null;
  numRooms?: number | null;
  numFireplaces?: number | null;
  heating?: string | null;
  airConditioning?: string | null;
  centralAirConditioning?: string | null;
  waterSource?: string | null;
  sewer?: string | null;
  exteriorConstruction1?: string | null;
  exteriorConstruction2?: string | null;
  foundationType?: string | null;
  roofMaterial?: string | null;
  flooringType?: string | null;
  numGarageSpaces?: number | null;
  numParkingSpaces?: number | null;
  garage?: string | null;
  zoning?: string | null;
  zoningDescription?: string | null;
  swimmingPool?: string | null;
  fireplace?: string | null;
  balcony?: string | null;
  patio?: string | null;
  elevator?: string | null;
  viewType?: string | null;
  waterfront?: string | null;
};

/**
 * Generate property details data structure from real property data
 */
export function generatePropertyDetailsData(
  property: PropertyListing,
  rawProperty?: SinglePropertyListingResponse | null
) {
  // Generate Key Facts from real data
  const keyFacts = generateKeyFacts(property);
  const details = property.details as ExtendedPropertyDetails | undefined;

  // Property Details
  const propertyDetails: Record<string, string> = {};
  if (details?.propertyType) propertyDetails['Property Type'] = details.propertyType;
  if (property.class) propertyDetails['Class'] = property.class;
  if (property.type) propertyDetails['Type'] = property.type;
  if (details?.style) propertyDetails['Style'] = details.style;
  if (details?.yearBuilt) propertyDetails['Year Built'] = String(details.yearBuilt);

  // Inside Details
  const inside: Record<string, string | number> = {};
  if (details?.numBedrooms !== undefined && details.numBedrooms !== null) {
    inside['Bedrooms'] = details.numBedrooms;
  }
  if (details?.numBathrooms !== undefined && details.numBathrooms !== null) {
    inside['Bathrooms'] = details.numBathrooms;
  }
  if (details?.sqft) {
    const sqft = typeof details.sqft === 'number' 
      ? details.sqft 
      : parseFloat(String(details.sqft).replace(/,/g, '')) || 0;
    if (sqft > 0) {
      inside['Square Feet'] = sqft;
    }
  }
  if (details?.numRooms !== undefined && details.numRooms !== null) {
    inside['Total Rooms'] = details.numRooms;
  }
  if (details?.numFireplaces !== undefined && details.numFireplaces !== null && details.numFireplaces > 0) {
    inside['Fireplaces'] = details.numFireplaces;
  }

  // Utilities
  const utilities: Record<string, string> = {};
  if (details?.heating) utilities['Heating'] = details.heating;
  if (details?.airConditioning) utilities['Cooling'] = details.airConditioning;
  else if (details?.centralAirConditioning) utilities['Cooling'] = details.centralAirConditioning;
  if (details?.waterSource) utilities['Water Source'] = details.waterSource;
  if (details?.sewer) utilities['Sewer'] = details.sewer;

  // Building Details
  const building: Record<string, string> = {};
  if (details?.exteriorConstruction1) building['Exterior'] = details.exteriorConstruction1;
  if (details?.exteriorConstruction2) building['Exterior 2'] = details.exteriorConstruction2;
  if (details?.foundationType) building['Foundation'] = details.foundationType;
  if (details?.roofMaterial) building['Roof'] = details.roofMaterial;
  if (details?.flooringType) building['Flooring'] = details.flooringType;
  if (rawProperty?.condominium?.stories) building['Stories'] = rawProperty.condominium.stories;

  // Parking Details
  const parking: Record<string, string | number> = {};
  if (details?.numGarageSpaces !== undefined && details.numGarageSpaces !== null && details.numGarageSpaces > 0) {
    parking['Garage Spaces'] = details.numGarageSpaces;
  }
  if (details?.numParkingSpaces !== undefined && details.numParkingSpaces !== null && details.numParkingSpaces > 0) {
    parking['Parking Spaces'] = details.numParkingSpaces;
  }
  if (details?.garage) parking['Garage Type'] = details.garage;
  if (rawProperty?.condominium?.parkingType) parking['Parking Type'] = rawProperty.condominium.parkingType;

  // Land Details
  const land: Record<string, string> = {};
  if (property.lot?.acres && property.lot.acres > 0) {
    land['Lot Size'] = `${property.lot.acres} ${property.lot.acres === 1 ? 'acre' : 'acres'}`;
  } else if (property.lot?.squareFeet && property.lot.squareFeet > 0) {
    land['Lot Size'] = `${property.lot.squareFeet.toLocaleString()} sqft`;
  }
  if (property.lot?.dimensions) land['Dimensions'] = property.lot.dimensions;
  if (property.lot?.features) land['Features'] = property.lot.features;
  if (details?.zoning) land['Zoning'] = details.zoning;
  if (details?.zoningDescription) land['Zoning Description'] = details.zoningDescription;

  // Highlights
  const highlights: Record<string, string> = {};
  if (details?.swimmingPool) highlights['Swimming Pool'] = details.swimmingPool;
  if (details?.fireplace || (details?.numFireplaces && details.numFireplaces > 0)) {
    highlights['Fireplace'] = details.numFireplaces ? `${details.numFireplaces} fireplace${details.numFireplaces > 1 ? 's' : ''}` : 'Yes';
  }
  if (details?.balcony) highlights['Balcony'] = details.balcony;
  if (details?.patio) highlights['Patio'] = details.patio;
  if (details?.elevator) highlights['Elevator'] = details.elevator;
  if (details?.viewType) highlights['View'] = details.viewType;
  if (details?.waterfront) highlights['Waterfront'] = details.waterfront;
  if (rawProperty?.condominium?.amenities && rawProperty.condominium.amenities.length > 0) {
    rawProperty.condominium.amenities.forEach((amenity, index) => {
      highlights[`Amenity ${index + 1}`] = amenity;
    });
  }

  // Rooms (from rawProperty if available)
  const rooms = rawProperty?.rooms?.map(room => {
    // Build dimensions from length and width
    let dimensions = '';
    if (room.length && room.width) {
      dimensions = `${room.length}' x ${room.width}'`;
    }
    
    // Build features array from features, features2, features3
    const features: string[] = [];
    if (room.features) features.push(room.features);
    if (room.features2) features.push(room.features2);
    if (room.features3) features.push(room.features3);
    
    return {
      name: room.description || 'Room',
      dimensions,
      features,
      level: room.level || ''
    };
  }) || [];

  // Map lastStatus to readable event names
  const getEventFromStatus = (lastStatus: string | null): string => {
    if (!lastStatus) return 'Listed For Sale';
    const statusLower = lastStatus.toLowerCase();
    const statusMap: Record<string, string> = {
      'new': 'Listed For Sale',
      'exp': 'Expired',
      'ter': 'Terminated',
      'sld': 'Sold',
      'wth': 'Withdrawn',
      'can': 'Canceled',
      'hold': 'Hold',
      'pc': 'Pending',
      'sc': 'Active Under Contract',
      'inc': 'Incomplete',
    };
    return statusMap[statusLower] || lastStatus;
  };

  // Determine if a history record is currently active
  const _isHistoryActive = (_history: { lastStatus?: string; timestamps?: { closedDate?: string; terminatedDate?: string; expiryDate?: string } }, isCurrentListing: boolean): boolean => {
    if (!isCurrentListing) return false;
    
    const lastStatus = history.lastStatus?.toLowerCase();
    const timestamps = history.timestamps;
    
    // Check if listing has been closed/terminated/expired
    if (timestamps?.closedDate || timestamps?.terminatedDate || timestamps?.expiryDate) {
      return false;
    }
    
    // Active statuses
    const activeStatuses = ['new', 'sc', 'pc', 'hold'];
    return lastStatus ? activeStatuses.includes(lastStatus) : false;
  };

  // Get end date from timestamps with better logic
  const getEndDate = (history: { 
    lastStatus?: string | null; 
    soldDate?: string | null; 
    soldPrice?: number | null;
    listPrice?: number;
    mlsNumber?: string;
    images?: string[];
    photoCount?: number;
    office?: { brokerageName?: string };
    timestamps?: { 
      closedDate?: string | null; 
      terminatedDate?: string | null; 
      expiryDate?: string | null; 
      soldDate?: string | null; 
      unavailableDate?: string | null;
      listingEntryDate?: string | null;
    } 
  }, isCurrentListing: boolean): string => {
    const timestamps = history.timestamps;
    if (!timestamps) {
      // If no timestamps and it's the current listing, use current date
      return isCurrentListing ? new Date().toISOString() : '';
    }
    
    // Priority: soldDate (from history) > soldDate (from timestamps) > closedDate > terminatedDate > unavailableDate > expiryDate
    // For sold listings, use soldDate if available (check history first, then timestamps)
    if (history.soldDate) return history.soldDate;
    if (timestamps.soldDate) return timestamps.soldDate;
    if (timestamps.closedDate) return timestamps.closedDate;
    if (timestamps.terminatedDate) return timestamps.terminatedDate;
    if (timestamps.unavailableDate) return timestamps.unavailableDate;
    if (timestamps.expiryDate) return timestamps.expiryDate;
    
    // If listing is still active (current listing with active status), use current date
    const lastStatus = history.lastStatus?.toLowerCase();
    const activeStatuses = ['new', 'sc', 'pc', 'hold'];
    if (isCurrentListing && lastStatus && activeStatuses.includes(lastStatus)) {
      return new Date().toISOString();
    }
    
    return '';
  };

  // Listing History (from rawProperty if available)
  // Sort by listDate descending (most recent first)
  const sortedHistory = rawProperty?.history 
    ? [...rawProperty.history].sort((a, b) => {
        const dateA = new Date(a.listDate || a.timestamps?.listingEntryDate || 0).getTime();
        const dateB = new Date(b.listDate || b.timestamps?.listingEntryDate || 0).getTime();
        return dateB - dateA; // Most recent first
      })
    : [];

  const listingHistory = sortedHistory.map((history, index) => {
    // The first item (index 0) is the most recent listing
    const isCurrentListing = index === 0;
    const dateStart = history.listDate || history.timestamps?.listingEntryDate || '';
    const dateEnd = getEndDate(history, isCurrentListing);
    const event = getEventFromStatus(history.lastStatus);
    
    // Use soldPrice if available, otherwise listPrice
    const priceValue = history.soldPrice || history.listPrice || 0;
    const price = priceValue > 0 ? `$${priceValue.toLocaleString()}` : '';
    const listPrice = history.listPrice ? `$${history.listPrice.toLocaleString()}` : '';
    
    // Get image URL from first image if available, transform to full CDN URL
    const imageUrl = history.images && history.images.length > 0 
      ? transformImageUrl(history.images[0]) 
      : '';
    
    return {
      dateStart,
      dateEnd: dateEnd || (dateStart ? new Date().toISOString() : ''),
      listPrice,
      price,
      event,
      listingId: history.mlsNumber || '',
      brokerage: history.office?.brokerageName || '',
      photoCount: history.photoCount || 0,
      imageUrl
    };
  });

  // Comparable Sales (from rawProperty if available)
  const soldPrices = rawProperty?.comparables
    ?.map(c => c.soldPrice || 0)
    .filter(p => p > 0) || [];
  
  let medianPrice = 0;
  if (soldPrices.length > 0) {
    const sorted = [...soldPrices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianPrice = sorted.length % 2 === 0 
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : Math.round(sorted[mid]);
  }

  const daysOnMarketValues = rawProperty?.comparables
    ?.map(c => (c as { daysOnMarket?: number }).daysOnMarket || 0)
    .filter(d => d > 0) || [];
  
  const avgDaysOnMarket = daysOnMarketValues.length > 0
    ? Math.round(daysOnMarketValues.reduce((sum, days) => sum + days, 0) / daysOnMarketValues.length)
    : 0;

  const comparableSales = {
    count: rawProperty?.comparables?.length || 0,
    medianPrice,
    avgDaysOnMarket
  };

  // Price Prediction (placeholder - would need actual prediction service)
  const pricePrediction = {
    lower: property.listPrice ? Math.round(property.listPrice * 0.9) : 0,
    mid: property.listPrice || 0,
    higher: property.listPrice ? Math.round(property.listPrice * 1.1) : 0,
    confidence: 75,
    appreciation: 0,
    rentalIncome: property.listPrice ? Math.round(property.listPrice * 0.005) : 0
  };

  return {
    keyFacts,
    listingHistory,
    pricePrediction,
    propertyDetails: {
      property: propertyDetails,
      inside,
      utilities,
      building,
      parking,
      highlights,
      land
    },
    rooms,
    comparableSales
  };
}

