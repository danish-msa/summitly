// Mapbox Theme Presets
// Converted from Google Maps themes to Mapbox style format

export type MapboxTheme = 'default' | 'silver' | 'retro' | 'dark' | 'night' | 'aubergine' | 'minimal' | 'custom';

export interface MapboxThemeConfig {
  name: string;
  description: string;
  style: string; // Mapbox style URL (e.g., 'mapbox://styles/mapbox/streets-v12')
}

// Default theme - Clean and minimal (using Mapbox Streets)
export const defaultMapboxTheme: MapboxThemeConfig = {
  name: 'Default',
  description: 'Clean and minimal map style',
  style: 'mapbox://styles/mapbox/streets-v12'
};

// Silver theme - Light gray tones
export const silverMapboxTheme: MapboxThemeConfig = {
  name: 'Silver',
  description: 'Light gray color scheme',
  style: 'mapbox://styles/mapbox/light-v11'
};

// Retro theme - Vintage look
export const retroMapboxTheme: MapboxThemeConfig = {
  name: 'Retro',
  description: 'Vintage sepia-toned style',
  style: 'mapbox://styles/mapbox/outdoors-v12'
};

// Dark theme - Dark mode
export const darkMapboxTheme: MapboxThemeConfig = {
  name: 'Dark',
  description: 'Dark mode for low-light viewing',
  style: 'mapbox://styles/mapbox/dark-v11'
};

// Night theme - Darker than dark
export const nightMapboxTheme: MapboxThemeConfig = {
  name: 'Night',
  description: 'Ultra-dark theme for night viewing',
  style: 'mapbox://styles/mapbox/dark-v11'
};

// Aubergine theme - Purple tones (using custom style)
export const aubergineMapboxTheme: MapboxThemeConfig = {
  name: 'Aubergine',
  description: 'Purple and pink color scheme',
  style: 'mapbox://styles/mapbox/satellite-streets-v12'
};

// Minimal theme - Very clean, reduced colors
export const minimalMapboxTheme: MapboxThemeConfig = {
  name: 'Minimal',
  description: 'Ultra-minimal with reduced visual noise',
  style: 'mapbox://styles/mapbox/light-v11'
};

// Custom theme - Using brand secondary color (#1AC0EB)
// For custom styling, we'll use a base style and apply filters
export const customMapboxTheme: MapboxThemeConfig = {
  name: 'Brand Secondary',
  description: 'Custom theme using brand secondary color (#1AC0EB)',
  style: 'mapbox://styles/mapbox/streets-v12'
};

// Theme registry
export const mapboxThemes: Record<MapboxTheme, MapboxThemeConfig> = {
  default: defaultMapboxTheme,
  silver: silverMapboxTheme,
  retro: retroMapboxTheme,
  dark: darkMapboxTheme,
  night: nightMapboxTheme,
  aubergine: aubergineMapboxTheme,
  minimal: minimalMapboxTheme,
  custom: customMapboxTheme,
};

// Current active theme
export const activeMapboxTheme: MapboxTheme = 'default';

// Get theme style
export const getMapboxThemeStyle = (theme: MapboxTheme = activeMapboxTheme): string => {
  return mapboxThemes[theme]?.style || defaultMapboxTheme.style;
};
