import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        // Brand colors (direct access)
        brand: {
          'cb-blue': '#012169',
          'celestial': '#418FDE',
          'bright-blue': '#1F69FF',
          'midnight': '#0A1730',
          'slate': '#1B3C55',
          'smoky-gray': '#58718D',
          'mist': '#BECAD7',
          'glacier': '#DAE1E8',
          'icy-blue': '#F0F5FB',
          'tide': '#BBCFEA'
        }
      },
      fontFamily: {
        // Body text - Bauziet
        sans: [
          'var(--font-bauziet)',
          'Bauziet',
          'sans-serif'
        ],
        // Headings - Geometos Neue
        geometos: [
          'var(--font-geometos-neue)',
          'GeometosNeue',
          'sans-serif'
        ],
        geometosNeue: [
          'var(--font-geometos-neue)',
          'GeometosNeue',
          'sans-serif'
        ],
        // Subheads, captions, initial caps, numbers - Garamond Pro
        garamond: [
          'var(--font-garamond-pro)',
          'Garamond Pro',
          'serif'
        ],
        garamondPro: [
          'var(--font-garamond-pro)',
          'Garamond Pro',
          'serif'
        ],
        // Body text - Bauziet
        bauziet: [
          'var(--font-bauziet)',
          'Bauziet',
          'sans-serif'
        ]
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [
    require("tailwindcss-animate")
  ],
} satisfies Config;
