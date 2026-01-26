# How Repliers API Makes Calls for Map Functionality

## Overview
This document explains how the Repliers API is used to fetch property data for the map components in Summitly.

## Call Flow Architecture

```
Map Component (MapboxPropertyMap/GooglePropertyMap)
    ↓ (receives properties as props)
Listings Component (src/components/MapSearch/Listings.tsx)
    ↓ (calls getListings())
Legacy API Wrapper (src/lib/api/properties.ts)
    ↓ (re-exports RepliersAPI.listings.getFiltered)
Repliers API Service (src/lib/api/repliers/services/listings.ts)
    ↓ (calls repliersClient.request())
Repliers API Client (src/lib/api/repliers/client.ts)
    ↓ (makes HTTP request)
Repliers API Server (https://api.repliers.io)
```

## Detailed Flow

### 1. Map Components Receive Properties
**Files:**
- `src/components/MapSearch/MapboxPropertyMap.tsx`
- `src/components/MapSearch/GooglePropertyMap.tsx`

Both map components receive properties as props:
```typescript
interface MapboxPropertyMapProps {
  properties: PropertyListing[];
  // ... other props
}
```

**Note:** The map components themselves do NOT make API calls. They only display the properties they receive.

### 2. Listings Component Fetches Data
**File:** `src/components/MapSearch/Listings.tsx`

The `Listings` component is responsible for fetching property data:

```typescript
import { getListings } from '@/lib/api/properties';

// Inside useEffect:
const data = await getListings(params);
```

**Parameters sent to API:**
- `resultsPerPage`: Number of results per page
- `pageNum`: Current page number
- `status`: "A" (Active listings)
- `minPrice`, `maxPrice`: Price filters
- `minBedrooms`, `minBaths`: Bedroom/bathroom filters
- `propertyType`: Property type filter
- `community`: Community/neighborhood filter
- `listingType`: Sale or Lease

### 3. Legacy API Wrapper
**File:** `src/lib/api/properties.ts`

This is a backward compatibility layer that re-exports the Repliers API:

```typescript
export const getListings = RepliersAPI.listings.getFiltered;
```

### 4. Repliers Listings Service
**File:** `src/lib/api/repliers/services/listings.ts`

The `getListings()` function:
- Transforms parameters
- Calls `repliersClient.request()`
- Transforms the API response to `PropertyListing[]` format

```typescript
export async function getListings(params: ListingsParams): Promise<ListingsResult> {
  const response = await repliersClient.request<ListingsResponse>({
    endpoint: '/listings',
    params,
    authMethod: 'header',
    cache: true,
    cacheDuration: API_CONFIG.cacheDurations.listings, // 2 minutes
    priority: 'high',
  });
  
  // Transform and return
  return {
    listings: transformedListings,
    count: response.data.count,
    numPages: response.data.numPages,
  };
}
```

### 5. Repliers API Client
**File:** `src/lib/api/repliers/client.ts`

The `repliersClient` is a singleton instance that handles:

#### Request Processing:
1. **Cache Check**: Checks if request is cached (2 minutes for listings)
2. **Queue Management**: Adds request to priority queue
3. **Rate Limiting**: Enforces 60 requests per minute limit
4. **Request Execution**: Makes HTTP request to `https://api.repliers.io`

#### HTTP Request Details:
```typescript
// Base URL
const API_CONFIG = {
  baseUrl: 'https://api.repliers.io',
  apiKey: process.env.NEXT_PUBLIC_REPLIERS_API_KEY,
};

// Request format
GET https://api.repliers.io/listings?status=A&resultsPerPage=20&...

// Headers
{
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'REPLIERS-API-KEY': '<api-key>'
}
```

#### Features:
- **Caching**: 2-minute cache for listings (configurable)
- **Retry Logic**: Automatic retry with exponential backoff (3 max retries)
- **Rate Limiting**: 60 requests per minute
- **Request Queueing**: Priority-based queue (high/normal/low)
- **Error Handling**: Comprehensive error handling with retryable errors
- **Logging**: All requests logged to console with details

#### Console Logging:
Every API request is logged:
```
📡 [Repliers API Request] {
  method: 'GET',
  endpoint: '/listings',
  url: 'https://api.repliers.io/listings?...',
  authMethod: 'header',
  params: { status: 'A', resultsPerPage: 20, ... },
  priority: 'high',
  cached: true
}

✅ [Repliers API Response] {
  endpoint: '/listings',
  status: 200,
  responseTime: '245ms',
  resultCount: 20,
  cached: false
}
```

## Map-Specific API Calls

### When Map Bounds Change
**File:** `src/components/Listings/Listings.tsx`

When the user pans/zooms the map, the `loadPropertiesByBounds()` function is called:

```typescript
const loadPropertiesByBounds = useCallback(async (bounds) => {
  const params = {
    status: "A",
    resultsPerPage: 500, // More results for map view
    // ... filters
  };
  
  const data = await getListings(params);
  // Update properties displayed on map
}, [filters]);
```

**Note:** Currently, map bounds are NOT sent to the API. The API returns all properties matching filters, and the map component filters them client-side based on visible bounds.

### Nearby Listings (Property Detail Page)
**File:** `src/components/ui/map.tsx`

For property detail pages, nearby listings are fetched:

```typescript
const fetchNearbyListings = useCallback(async (centerLat, centerLng, currentZoom) => {
  const params = {
    resultsPerPage: maxResults, // 30-100 based on zoom
    status: 'A',
  };
  
  const result = await getListings(params);
  
  // Filter by distance client-side
  const filtered = result.listings.filter(listing => {
    const distance = calculateDistance(centerLat, centerLng, ...);
    return distance < radius;
  });
}, [zoom]);
```

## API Configuration

**File:** `src/lib/api/repliers/client.ts`

```typescript
const API_CONFIG = {
  baseUrl: 'https://api.repliers.io',
  apiKey: process.env.NEXT_PUBLIC_REPLIERS_API_KEY,
  
  // Performance settings
  maxConcurrentRequests: 5,
  rateLimitPerMinute: 60,
  defaultTimeout: 30000, // 30 seconds
  defaultMaxRetries: 3,
  
  // Cache durations
  cacheDurations: {
    listings: 2 * 60 * 1000, // 2 minutes
    // ...
  },
};
```

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_REPLIERS_API_KEY=your-api-key-here
```

## Key Points

1. **Map components are display-only**: They don't make API calls, only render properties
2. **Listings component fetches data**: The parent component (`Listings.tsx`) handles all API calls
3. **Caching is enabled**: Listings are cached for 2 minutes to reduce API calls
4. **Rate limiting**: Maximum 60 requests per minute
5. **Automatic retries**: Failed requests are retried up to 3 times
6. **Request logging**: All API calls are logged to console for debugging
7. **Client-side filtering**: Map bounds filtering happens client-side, not via API

## Debugging

### View API Stats
```typescript
import { RepliersAPI } from '@/lib/api/repliers';

const stats = RepliersAPI.client.getStats();
console.log(stats);
// {
//   totalRequests: 150,
//   successfulRequests: 148,
//   failedRequests: 2,
//   cachedRequests: 45,
//   cacheSize: 12,
//   queueLength: 0,
//   rateLimitUsage: "12/60"
// }
```

### Clear Cache
```typescript
RepliersAPI.client.clearCache();
```

### Monitor Requests
All requests are automatically logged to the browser console with:
- Request method and endpoint
- Parameters sent
- Response status and time
- Cache hit/miss status

## Example API Request

When the map loads, a request like this is made:

```
GET https://api.repliers.io/listings?status=A&resultsPerPage=20&pageNum=1
Headers:
  REPLIERS-API-KEY: <your-key>
  Accept: application/json
  Content-Type: application/json
```

Response:
```json
{
  "listings": [...],
  "count": 1250,
  "numPages": 63
}
```

The response is then transformed to `PropertyListing[]` format and passed to the map component.
