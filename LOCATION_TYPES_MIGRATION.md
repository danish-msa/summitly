# Market Trends - Multi-Location Type Support

## Overview

The Market Trends system now supports **all location types** to prevent data clashes:

- ✅ **City** - e.g., "Oakville", "Toronto"
- ✅ **Area** - e.g., "Downtown", "North York"
- ✅ **Neighbourhood** - e.g., "Old Oakville", "Yorkville"
- ✅ **Intersection** - e.g., "Main & King", "Yonge & Bloor"
- ✅ **Community** - e.g., "The Beaches", "Distillery District"

## Database Structure

### Unique Constraint
The database uses a **composite unique key** to prevent clashes:
```
locationType + locationName + month
```

This means:
- ✅ `city:Oakville:2025-01` is different from `area:Oakville:2025-01`
- ✅ `neighbourhood:Downtown:2025-01` in Toronto is different from `neighbourhood:Downtown:2025-01` in Mississauga
- ✅ Same location name in different types won't clash

### Parent Location Hierarchy
The database stores parent locations for context:
- `parentCity` - City this location belongs to (if not a city)
- `parentArea` - Area this location belongs to (if neighbourhood/intersection/community)
- `parentNeighbourhood` - Neighbourhood this location belongs to (if intersection/community)

**Example:**
```
locationType: "intersection"
locationName: "Main & King"
parentCity: "Toronto"
parentArea: "Downtown"
parentNeighbourhood: "Financial District"
```

## API Routes

### New Route Structure

**Before:**
```
/api/market-trends/[city]
```

**After:**
```
/api/market-trends/[locationType]/[locationName]
```

### Examples

1. **City:**
   ```
   GET /api/market-trends/city/Oakville
   ```

2. **Area:**
   ```
   GET /api/market-trends/area/Downtown?parentCity=Toronto
   ```

3. **Neighbourhood:**
   ```
   GET /api/market-trends/neighbourhood/Old%20Oakville?parentCity=Oakville&parentArea=Central
   ```

4. **Intersection:**
   ```
   GET /api/market-trends/intersection/Main%20%26%20King?parentCity=Toronto&parentArea=Downtown&parentNeighbourhood=Financial%20District
   ```

5. **Community:**
   ```
   GET /api/market-trends/community/The%20Beaches?parentCity=Toronto&parentArea=East%20York
   ```

### Rankings Route

Rankings are typically only available for cities:
```
GET /api/market-trends/city/Oakville/rankings
```

For other location types, the API returns a message indicating rankings are only available for cities.

## Migration Steps

### 1. Update Database Schema

Run the updated SQL script in Supabase:
```bash
# Use the updated supabase_market_trends_setup.sql
```

Or use Prisma:
```bash
npx prisma migrate dev --name add_location_types
```

### 2. Migrate Existing Data (if any)

If you have existing data with the old `city` field, you'll need to migrate it:

```sql
-- Migrate existing data (if table already exists with old structure)
-- This assumes you have old data with 'city' column

-- Step 1: Add new columns (if not exists)
ALTER TABLE "MarketTrends" 
ADD COLUMN IF NOT EXISTS "locationType" TEXT,
ADD COLUMN IF NOT EXISTS "locationName" TEXT,
ADD COLUMN IF NOT EXISTS "parentCity" TEXT,
ADD COLUMN IF NOT EXISTS "parentArea" TEXT,
ADD COLUMN IF NOT EXISTS "parentNeighbourhood" TEXT;

-- Step 2: Migrate existing data
UPDATE "MarketTrends"
SET 
  "locationType" = 'city',
  "locationName" = "city",
  "parentCity" = NULL,
  "parentArea" = NULL,
  "parentNeighbourhood" = NULL
WHERE "locationType" IS NULL;

-- Step 3: Create new unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "MarketTrends_locationType_locationName_month_key" 
ON "MarketTrends"("locationType", "locationName", "month");

-- Step 4: Drop old unique constraint (after verifying new one works)
-- DROP INDEX IF EXISTS "MarketTrends_city_month_key";

-- Step 5: Drop old city column (after migration is complete)
-- ALTER TABLE "MarketTrends" DROP COLUMN IF EXISTS "city";
```

### 3. Update Components

Components need to be updated to use the new API route structure:

**Before:**
```typescript
fetch(`/api/market-trends/${cityName}`)
```

**After:**
```typescript
fetch(`/api/market-trends/${locationType}/${locationName}${parentParams}`)
```

## Component Updates Needed

### 1. LocationTrendsPage.tsx
Update to pass `locationType` and parent location info:

```typescript
const locationType: LocationType = 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community';
const locationName = displayName;
const parentCity = cityName; // if locationType !== 'city'
const parentArea = areaName; // if locationType === 'neighbourhood' | 'intersection' | 'community'
```

### 2. HousingPricesSection.tsx
Update API call:
```typescript
const params = new URLSearchParams();
if (parentCity) params.append('parentCity', parentCity);
if (parentArea) params.append('parentArea', parentArea);
if (parentNeighbourhood) params.append('parentNeighbourhood', parentNeighbourhood);

const response = await fetch(
  `/api/market-trends/${locationType}/${encodeURIComponent(locationName)}?${params.toString()}`
);
```

### 3. HousingInventorySection.tsx
Same update as above.

### 4. RankingSection.tsx
Only fetch rankings for cities:
```typescript
if (locationType === 'city') {
  const response = await fetch(`/api/market-trends/city/${locationName}/rankings`);
}
```

## Data Examples

### City Record
```json
{
  "locationType": "city",
  "locationName": "Oakville",
  "parentCity": null,
  "parentArea": null,
  "parentNeighbourhood": null,
  "month": "2025-01"
}
```

### Area Record
```json
{
  "locationType": "area",
  "locationName": "Downtown",
  "parentCity": "Toronto",
  "parentArea": null,
  "parentNeighbourhood": null,
  "month": "2025-01"
}
```

### Neighbourhood Record
```json
{
  "locationType": "neighbourhood",
  "locationName": "Old Oakville",
  "parentCity": "Oakville",
  "parentArea": "Central",
  "parentNeighbourhood": null,
  "month": "2025-01"
}
```

### Intersection Record
```json
{
  "locationType": "intersection",
  "locationName": "Main & King",
  "parentCity": "Toronto",
  "parentArea": "Downtown",
  "parentNeighbourhood": "Financial District",
  "month": "2025-01"
}
```

## Benefits

1. **No Data Clashes** - Same name in different location types won't conflict
2. **Hierarchical Context** - Parent locations stored for filtering and context
3. **Flexible Queries** - Can query by location type, name, or parent
4. **Scalable** - Easy to add new location types in the future
5. **Clear Separation** - Each location type has its own data space

## Query Examples

### Get all cities with data
```sql
SELECT DISTINCT "locationName"
FROM "MarketTrends"
WHERE "locationType" = 'city'
ORDER BY "locationName";
```

### Get all areas in a city
```sql
SELECT DISTINCT "locationName"
FROM "MarketTrends"
WHERE "locationType" = 'area'
  AND "parentCity" = 'Toronto'
ORDER BY "locationName";
```

### Get all neighbourhoods in an area
```sql
SELECT DISTINCT "locationName"
FROM "MarketTrends"
WHERE "locationType" = 'neighbourhood'
  AND "parentCity" = 'Toronto'
  AND "parentArea" = 'Downtown'
ORDER BY "locationName";
```

### Get data for a specific location
```sql
SELECT *
FROM "MarketTrends"
WHERE "locationType" = 'neighbourhood'
  AND "locationName" = 'Old Oakville'
  AND "month" = '2025-01';
```

