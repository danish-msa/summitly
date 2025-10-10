import {
  PropertyListing,
  PropertyType,
  PropertyClass,
  City,
  ApiListing,
  ListingsResponse,
  PropertyTypesResponse
} from '@/lib/types';

const API_BASE_URL = 'https://api.repliers.io';
const API_KEY = process.env.NEXT_PUBLIC_REPLIERS_API_KEY || 'wPBzfSTENIwtX6fXv6JZC2tR7tMUVT';

const apiHeaders = {
  accept: 'application/json',
  'REPLIERS-API-KEY': API_KEY
};

export const fetchPropertyTypes = async (): Promise<PropertyType[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/listings/property-types`, {
      method: 'GET',
      headers: apiHeaders
    });

    if (!response.ok) {
      console.error('API Response:', await response.text());
      throw new Error(`Failed to fetch property types: ${response.status}`);
    }

    const data = await response.json() as PropertyTypesResponse;
    
    // Transform the API data to match our existing format
    const transformedData: PropertyType[] = [];
    let id = 1;

    // Correctly parse the nested structure
    data.boards.forEach((board) => {
      Object.entries(board.classes).forEach(([className, classData]) => {
        // propertyTypes is an array of objects
        classData.propertyTypes.forEach((propertyTypeObj) => {
          // Each object in the array has property type names as keys
          Object.entries(propertyTypeObj).forEach(([typeName, typeDetails]) => {
            transformedData.push({
              id: id,
              icon: `/images/a${(id % 5) + 1}.png`, // Cycle through available icons
              type: typeName,
              number: typeDetails.activeCount,
              class: className
            });
            id++;
          });
        });
      });
    });

    return transformedData;
  } catch (error) {
    console.error('Error fetching property types:', error);
    return []; // Return empty array instead of fallback data
  }
};

export const fetchPropertyClasses = async (): Promise<PropertyClass[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/listings/property-types`, {
      method: 'GET',
      headers: apiHeaders
    });

    if (!response.ok) {
      console.error('API Response:', await response.text());
      throw new Error(`Failed to fetch property types: ${response.status}`);
    }

    const data = await response.json() as PropertyTypesResponse;
    
    // Transform the API data to aggregate by class
    const classTotals: Record<string, number> = {};
    
    // Calculate total properties for each class
    data.boards.forEach((board) => {
      Object.entries(board.classes).forEach(([className, classData]) => {
        classTotals[className] = 0;
        
        // propertyTypes is an array of objects
        classData.propertyTypes.forEach((propertyTypeObj) => {
          // Each object in the array has property type names as keys
          Object.entries(propertyTypeObj).forEach(([, typeDetails]) => {
            classTotals[className] += typeDetails.activeCount;
          });
        });
      });
    });
    
    // Convert to our desired format
    const transformedData: PropertyClass[] = Object.entries(classTotals).map(([className, count], index) => ({
      id: index + 1,
      icon: `/images/a${(index % 5) + 1}.png`,
      type: className.charAt(0).toUpperCase() + className.slice(1) + " Properties", // Capitalize and add "Properties"
      number: count
    }));

    return transformedData;
  } catch (error) {
    console.error('Error fetching property classes:', error);
    return []; // Return empty array instead of fallback data
  }
};

export const fetchPropertyListings = async (): Promise<PropertyListing[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/listings`, {
      method: 'GET',
      headers: apiHeaders
    });

    if (!response.ok) {
      console.error('API Response:', await response.text());
      throw new Error(`Failed to fetch listings: ${response.status}`);
    }

    const data = await response.json() as ListingsResponse;
    
    // Transform the API data to match our new format
    const transformedData: PropertyListing[] = data.listings.map((listing: ApiListing) => {
      // Format location with better handling of undefined values
      const locationParts = [
        listing.address?.unitNumber,
        listing.address?.streetNumber,
        listing.address?.streetName,
        listing.address?.streetSuffix,
        listing.address?.streetDirection,
        listing.address?.neighborhood,
        listing.address?.city,
        listing.address?.zip
      ].filter(Boolean);
      
      const location = locationParts.length > 0 
        ? locationParts.join(' ') 
        : 'Location not available';
      
      // Improved image handling section
      let allImages: string[] = [];
  
      if (listing.images && Array.isArray(listing.images)) {
        allImages = listing.images.map((img: string) => {
          // Construct the full URL for sandbox images
          if (img.startsWith('sandbox/')) {
            return `https://cdn.repliers.io/${img}`;
          }
          // Handle other possible image formats
          return img.startsWith('http') ? img : `https://cdn.repliers.io/${img}`;
        }).filter((url: string) => url); // Filter out any empty strings
      }
      // Fallback images if none found
      if (allImages.length === 0) {
        allImages = [
          '/images/p1.jpg',
          '/images/p2.jpg',
          '/images/p3.jpg',
          '/images/p4.jpg',
          '/images/p5.jpg'
        ];
      }
      
      return {
        mlsNumber: listing.mlsNumber || '',
        status: listing.status || 'Active',
        class: listing.class || 'residential',
        listPrice: listing.listPrice || 0,
        listDate: listing.listDate || new Date().toISOString(),
        lastStatus: listing.lastStatus || '',
        soldPrice: listing.soldPrice || '',
        soldDate: listing.soldDate || '',
        
        address: {
          area: listing.address?.area || null,
          city: listing.address?.city || null,
          country: listing.address?.country || null,
          district: listing.address?.district || null,
          majorIntersection: listing.address?.majorIntersection || null,
          neighborhood: listing.address?.neighborhood || null,
          streetDirection: listing.address?.streetDirection || null,
          streetName: listing.address?.streetName || null,
          streetNumber: listing.address?.streetNumber || null,
          streetSuffix: listing.address?.streetSuffix || null,
          unitNumber: listing.address?.unitNumber || null,
          zip: listing.address?.zip || null,
          state: listing.address?.state || null,
          communityCode: listing.address?.communityCode || null,
          streetDirectionPrefix: listing.address?.streetDirectionPrefix || null,
          addressKey: listing.address?.addressKey || null,
          location: location
        },
        
        map: {
          latitude: listing.map?.latitude || null,
          longitude: listing.map?.longitude || null,
          point: listing.map?.point || null
        },
        
        details: {
          numBathrooms: listing.details?.numBathrooms || 0,
          numBathroomsPlus: listing.details?.numBathroomsPlus || 0,
          numBedrooms: listing.details?.numBedrooms || 0,
          numBedroomsPlus: listing.details?.numBedroomsPlus || 0,
          propertyType: listing.details?.propertyType || 'Unknown',
          sqft: listing.details?.sqft || 0
        },
        
        updatedOn: listing.updatedOn || new Date().toISOString(),
        
        lot: {
          acres: listing.lot?.acres || 0,
          depth: listing.lot?.depth || 0,
          irregular: listing.lot?.irregular || 0,
          legalDescription: listing.lot?.legalDescription || '',
          measurement: listing.lot?.measurement || '',
          width: listing.lot?.width || 0,
          size: listing.lot?.size || 0,
          source: listing.lot?.source || '',
          dimensionsSource: listing.lot?.dimensionsSource || '',
          dimensions: listing.lot?.dimensions || '',
          squareFeet: listing.lot?.squareFeet || 0,
          features: listing.lot?.features || '',
          taxLot: listing.lot?.taxLot || 0
        },
        
        boardId: listing.boardId || 0,
        
        images: {
          imageUrl: allImages[0] || '',
          allImages: allImages
        }
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Error fetching property listings:', error);
    return []; // Return empty array instead of fallback data
  }
};

export const fetchTopCities = async (): Promise<City[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/listings`, {
      method: 'GET',
      headers: apiHeaders
    });

    if (!response.ok) {
      console.error('API Response:', await response.text());
      throw new Error(`Failed to fetch listings: ${response.status}`);
    }

    const data = await response.json() as ListingsResponse;
    
    // Count properties by city
    const cityCounts: Record<string, number> = {};
    
    data.listings.forEach((listing: ApiListing) => {
      const city = listing.address?.city;
      if (city) {
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
    });
    
    const sortedCities = Object.entries(cityCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 6)
      .map(([cityName, count], index) => ({
        id: index + 1,
        image: `/images/c${(index % 6) + 1}.jpg`,
        cityName,
        numberOfProperties: count
      }));
    
    return sortedCities;
  } catch (error) {
    console.error('Error fetching top cities:', error);
    return []; // Return empty array instead of fallback data
  }
};

export const getListings = async (params: Record<string, string | number>): Promise<{
  listings: PropertyListing[];
  count: number;
  numPages: number;
}> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value.toString());
    });

    const url = `${API_BASE_URL}/listings?${queryParams.toString()}`;
    console.log('API URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: apiHeaders
    });

    if (!response.ok) {
      console.error('API Response:', await response.text());
      throw new Error(`Failed to fetch listings: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the API data to match our format
    const transformedListings = data.listings.map((listing: ApiListing) => {
      // Format location with better handling of undefined values
      const locationParts = [
        listing.address?.unitNumber,
        listing.address?.streetNumber,
        listing.address?.streetName,
        listing.address?.streetSuffix,
        listing.address?.streetDirection,
        listing.address?.neighborhood,
        listing.address?.city,
        listing.address?.zip
      ].filter(Boolean);
      
      const location = locationParts.length > 0 
        ? locationParts.join(' ') 
        : 'Location not available';
      
      // Improved image handling section
      let allImages: string[] = [];
  
      if (listing.images && Array.isArray(listing.images)) {
        allImages = listing.images.map((img: string) => {
          // Construct the full URL for sandbox images
          if (img.startsWith('sandbox/')) {
            return `https://cdn.repliers.io/${img}`;
          }
          // Handle other possible image formats
          return img.startsWith('http') ? img : `https://cdn.repliers.io/${img}`;
        }).filter((url: string) => url); // Filter out any empty strings
      }
      // Fallback images if none found
      if (allImages.length === 0) {
        allImages = [
          '/images/p1.jpg',
          '/images/p2.jpg',
          '/images/p3.jpg',
          '/images/p4.jpg',
          '/images/p5.jpg'
        ];
      }
      
      return {
        mlsNumber: listing.mlsNumber || '',
        status: listing.status || 'Active',
        class: listing.class || 'residential',
        listPrice: listing.listPrice || 0,
        listDate: listing.listDate || new Date().toISOString(),
        lastStatus: listing.lastStatus || '',
        soldPrice: listing.soldPrice || '',
        soldDate: listing.soldDate || '',
        
        address: {
          area: listing.address?.area || null,
          city: listing.address?.city || null,
          country: listing.address?.country || null,
          district: listing.address?.district || null,
          majorIntersection: listing.address?.majorIntersection || null,
          neighborhood: listing.address?.neighborhood || null,
          streetDirection: listing.address?.streetDirection || null,
          streetName: listing.address?.streetName || null,
          streetNumber: listing.address?.streetNumber || null,
          streetSuffix: listing.address?.streetSuffix || null,
          unitNumber: listing.address?.unitNumber || null,
          zip: listing.address?.zip || null,
          state: listing.address?.state || null,
          communityCode: listing.address?.communityCode || null,
          streetDirectionPrefix: listing.address?.streetDirectionPrefix || null,
          addressKey: listing.address?.addressKey || null,
          location: location
        },
        
        map: {
          latitude: listing.map?.latitude || null,
          longitude: listing.map?.longitude || null,
          point: listing.map?.point || null
        },
        
        details: {
          numBathrooms: listing.details?.numBathrooms || 0,
          numBathroomsPlus: listing.details?.numBathroomsPlus || 0,
          numBedrooms: listing.details?.numBedrooms || 0,
          numBedroomsPlus: listing.details?.numBedroomsPlus || 0,
          propertyType: listing.details?.propertyType || 'Unknown',
          sqft: listing.details?.sqft || 0
        },
        
        updatedOn: listing.updatedOn || new Date().toISOString(),
        
        lot: {
          acres: listing.lot?.acres || 0,
          depth: listing.lot?.depth || 0,
          irregular: listing.lot?.irregular || 0,
          legalDescription: listing.lot?.legalDescription || '',
          measurement: listing.lot?.measurement || '',
          width: listing.lot?.width || 0,
          size: listing.lot?.size || 0,
          source: listing.lot?.source || '',
          dimensionsSource: listing.lot?.dimensionsSource || '',
          dimensions: listing.lot?.dimensions || '',
          squareFeet: listing.lot?.squareFeet || 0,
          features: listing.lot?.features || '',
          taxLot: listing.lot?.taxLot || 0
        },
        
        boardId: listing.boardId || 0,
        
        images: {
          imageUrl: allImages[0] || '',
          allImages: allImages
        }
      };
    });

    return {
      listings: transformedListings,
      count: data.count || transformedListings.length,
      numPages: data.numPages || Math.ceil(transformedListings.length / (Number(params.resultsPerPage) || 10))
    };
  } catch (error) {
    console.error('Error fetching filtered listings:', error);
    return {
      listings: [], // Return empty array instead of fallback data
      count: 0,
      numPages: 0
    };
  }
};
