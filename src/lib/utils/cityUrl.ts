/**
 * Utility functions for generating city URLs
 */

/**
 * Generate city URL from city name
 * Format: /{cityname}-real-estate/
 */
export function getCityUrl(cityName: string): string {
  if (!cityName) return '/listings';
  
  const citySlug = cityName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  return `/${citySlug}-real-estate`;
}

/**
 * Parse city URL to extract city name
 * Removes "-real-estate" suffix and converts slug back to readable format
 */
export function parseCityUrl(citySlug: string): string {
  // Remove "-real-estate" suffix if present
  let cityName = citySlug.replace(/-real-estate$/, '');
  
  // Convert slug back to readable format (capitalize first letter of each word)
  cityName = cityName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return cityName;
}

/**
 * Check if a URL slug is a city URL (ends with -real-estate)
 */
export function isCityUrl(slug: string): boolean {
  return slug.endsWith('-real-estate');
}

