import { PropertyListing } from '@/lib/types';

/**
 * Generate Key Facts from real property data
 * Only includes non-null values
 */
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
  yearBuilt?: string | number | null;
  numGarageSpaces?: number | null;
  numParkingSpaces?: number | null;
  garage?: string | null;
  style?: string | null;
  heating?: string | null;
  airConditioning?: string | null;
  centralAirConditioning?: string | null;
  waterSource?: string | null;
  sewer?: string | null;
  landSewer?: string | null;
  zoning?: string | null;
  zoningType?: string | null;
  zoningDescription?: string | null;
  numFireplaces?: number | null;
  swimmingPool?: string | null;
  elevator?: string | null;
  patio?: string | null;
  basement1?: string | null;
  basement2?: string | null;
  den?: string | null;
  familyRoom?: string | null;
  exteriorConstruction1?: string | null;
  exteriorConstruction2?: string | null;
  foundationType?: string | null;
  roofMaterial?: string | null;
  flooringType?: string | null;
  viewType?: string | null;
  waterfront?: string | null;
  furnished?: string | null;
  centralVac?: string | null;
  driveway?: string | null;
  laundryLevel?: string | null;
  HOAFee?: string | null;
  constructionStatus?: string | null;
  energyCertification?: string | null;
  energuideRating?: string | null;
};

export function generateKeyFacts(property: PropertyListing): Record<string, string | number> {
  const keyFacts: Record<string, string | number> = {};
  const details = property.details as ExtendedPropertyDetails | undefined;

  // Property Type
  if (details?.propertyType) {
    keyFacts['Property Type'] = details.propertyType;
  }

  // Class
  if (property.class) {
    keyFacts['Class'] = property.class;
  }

  // Type (Sale/Lease)
  if (property.type) {
    keyFacts['Type'] = property.type;
  }

  // Price per Sq Ft
  if (property.listPrice && details?.sqft) {
    const sqft = typeof details.sqft === 'number' 
      ? details.sqft 
      : parseFloat(String(details.sqft).replace(/,/g, '')) || 0;
    if (sqft > 0) {
      const pricePerSqft = Math.round(property.listPrice / sqft);
      keyFacts['Price per Sq Ft'] = `$${pricePerSqft.toLocaleString()}`;
    }
  }

  // Year Built
  if (details?.yearBuilt) {
    keyFacts['Year Built'] = details.yearBuilt;
  }

  // Lot Size
  if (property.lot?.acres && property.lot.acres > 0) {
    keyFacts['Lot Size'] = `${property.lot.acres} ${property.lot.acres === 1 ? 'acre' : 'acres'}`;
  } else if (property.lot?.squareFeet && property.lot.squareFeet > 0) {
    keyFacts['Lot Size'] = `${property.lot.squareFeet.toLocaleString()} sqft`;
  }

  // Square Feet
  if (details?.sqft) {
    const sqft = typeof details.sqft === 'number' 
      ? details.sqft 
      : parseFloat(String(details.sqft).replace(/,/g, '')) || 0;
    if (sqft > 0) {
      keyFacts['Square Feet'] = sqft.toLocaleString();
    }
  }

  // Bedrooms
  if (details?.numBedrooms !== undefined && details.numBedrooms !== null) {
    keyFacts['Bedrooms'] = details.numBedrooms;
  }

  // Bathrooms
  if (details?.numBathrooms !== undefined && details.numBathrooms !== null) {
    const bathrooms = details.numBathrooms;
    const bathroomsPlus = details.numBathroomsPlus;
    if (bathroomsPlus && Number(bathroomsPlus) > 0) {
      keyFacts['Bathrooms'] = `${bathrooms} + ${bathroomsPlus}`;
    } else {
      keyFacts['Bathrooms'] = bathrooms;
    }
  }

  // Garage/Parking
  if (details?.numGarageSpaces !== undefined && details.numGarageSpaces !== null && details.numGarageSpaces > 0) {
    const garageType = details.garage ? ` ${details.garage}` : '';
    keyFacts['Garage'] = `${details.numGarageSpaces}-car${details.numGarageSpaces > 1 ? 's' : ''}${garageType}`;
  } else if (details?.numParkingSpaces !== undefined && details.numParkingSpaces !== null && details.numParkingSpaces > 0) {
    keyFacts['Parking'] = `${details.numParkingSpaces} space${details.numParkingSpaces > 1 ? 's' : ''}`;
  } else if (details?.garage) {
    keyFacts['Garage'] = details.garage;
  }

  // Days on Market
  if (property.daysOnMarket !== undefined && property.daysOnMarket > 0) {
    keyFacts['Days on Market'] = property.daysOnMarket;
  }

  // Style
  if (details?.style) {
    keyFacts['Style'] = details.style;
  }

  // Heating
  if (details?.heating) {
    keyFacts['Heating'] = details.heating;
  }

  // Air Conditioning / Cooling
  if (details?.airConditioning) {
    keyFacts['Air Conditioning'] = details.airConditioning;
  } else if (details?.centralAirConditioning) {
    keyFacts['Air Conditioning'] = details.centralAirConditioning;
  }

  // Water Source
  if (details?.waterSource) {
    keyFacts['Water Source'] = details.waterSource;
  }

  // Sewer
  if (details?.sewer) {
    keyFacts['Sewer'] = details.sewer;
  } else if (details?.landSewer) {
    keyFacts['Sewer'] = details.landSewer;
  }

  // Zoning
  if (details?.zoning) {
    keyFacts['Zoning'] = details.zoning;
  } else if (details?.zoningType) {
    keyFacts['Zoning'] = details.zoningType;
  } else if (details?.zoningDescription) {
    keyFacts['Zoning'] = details.zoningDescription;
  }

  // Fireplaces
  if (details?.numFireplaces !== undefined && details.numFireplaces !== null && details.numFireplaces > 0) {
    keyFacts['Fireplaces'] = details.numFireplaces;
  }

  // Swimming Pool
  if (details?.swimmingPool) {
    keyFacts['Swimming Pool'] = details.swimmingPool;
  }

  // Elevator
  if (details?.elevator) {
    keyFacts['Elevator'] = details.elevator;
  }

  // Patio
  if (details?.patio) {
    keyFacts['Patio'] = details.patio;
  }

  // Basement
  if (details?.basement1) {
    keyFacts['Basement'] = details.basement1;
  } else if (details?.basement2) {
    keyFacts['Basement'] = details.basement2;
  }

  // Den
  if (details?.den) {
    keyFacts['Den'] = details.den;
  }

  // Family Room
  if (details?.familyRoom) {
    keyFacts['Family Room'] = details.familyRoom;
  }

  // Exterior Construction
  if (details?.exteriorConstruction1) {
    keyFacts['Exterior'] = details.exteriorConstruction1;
    if (details.exteriorConstruction2) {
      keyFacts['Exterior'] = `${details.exteriorConstruction1}, ${details.exteriorConstruction2}`;
    }
  }

  // Foundation Type
  if (details?.foundationType) {
    keyFacts['Foundation'] = details.foundationType;
  }

  // Roof Material
  if (details?.roofMaterial) {
    keyFacts['Roof'] = details.roofMaterial;
  }

  // Flooring Type
  if (details?.flooringType) {
    keyFacts['Flooring'] = details.flooringType;
  }

  // View Type
  if (details?.viewType) {
    keyFacts['View'] = details.viewType;
  }

  // Waterfront
  if (details?.waterfront) {
    keyFacts['Waterfront'] = details.waterfront;
  }

  // Furnished
  if (details?.furnished) {
    keyFacts['Furnished'] = details.furnished;
  }

  // Central Vacuum
  if (details?.centralVac) {
    keyFacts['Central Vacuum'] = details.centralVac;
  }

  // Driveway
  if (details?.driveway) {
    keyFacts['Driveway'] = details.driveway;
  }

  // Laundry Level
  if (details?.laundryLevel) {
    keyFacts['Laundry'] = details.laundryLevel;
  }

  // HOA Fee
  if (details?.HOAFee) {
    keyFacts['HOA Fee'] = details.HOAFee;
  }

  // Construction Status
  if (details?.constructionStatus) {
    keyFacts['Construction Status'] = details.constructionStatus;
  }

  // Energy Certification
  if (details?.energyCertification) {
    keyFacts['Energy Certification'] = details.energyCertification;
  }

  // EnerGuide Rating
  if (details?.energuideRating) {
    keyFacts['EnerGuide Rating'] = details.energuideRating;
  }

  return keyFacts;
}

