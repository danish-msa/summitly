import localFont from "next/font/local";

// Simplified font configuration for Next.js 15 + Turbopack compatibility
export const geometosNeue = localFont({
  src: [
    {
      path: "../../public/fonts/GeometosNeue.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/GeometosNeueBold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-geometos-neue",
  display: "swap",
  fallback: ['system-ui', 'arial'],
});
