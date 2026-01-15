# Buy / Rent / Pre-Con Routing Structure

This document describes the routing structure for `/buy/`, `/rent/`, and `/pre-con/` pages.

## Overview

All three route types use the same catch-all pattern: `[...segments]` which allows for flexible URL structures like:
- `/buy/toronto/condos`
- `/rent/toronto/condos`
- `/pre-con/toronto/condos`

## Route Files

### Buy Pages
- **File**: `src/app/buy/[...segments]/page.tsx`
- **Pattern**: `/buy/[city]/[filters...]`
- **Component**: `PropertyBasePage` with `listingType="sell"`

### Rent Pages
- **File**: `src/app/rent/[...segments]/page.tsx`
- **Pattern**: `/rent/[city]/[filters...]`
- **Component**: `PropertyBasePage` with `listingType="rent"`

### Pre-Con Pages
- **File**: `src/app/pre-con/[...segments]/page.tsx`
- **Pattern**: `/pre-con/[city]/[filters...]` or `/pre-con/[propertyType]` or `/pre-con/[status]`
- **Component**: `PreConstructionBasePage`

## URL Structure

### Buy & Rent Pages

Both `/buy/` and `/rent/` follow the same structure:

#### City Only
- `/buy/toronto` → City page (all properties in Toronto)
- `/rent/toronto` → City page (all rentals in Toronto)

#### City + Property Type
- `/buy/toronto/condos` → Condos for sale in Toronto
- `/buy/toronto/houses` → Houses for sale in Toronto
- `/rent/toronto/condos` → Condos for rent in Toronto
- `/rent/toronto/houses` → Houses for rent in Toronto

#### City + Neighbourhood
- `/buy/toronto/downtown` → Properties in Downtown Toronto
- `/rent/toronto/downtown` → Rentals in Downtown Toronto

#### City + Neighbourhood + Property Type
- `/buy/toronto/downtown/condos` → Condos in Downtown Toronto
- `/rent/toronto/downtown/condos` → Condos for rent in Downtown Toronto

#### City + Filters
- `/buy/toronto/2-bedroom` → 2-bedroom properties in Toronto
- `/buy/toronto/under-500000` → Properties under $500K in Toronto
- `/buy/toronto/condos/2-bedroom` → 2-bedroom condos in Toronto
- `/buy/toronto/condos/under-500000` → Condos under $500K in Toronto

### Pre-Con Pages

Pre-con pages have additional route types:

#### Property Type Only
- `/pre-con/condos` → All condos (pre-construction)
- `/pre-con/houses` → All houses (pre-construction)
- `/pre-con/high-rise-condos` → High-rise condos

#### Status Only
- `/pre-con/selling` → Selling projects
- `/pre-con/coming-soon` → Coming soon projects
- `/pre-con/sold-out` → Sold out projects

#### Completion Year
- `/pre-con/2025` → Projects completing in 2025
- `/pre-con/2026` → Projects completing in 2026

#### City + Property Type
- `/pre-con/toronto/condos` → Condos in Toronto
- `/pre-con/toronto/houses` → Houses in Toronto

#### City + Status
- `/pre-con/toronto/selling` → Selling projects in Toronto

#### City + Completion Year
- `/pre-con/toronto/2025` → Projects in Toronto completing in 2025

## URL Parsing

All routes use the `parseUrlSegments` utility from `src/lib/utils/urlSegmentParser.ts`:

```typescript
const parsed = parseUrlSegments(segments);
// Returns:
// {
//   city: string;
//   locationType: 'city' | 'neighbourhood' | 'intersection' | null;
//   locationName: string | null;
//   filters: string[];
//   pageType: PropertyPageType;
//   combinedSlug: string;
// }
```

## Supported Filters

### Property Types
- `condos`, `condo`
- `houses`, `house`
- `townhouses`, `townhouse`, `townhomes`
- `lofts`, `loft`
- `semi-detached`, `semi-detached-homes`
- `detached`, `detached-homes`

### Price Ranges
- `under-400000`, `under-500000`, `under-700000`, `under-1000000`
- `over-1000000`, `over-2000000`
- `400000-600000`, `600000-800000`, `1000000-1500000`

### Bedrooms
- `1-bedroom`, `2-bedroom`, `3-bedroom`, `4-bedroom`, `5-bedroom`, `5-plus-bedroom`

### Bathrooms
- `1-bathroom`, `2-bathroom`, `3-bathroom`, `4-bathroom`, `5-bathroom`, `5-plus-bathroom`

### Square Footage
- `under-600-sqft`, `over-1000-sqft`, `1000-1500-sqft`

### Features
- `swimming-pool`, `2-car-garage`, `balcony`, `city-view`, `fireplace`, etc.

## Pre-Con Specific Routes

### Property Types
- `condos`, `houses`, `lofts`, `master-planned-communities`, `multi-family`, `offices`

### Sub-Property Types
- `high-rise-condos`, `mid-rise-condos`, `low-rise-condos`
- `link-houses`, `townhouse-houses`, `semi-detached-houses`, `detached-houses`

### Status
- `selling`, `coming-soon`, `sold-out`

### Completion Year
- Any 4-digit year: `2025`, `2026`, `2027`, etc.

## Examples

### Buy Pages
- `/buy/toronto` → All properties for sale in Toronto
- `/buy/toronto/condos` → Condos for sale in Toronto
- `/buy/toronto/downtown/condos` → Condos in Downtown Toronto
- `/buy/toronto/condos/2-bedroom` → 2-bedroom condos in Toronto
- `/buy/toronto/condos/under-500000/2-bedroom` → 2-bedroom condos under $500K in Toronto

### Rent Pages
- `/rent/toronto` → All rentals in Toronto
- `/rent/toronto/condos` → Condos for rent in Toronto
- `/rent/toronto/downtown/condos` → Condos for rent in Downtown Toronto
- `/rent/toronto/condos/2-bedroom` → 2-bedroom condos for rent in Toronto

### Pre-Con Pages
- `/pre-con/toronto` → All pre-construction projects in Toronto
- `/pre-con/condos` → All condos (pre-construction)
- `/pre-con/toronto/condos` → Condos in Toronto (pre-construction)
- `/pre-con/high-rise-condos` → High-rise condos (pre-construction)
- `/pre-con/selling` → All selling projects
- `/pre-con/toronto/selling` → Selling projects in Toronto
- `/pre-con/2025` → Projects completing in 2025
- `/pre-con/toronto/2025` → Projects in Toronto completing in 2025

## Implementation Details

### Buy & Rent
- Use `PropertyBasePage` component
- Parse segments with `parseUrlSegments()`
- Determine location type with `parseLocationSegments()`
- Pass `listingType="sell"` or `listingType="rent"`

### Pre-Con
- Use `PreConstructionBasePage` component
- Has custom logic to determine page type:
  - Checks if first segment is a known city
  - Checks if segment is a property type, status, or completion year
  - Falls back to project lookup if not recognized
- Supports city + property type combinations

## Key Differences

1. **Buy/Rent**: Always require a city as first segment (or use `/properties/` structure)
2. **Pre-Con**: Can work with or without city:
   - `/pre-con/condos` (no city) → All condos
   - `/pre-con/toronto/condos` (with city) → Condos in Toronto

## Status

✅ **Functional**: All three routing structures are implemented and working.

## Related Files

- `src/app/buy/[...segments]/page.tsx` - Buy page route
- `src/app/rent/[...segments]/page.tsx` - Rent page route
- `src/app/pre-con/[...segments]/page.tsx` - Pre-con page route
- `src/lib/utils/urlSegmentParser.ts` - URL parsing utility
- `src/lib/utils/locationDetection.ts` - Location type detection
- `src/components/Properties/PropertyBasePage/` - Buy/Rent page component
- `src/components/PreCon/PreConstructionBasePage/` - Pre-con page component
