const API_KEY = process.env.NEXT_PUBLIC_REPLIERS_API_KEY;
const BASE_URL = 'https://api.repliers.io';

export async function getListings(params = {}) {
  const query = new URLSearchParams({
    ...params,
    status: "A", // Active listings
    resultsPerPage: params.resultsPerPage || 50,
    // Add other default params as needed
  }).toString();

  console.log(`Calling API: ${BASE_URL}/listings?${query}`);
  
  try {
    const response = await fetch(`${BASE_URL}/listings?${query}`, {
      headers: {
        "REPLIERS-API-KEY": API_KEY,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch listings: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API returned data with', data.listings?.length || 0, 'listings');
    return data;
  } catch (error) {
    console.error('Error in getListings:', error);
    return { listings: [], count: 0 };
  }
}

export async function getPropertyTypes() {
  // Some APIs have endpoints for metadata like property types
  // If not, we can extract from listings
}