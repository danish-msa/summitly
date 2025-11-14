# Current Routing Structure

## Property Pages
- **URL**: `/{cityname}/{propertyaddress}` 
- **Example**: `/toronto/123-main-street`
- **Route**: `[cityName]/[propertyAddress]/page.tsx`
- **Note**: cityName does NOT end with `-real-estate`

## City Pages
- **URL**: `/{cityname}-real-estate`
- **Example**: `/toronto-real-estate`
- **Route**: `[citySlug]/page.tsx` (where citySlug ends with `-real-estate`)

- **URL**: `/{cityname}-real-estate/trends`
- **Route**: `[citySlug]/trends/page.tsx`

- **URL**: `/{cityname}-real-estate/areas`
- **Route**: `[citySlug]/areas/page.tsx`

- **URL**: `/{cityname}-real-estate/neighbourhoods`
- **Route**: `[citySlug]/neighbourhoods/page.tsx`

## Area Pages
- **URL**: `/{cityname}-real-estate/{areaname}`
- **Example**: `/toronto-real-estate/downtown`
- **Route**: `[citySlug]/[areaName]/page.tsx` (where citySlug ends with `-real-estate`)

- **URL**: `/{cityname}-real-estate/{areaname}/trends`
- **Route**: `[citySlug]/[areaName]/trends/page.tsx`

- **URL**: `/{cityname}-real-estate/{areaname}/neighbourhoods`
- **Route**: `[citySlug]/[areaName]/neighbourhoods/page.tsx`

## Neighbourhood Pages
- **URL**: `/{cityname}-real-estate/{areaname}/{neighbourhoodname}`
- **Example**: `/toronto-real-estate/downtown/district`
- **Route**: `[citySlug]/[areaName]/[neighbourhoodName]/page.tsx` (where citySlug ends with `-real-estate`)

- **URL**: `/{cityname}-real-estate/{areaname}/{neighbourhoodname}/trends`
- **Route**: `[citySlug]/[areaName]/[neighbourhoodName]/trends/page.tsx`

## Directory Structure
```
src/app/
  [cityName]/                          # Property pages only
    [propertyAddress]/
      page.tsx                         # Property detail page
  
  [citySlug]/                          # City/Area/Neighbourhood pages
    page.tsx                           # City page (if ends with -real-estate)
    trends/
      page.tsx                         # City trends
    areas/
      page.tsx                         # City areas list
    neighbourhoods/
      page.tsx                         # City neighbourhoods list
    [areaName]/                        # Area pages (if citySlug ends with -real-estate)
      page.tsx                         # Area detail page
      trends/
        page.tsx                       # Area trends
      neighbourhoods/
        page.tsx                       # Area neighbourhoods list
      [neighbourhoodName]/             # Neighbourhood pages
        page.tsx                       # Neighbourhood detail page
        trends/
          page.tsx                     # Neighbourhood trends
```

## Key Points
1. Properties use `[cityName]` (without `-real-estate` suffix)
2. Cities/Areas/Neighbourhoods use `[citySlug]` (with `-real-estate` suffix)
3. Route guards check if citySlug ends with `-real-estate` to differentiate

