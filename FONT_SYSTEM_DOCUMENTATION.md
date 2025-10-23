# Font System Documentation

## Overview
This website uses a three-font system designed for optimal typography hierarchy and brand consistency:

1. **Outfit** - For heading elements
2. **Bauziet** - For body text  
3. **Garamond Pro** - For subheads, captions, initial caps, numbers, and decorative elements

## Font Implementation

### 1. Outfit (Headings)
- **Purpose**: All heading elements (h1-h6)
- **Implementation**: Google Fonts via Next.js
- **Weights Available**: 300, 400, 500, 600, 700, 800, 900
- **CSS Variable**: `--font-outfit`
- **Tailwind Class**: `font-outfit`

### 2. Bauziet (Body Text)
- **Purpose**: All body text, paragraphs, and general content
- **Implementation**: Local font files in `/public/fonts/Bauziet/`
- **Weights Available**: 300, 400, 500, 600, 700
- **CSS Variable**: `--font-bauziet`
- **Tailwind Class**: `font-bauziet` or `font-sans` (default)

### 3. Garamond Pro (Decorative Elements)
- **Purpose**: Subheads, captions, initial caps, numbers, and accessorizing elements
- **Implementation**: Local font files in `/public/fonts/Garamond Pro/`
- **Weights Available**: 400, 700 (with italic variants)
- **CSS Variable**: `--font-garamond-pro`
- **Tailwind Class**: `font-garamond` or `font-garamondPro`

## Usage Guidelines

### Automatic Font Assignment
- **Headings (h1-h6)**: Automatically use Outfit
- **Body text (p, div, span, etc.)**: Automatically use Bauziet
- **Numbers and decorative text**: Use utility classes

### Utility Classes

#### Font Family Classes
```css
.font-heading     /* Outfit for headings */
.font-body        /* Bauziet for body text */
.font-subhead     /* Garamond Pro for subheads */
.font-caption     /* Garamond Pro for captions (with small text) */
.font-initial-cap /* Garamond Pro for large initial caps */
.font-numbers     /* Garamond Pro for numbers */
```

#### Usage Examples
```jsx
// Heading with Outfit (automatic)
<h1>Main Title</h1>

// Body text with Bauziet (automatic)
<p>This is body text using Bauziet.</p>

// Subhead with Garamond Pro
<h2 className="font-subhead">Section Subtitle</h2>

// Caption with Garamond Pro
<span className="font-caption">Image caption text</span>

// Initial cap with Garamond Pro
<span className="font-initial-cap">D</span>rop cap text

// Numbers with Garamond Pro
<span className="font-numbers">$1,250,000</span>
```

## Garamond Pro Integration

### Current Setup
- **Garamond Pro** is implemented using local font files
- Font files are located in `/public/fonts/Garamond Pro/`
- Includes Regular, Italic, Bold, and Bold Italic variants
- No licensing restrictions for web usage (assuming proper licensing)

### Font Files Available
- `AGaramondPro-Regular.otf` (400 weight, normal)
- `AGaramondPro-Italic.otf` (400 weight, italic)
- `AGaramondPro-Bold.otf` (700 weight, normal)
- `AGaramondPro-BoldItalic.otf` (700 weight, italic)

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Font imports and configuration
│   ├── fonts.ts            # Local font definitions
│   └── globals.css         # Font CSS variables and utility classes
├── public/
│   └── fonts/              # Local font files
│       ├── Bauziet/        # Bauziet font files
│       ├── Garamond Pro/    # Garamond Pro font files
│       └── Geometos Neue/   # Geometos Neue font files (available but not used)
└── tailwind.config.ts      # Tailwind font family configuration
```

## CSS Variables

```css
:root {
  --font-outfit: 'Outfit', sans-serif;
  --font-bauziet: 'Bauziet', sans-serif;
  --font-garamond-pro: 'Garamond Pro', serif;
}
```

## Best Practices

1. **Consistency**: Use the established font hierarchy consistently across the site
2. **Performance**: Fonts are loaded with `display: swap` for optimal performance
3. **Accessibility**: Ensure sufficient contrast ratios with all font combinations
4. **Responsive**: Font sizes are responsive and scale appropriately
5. **Fallbacks**: All fonts have appropriate fallback fonts defined

## Migration Notes

- **From Roboto**: The site previously used Roboto for body text, now uses Bauziet
- **From Geometos**: Previously used Geometos for headings, now uses Outfit
- **Garamond Pro**: Implemented for decorative elements using local font files

## Testing

To verify font implementation:

1. Check that headings use Outfit
2. Verify body text uses Bauziet
3. Test utility classes for Garamond Pro elements
4. Ensure fonts load properly across different devices
5. Validate accessibility with screen readers

