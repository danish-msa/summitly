import { PropertyListing } from '@/lib/types';

/**
 * Generate Key Facts from real property data
 * Only includes non-null values
 */
export function generateKeyFacts(property: PropertyListing): Record<string, string | number> {
  const keyFacts: Record<string, string | number> = {};

  // Property Type
  if (property.details?.propertyType) {
    keyFacts['Property Type'] = property.details.propertyType;
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
  if (property.listPrice && property.details?.sqft) {
    const sqft = typeof property.details.sqft === 'number' 
      ? property.details.sqft 
      : parseFloat(String(property.details.sqft).replace(/,/g, '')) || 0;
    if (sqft > 0) {
      const pricePerSqft = Math.round(property.listPrice / sqft);
      keyFacts['Price per Sq Ft'] = `$${pricePerSqft.toLocaleString()}`;
    }
  }

  // Year Built
  if ('yearBuilt' in (property.details || {}) && property.details?.yearBuilt) {
    keyFacts['Year Built'] = (property.details as { yearBuilt?: string | number | null }).yearBuilt as string | number;
  }

  // Lot Size
  if (property.lot?.acres && property.lot.acres > 0) {
    keyFacts['Lot Size'] = `${property.lot.acres} ${property.lot.acres === 1 ? 'acre' : 'acres'}`;
  } else if (property.lot?.squareFeet && property.lot.squareFeet > 0) {
    keyFacts['Lot Size'] = `${property.lot.squareFeet.toLocaleString()} sqft`;
  }

  // Square Feet
  if (property.details?.sqft) {
    const sqft = typeof property.details.sqft === 'number' 
      ? property.details.sqft 
      : parseFloat(String(property.details.sqft).replace(/,/g, '')) || 0;
    if (sqft > 0) {
      keyFacts['Square Feet'] = sqft.toLocaleString();
    }
  }

  // Bedrooms
  if (property.details?.numBedrooms !== undefined && property.details.numBedrooms !== null) {
    keyFacts['Bedrooms'] = property.details.numBedrooms;
  }

  // Bathrooms
  if (property.details?.numBathrooms !== undefined && property.details.numBathrooms !== null) {
    const bathrooms = property.details.numBathrooms;
    const bathroomsPlus = property.details.numBathroomsPlus;
    if (bathroomsPlus && Number(bathroomsPlus) > 0) {
      keyFacts['Bathrooms'] = `${bathrooms} + ${bathroomsPlus}`;
    } else {
      keyFacts['Bathrooms'] = bathrooms;
    }
  }

  // Garage/Parking
  if (property.details?.numGarageSpaces !== undefined && property.details.numGarageSpaces !== null && property.details.numGarageSpaces > 0) {
    const garageType = property.details.garage ? ` ${property.details.garage}` : '';
    keyFacts['Garage'] = `${property.details.numGarageSpaces}-car${property.details.numGarageSpaces > 1 ? 's' : ''}${garageType}`;
  } else if (property.details?.numParkingSpaces !== undefined && property.details.numParkingSpaces !== null && property.details.numParkingSpaces > 0) {
    keyFacts['Parking'] = `${property.details.numParkingSpaces} space${property.details.numParkingSpaces > 1 ? 's' : ''}`;
  } else if (property.details?.garage) {
    keyFacts['Garage'] = property.details.garage;
  }

  // Days on Market
  if (property.daysOnMarket !== undefined && property.daysOnMarket > 0) {
    keyFacts['Days on Market'] = property.daysOnMarket;
  }

  // Style
  if (property.details?.style) {
    keyFacts['Style'] = property.details.style;
  }

  // Heating
  if (property.details?.heating) {
    keyFacts['Heating'] = property.details.heating;
  }

  // Air Conditioning / Cooling
  if (property.details?.airConditioning) {
    keyFacts['Air Conditioning'] = property.details.airConditioning;
  } else if (property.details?.centralAirConditioning) {
    keyFacts['Air Conditioning'] = property.details.centralAirConditioning;
  }

  // Water Source
  if (property.details?.waterSource) {
    keyFacts['Water Source'] = property.details.waterSource;
  }

  // Sewer
  if (property.details?.sewer) {
    keyFacts['Sewer'] = property.details.sewer;
  } else if (property.details?.landSewer) {
    keyFacts['Sewer'] = property.details.landSewer;
  }

  // Zoning
  if (property.details?.zoning) {
    keyFacts['Zoning'] = property.details.zoning;
  } else if (property.details?.zoningType) {
    keyFacts['Zoning'] = property.details.zoningType;
  } else if (property.details?.zoningDescription) {
    keyFacts['Zoning'] = property.details.zoningDescription;
  }

  // Fireplaces
  if (property.details?.numFireplaces !== undefined && property.details.numFireplaces !== null && property.details.numFireplaces > 0) {
    keyFacts['Fireplaces'] = property.details.numFireplaces;
  }

  // Swimming Pool
  if (property.details?.swimmingPool) {
    keyFacts['Swimming Pool'] = property.details.swimmingPool;
  }

  // Elevator
  if (property.details?.elevator) {
    keyFacts['Elevator'] = property.details.elevator;
  }

  // Patio
  if (property.details?.patio) {
    keyFacts['Patio'] = property.details.patio;
  }

  // Basement
  if (property.details?.basement1) {
    keyFacts['Basement'] = property.details.basement1;
  } else if (property.details?.basement2) {
    keyFacts['Basement'] = property.details.basement2;
  }

  // Den
  if (property.details?.den) {
    keyFacts['Den'] = property.details.den;
  }

  // Family Room
  if (property.details?.familyRoom) {
    keyFacts['Family Room'] = property.details.familyRoom;
  }

  // Exterior Construction
  if (property.details?.exteriorConstruction1) {
    keyFacts['Exterior'] = property.details.exteriorConstruction1;
    if (property.details.exteriorConstruction2) {
      keyFacts['Exterior'] = `${property.details.exteriorConstruction1}, ${property.details.exteriorConstruction2}`;
    }
  }

  // Foundation Type
  if (property.details?.foundationType) {
    keyFacts['Foundation'] = property.details.foundationType;
  }

  // Roof Material
  if (property.details?.roofMaterial) {
    keyFacts['Roof'] = property.details.roofMaterial;
  }

  // Flooring Type
  if (property.details?.flooringType) {
    keyFacts['Flooring'] = property.details.flooringType;
  }

  // View Type
  if (property.details?.viewType) {
    keyFacts['View'] = property.details.viewType;
  }

  // Waterfront
  if (property.details?.waterfront) {
    keyFacts['Waterfront'] = property.details.waterfront;
  }

  // Furnished
  if (property.details?.furnished) {
    keyFacts['Furnished'] = property.details.furnished;
  }

  // Central Vacuum
  if (property.details?.centralVac) {
    keyFacts['Central Vacuum'] = property.details.centralVac;
  }

  // Driveway
  if (property.details?.driveway) {
    keyFacts['Driveway'] = property.details.driveway;
  }

  // Laundry Level
  if (property.details?.laundryLevel) {
    keyFacts['Laundry'] = property.details.laundryLevel;
  }

  // HOA Fee
  if (property.details?.HOAFee) {
    keyFacts['HOA Fee'] = property.details.HOAFee;
  }

  // Construction Status
  if (property.details?.constructionStatus) {
    keyFacts['Construction Status'] = property.details.constructionStatus;
  }

  // Energy Certification
  if (property.details?.energyCertification) {
    keyFacts['Energy Certification'] = property.details.energyCertification;
  }

  // EnerGuide Rating
  if (property.details?.energuideRating) {
    keyFacts['EnerGuide Rating'] = property.details.energuideRating;
  }

  return keyFacts;
}

