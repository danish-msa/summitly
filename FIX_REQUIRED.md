# Fix Required: Delete [cityName] Directory

## Problem
Next.js doesn't allow two different dynamic segment names at the same level:
- `[cityName]` and `[citySlug]` both exist in `src/app/`
- This causes the error: "You cannot use different slug names for the same dynamic path"

## Solution
Delete the `[cityName]` directory entirely. The trends components have been moved to `src/components/Location/trends/` and imports are already updated.

## Steps to Fix

1. **Copy remaining trends components** (if any are missing):
   - Copy `src/app/[cityName]/trends/components/*` to `src/components/Location/trends/components/`
   - Copy `src/app/[cityName]/trends/utils/chartOptions.ts` to `src/components/Location/trends/utils/chartOptions.ts`
   - Copy `src/app/[cityName]/trends/utils/dataGenerators.ts` to `src/components/Location/trends/utils/dataGenerators.ts`

2. **Delete the entire `[cityName]` directory**:
   ```bash
   rm -rf src/app/[cityName]
   ```
   Or manually delete the folder in your file explorer.

## Already Done
✅ Created `src/components/Location/trends/utils/helpers.ts`
✅ Created `src/components/Location/trends/components/PageHeader.tsx`
✅ Created `src/components/Location/neighbourhoods/utils/dataGenerators.ts`
✅ Updated imports in `LocationTrendsPage.tsx`
✅ Updated imports in `[citySlug]/neighbourhoods/page.tsx`
✅ Moved property page to `[citySlug]/[propertyAddress]/page.tsx`
✅ Updated `LocationPage.tsx` and `LocationTrendsPage.tsx` to use `citySlug` parameter

## Current Structure (After Fix)
```
src/app/
  [citySlug]/                          # Single dynamic segment for all routes
    page.tsx                           # City page (if ends with -real-estate)
    [propertyAddress]/                 # Property page (if doesn't end with -real-estate)
      page.tsx
    trends/
      page.tsx                         # City trends
    areas/
      page.tsx                         # City areas
    neighbourhoods/
      page.tsx                         # City neighbourhoods
    [areaName]/                        # Area pages (to be created)
      page.tsx
      trends/
        page.tsx
      neighbourhoods/
        page.tsx
      [neighbourhoodName]/             # Neighbourhood pages (to be created)
        page.tsx
        trends/
          page.tsx
```

