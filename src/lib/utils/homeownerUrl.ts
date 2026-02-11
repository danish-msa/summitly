/**
 * Utility functions for generating homeowner property URLs
 * Format: /homeowner/{streetNumber}-{streetName}-{city}-{state}-{zip}
 */

/**
 * Slugify a string for URL use
 */
function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate homeowner property URL slug
 * Format: {streetNumber}-{streetName}-{city}-{state}-{zip}
 * Example: 143-Mykeys-Way-Huntsville-AL-35811
 */
export function getHomeownerPropertySlug(property: {
  address?: {
    streetNumber?: string | null;
    streetName?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
}): string {
  const streetNumber = property.address?.streetNumber;
  const streetName = property.address?.streetName;
  const city = property.address?.city;
  const state = property.address?.state;
  const zip = property.address?.zip;

  const parts: string[] = [];

  if (streetNumber) parts.push(slugify(streetNumber));
  if (streetName) parts.push(slugify(streetName));
  if (city) parts.push(slugify(city));
  if (state) parts.push(slugify(state));
  if (zip) parts.push(slugify(zip));

  return parts.join('-');
}

/**
 * Generate full homeowner property URL
 */
export function getHomeownerPropertyUrl(property: {
  address?: {
    streetNumber?: string | null;
    streetName?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
}): string {
  const slug = getHomeownerPropertySlug(property);
  return `/homeowner/${slug}`;
}

/**
 * Detect if the slug is an MLS number (e.g. X9308540, C1234567).
 * MLS numbers are typically alphanumeric, 6+ chars, no hyphens.
 */
export function isSlugMlsNumber(slug: string): boolean {
  if (!slug || slug.length < 6) return false;
  return /^[A-Za-z0-9]+$/.test(slug) && !slug.includes("-");
}

/**
 * Parse homeowner property slug back to address components
 */
export function parseHomeownerPropertySlug(slug: string): {
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  zip?: string;
} | null {
  const parts = slug.split('-');
  
  // Expected format: {streetNumber}-{streetName}-{city}-{state}-{zip}
  // Minimum: streetNumber and streetName (2 parts)
  // Maximum: all 5 parts
  
  if (parts.length < 2) {
    return null;
  }

  // Try to identify parts
  // Street number is usually just numbers (first part)
  // Street name could be multiple words
  // City could be multiple words
  // State is usually 2 letters (second to last)
  // Zip is usually 5 digits (last part)

  const result: {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    zip?: string;
  } = {};

  // Last part is likely zip (5 digits)
  const lastPart = parts[parts.length - 1];
  if (/^\d{5}$/.test(lastPart)) {
    result.zip = lastPart;
    parts.pop();
  }

  // Second to last part is likely state (2 letters)
  if (parts.length > 0) {
    const secondLastPart = parts[parts.length - 1];
    if (/^[a-z]{2}$/i.test(secondLastPart)) {
      result.state = secondLastPart.toUpperCase();
      parts.pop();
    }
  }

  // First part is street number
  if (parts.length > 0) {
    result.streetNumber = parts[0];
    parts.shift();
  }

  // Remaining parts could be street name and city
  // We'll need to make an educated guess
  // For now, assume everything between street number and state/zip is street name + city
  if (parts.length > 0) {
    // Try to split: usually street name comes before city
    // This is a heuristic - might need refinement based on actual data
    const remaining = parts.join('-');
    
    // For simplicity, we'll return the remaining parts as street name
    // and let the caller handle city separately if needed
    result.streetName = remaining;
  }

  return result;
}
