# Map Themes Guide

Your map now supports multiple theme options! Here's how to use them.

## Available Themes

1. **Default** - Clean and minimal map style (current)
2. **Silver** - Light gray color scheme
3. **Retro** - Vintage sepia-toned style
4. **Dark** - Dark mode for low-light viewing
5. **Night** - Ultra-dark theme for night viewing
6. **Aubergine** - Purple and pink color scheme
7. **Minimal** - Ultra-minimal with reduced visual noise
8. **Custom** - Customizable theme

## How to Change Theme

### Option 1: Change Default Theme (Recommended)

Edit `src/lib/constants/mapThemes.ts` and change the `activeTheme` export:

```typescript
// Change this line:
export const activeTheme: MapTheme = 'default';

// To any of these:
export const activeTheme: MapTheme = 'silver';
export const activeTheme: MapTheme = 'retro';
export const activeTheme: MapTheme = 'dark';
export const activeTheme: MapTheme = 'night';
export const activeTheme: MapTheme = 'aubergine';
export const activeTheme: MapTheme = 'minimal';
export const activeTheme: MapTheme = 'custom';
```

### Option 2: Pass Theme as Prop

You can also pass the theme directly to the `GooglePropertyMap` component:

```typescript
<GooglePropertyMap
  properties={properties}
  selectedProperty={selectedProperty}
  onPropertySelect={handleSelect}
  onBoundsChange={handleBounds}
  theme="dark" // Add this prop
/>
```

## Customizing Themes

To create your own theme, edit `src/lib/constants/mapThemes.ts` and modify the `customTheme` object:

```typescript
export const customTheme: MapThemeConfig = {
  name: 'Custom',
  description: 'Your custom theme',
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#your-color' }]
    },
    // Add more style rules...
  ]
};
```

## Theme Examples

- **Default**: Best for general use, clean and professional
- **Silver**: Great for light backgrounds, subtle appearance
- **Retro**: Perfect for vintage/classic property listings
- **Dark**: Ideal for dark mode websites or low-light viewing
- **Night**: Maximum contrast, best for night-time use
- **Aubergine**: Unique purple theme for branding
- **Minimal**: Maximum focus on markers, minimal distractions

## Google Maps Style Reference

For advanced customization, refer to the [Google Maps Styling Wizard](https://mapstyle.withgoogle.com/) or the [Google Maps JavaScript API Styling Guide](https://developers.google.com/maps/documentation/javascript/style-reference).
