# Font System Documentation

## Overview
This website uses a three-font system designed for optimal typography hierarchy and brand consistency:

1. **Geometos** - For heading elements
2. **Roboto** - For body text  
3. **EB Garamond** - For subheads, captions, initial caps, numbers, and decorative elements

## Font Implementation

### 1. Geometos (Headings)
- **Purpose**: All heading elements (h1-h6)
- **Implementation**: Local font files in `/public/fonts/`
- **Weights Available**: 200, 300, 400, 700, 800, 900, 950
- **CSS Variable**: `--font-geometos-neue`
- **Tailwind Class**: `font-geometos` or `font-geometosNeue`

### 2. Roboto (Body Text)
- **Purpose**: All body text, paragraphs, and general content
- **Implementation**: Google Fonts via Next.js
- **Weights Available**: 100, 300, 400, 500, 700, 900
- **CSS Variable**: `--font-roboto`
- **Tailwind Class**: `font-roboto` or `font-sans` (default)

### 3. EB Garamond (Decorative Elements)
- **Purpose**: Subheads, captions, initial caps, numbers, and accessorizing elements
- **Implementation**: Google Fonts via Next.js (free alternative to Adobe Garamond Pro)
- **Weights Available**: 400, 500, 600, 700
- **CSS Variable**: `--font-garamond`
- **Tailwind Class**: `font-garamond`

## Usage Guidelines

### Automatic Font Assignment
- **Headings (h1-h6)**: Automatically use Geometos
- **Body text (p, div, span, etc.)**: Automatically use Roboto
- **Numbers and decorative text**: Use utility classes

### Utility Classes

#### Font Family Classes
```css
.font-heading     /* Geometos for headings */
.font-body        /* Roboto for body text */
.font-subhead     /* Garamond for subheads */
.font-caption     /* Garamond for captions (with small text) */
.font-initial-cap /* Garamond for large initial caps */
.font-numbers     /* Garamond for numbers */
```

#### Usage Examples
```jsx
// Heading with Geometos (automatic)
<h1>Main Title</h1>

// Body text with Roboto (automatic)
<p>This is body text using Roboto.</p>

// Subhead with Garamond
<h2 className="font-subhead">Section Subtitle</h2>

// Caption with Garamond
<span className="font-caption">Image caption text</span>

// Initial cap with Garamond
<span className="font-initial-cap">D</span>rop cap text

// Numbers with Garamond
<span className="font-numbers">$1,250,000</span>
```

## Adobe Garamond Pro Integration

### Current Setup
- **EB Garamond** is used as a free, open-source alternative to Adobe Garamond Pro
- EB Garamond closely resembles Adobe Garamond Pro in appearance
- No licensing restrictions for web usage

### To Use Adobe Garamond Pro Instead
If you want to use the actual Adobe Garamond Pro font:

1. **Get Adobe Fonts License**: Ensure you have proper licensing through Adobe Fonts
2. **Add to Adobe Fonts Project**: Create a web project in Adobe Fonts
3. **Update Implementation**: Replace EB Garamond with Adobe Garamond Pro in `layout.tsx`

```jsx
// Example Adobe Garamond Pro implementation
import { Adobe_Garamond_Pro } from "next/font/google";

const adobeGaramond = Adobe_Garamond_Pro({
  weight: ['400', '500', '600', '700'],
  variable: "--font-garamond",
  subsets: ["latin"],
});
```

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Font imports and configuration
│   ├── fonts.ts            # Local font definitions
│   └── globals.css         # Font CSS variables and utility classes
├── public/
│   └── fonts/              # Local Geometos font files
└── tailwind.config.ts      # Tailwind font family configuration
```

## CSS Variables

```css
:root {
  --font-geometos: 'GeometosNeue', sans-serif;
  --font-roboto: 'Roboto', sans-serif;
  --font-garamond: 'EB Garamond', serif;
}
```

## Best Practices

1. **Consistency**: Use the established font hierarchy consistently across the site
2. **Performance**: Fonts are loaded with `display: swap` for optimal performance
3. **Accessibility**: Ensure sufficient contrast ratios with all font combinations
4. **Responsive**: Font sizes are responsive and scale appropriately
5. **Fallbacks**: All fonts have appropriate fallback fonts defined

## Migration Notes

- **From Poppins**: The site previously used Poppins for body text, now uses Roboto
- **Geometos**: Already implemented and working correctly
- **New Addition**: EB Garamond is newly added for decorative elements

## Testing

To verify font implementation:

1. Check that headings use Geometos
2. Verify body text uses Roboto
3. Test utility classes for Garamond elements
4. Ensure fonts load properly across different devices
5. Validate accessibility with screen readers

