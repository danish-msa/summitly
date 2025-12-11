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

/**
 * Generate property details data structure from real property data
 */
export function generatePropertyDetailsData(
  property: PropertyListing,
  rawProperty?: SinglePropertyListingResponse | null
) {
  // Generate Key Facts from real data
  const keyFacts = generateKeyFacts(property);

  // Property Details
  const propertyDetails: Record<string, string> = {};
  if (property.details?.propertyType) propertyDetails['Property Type'] = property.details.propertyType;
  if (property.class) propertyDetails['Class'] = property.class;
  if (property.type) propertyDetails['Type'] = property.type;
  if (property.details?.style) propertyDetails['Style'] = property.details.style;
  if (property.details?.yearBuilt) propertyDetails['Year Built'] = property.details.yearBuilt;

  // Inside Details
  const inside: Record<string, string | number> = {};
  if (property.details?.numBedrooms !== undefined && property.details.numBedrooms !== null) {
    inside['Bedrooms'] = property.details.numBedrooms;
  }
  if (property.details?.numBathrooms !== undefined && property.details.numBathrooms !== null) {
    inside['Bathrooms'] = property.details.numBathrooms;
  }
  if (property.details?.sqft) {
    const sqft = typeof property.details.sqft === 'number' 
      ? property.details.sqft 
      : parseFloat(String(property.details.sqft).replace(/,/g, '')) || 0;
    if (sqft > 0) {
      inside['Square Feet'] = sqft;
    }
  }
  if (property.details?.numRooms !== undefined && property.details.numRooms !== null) {
    inside['Total Rooms'] = property.details.numRooms;
  }
  if (property.details?.numFireplaces !== undefined && property.details.numFireplaces !== null && property.details.numFireplaces > 0) {
    inside['Fireplaces'] = property.details.numFireplaces;
  }

  // Utilities
  const utilities: Record<string, string> = {};
  if (property.details?.heating) utilities['Heating'] = property.details.heating;
  if (property.details?.airConditioning) utilities['Cooling'] = property.details.airConditioning;
  else if (property.details?.centralAirConditioning) utilities['Cooling'] = property.details.centralAirConditioning;
  if (property.details?.waterSource) utilities['Water Source'] = property.details.waterSource;
  if (property.details?.sewer) utilities['Sewer'] = property.details.sewer;

  // Building Details
  const building: Record<string, string> = {};
  if (property.details?.exteriorConstruction1) building['Exterior'] = property.details.exteriorConstruction1;
  if (property.details?.exteriorConstruction2) building['Exterior 2'] = property.details.exteriorConstruction2;
  if (property.details?.foundationType) building['Foundation'] = property.details.foundationType;
  if (property.details?.roofMaterial) building['Roof'] = property.details.roofMaterial;
  if (property.details?.flooringType) building['Flooring'] = property.details.flooringType;
  if (rawProperty?.condominium?.stories) building['Stories'] = rawProperty.condominium.stories;

  // Parking Details
  const parking: Record<string, string | number> = {};
  if (property.details?.numGarageSpaces !== undefined && property.details.numGarageSpaces !== null && property.details.numGarageSpaces > 0) {
    parking['Garage Spaces'] = property.details.numGarageSpaces;
  }
  if (property.details?.numParkingSpaces !== undefined && property.details.numParkingSpaces !== null && property.details.numParkingSpaces > 0) {
    parking['Parking Spaces'] = property.details.numParkingSpaces;
  }
  if (property.details?.garage) parking['Garage Type'] = property.details.garage;
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
  if (property.details?.zoning) land['Zoning'] = property.details.zoning;
  if (property.details?.zoningDescription) land['Zoning Description'] = property.details.zoningDescription;

  // Highlights
  const highlights: Record<string, string> = {};
  if (property.details?.swimmingPool) highlights['Swimming Pool'] = property.details.swimmingPool;
  if (property.details?.fireplace || (property.details?.numFireplaces && property.details.numFireplaces > 0)) {
    highlights['Fireplace'] = property.details.numFireplaces ? `${property.details.numFireplaces} fireplace${property.details.numFireplaces > 1 ? 's' : ''}` : 'Yes';
  }
  if (property.details?.balcony) highlights['Balcony'] = property.details.balcony;
  if (property.details?.patio) highlights['Patio'] = property.details.patio;
  if (property.details?.elevator) highlights['Elevator'] = property.details.elevator;
  if (property.details?.viewType) highlights['View'] = property.details.viewType;
  if (property.details?.waterfront) highlights['Waterfront'] = property.details.waterfront;
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
  const isHistoryActive = (history: { lastStatus?: string; timestamps?: { closedDate?: string; terminatedDate?: string; expiryDate?: string } }, isCurrentListing: boolean): boolean => {
    if (!isCurrentListing) return false;
    
    const lastStatus = history.lastStatus?.toLowerCase();
    const timestamps = history.timestamps;
    
    // Check if listing has been closed/terminated/expired
    if (timestamps?.closedDate || timestamps?.terminatedDate || timestamps?.expiryDate) {
      return false;
    }
    
    // Active statuses
    const activeStatuses = ['new', 'sc', 'pc', 'hold'];
    return activeStatuses.includes(lastStatus);
  };

  // Get end date from timestamps with better logic
  const getEndDate = (history: { timestamps?: { closedDate?: string; terminatedDate?: string; expiryDate?: string; soldDate?: string } }, isCurrentListing: boolean): string => {
    const timestamps = history.timestamps;
    if (!timestamps) {
      // If no timestamps and it's the current listing, use current date
      return isCurrentListing ? new Date().toISOString() : '';
    }
    
    // Priority: closedDate > terminatedDate > unavailableDate > expiryDate
    // For sold listings, use soldDate if available
    if (history.soldDate) return history.soldDate;
    if (timestamps.closedDate) return timestamps.closedDate;
    if (timestamps.terminatedDate) return timestamps.terminatedDate;
    if (timestamps.unavailableDate) return timestamps.unavailableDate;
    if (timestamps.expiryDate) return timestamps.expiryDate;
    
    // If listing is still active (current listing with active status), use current date
    const lastStatus = history.lastStatus?.toLowerCase();
    const activeStatuses = ['new', 'sc', 'pc', 'hold'];
    if (isCurrentListing && activeStatuses.includes(lastStatus)) {
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
    ?.map(c => c.daysOnMarket || 0)
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

