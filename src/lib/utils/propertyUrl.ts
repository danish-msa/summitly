/**
 * Utility functions for generating property URLs
 */

/**
 * Slugify a string for URL use
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate property URL from property data
 * Format: /{cityname}/{streetNumber}-{streetName}-{mlsNumber}
 * This includes MLS number for fast API lookup while keeping SEO-friendly address
 */
export function getPropertyUrl(property: {
  address?: {
    city?: string | null;
    streetNumber?: string | null;
    streetName?: string | null;
  };
  mlsNumber?: string;
}): string {
  const city = property.address?.city;
  const streetNumber = property.address?.streetNumber;
  const streetName = property.address?.streetName;
  const mlsNumber = property.mlsNumber;

  // If we have city, address components, and MLS number, use the new format
  if (city && streetNumber && streetName && mlsNumber) {
    const citySlug = slugify(city);
    const addressSlug = `${slugify(streetNumber)}-${slugify(streetName)}`;
    // Append MLS number for fast lookup: /toronto/7712-onibal-ACT7353557
    return `/${citySlug}/${addressSlug}-${mlsNumber}`;
  }

  // If we have city and address but no MLS, use address-only format (backward compatibility)
  if (city && streetNumber && streetName) {
    const citySlug = slugify(city);
    const addressSlug = `${slugify(streetNumber)}-${slugify(streetName)}`;
    return `/${citySlug}/${addressSlug}`;
  }

  // Fallback to old format if address data is missing
  if (mlsNumber) {
    return `/property/${mlsNumber}`;
  }

  return '/listings';
}

/**
 * Parse property URL to extract city, address, and MLS number
 * Supports both formats:
 * - /toronto/7712-onibal-ACT7353557 (with MLS)
 * - /toronto/7712-onibal (without MLS, backward compatibility)
 */
export function parsePropertyUrl(
  citySlug: string,
  addressSlug: string
): { city: string; streetNumber: string; streetName: string; mlsNumber?: string } | null {
  // Split address slug by hyphen
  const parts = addressSlug.split('-');
  
  if (parts.length < 2) {
    return null;
  }

  // Check if last part looks like an MLS number (contains letters and numbers, length >= 6)
  // MLS numbers are usually like: ACT7353557, C1234567, etc.
  const lastPart = parts[parts.length - 1];
  const looksLikeMlsNumber = /^[A-Z0-9]+$/i.test(lastPart) && lastPart.length >= 6;
  
  let mlsNumber: string | undefined;
  let streetNameParts: string[];
  
  if (looksLikeMlsNumber && parts.length >= 3) {
    // URL includes MLS number: /toronto/7712-onibal-ACT7353557
    mlsNumber = lastPart;
    streetNameParts = parts.slice(1, -1); // Everything between street number and MLS
  } else {
    // URL doesn't include MLS: /toronto/7712-onibal (backward compatibility)
    streetNameParts = parts.slice(1); // Everything after street number
  }

  // First part is street number
  const streetNumber = parts[0];
  const streetName = streetNameParts.join('-');

  // Convert slugs back to readable format
  // For street name, join with spaces and capitalize
  const formattedStreetName = streetName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // For city, join with spaces and capitalize
  const formattedCity = citySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    city: formattedCity,
    streetNumber: streetNumber, // Keep as-is (usually just numbers)
    streetName: formattedStreetName,
    mlsNumber: mlsNumber, // MLS number if present in URL
  };
}

