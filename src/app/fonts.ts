import localFont from 'next/font/local'
import { Rubik, Outfit } from 'next/font/google'

// Geometos Neue - Main heading font
export const geometosNeue = localFont({
  src: [
    {
      path: '../../public/fonts/Geometos Neue/GeometosNeueExtraLight.otf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Geometos Neue/GeometosNeueLight.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Geometos Neue/GeometosNeue.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Geometos Neue/GeometosNeueBold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Geometos Neue/GeometosNeueExtraBold.otf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Geometos Neue/GeometosNeueBlack.otf',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Geometos Neue/GeometosNeueUltra.otf',
      weight: '950',
      style: 'normal',
    },
  ],
  variable: '--font-geometos-neue',
  display: 'swap',
})

// Bauziet - Body text font
export const bauziet = localFont({
  src: [
    {
      path: '../../public/fonts/Bauziet/Bauziet-Norm-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Bauziet/Bauziet-Norm-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Bauziet/Bauziet-Norm-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Bauziet/Bauziet-Norm-MediumItalic.otf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Bauziet/Bauziet-Norm-SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Bauziet/Bauziet-Norm-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-bauziet',
  display: 'swap',
})

// Garamond Pro - Subheaders and emphasis font
export const garamondPro = localFont({
  src: [
    {
      path: '../../public/fonts/Garamond Pro/AGaramondPro-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Garamond Pro/AGaramondPro-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Garamond Pro/AGaramondPro-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Garamond Pro/AGaramondPro-BoldItalic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-garamond-pro',
  display: 'swap',
})

// Rubik - Testing font for headings
// Using fallback configuration to handle network issues gracefully
export const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  preload: false, // Disable preload to reduce connection attempts
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial', 'sans-serif'], // Better fallback chain
})

// Outfit - Testing font for headings
// Using fallback configuration to handle network issues gracefully
export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  preload: false, // Disable preload to reduce connection attempts
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial', 'sans-serif'], // Better fallback chain
})