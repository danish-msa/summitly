import type { Metadata } from "next";
import "./globals.css";
import ResponsiveNav from "@/components/Home/Navbar/ResponsiveNav";
import Footer from "@/components/Home/Footer/Footer";
import ScrollToTop from "@/components/Helper/ScrollToTop";
import GoogleMapsProvider from '@/providers/GoogleMapsProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import SessionProvider from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { geometosNeue, bauziet, garamondPro } from './fonts';

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
      <body className={`${geometosNeue.variable} ${bauziet.variable} ${garamondPro.variable}`}>
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
