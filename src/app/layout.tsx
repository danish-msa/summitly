import type { Metadata } from "next";
import { Roboto, EB_Garamond } from "next/font/google";
import "./globals.css";
import ResponsiveNav from "@/components/Home/Navbar/ResponsiveNav";
import Footer from "@/components/Home/Footer/Footer";
import ScrollToTop from "@/components/Helper/ScrollToTop";
import GoogleMapsProvider from '@/providers/GoogleMapsProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import SessionProvider from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
// import { geometosNeue } from './fonts'; // Temporarily disabled due to Next.js 15 + Turbopack issues

// Roboto font for body text
const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: "--font-roboto",
  subsets: ["latin"],
});

// EB Garamond as fallback for Adobe Garamond Pro (free alternative)
const garamond = EB_Garamond({
  weight: ['400', '500', '600', '700'],
  variable: "--font-garamond",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Real Estate Project",
  description: "Real Estate Website using Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${garamond.variable}`}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
          <SessionProvider>
            <QueryProvider>
              <ResponsiveNav />
              
              <GoogleMapsProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                {children}
              </GoogleMapsProvider>
              
              <Footer />
              <ScrollToTop />
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
