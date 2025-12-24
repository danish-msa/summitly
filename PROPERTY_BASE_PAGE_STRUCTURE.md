# Property Base Page Structure

This document describes the new property base page template system for creating dynamic property listing pages.

## Overview

The `PropertyBasePage` component provides a reusable template for creating property listing pages with various filters (property type, price range, bedrooms) and combinations thereof.

## Component Structure

```
src/components/Properties/PropertyBasePage/
├── components/
│   ├── HeroSection.tsx          # Hero section with title and alerts
│   ├── LoadingState.tsx         # Loading spinner
│   ├── MapView.tsx              # Google Maps integration
│   ├── PropertyListings.tsx     # Property grid/list display
│   └── ViewModeToggle.tsx       # Toggle between list/mixed/map views
├── hooks.ts                     # Data fetching and filtering logic
├── types.ts                     # TypeScript types
├── utils.ts                     # Utility functions for parsing slugs
├── PropertyBasePage.tsx         # Main component
└── index.ts                     # Exports
```

## Route Structure

All routes are under `/properties/[citySlug]/...`:

### 1. Property Type Pages
- **Route**: `/properties/[citySlug]/[propertyType]`
- **Examples**:
  - `/properties/toronto-real-estate/homes`
  - `/properties/toronto-real-estate/condos`
  - `/properties/toronto-real-estate/townhouses`
  - `/properties/toronto-real-estate/detached-homes`
  - `/properties/toronto-real-estate/semi-detached-homes`
  - `/properties/toronto-real-estate/lofts`

### 2. Price Range Pages
- **Route**: `/properties/[citySlug]/[priceRange]`
- **Examples**:
  - `/properties/toronto-real-estate/under-400000`
  - `/properties/toronto-real-estate/under-500000`
  - `/properties/toronto-real-estate/under-700000`
  - `/properties/toronto-real-estate/under-1000000`
  - `/properties/toronto-real-estate/over-1000000`
  - `/properties/toronto-real-estate/over-2000000` (Luxury)
  - `/properties/toronto-real-estate/400000-600000` (Range)

### 3. Bedroom Pages
- **Route**: `/properties/[citySlug]/[bedrooms]`
- **Examples**:
  - `/properties/toronto-real-estate/1-bedroom`
  - `/properties/toronto-real-estate/2-bedroom`
  - `/properties/toronto-real-estate/3-bedroom`
  - `/properties/toronto-real-estate/4-bedroom`
  - `/properties/toronto-real-estate/5-plus-bedroom`

### 4. Combined Pages

#### Property Type + Price Range
- **Route**: `/properties/[citySlug]/[propertyType]/[priceRange]`
- **Examples**:
  - `/properties/toronto-real-estate/condos/under-500000`
  - `/properties/toronto-real-estate/townhouses/under-800000`
  - `/properties/toronto-real-estate/detached-homes/under-1200000`
  - `/properties/toronto-real-estate/condos/600000-800000`

#### Property Type + Bedrooms
- **Route**: `/properties/[citySlug]/[propertyType]/[bedrooms]`
- **Examples**:
  - `/properties/toronto-real-estate/condos/2-bedroom`
  - `/properties/toronto-real-estate/houses/3-bedroom`
  - `/properties/toronto-real-estate/condos/1-bedroom`

#### Price Range + Bedrooms
- **Route**: `/properties/[citySlug]/[priceRange]/[bedrooms]`
- **Examples**:
  - `/properties/toronto-real-estate/under-800000/3-bedroom`
  - `/properties/toronto-real-estate/600000-800000/2-bedroom`

#### Property Type + Price Range + Bedrooms
- **Route**: `/properties/[citySlug]/[propertyType]/[priceRange]/[bedrooms]`
- **Examples**:
  - `/properties/toronto-real-estate/condos/under-500000/2-bedroom`
  - `/properties/toronto-real-estate/houses/under-800000/3-bedroom`

## Supported Property Types

- `homes` / `houses` → House
- `condos` / `condo` → Condo
- `lofts` / `loft` → Loft
- `semi-detached` / `semi-detached-homes` → Semi-Detached
- `detached` / `detached-homes` → Detached
- `townhouses` / `townhouse` / `townhomes` → Townhouse

## Price Range Formats

### Under Format
- `under-400000` → "Under $400,000"
- `under-500000` → "Under $500,000"
- `under-700000` → "Under $700,000"
- `under-1000000` → "Under $1,000,000"

### Over Format
- `over-1000000` → "Over $1,000,000"
- `over-2000000` → "Luxury Homes Over $2,000,000" (special label)

### Range Format
- `400000-600000` → "$400,000-$600,000"
- `600000-800000` → "$600,000-$800,000"
- `1000000-1500000` → "$1,000,000-$1,500,000"

## Bedroom Formats

- `1-bedroom` → "1 Bedroom"
- `2-bedroom` → "2 Bedroom"
- `3-bedroom` → "3 Bedroom"
- `4-bedroom` → "4 Bedroom"
- `5-plus-bedroom` or `5-bedroom` → "5+ Bedroom"

## City Slug Format

The `citySlug` parameter should match your existing city page structure:
- `toronto-real-estate`
- `vancouver-real-estate`
- `calgary-real-estate`
- etc.

The component automatically removes the `-real-estate` suffix when querying the API.

## Features

1. **Dynamic Filtering**: Automatically filters properties based on URL parameters
2. **Global Filters**: Users can further refine results using the global filter component
3. **Map Integration**: View properties on an interactive map
4. **Multiple View Modes**: List, Mixed (list + map), and Map-only views
5. **SEO Optimized**: Automatic metadata generation for each page type
6. **Property Alerts**: Users can set up alerts for new properties matching their criteria

## Usage Example

```tsx
import PropertyBasePage from '@/components/Properties/PropertyBasePage/PropertyBasePage';

export default function CondosUnder500KPage({ params }: { params: { citySlug: string } }) {
  return (
    <PropertyBasePage
      slug="condos-under-500000"
      pageType="propertyType-price"
      citySlug={params.citySlug}
    />
  );
}
```

## API Integration

The component uses the Repliers API via `RepliersAPI.listings.getFiltered()` with the following parameters:

- `city`: City name (extracted from citySlug)
- `propertyType`: Property type (House, Condo, etc.)
- `minPrice` / `maxPrice`: Price range filters
- `minBedrooms` / `maxBedrooms`: Bedroom filters
- `status`: 'A' (Active listings)
- `resultsPerPage`: 100

## Future Enhancements

The structure is designed to be easily extensible for:
- Additional property types
- More price ranges
- Additional filters (bathrooms, square footage, etc.)
- Custom page content (hero images, descriptions, FAQs)
- Analytics tracking

