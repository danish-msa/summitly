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
			brand: {
				'cb-blue': '#012169',
				celestial: '#418FDE',
				'bright-blue': '#1F69FF',
				midnight: '#0A1730',
				slate: '#1B3C55',
				'smoky-gray': '#58718D',
				mist: '#BECAD7',
				glacier: '#DAE1E8',
				'icy-blue': '#F0F5FB',
				tide: '#BBCFEA'
			},
			cyan: {
				DEFAULT: 'hsl(var(--cyan))',
			},
			magenta: {
				DEFAULT: 'hsl(var(--magenta))',
			},
			'brand-red': {
				DEFAULT: 'hsl(var(--brand-red))',
			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-bauziet)',
  				'Bauziet',
  				'sans-serif'
  			],
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
  			},
  			'spin-slow': {
  				from: {
  					transform: 'rotate(0deg)'
  				},
  				to: {
  					transform: 'rotate(360deg)'
  				}
  			},
  			'spin-reverse': {
  				from: {
  					transform: 'rotate(360deg)'
  				},
  				to: {
  					transform: 'rotate(0deg)'
  				}
  			},
  			'pulse-glow': {
  				'0%, 100%': {
  					boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)'
  				},
  				'50%': {
  					boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)'
  				}
  			},
  			'map-grid': {
  				'0%': {
  					opacity: '0.1'
  				},
  				'50%': {
  					opacity: '0.3'
  				},
  				'100%': {
  					opacity: '0.1'
  				}
  			},
  			'location-pin': {
  				'0%, 100%': {
  					transform: 'translate(-50%, -50%) scale(1)'
  				},
  				'50%': {
  					transform: 'translate(-50%, -50%) scale(1.2)'
  				}
  			},
  			'progress-fill': {
  				'0%': {
  					width: '0%'
  				},
  				'100%': {
  					width: '100%'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-200px 0'
  				},
  				'100%': {
  					backgroundPosition: 'calc(200px + 100%) 0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'spin-slow': 'spin-slow 3s linear infinite',
  			'spin-reverse': 'spin-reverse 2s linear infinite',
  			'pulse-glow': 'pulse-glow 2s infinite',
  			'map-grid': 'map-grid 2s infinite',
  			'location-pin': 'location-pin 1.5s infinite',
  			'progress-fill': 'progress-fill 3s ease-out forwards',
  			shimmer: 'shimmer 1.5s infinite'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate")
  ],
} satisfies Config;
