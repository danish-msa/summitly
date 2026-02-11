import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Import filter detection utilities
import { 
  parseBedroomSlug, 
  parseBathroomSlug, 
  parsePriceRangeSlug, 
  parseSqftSlug 
} from '@/components/Properties/PropertyBasePage/utils'

// Known city slugs for pre-con routes
const preConCitySlugs = [
  'toronto', 'brampton', 'hamilton', 'calgary', 'mississauga', 
  'oakville', 'milton', 'edmonton'
];

// Known status slugs
const knownStatusSlugs = ['selling', 'coming-soon', 'sold-out'];

// Known property type slugs
const knownPropertyTypeSlugs = ['condos', 'houses', 'lofts', 'master-planned-communities', 'multi-family', 'offices'];

// Known sub-property type slugs
const knownSubPropertyTypeSlugs = [
  'high-rise-condos',
  'mid-rise-condos',
  'low-rise-condos',
  'link-houses',
  'townhouse-houses',
  'semi-detached-houses',
  'detached-houses',
];

// Helper to check if a string is a year (4-digit number)
function isYear(str: string): boolean {
  const yearRegex = /^\d{4}$/;
  if (!yearRegex.test(str)) return false;
  const year = parseInt(str, 10);
  return year >= 2020 && year <= 2100;
}

// Helper to check if slug is a sub-property type
function isSubPropertyType(slug: string): boolean {
  return knownSubPropertyTypeSlugs.includes(slug.toLowerCase());
}

// Check if a segment is a filter pattern
function isFilterPattern(segment: string): boolean {
  const lowerSegment = segment.toLowerCase();
  
  // Check all filter types
  if (parseBedroomSlug(segment)) return true;
  if (parseBathroomSlug(segment)) return true;
  if (parsePriceRangeSlug(segment)) return true;
  if (parseSqftSlug(segment)) return true;
  if (knownStatusSlugs.includes(lowerSegment)) return true;
  if (knownPropertyTypeSlugs.includes(lowerSegment)) return true;
  if (isSubPropertyType(segment)) return true;
  if (isYear(segment)) return true;
  
  return false;
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Handle pre-con routes: detect filter patterns and rewrite to catch-all format
    if (pathname.startsWith('/pre-con/')) {
      const segments = pathname.replace('/pre-con/', '').split('/').filter(Boolean);
      
      // If we have exactly 2 segments, check if it's a city + filter pattern
      if (segments.length === 2) {
        const [firstSegment, secondSegment] = segments;
        const isKnownCity = preConCitySlugs.includes(firstSegment.toLowerCase());
        const isFilter = isFilterPattern(secondSegment);
        
        // BULLETPROOF SOLUTION: Rewrite filter URLs to a format that won't match [slug]/[unitId]
        // We'll rewrite /pre-con/city/filter to /pre-con/_filter/city/filter internally
        // The catch-all route will handle _filter as a special prefix and process it correctly
        if (isKnownCity && isFilter) {
          console.log('[Middleware] Detected city + filter pattern, rewriting URL:', {
            original: pathname,
            city: firstSegment,
            filter: secondSegment,
          });
          
          // Rewrite internally to /pre-con/_filter/city/filter
          // This has 3 segments, so it won't match [slug]/[unitId] (which only matches 2 segments)
          // The catch-all route [...segments] will handle it
          const newPath = `/pre-con/_filter/${firstSegment}/${secondSegment}`;
          const url = req.nextUrl.clone();
          url.pathname = newPath;
          return NextResponse.rewrite(url);
        }
      }
    }

    // For all other routes, continue normally
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pre-con/:path*',
  ],
}
