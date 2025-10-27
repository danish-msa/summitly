# Location Data System Documentation

This document explains how to use the organized location data system for demographic and location-based features using the Repliers Locations API.

## Overview

The location data system provides a structured way to handle geographical data from the Repliers API, including areas, cities, neighborhoods, and their associated property demographics.

## API Structure

### Repliers Locations API Endpoint
```
GET https://api.repliers.io/listings/locations
```

### Query Parameters
- `area` (string): Filter by area name
- `city` (string): Filter by city name  
- `class` (string): Filter by property class (`residential`, `condo`, `commercial`)
- `neighborhood` (string): Filter by neighborhood name
- `search` (string): Search across all location fields

### API Response Structure
```typescript
interface LocationsResponse {
  boards: Board[];
}

interface Board {
  boardId: number;
  name: string;
  updatedOn: string;
  classes: PropertyClass[];
}

interface PropertyClass {
  name: string; // "residential", "condo", "commercial"
  areas: Area[];
}

interface Area {
  name: string;
  cities: City[];
}

interface City {
  name: string;
  activeCount: number;
  location: LocationCoordinates;
  state: string;
  coordinates: LocationPolygon;
  neighborhoods: Neighborhood[];
}

interface Neighborhood {
  name: string;
  activeCount: number;
  location: LocationCoordinates;
  coordinates?: LocationPolygon;
}
```

## Processed Data Structure

### ProcessedLocation Interface
```typescript
interface ProcessedLocation {
  id: string;                    // Unique identifier
  name: string;                  // Location name
  type: 'area' | 'city' | 'neighborhood';
  parent?: string;               // Parent location name
  activeCount: number;           // Total active properties
  coordinates: LocationCoordinates;
  polygon?: LocationPolygon;     // Geographic boundaries
  children?: ProcessedLocation[]; // Sub-locations
  demographics: {
    residential: number;         // Residential property count
    condo: number;              // Condo property count
    commercial: number;         // Commercial property count
    total: number;               // Total property count
  };
}
```

## Usage Examples

### 1. Basic API Service Usage

```typescript
import { LocationService } from '@/lib/api/location-service';

const locationService = new LocationService('your-api-key');

// Fetch all locations
const allLocations = await locationService.fetchLocations();

// Fetch locations by area
const torontoLocations = await locationService.fetchLocationsByArea('Toronto');

// Fetch residential properties only
const residentialLocations = await locationService.fetchLocationsByClass('residential');

// Search locations
const searchResults = await locationService.searchLocations('downtown');
```

### 2. Using React Hooks

```typescript
import { useLocationData } from '@/hooks/useLocationData';

function LocationComponent() {
  const {
    locations,
    loading,
    error,
    fetchLocations,
    searchLocations,
    getPopularLocations,
    updateFilters
  } = useLocationData();

  useEffect(() => {
    fetchLocations('your-api-key');
  }, []);

  const handleSearch = (query: string) => {
    const results = searchLocations(query, 10);
    console.log('Search results:', results);
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {locations.map(location => (
        <div key={location.id}>
          <h3>{location.name}</h3>
          <p>Properties: {location.demographics.total}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Location Filtering

```typescript
import { LocationDataProcessor } from '@/lib/location-utils';

// Filter locations by criteria
const filteredLocations = LocationDataProcessor.filterLocations(locations, {
  area: 'Toronto',
  class: 'residential',
  search: 'downtown'
});

// Get locations within radius
const nearbyLocations = LocationDataProcessor.getLocationsInRadius(
  locations,
  { lat: 43.653226, lng: -79.3831843 }, // Toronto coordinates
  10 // 10km radius
);
```

### 4. Location Hierarchy

```typescript
// Get location hierarchy (Area -> City -> Neighborhood)
const hierarchy = LocationDataProcessor.getLocationHierarchy(
  locations,
  'Annex' // Target neighborhood
);

// Result: [Toronto Area, Downtown Toronto City, Annex Neighborhood]
```

## Data Processing Features

### 1. Geographic Calculations
- **Distance Calculation**: Calculate distance between coordinates
- **Radius Search**: Find locations within specified radius
- **Center Coordinates**: Calculate center point for areas
- **Polygon Handling**: Process geographic boundaries

### 2. Demographics Analysis
- **Property Distribution**: Count by property class
- **Market Statistics**: Calculate averages and trends
- **Location Comparison**: Compare demographics across locations

### 3. Search and Filtering
- **Text Search**: Search across location names
- **Hierarchical Filtering**: Filter by area/city/neighborhood
- **Class Filtering**: Filter by property class
- **Geographic Filtering**: Filter by coordinates/radius

## Caching System

The system includes intelligent caching to reduce API calls:

```typescript
import { LocationDataCache } from '@/lib/api/location-service';

const cache = new LocationDataCache();

// Cache expires after 5 minutes
const locations = await locationService.fetchLocations(filters, true); // useCache = true
```

## Error Handling

```typescript
try {
  const locations = await locationService.fetchLocations();
} catch (error) {
  if (error.message.includes('API request failed')) {
    // Handle API errors
    console.error('API Error:', error.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

## Performance Considerations

### 1. Caching Strategy
- Cache API responses for 5 minutes
- Use cache keys based on filter parameters
- Clear expired cache entries automatically

### 2. Data Processing
- Process data once and reuse
- Use efficient algorithms for geographic calculations
- Implement pagination for large datasets

### 3. API Optimization
- Batch requests when possible
- Use specific filters to reduce data transfer
- Implement retry logic for failed requests

## Integration Examples

### 1. Map Integration
```typescript
// Use coordinates for map markers
const mapMarkers = locations.map(location => ({
  position: location.coordinates,
  title: location.name,
  properties: location.demographics.total
}));
```

### 2. Search Autocomplete
```typescript
// Implement search autocomplete
const searchSuggestions = useLocationSearch();

const handleInputChange = (query: string) => {
  searchSuggestions.search(query);
};
```

### 3. Demographic Charts
```typescript
// Prepare data for charts
const chartData = locations.map(location => ({
  name: location.name,
  residential: location.demographics.residential,
  condo: location.demographics.condo,
  commercial: location.demographics.commercial
}));
```

## Best Practices

### 1. Data Management
- Always validate API responses
- Handle loading and error states
- Use TypeScript interfaces for type safety
- Implement proper error boundaries

### 2. Performance
- Use caching to reduce API calls
- Implement debouncing for search inputs
- Lazy load location data when needed
- Use virtual scrolling for large lists

### 3. User Experience
- Provide loading indicators
- Show error messages clearly
- Implement search suggestions
- Use progressive disclosure for hierarchy

## Troubleshooting

### Common Issues

1. **API Key Issues**
   ```typescript
   const isValid = await locationService.validateConnection();
   if (!isValid) {
     console.error('Invalid API key');
   }
   ```

2. **Empty Results**
   ```typescript
   if (locations.length === 0) {
     console.log('No locations found for the given filters');
   }
   ```

3. **Cache Issues**
   ```typescript
   // Clear cache if data seems stale
   locationService.clearCache();
   ```

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Analytics**: Market trend analysis
3. **Geographic Clustering**: Group nearby locations
4. **Predictive Search**: ML-based search suggestions
5. **Data Visualization**: Interactive maps and charts

This system provides a robust foundation for building location-based features with proper data organization, caching, and error handling.
