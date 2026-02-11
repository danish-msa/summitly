import Rent from '@/components/Rent/Rent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Homes for Rent | Find Rental Properties',
  description: 'Find homes for rent. Browse rental listings, view photos, and connect with real estate agents.',
};

export default function RentPage() {
  return <Rent />;
}

