import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Home | Property Insights & Details',
  description: 'Search for your property and view detailed insights, market analytics, and property information.',
  openGraph: {
    title: 'My Home | Property Insights & Details',
    description: 'Search for your property and view detailed insights, market analytics, and property information.',
    type: 'website',
  },
  alternates: {
    canonical: '/homeowner',
  },
};

export default function HomeownerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
