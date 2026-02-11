# Single Property Listing API Structure

This document describes the comprehensive data structure for single property listing API responses from Repliers.

## Overview

The single property listing endpoint (`/listings/{mlsNumber}`) returns a complete property listing with all available details, including:

- Basic listing information (price, status, dates)
- Full address and location data
- Detailed property specifications
- Images and media
- Agent and office information
- Market estimates and comparables
- Image insights and quality metrics
- Property history
- Open house schedules
- And much more

## Type Definitions

### Main Response Type

**`SinglePropertyListingResponse`** - The complete API response structure

Located in: `src/lib/api/repliers/types/single-listing.ts`

### Usage

```typescript
import { getRawListingDetails } from '@/lib/api/repliers';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';

// Fetch complete listing data
const listing = await getRawListingDetails('ACT7353557');

if (listing) {
  // Access all fields
  console.log(listing.mlsNumber);
  console.log(listing.estimate?.value);
  console.log(listing.imageInsights?.summary);
  console.log(listing.comparables);
  // ... etc
}
```

## Key Fields

### Core Fields
- `mlsNumber` - MLS listing number
- `resource` - Resource identifier
- `status` - Listing status (e.g., "A" for Active)
- `class` - Property class (e.g., "CondoProperty")
- `type` - Listing type ("Sale" or "Lease")
- `listPrice` - Current listing price
- `originalPrice` - Original listing price
- `soldPrice` - Sold price (if sold)
- `soldDate` - Date sold (if sold)
- `listDate` - Date listed
- `daysOnMarket` - Days on market
- `simpleDaysOnMarket` - Simplified days on market
- `standardStatus` - Standard status string

### Address & Location
- `address` - Complete address object with all address components
- `map` - Latitude, longitude, and point coordinates
- `permissions` - Display permissions for address/listing

### Property Details
- `details` - Comprehensive property details including:
  - Bedrooms, bathrooms, square footage
  - Property type, style, year built
  - Heating, cooling, appliances
  - Features and amenities
  - And 80+ additional detail fields

### Lot Information
- `lot` - Lot details including:
  - Size (acres, square feet)
  - Dimensions
  - Legal description
  - Features

### Condominium Information
- `condominium` - Condo-specific details including:
  - Condo corporation
  - Fees (maintenance, parking, etc.)
  - Parking type
  - Amenities
  - Locker information

### Media
- `images` - Array of image URLs
- `photoCount` - Total number of photos
- `imageInsights` - AI-powered image analysis including:
  - Image classification (room type)
  - Quality scores (qualitative and quantitative)
  - Overall quality metrics

### Market Data
- `estimate` - Property value estimate including:
  - High/low estimates
  - Confidence score
  - Historical value trends
  - Current estimated value

- `comparables` - Comparable properties with:
  - Full property details
  - Distance from listing
  - Sale information

### Agent & Office
- `agents` - Array of listing agents with:
  - Contact information
  - Brokerage details
  - Photos

- `office` - Listing office information

### Additional Data
- `rooms` - Detailed room information
- `openHouse` - Open house schedules
- `taxes` - Tax information
- `nearby` - Nearby amenities
- `history` - Listing history/price changes
- `timestamps` - Various timestamp fields

## API Functions

### `getListingDetails(mlsNumber: string)`
Returns a transformed `PropertyListing` object suitable for display in the application.

```typescript
const listing = await RepliersAPI.listings.getDetails('ACT7353557');
```

### `getRawListingDetails(mlsNumber: string)`
Returns the complete, untransformed API response matching the full structure.

```typescript
const rawListing = await RepliersAPI.listings.getRawDetails('ACT7353557');
```

## Type Compatibility

The `ApiListing` interface in `src/lib/types/index.ts` has been updated to include all fields from the single listing response. This ensures backward compatibility while supporting the full data structure.

Fields are optional to support both:
- List view responses (may have fewer fields)
- Detail view responses (complete structure)

## Example Response Structure

See the provided API response example in the project documentation for a complete example of all available fields.

## Notes

- All fields that can be `null` in the API are typed as `| null`
- Arrays may be empty but are always present
- Nested objects follow the same nullability rules
- The `[key: string]: unknown` index signature on `ApiListing` allows for future API additions

