# Google Maps Integration Setup

This document outlines the setup required for Google Maps integration with marker clustering and search features.

## Prerequisites

1. **Google Cloud Console Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API

2. **API Key Configuration**
   - Create an API key in Google Cloud Console
   - Restrict the API key to your domain for security
   - Add the following restrictions:
     - HTTP referrers (web sites)
     - Your domain (e.g., `localhost:3000/*`, `yourdomain.com/*`)

## Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Features Implemented

### 1. Marker Clustering
- Uses `@googlemaps/markerclusterer` library
- Custom cluster markers with property count
- Automatic clustering based on zoom level
- Smooth animations and transitions

### 2. Search Functionality
- Integrated Google Places Autocomplete
- Search for cities, addresses, and establishments
- Restricted to Canada (can be modified)
- Real-time search suggestions
- Click to navigate to searched location

### 3. Property Markers
- Custom marker design with price display
- Different colors for selected properties
- Hover effects and smooth transitions
- Click to select property

### 4. Info Windows
- Rich property information display
- Property images, details, and pricing
- Direct navigation to property details
- Responsive design

## Components Structure

```
src/components/MapSearch/
├── GooglePropertyMap.tsx      # Main map component with clustering
├── MapSearchBox.tsx           # Search functionality
├── GoogleMapsProvider.tsx     # Google Maps context provider
└── Listings.tsx               # Updated to use Google Maps
```

## Usage

The map component is automatically integrated into the MapSearch Listings page. Users can:

1. **Search for locations** using the search box
2. **View clustered markers** that group nearby properties
3. **Click on markers** to see property details
4. **Use map filters** to show/hide properties based on map bounds
5. **Navigate to properties** directly from the map

## Customization

### Marker Styling
Modify the marker appearance in `GooglePropertyMap.tsx`:

```typescript
// Custom marker icon
icon: {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#4a60a1" stroke="white" stroke-width="2"/>
      <text x="20" y="25" text-anchor="middle" fill="white" font-size="10">$500k</text>
    </svg>
  `),
  scaledSize: new google.maps.Size(40, 40),
  anchor: new google.maps.Point(20, 20)
}
```

### Cluster Styling
Customize cluster appearance in the `initializeClusterer` function:

```typescript
renderer: {
  render: ({ count, position }) => {
    // Custom cluster element
    const clusterElement = document.createElement('div');
    // ... styling code
    return clusterElement;
  }
}
```

### Search Restrictions
Modify search restrictions in `MapSearchBox.tsx`:

```typescript
requestOptions: {
  types: ['(cities)', 'address', 'establishment'],
  componentRestrictions: { country: 'ca' }, // Change country code
}
```

## Performance Considerations

1. **Marker Clustering**: Automatically handles large numbers of markers
2. **Lazy Loading**: Map component is dynamically imported
3. **Bounds Optimization**: Only shows relevant properties
4. **Debounced Search**: Prevents excessive API calls

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the API key is correct
   - Check domain restrictions
   - Ensure required APIs are enabled

2. **Markers Not Showing**
   - Check property coordinates are valid
   - Verify map bounds are correct
   - Check console for errors

3. **Search Not Working**
   - Verify Places API is enabled
   - Check API key permissions
   - Ensure proper billing setup

### Debug Mode

Enable debug logging by adding to your environment:

```bash
NEXT_PUBLIC_DEBUG_MAPS=true
```

## Migration from Mapbox

The following changes were made to migrate from Mapbox to Google Maps:

1. **Removed Dependencies**:
   - `mapbox-gl`
   - Mapbox-specific CSS

2. **Added Dependencies**:
   - `@googlemaps/markerclusterer`
   - `use-places-autocomplete`

3. **Updated Components**:
   - Replaced `PropertyMap.tsx` with `GooglePropertyMap.tsx`
   - Added search functionality
   - Implemented marker clustering

## Security Notes

1. **API Key Security**: Always restrict your API key to specific domains
2. **Rate Limiting**: Implement proper rate limiting for production use
3. **Billing**: Monitor usage to avoid unexpected charges
4. **HTTPS**: Ensure your site uses HTTPS in production

## Support

For issues related to:
- Google Maps API: Check [Google Maps Platform documentation](https://developers.google.com/maps/documentation)
- Marker Clustering: See [@googlemaps/markerclusterer documentation](https://github.com/googlemaps/js-markerclusterer)
- React Integration: Check [@react-google-maps/api documentation](https://react-google-maps-api-docs.netlify.app/)
