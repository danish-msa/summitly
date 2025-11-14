# URL Structure Explanation & Implementation

## Current Situation

You have a mixed structure with:
- `[cityName]` directory handling both city and property pages
- `[slug]` directory handling both area and property pages
- Confusing routing logic that checks if cityName ends with `-real-estate`

## Desired URL Structure

### Property Pages
- `/{cityname}/{propertyaddress}` 
  - Example: `/toronto/123-main-street`
  - Route: `[cityName]/[propertyAddress]` where cityName = "toronto" (no -real-estate)

### City Pages  
- `/{cityname}-real-estate`
  - Example: `/toronto-real-estate`
  - Route: `[citySlug]` where citySlug = "toronto-real-estate"
- `/{cityname}-real-estate/trends`
- `/{cityname}-real-estate/areas`
- `/{cityname}-real-estate/neighbourhoods`

### Area Pages
- `/{cityname}-real-estate/{areaname}`
  - Example: `/toronto-real-estate/downtown`
  - Route: `[citySlug]/[areaName]` where citySlug = "toronto-real-estate"
- `/{cityname}-real-estate/{areaname}/trends`
- `/{cityname}-real-estate/{areaname}/neighbourhoods`

### Neighbourhood Pages
- `/{cityname}-real-estate/{areaname}/{neighbourhoodname}`
  - Example: `/toronto-real-estate/downtown/district`
  - Route: `[citySlug]/[areaName]/[neighbourhoodName]` where citySlug = "toronto-real-estate"
- `/{cityname}-real-estate/{areaname}/{neighbourhoodname}/trends`

## Next.js Limitation

Next.js doesn't support literal text in dynamic segment directory names (e.g., `[citySlug]-real-estate` is invalid).

## Solution

Use `[citySlug]` for city/area/neighbourhood pages and check if it ends with `-real-estate`:
- `/toronto-real-estate` → `[citySlug]` where citySlug = "toronto-real-estate" → City page
- `/toronto/123-main-street` → `[cityName]` where cityName = "toronto" → Property page

These don't conflict because:
- Property URLs have 2 segments: `[cityName]/[propertyAddress]`
- City URLs have 1 segment: `[citySlug]` (ending with -real-estate)

## Final Directory Structure

```
src/app/
  [cityName]/                          # Property pages (cityName = "toronto", no -real-estate)
    [propertyAddress]/
      page.tsx                         # Property detail page
  
  [citySlug]/                          # City/Area/Neighbourhood pages (citySlug = "toronto-real-estate")
    page.tsx                           # City page (if citySlug ends with -real-estate)
    trends/
      page.tsx                         # City trends
    areas/
      page.tsx                         # City areas list
    neighbourhoods/
      page.tsx                         # City neighbourhoods list
    [areaName]/                        # Area pages
      page.tsx                         # Area page (if citySlug ends with -real-estate)
      trends/
        page.tsx                       # Area trends
      neighbourhoods/
        page.tsx                       # Area neighbourhoods list
      [neighbourhoodName]/             # Neighbourhood pages
        page.tsx                       # Neighbourhood page
        trends/
          page.tsx                     # Neighbourhood trends
```

## Implementation Steps

1. ✅ Create `[cityName]/[propertyAddress]/page.tsx` for property pages
2. Create `[citySlug]/page.tsx` for city pages (check if ends with -real-estate)
3. Move city subpages to `[citySlug]/trends`, `[citySlug]/areas`, `[citySlug]/neighbourhoods`
4. Create area pages structure under `[citySlug]/[areaName]`
5. Create neighbourhood pages structure under `[citySlug]/[areaName]/[neighbourhoodName]`
6. Update all components to use correct parameter names
7. Delete unused directories: `[cityName]/[slug]`, `[cityName]/[area]`, old `[cityName]` pages

