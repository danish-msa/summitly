import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        accent: 'var(--accent-color)',
        background: 'var(--background-color)',
        text: 'var(--text-color)',
        backgroundgray: 'var(--backgroundgray-color)',
      },
      fontFamily: {
        sans: ["var(--font-display)", "sans-serif"],
        geometosNeue: ['GeometosNeue', 'sans-serif'],
      },
    }
  },
  plugins: [
    require('daisyui'),
  ],
} satisfies Config;
