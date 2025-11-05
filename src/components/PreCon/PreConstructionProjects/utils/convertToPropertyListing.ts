import type { PreConstructionProperty } from '../PropertyCards/types';
import { PropertyListing } from '@/lib/types';

/**
 * Convert PreConstructionProperty to PropertyListing format for map display
 */
export const convertToPropertyListing = (project: PreConstructionProperty): PropertyListing => {
  const streetParts = project.address.street.split(' ');
  const streetNumber = streetParts[0] || '';
  const streetName = streetParts.slice(1).join(' ') || '';
  
  return {
    mlsNumber: project.id,
    status: project.status,
    class: 'residential',
    type: 'Sale',
    listPrice: project.startingPrice,
    listDate: new Date().toISOString(),
    lastStatus: project.status,
    soldPrice: '',
    soldDate: '',
    address: {
      area: null,
      city: project.address.city,
      country: 'Canada',
      district: null,
      majorIntersection: null,
      neighborhood: project.address.city,
      streetDirection: null,
      streetName: streetName,
      streetNumber: streetNumber,
      streetSuffix: null,
      unitNumber: null,
      zip: null,
      state: project.address.province,
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: `${project.address.street}, ${project.address.city}, ${project.address.province}`
    },
    map: {
      latitude: project.address.latitude || null,
      longitude: project.address.longitude || null,
      point: null
    },
    details: {
      numBathrooms: parseInt(project.details.bathroomRange.split('-')[0]) || 1,
      numBathroomsPlus: parseInt(project.details.bathroomRange.split('-')[0]) || 1,
      numBedrooms: parseInt(project.details.bedroomRange.split('-')[0]) || 1,
      numBedroomsPlus: parseInt(project.details.bedroomRange.split('-')[0]) || 1,
      propertyType: project.details.propertyType,
      sqft: parseInt(project.details.sqftRange.split('-')[0].replace(/,/g, '')) || 0
    },
    updatedOn: new Date().toISOString(),
    lot: {
      acres: 0,
      depth: 0,
      irregular: 0,
      legalDescription: project.projectName,
      measurement: '',
      width: 0,
      size: 0,
      source: '',
      dimensionsSource: '',
      dimensions: '',
      squareFeet: parseInt(project.details.sqftRange.split('-')[0].replace(/,/g, '')) || 0,
      features: '',
      taxLot: ''
    },
    boardId: 0,
    images: {
      imageUrl: project.images[0] || '',
      allImages: project.images
    }
  };
};

