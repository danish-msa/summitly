# URL Structure Plan

## Desired URL Structure

### Property Pages
- `/{cityname}/{propertyaddress}` - e.g., `/toronto/123-main-street`

### City Pages  
- `/{cityname}-real-estate` - e.g., `/toronto-real-estate`
- `/{cityname}-real-estate/trends`
- `/{cityname}-real-estate/areas`
- `/{cityname}-real-estate/neighbourhoods`

### Area Pages
- `/{cityname}-real-estate/{areaname}` - e.g., `/toronto-real-estate/downtown`
- `/{cityname}-real-estate/{areaname}/trends`
- `/{cityname}-real-estate/{areaname}/neighbourhoods`

### Neighbourhood Pages
- `/{cityname}-real-estate/{areaname}/{neighbourhoodname}` - e.g., `/toronto-real-estate/downtown/district`
- `/{cityname}-real-estate/{areaname}/{neighbourhoodname}/trends`

## Next.js Implementation Challenge

Next.js doesn't support literal text in dynamic segment directory names (e.g., `[citySlug]-real-estate`). 

## Solution

Use a single dynamic segment `[citySlug]` and check the pattern inside components:
- If `citySlug` ends with `-real-estate` → city/area/neighbourhood pages
- If `citySlug` doesn't end with `-real-estate` → property pages

## Directory Structure

```
src/app/
  [citySlug]/                    # Handles both city-real-estate and city (property)
    page.tsx                      # City page if ends with -real-estate, else 404
    trends/
      page.tsx                    # City trends
    areas/
      page.tsx                    # City areas
    neighbourhoods/
      page.tsx                    # City neighbourhoods
    [secondSegment]/              # Area or property address
      page.tsx                    # Area page if citySlug ends with -real-estate, else property
      trends/
        page.tsx                  # Area trends
      neighbourhoods/
        page.tsx                  # Area neighbourhoods
      [thirdSegment]/             # Neighbourhood name
        page.tsx                  # Neighbourhood page
        trends/
          page.tsx                # Neighbourhood trends
```

## Alternative: Use Middleware

Use Next.js middleware to rewrite URLs:
- `/toronto-real-estate` → `/city/toronto-real-estate`
- `/toronto/123-main-street` → `/property/toronto/123-main-street`

This allows cleaner separation but adds complexity.

