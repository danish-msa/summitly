# Mapbox Implementation Guide

This document explains the Mapbox implementation and how to switch from Google Maps to Mapbox.

## Overview

The codebase now supports both Google Maps and Mapbox as map providers. You can switch between them using an environment variable.

## Features Implemented

### ✅ Core Components
- **MapboxPropertyMap**: Main property map with marker clustering (replaces GooglePropertyMap)
- **MapboxMap**: Simple map component for property detail pages (replaces Map component)
- **PropertyMap**: Universal wrapper that switches between Google Maps and Mapbox
- **UnifiedMap**: Universal wrapper for simple map components

### ✅ Features
- ✅ Marker clustering using Supercluster
- ✅ Custom price markers with selection state
- ✅ Property popups/info windows
- ✅ Filter panel integration
- ✅ Theme support (converted from Google Maps themes)
- ✅ Bounds change handling
- ✅ Zoom controls
- ✅ Property selection and navigation
- ✅ Location-based centering
- ✅ Auto-fit bounds for properties

## Setup

### 1. Get Mapbox Access Token

1. Sign up at [mapbox.com](https://www.mapbox.com)
2. Go to your account page
3. Copy your access token

### 2. Configure Environment Variables

Add to your `.env.local`:

```bash
# Map Provider: 'google' or 'mapbox'
NEXT_PUBLIC_MAP_PROVIDER=mapbox

# Mapbox Access Token
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here

# Keep Google Maps key for fallback (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

### 3. Install Dependencies

Dependencies are already installed:
- `mapbox-gl`: Mapbox GL JS library
- `react-map-gl`: React wrapper for Mapbox
- `supercluster`: Marker clustering library
- `@types/supercluster`: TypeScript types

## Usage

### Using the Universal Components

The easiest way is to use the universal wrapper components that automatically switch based on `NEXT_PUBLIC_MAP_PROVIDER`:

```tsx
import PropertyMap from '@/components/MapSearch/PropertyMap';
import UnifiedMap from '@/components/ui/unified-map';

// This will use Mapbox if NEXT_PUBLIC_MAP_PROVIDER=mapbox
<PropertyMap
  properties={properties}
  selectedProperty={selectedProperty}
  onPropertySelect={handleSelect}
  onBoundsChange={handleBoundsChange}
/>
```

### Direct Usage

You can also import Mapbox components directly:

```tsx
import MapboxPropertyMap from '@/components/MapSearch/MapboxPropertyMap';
import MapboxMap from '@/components/ui/mapbox-map';

<MapboxPropertyMap {...props} />
<MapboxMap {...props} />
```

## Migration from Google Maps

### Step 1: Test Mapbox Locally

1. Set `NEXT_PUBLIC_MAP_PROVIDER=mapbox` in `.env.local`
2. Add your Mapbox access token
3. Test all map features:
   - Property listings map
   - Property detail pages
   - Pre-construction projects
   - Comparables
   - Filter panel

### Step 2: Update Components (Optional)

If you want to use Mapbox directly without the wrapper, update imports:

**Before:**
```tsx
import GooglePropertyMap from '@/components/MapSearch/GooglePropertyMap';
```

**After:**
```tsx
import MapboxPropertyMap from '@/components/MapSearch/MapboxPropertyMap';
// OR use the universal wrapper
import PropertyMap from '@/components/MapSearch/PropertyMap';
```

### Step 3: Deploy

1. Add environment variables to your deployment platform (Vercel, AWS, etc.)
2. Set `NEXT_PUBLIC_MAP_PROVIDER=mapbox`
3. Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
4. Deploy and test

### Step 4: Remove Google Maps (After Testing)

Once Mapbox is fully tested and working:

1. Remove Google Maps dependencies:
   ```bash
   npm uninstall @react-google-maps/api @googlemaps/markerclusterer
   ```

2. Remove Google Maps components (optional):
   - `src/components/MapSearch/GooglePropertyMap.tsx`
   - `src/components/ui/map.tsx`
   - `src/providers/GoogleMapsProvider.tsx`

3. Update all imports to use Mapbox or universal components

## Map Themes

Mapbox themes are defined in `src/lib/constants/mapboxThemes.ts`. 

Available themes:
- `default`: Clean and minimal (Mapbox Streets)
- `silver`: Light gray tones (Mapbox Light)
- `retro`: Vintage look (Mapbox Outdoors)
- `dark`: Dark mode (Mapbox Dark)
- `night`: Ultra-dark (Mapbox Dark)
- `aubergine`: Purple tones (Mapbox Satellite Streets)
- `minimal`: Ultra-minimal (Mapbox Light)
- `custom`: Brand secondary color theme (Mapbox Streets)

## Differences from Google Maps

### Marker Clustering
- Uses `supercluster` library instead of `@googlemaps/markerclusterer`
- Clustering behavior is similar but implementation differs slightly

### Popups
- Mapbox uses `Popup` component instead of `InfoWindow`
- Styling is similar but uses different CSS classes

### Styling
- Mapbox uses style URLs or style objects instead of Google Maps style arrays
- Themes are converted to Mapbox-compatible formats

### API
- Mapbox uses `react-map-gl` hooks and components
- Google Maps uses `@react-google-maps/api` components

## Troubleshooting

### Map not loading
- Check that `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set
- Verify the token is valid in your Mapbox account
- Check browser console for errors

### Markers not showing
- Ensure properties have valid `latitude` and `longitude` in `map` object
- Check that clustering is initialized correctly
- Verify bounds are being calculated

### Styling issues
- Mapbox styles are loaded from CDN, ensure internet connection
- Custom styles require Mapbox Studio account
- Check CSS for popup styling

## Cost Comparison

### Google Maps
- Pay-as-you-go pricing
- Can get expensive with high usage
- Free tier: $200/month credit

### Mapbox
- Generous free tier: 50,000 map loads/month
- Pay-as-you-go after free tier
- Often more cost-effective for high-traffic sites

## Support

For issues or questions:
1. Check Mapbox documentation: https://docs.mapbox.com/
2. Check react-map-gl documentation: https://visgl.github.io/react-map-gl/
3. Review component code in `src/components/MapSearch/MapboxPropertyMap.tsx`
