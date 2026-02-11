# Global Filter System

This directory contains a comprehensive, reusable filter system that can be used across multiple components in the application.

## Components

### Core Components
- **GlobalFilters**: Main component that combines all filter types
- **LocationFilter**: Advanced location selection with search and area support
- **PropertyTypeFilter**: Property type selection
- **CommunityFilter**: Community/neighborhood selection
- **PriceFilter**: Price range selection with sliders
- **BedroomFilter**: Bedroom count selection
- **BathroomFilter**: Bathroom count selection

### Supporting Files
- **types/filters.ts**: Type definitions and interfaces
- **hooks/useGlobalFilters.ts**: Global filter state management hook

## Usage Examples

### Basic Usage
```tsx
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import GlobalFilters from '@/components/common/filters/GlobalFilters';

const MyComponent = () => {
  const { filters, handleFilterChange, resetFilters } = useGlobalFilters();
  
  return (
    <GlobalFilters
      filters={filters}
      handleFilterChange={handleFilterChange}
      resetFilters={resetFilters}
      communities={communities}
      locations={locations}
    />
  );
};
```

### Custom Filter Selection
```tsx
<GlobalFilters
  filters={filters}
  handleFilterChange={handleFilterChange}
  resetFilters={resetFilters}
  communities={communities}
  locations={locations}
  showLocation={true}
  showPropertyType={true}
  showCommunity={false}
  showPrice={true}
  showBedrooms={true}
  showBathrooms={true}
  layout="horizontal"
/>
```

### Individual Filter Usage
```tsx
import LocationFilter from '@/components/common/filters/LocationFilter';

<LocationFilter
  filters={filters}
  handleFilterChange={handleFilterChange}
  communities={communities}
  locations={locations}
/>
```

## Filter State Structure

```typescript
interface FilterState {
  // Location filters
  location: string;
  locationArea: string;
  
  // Property filters
  propertyType: string;
  community: string;
  
  // Price filters
  minPrice: number;
  maxPrice: number;
  
  // Property details
  bedrooms: number;
  bathrooms: number;
  
  // Listing type
  listingType: string;
}
```

## Features

### Location Filter
- Advanced location search with autocomplete
- Two-column layout (regions + areas)
- "Use my location" functionality
- Search through both location names and areas
- Clear individual filters

### Property Type Filter
- Grid layout for easy selection
- Visual feedback for selected options
- Clear individual filters

### Community Filter
- Scrollable list for large community lists
- Clear individual filters

### Price Filter
- Dual-range slider for min/max price
- Formatted price display
- Reset functionality

### Bedroom/Bathroom Filters
- Horizontal button layout
- "Any" and "5+" options
- Clear individual filters

## Customization

### Layout Options
- `horizontal`: Filters arranged horizontally (default)
- `vertical`: Filters arranged vertically

### Show/Hide Filters
Control which filters are displayed:
- `showLocation`
- `showPropertyType`
- `showCommunity`
- `showPrice`
- `showBedrooms`
- `showBathrooms`

### Styling
All components use Tailwind CSS classes and can be customized through the `className` prop.

## Integration

The filter system is designed to work seamlessly with:
- React state management
- Next.js routing
- Location detection services
- Property search APIs

## Examples in Codebase

- **ListingFilters**: Full filter implementation for property listings
- **PropertyFilters**: Simplified filter for property search
- **Home/Properties**: Location and property type filters only
