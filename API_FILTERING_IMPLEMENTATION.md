# API Filtering Implementation Summary

This document outlines which filters are handled server-side (via Repliers API) vs client-side, and any known limitations.

## ✅ Server-Side API Filters (Applied via Repliers API)

These filters are sent directly to the Repliers API and filtered server-side:

### Basic Filters
- ✅ **City** - `city` parameter
- ✅ **Property Type** - `propertyType` parameter
- ✅ **Price Range** - `minPrice`, `maxPrice` parameters
- ✅ **Bedrooms** - `minBedrooms`, `maxBedrooms` parameters
- ✅ **Bathrooms** - `minBathrooms`, `maxBathrooms` parameters
- ✅ **Square Footage** - `minSqft`, `maxSqft` parameters
- ✅ **Year Built** - `minYearBuilt`, `maxYearBuilt` parameters
- ✅ **List Date** - `minListDate`, `maxListDate` parameters (for status/time-based filters)
- ✅ **Status** - `status` parameter (defaults to 'A' for active)

## ⚠️ Client-Side Only Filters

These filters are applied after fetching data from the API (client-side filtering):

### Lot Size
- **Reason**: API doesn't support lot size filtering directly
- **Implementation**: Filters by `lot.acres` or `lot.squareFeet` after fetching
- **Note**: May need to fetch more results than needed and filter client-side

### Year Built (Special Types)
- **Renovated Homes**: No API parameter - relies on description/keyword matching
- **Mid-Century Homes**: Calculated from year built (1945-1975)
- **Heritage Homes**: Calculated from year built (50+ years old)

### Ownership/Fee Structure
- **Freehold**: No direct API parameter - relies on property type matching
- **Low Maintenance Fees**: Filters by `condominium.fees.maintenance` after fetching
- **No Amenities**: Filters by `condominium.amenities` array length

### Feature-Based Filters (40+ features)
- **Reason**: API doesn't support feature-based filtering directly
- **Implementation**: Searches in:
  - `details.description`
  - `lot.features`
  - `details.garage` (for garage features)
  - `details.numGarageSpaces` (for numeric garage features)
- **Note**: Uses keyword matching, may have false positives/negatives

### Status Filters (Special Types)
- **Price Reduced**: Checks `originalPrice > listPrice` (client-side)
- **Back-on-Market**: Checks `lastStatus` for "sold" or "terminated" (client-side)
- **Open Houses**: Checks `openHouse` array length (client-side)

## 📊 Data Fields Used

### From API Response
- `details.sqft` - Square footage (string or number)
- `details.yearBuilt` - Year built (string, may be age range like "0-5")
- `details.garage` - Garage description (string)
- `details.numGarageSpaces` - Number of garage spaces (number)
- `lot.acres` - Lot size in acres (number)
- `lot.squareFeet` - Lot size in square feet (number)
- `lot.features` - Lot features (string)
- `condominium.fees.maintenance` - Maintenance fees (number)
- `condominium.amenities` - Amenities array
- `originalPrice` - Original listing price (number)
- `listDate` - Listing date (string, ISO format)
- `lastStatus` - Last status (string)
- `openHouse` - Open house array

## 🔍 Filtering Logic

### Square Footage
1. **API Level**: Sends `minSqft`/`maxSqft` to API
2. **Client Level**: Additional filtering for exact matches
3. **Handles**: String format (with commas), number format, ranges

### Year Built
1. **API Level**: Sends `minYearBuilt`/`maxYearBuilt` calculated from age
2. **Client Level**: 
   - Handles age ranges (e.g., "0-5")
   - Calculates years old from year built
   - Special types (mid-century, heritage)

### Features
1. **Client-Side Only**: Keyword matching in description/features
2. **Garage Features**: Uses both `garage` string and `numGarageSpaces` number
3. **Fallback**: If exact match fails, searches in description

## ⚠️ Known Limitations

1. **Square Footage**:
   - Some MLSs provide sqft as ranges (e.g., "1500-2000")
   - API returns listings where range overlaps with criteria
   - Many listings may have `null` sqft values

2. **Year Built**:
   - Some MLSs use age ranges instead of exact years
   - May need to use `yearBuilt` parameter with age range string (e.g., "0-5")
   - Currently using calculated year built from age

3. **Features**:
   - Relies on keyword matching in descriptions
   - May miss features not mentioned in description
   - May have false positives if keywords appear in different context

4. **Lot Size**:
   - Client-side only, may need to fetch more results
   - Some listings may have missing lot size data

5. **Ownership/Fees**:
   - Only works for condos (has condominium data)
   - Freehold detection relies on property type matching

## 🚀 Recommendations

1. **For Better Performance**:
   - Increase `resultsPerPage` when using client-side filters
   - Consider pagination for large result sets
   - Cache results when possible

2. **For Better Accuracy**:
   - Enhance feature detection with more specific fields
   - Add validation for sqft ranges
   - Consider using API's `yearBuilt` parameter with age ranges for specific MLSs

3. **For Missing Data**:
   - Handle null values gracefully
   - Show "data not available" for listings with missing fields
   - Consider fetching full listing details for feature verification

## 📝 Testing Checklist

- [ ] Test sqft filtering with various formats (string, number, ranges)
- [ ] Test year built with age ranges vs exact years
- [ ] Test feature filtering with various keywords
- [ ] Test lot size filtering (acres vs sqft)
- [ ] Test ownership/fee filtering for condos
- [ ] Test status filters (new listings, price reduced, etc.)
- [ ] Test combinations of filters
- [ ] Verify API parameters are being sent correctly
- [ ] Check for null/missing data handling
