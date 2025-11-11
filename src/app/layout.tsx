import type { Metadata, Viewport } from "next";
import "./globals.css";
import ResponsiveNav from "@/components/Home/Navbar/ResponsiveNav";
import Footer from "@/components/Home/Footer/Footer";
import ScrollToTop from "@/components/Helper/ScrollToTop";
import GoogleMapsProvider from '@/providers/GoogleMapsProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import SessionProvider from '@/components/providers/SessionProvider';
import { Toaster } from '@/components/ui/toaster';
import { geometosNeue, bauziet, garamondPro, rubik, outfit } from './fonts';

export const metadata: Metadata = {
  title: "Summit Realty",
  description: "Summit Realty is a real estate company that provides a wide range of services to its clients. We are a team of experienced real estate agents who are dedicated to helping you find the perfect home or investment property.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
            <Toaster />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
