// Map Provider Configuration
// Switch between Google Maps and Mapbox

export type MapProvider = 'google' | 'mapbox';

// Feature flag: Set to 'mapbox' to use Mapbox, 'google' to use Google Maps
// Default to 'google' for backward compatibility
export const MAP_PROVIDER: MapProvider = (process.env.NEXT_PUBLIC_MAP_PROVIDER as MapProvider) || 'google';

// Check if Mapbox is enabled
export const isMapboxEnabled = (): boolean => {
  return MAP_PROVIDER === 'mapbox';
};

// Check if Google Maps is enabled
export const isGoogleMapsEnabled = (): boolean => {
  return MAP_PROVIDER === 'google';
};
