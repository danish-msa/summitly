import type { Metadata } from "next";
import "./globals.css";
import ResponsiveNav from "@/components/Home/Navbar/ResponsiveNav";
import Footer from "@/components/Home/Footer/Footer";
import ScrollToTop from "@/components/Helper/ScrollToTop";
import GoogleMapsProvider from '@/providers/GoogleMapsProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import SessionProvider from '@/components/providers/SessionProvider';
import { geometosNeue, bauziet, garamondPro, rubik, outfit } from './fonts';

export const metadata: Metadata = {
  title: "Real Estate Project",
  description: "Real Estate Website using Next.js",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geometosNeue.variable} ${bauziet.variable} ${garamondPro.variable} ${rubik.variable} ${outfit.variable}`}>
        <SessionProvider>
          <QueryProvider>
            <ResponsiveNav />
            
            <GoogleMapsProvider>
              {children}
            </GoogleMapsProvider>
            
            <Footer />
            <ScrollToTop />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
