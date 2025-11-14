# CRITICAL FIX: Delete [cityName] Directory

## Problem
Next.js is returning 404 errors because both `[cityName]` and `[citySlug]` directories exist at the same level. Next.js cannot differentiate between them, causing routing conflicts.

## Solution
**DELETE the entire `src/app/[cityName]` directory** - All functionality has been moved to `[citySlug]`.

## What to Delete
Delete this entire directory:
```
src/app/[cityName]/
```

This includes:
- `[cityName]/[area]/` - Old area routes (moved to `[citySlug]/[areaName]/`)
- `[cityName]/[slug]/` - Old slug routes (moved to `[citySlug]/[areaName]/`)
- `[cityName]/[propertyAddress]/` - Old property route (moved to `[citySlug]/[propertyAddress]/`)
- `[cityName]/areas/` - Old areas list (moved to `[citySlug]/areas/`)
- `[cityName]/neighbourhoods/` - Old neighbourhoods list (moved to `[citySlug]/neighbourhoods/`)
- `[cityName]/trends/` - Old trends (moved to `src/components/Location/trends/`)

## Current Working Structure
All routes are now in `[citySlug]`:
- Properties: `[citySlug]/[propertyAddress]/page.tsx` (citySlug does NOT end with -real-estate)
- Cities: `[citySlug]/page.tsx` (citySlug ends with -real-estate)
- Areas: `[citySlug]/[areaName]/page.tsx` (citySlug ends with -real-estate)
- Neighbourhoods: `[citySlug]/[areaName]/[neighbourhoodName]/page.tsx` (citySlug ends with -real-estate)

## After Deletion
Once you delete `[cityName]`, restart your Next.js dev server and all routes should work:
- ✅ `/brampton/45-cesaathr` → Property page
- ✅ `/scugog-real-estate/durham` → Area page
- ✅ `/scugog-real-estate/durham/port-perry` → Neighbourhood page

