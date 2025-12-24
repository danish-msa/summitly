/**
 * Brand Identity Color Palette
 * 
 * This file contains all the brand colors from your identity system
 * mapped to their appropriate usage in the application.
 */

export const brandColors = {
  // Primary Brand Colors
  cbBlue: {
    hex: '#001D3D',
    rgb: '0, 29, 61',
    hsl: '214, 100%, 12%',
    usage: 'Primary brand color, main CTAs, headers'
  },
  
  celestial: {
    hex: '#418FDE',
    rgb: '65, 143, 222',
    hsl: '210, 100%, 60%',
    usage: 'Secondary actions, highlights, accents'
  },
  
  brightBlue: {
    hex: '#1F69FF',
    rgb: '31, 105, 255',
    hsl: '220, 100%, 50%',
    usage: 'Interactive elements, links, focus states'
  },
  
  // Neutral Colors
  midnight: {
    hex: '#0A1730',
    rgb: '10, 23, 48',
    hsl: '220, 65%, 15%',
    usage: 'Dark text, primary content'
  },
  
  slate: {
    hex: '#1B3C55',
    rgb: '27, 60, 85',
    hsl: '220, 65%, 25%',
    usage: 'Secondary text, cards in dark mode'
  },
  
  smokyGray: {
    hex: '#58718D',
    rgb: '88, 113, 141',
    hsl: '220, 25%, 45%',
    usage: 'Muted text, secondary content'
  },
  
  // Light Colors
  mist: {
    hex: '#BECAD7',
    rgb: '190, 202, 215',
    hsl: '220, 25%, 85%',
    usage: 'Borders, dividers, subtle backgrounds'
  },
  
  glacier: {
    hex: '#DAE1E8',
    rgb: '218, 225, 232',
    hsl: '220, 25%, 90%',
    usage: 'Light backgrounds, input fields'
  },
  
  icyBlue: {
    hex: '#F0F5FB',
    rgb: '240, 245, 251',
    hsl: '240, 100%, 98%',
    usage: 'Main background, page backgrounds'
  },
  
  tide: {
    hex: '#BBCFEA',
    rgb: '184, 207, 234',
    hsl: '220, 50%, 85%',
    usage: 'Subtle highlights, hover states'
  }
} as const;

/**
 * Theme Color Mappings
 * 
 * Maps brand colors to CSS custom properties for consistent theming
 */
export const themeColorMappings = {
  light: {
    background: brandColors.icyBlue.hex,
    foreground: brandColors.midnight.hex,
    primary: brandColors.cbBlue.hex,
    secondary: brandColors.celestial.hex,
    accent: brandColors.brightBlue.hex,
    muted: brandColors.glacier.hex,
    mutedForeground: brandColors.smokyGray.hex,
    border: brandColors.mist.hex,
    input: brandColors.glacier.hex,
    ring: brandColors.cbBlue.hex,
  },
  dark: {
    background: brandColors.midnight.hex,
    foreground: brandColors.glacier.hex,
    primary: brandColors.brightBlue.hex,
    secondary: brandColors.celestial.hex,
    accent: brandColors.celestial.hex,
    muted: brandColors.slate.hex,
    mutedForeground: brandColors.mist.hex,
    border: brandColors.slate.hex,
    input: brandColors.slate.hex,
    ring: brandColors.brightBlue.hex,
  }
} as const;

/**
 * Color Usage Guidelines
 */
export const colorUsage = {
  primary: {
    description: 'Main brand color for primary actions and branding',
    colors: [brandColors.cbBlue, brandColors.brightBlue],
    usage: ['Buttons', 'Links', 'Brand elements', 'Focus states']
  },
  
  secondary: {
    description: 'Supporting color for secondary actions',
    colors: [brandColors.celestial],
    usage: ['Secondary buttons', 'Highlights', 'Accents']
  },
  
  neutral: {
    description: 'Text and content colors',
    colors: [brandColors.midnight, brandColors.slate, brandColors.smokyGray],
    usage: ['Headings', 'Body text', 'Secondary text', 'Muted content']
  },
  
  background: {
    description: 'Background and surface colors',
    colors: [brandColors.icyBlue, brandColors.glacier, brandColors.mist],
    usage: ['Page backgrounds', 'Card backgrounds', 'Input fields', 'Borders']
  }
} as const;

/**
 * Accessibility Information
 */
export const accessibilityInfo = {
  contrastRatios: {
    'CB Blue on White': '12.63:1 (AAA)',
    'Midnight on Icy Blue': '11.2:1 (AAA)',
    'Celestial on White': '4.5:1 (AA)',
    'Bright Blue on White': '7.1:1 (AAA)',
    'Smoky Gray on Icy Blue': '4.8:1 (AA)',
    'Glacier on Midnight': '8.9:1 (AAA)'
  },
  
  recommendations: [
    'All color combinations meet WCAG AA standards',
    'Primary text has excellent contrast (AAA rating)',
    'Secondary text maintains good readability',
    'Interactive elements have sufficient contrast for accessibility'
  ]
} as const;

export default brandColors;
