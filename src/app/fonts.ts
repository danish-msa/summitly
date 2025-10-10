import localFont from "next/font/local";

export const geometosNeue = localFont({
  src: [
    {
      path: "/fonts/GeometosNeueExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "/fonts/GeometosNeueLight.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "/fonts/GeometosNeue.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "/fonts/GeometosNeueBold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "/fonts/GeometosNeueExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "/fonts/GeometosNeueBoldBlack.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "/fonts/GeometosNeueBoldUltra.ttf",
      weight: "950",
      style: "normal",
    },
  ],
  variable: "--font-geometos-neue",
  display: "swap",
});
