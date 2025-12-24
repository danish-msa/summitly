import Item from '@/components/Item/Item';
import PropertyBasePage from '@/components/Properties/PropertyBasePage/PropertyBasePage';
import { parseUrlSegments } from '@/lib/utils/urlSegmentParser';
import { parseUrlSegments as parseLocationSegments } from '@/lib/utils/locationDetection';
import React from 'react'

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Check if the ID looks like a property ID (MLS number format)
 * Property IDs typically contain numbers and letters (e.g., "C1234567", "ACT7353557")
 * City names are typically just lowercase letters with hyphens (e.g., "toronto", "vancouver")
 */
function isPropertyId(id: string): boolean {
  // Property IDs usually contain numbers or have specific formats
  // If it's all lowercase letters/hyphens and no numbers, it's likely a city name
  const hasNumbers = /\d/.test(id);
  const isAllLowercaseLetters = /^[a-z-]+$/.test(id.toLowerCase());
  
  // If it has numbers, it's likely a property ID
  if (hasNumbers) {
    return true;
  }
  
  // If it's all lowercase letters/hyphens and looks like a city name, it's not a property ID
  // Known city names should be handled by the catch-all route
  if (isAllLowercaseLetters && id.length >= 3) {
    return false;
  }
  
  // Default: assume it's a property ID if it's short and contains uppercase or special chars
  return id.length < 20 && !isAllLowercaseLetters;
}

export default async function RentItemPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  // Check if this looks like a property ID or a city name
  if (!isPropertyId(id)) {
    // This is likely a city name - handle it as a city page
    // Parse it as if it were a segment in the catch-all route
    const parsed = parseUrlSegments([id]);
    
    // Determine location type
    let actualLocationType = parsed.locationType;
    if (parsed.locationName) {
      const locationInfo = await parseLocationSegments([id], '');
      actualLocationType = locationInfo.locationType;
    }
    
    // Build combined slug for PropertyBasePage
    const combinedSlug = parsed.filters.length > 0 
      ? parsed.filters.join('-')
      : parsed.locationName 
        ? parsed.locationName.toLowerCase().replace(/\s+/g, '-')
        : parsed.city.toLowerCase().replace(/\s+/g, '-');
    
    // Render as a city page
    return (
      <PropertyBasePage
        slug={combinedSlug}
        pageType={parsed.pageType}
        citySlug={id}
        listingType="rent"
        locationType={actualLocationType}
        locationName={parsed.locationName}
      />
    );
  }
  
  // Item.tsx now handles both buy and rent properties
  // This route is kept for backward compatibility with old /rent/[id] URLs
  return (
    <Item />
  );
}

