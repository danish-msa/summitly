// Google Maps Theme Presets
// You can easily switch between themes by changing the export

export type MapTheme = 'default' | 'silver' | 'retro' | 'dark' | 'night' | 'aubergine' | 'minimal' | 'custom';

export interface MapThemeConfig {
  name: string;
  description: string;
  styles: google.maps.MapTypeStyle[];
}

// Default theme - Clean and minimal
export const defaultTheme: MapThemeConfig = {
  name: 'Default',
  description: 'Clean and minimal map style',
  styles: [
    // Darken the entire map for better marker visibility
    {
      featureType: 'all',
      elementType: 'all',
      stylers: [
        { saturation: -30 }, // Reduce saturation
        { lightness: -15 } // Darken by 15%
      ]
    },
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Silver theme - Light gray tones
export const silverTheme: MapThemeConfig = {
  name: 'Silver',
  description: 'Light gray color scheme',
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9c9c9' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Retro theme - Vintage look
export const retroTheme: MapThemeConfig = {
  name: 'Retro',
  description: 'Vintage sepia-toned style',
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#ebe3cd' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9c0a8' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#d4c5a9' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Dark theme - Dark mode
export const darkTheme: MapThemeConfig = {
  name: 'Dark',
  description: 'Dark mode for low-light viewing',
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#242f3e' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#1e2832' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b0' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1e2832' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Night theme - Darker than dark
export const nightTheme: MapThemeConfig = {
  name: 'Night',
  description: 'Ultra-dark theme for night viewing',
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#1d1d1d' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#0c0c0c' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#2c2c2c' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#7c7c7c' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Aubergine theme - Purple tones
export const aubergineTheme: MapThemeConfig = {
  name: 'Aubergine',
  description: 'Purple and pink color scheme',
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#d49964' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#6d5ba5' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#f5d5b4' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Minimal theme - Very clean, reduced colors
export const minimalTheme: MapThemeConfig = {
  name: 'Minimal',
  description: 'Ultra-minimal with reduced visual noise',
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#e0e0e0' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Custom theme - Using brand secondary color (#1AC0EB)
export const customTheme: MapThemeConfig = {
  name: 'Brand Secondary',
  description: 'Custom theme using brand secondary color (#1AC0EB)',
  styles: [
    // Darken the entire map for better marker visibility (applied to all features)
    {
      featureType: 'all',
      elementType: 'all',
      stylers: [
        { saturation: -30 }, // Reduce saturation
        { lightness: -15 } // Darken by 15%
      ]
    },
    // Base geometry - Use #C5C7C1 for most areas (this will be darkened by the above style)
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#C5C7C1' }]
    },
    // Building areas - Use #C5C7C1
    {
      featureType: 'poi.business',
      elementType: 'geometry',
      stylers: [{ color: '#C5C7C1' }]
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#C5C7C1' }]
    },
    // Urban/built-up areas
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry',
      stylers: [{ color: '#C5C7C1' }]
    },
    // Land areas - Use #C5C7C1
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#C5C7C1' }]
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry',
      stylers: [{ color: '#C5C7C1' }]
    },
    // Water - Muted blue-gray (less bright)
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#A8B5B8' }] // Muted blue-gray, less bright
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6B7A7D' }] // Darker gray for water labels
    },
    // Roads - White to contrast with #C5C7C1 land
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#E0E0E0' }] // Light gray stroke
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#D0D0D0', weight: 1.5 }] // Slightly darker gray for highways
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#4a90a2' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }]
    },
    // Parks and green spaces - Subtle green that works with secondary
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#e8f5f0' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#2d8659' }]
    },
    // Administrative boundaries
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1AC0EB', weight: 0.5 }]
    },
    {
      featureType: 'administrative',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#4a90a2' }]
    },
    // Hide POI labels
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    // Transit
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Theme registry
export const mapThemes: Record<MapTheme, MapThemeConfig> = {
  default: defaultTheme,
  silver: silverTheme,
  retro: retroTheme,
  dark: darkTheme,
  night: nightTheme,
  aubergine: aubergineTheme,
  minimal: minimalTheme,
  custom: customTheme,
};

// Current active theme - Change this to switch themes
export const activeTheme: MapTheme = 'default';

// Get theme styles
export const getThemeStyles = (theme: MapTheme = activeTheme): google.maps.MapTypeStyle[] => {
  return mapThemes[theme]?.styles || defaultTheme.styles;
};
