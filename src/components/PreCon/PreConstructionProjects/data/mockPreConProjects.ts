import type { PreConstructionProperty } from '../../PropertyCards/types';

// Mock data for pre-construction projects
// In a real app, this would come from an API or data service
export const mockPreConProjects: PreConstructionProperty[] = [
  {
    id: '1',
    projectName: 'Luxury Heights Condominiums',
    developer: 'Premium Developments Inc.',
    startingPrice: 450000,
    images: [
      '/images/p1.jpg',
      '/images/p2.jpg',
      '/images/p3.jpg',
    ],
    address: {
      street: '123 Main Street',
      city: 'Toronto',
      province: 'Ontario',
      latitude: 43.6532,
      longitude: -79.3832,
    },
    details: {
      propertyType: 'Condominium',
      bedroomRange: '1-3',
      bathroomRange: '1-2',
      sqftRange: '650-1,200',
      totalUnits: 150,
      availableUnits: 45,
    },
    completion: {
      date: 'Q4 2025',
      progress: 35,
    },
    features: ['Rooftop Terrace', 'Gym', 'Pool', 'Concierge'],
    depositStructure: '5% on signing, 10% within 6 months',
    status: 'selling',
  },
  {
    id: '2',
    projectName: 'Waterfront Residences',
    developer: 'Ocean View Developments',
    startingPrice: 680000,
    images: [
      '/images/p2.jpg',
      '/images/p3.jpg',
      '/images/p4.jpg',
    ],
    address: {
      street: '456 Harbor Drive',
      city: 'Vancouver',
      province: 'British Columbia',
      latitude: 49.2827,
      longitude: -123.1207,
    },
    details: {
      propertyType: 'Condominium',
      bedroomRange: '2-4',
      bathroomRange: '2-3',
      sqftRange: '1,000-1,800',
      totalUnits: 200,
      availableUnits: 120,
    },
    completion: {
      date: 'Q2 2026',
      progress: 15,
    },
    features: ['Waterfront Views', 'Marina Access', 'Spa', 'Restaurant'],
    depositStructure: '10% on signing, 5% every 6 months',
    status: 'selling',
  },
  {
    id: '3',
    projectName: 'Urban Loft District',
    developer: 'Metro Builders',
    startingPrice: 320000,
    images: [
      '/images/p3.jpg',
      '/images/p4.jpg',
      '/images/p5.jpg',
    ],
    address: {
      street: '789 Downtown Ave',
      city: 'Montreal',
      province: 'Quebec',
      latitude: 45.5017,
      longitude: -73.5673,
    },
    details: {
      propertyType: 'House',
      bedroomRange: '1-2',
      bathroomRange: '1-2',
      sqftRange: '550-950',
      totalUnits: 80,
      availableUnits: 25,
    },
    completion: {
      date: 'Q3 2025',
      progress: 60,
    },
    features: ['Exposed Brick', 'High Ceilings', 'Rooftop Garden'],
    depositStructure: '5% on signing',
    status: 'selling',
  },
  {
    id: '4',
    projectName: 'Mountain View Estates',
    developer: 'Alpine Homes',
    startingPrice: 850000,
    images: [
      '/images/p4.jpg',
      '/images/p5.jpg',
      '/images/p6.jpg',
    ],
    address: {
      street: '321 Mountain Road',
      city: 'Calgary',
      province: 'Alberta',
      latitude: 51.0447,
      longitude: -114.0719,
    },
    details: {
      propertyType: 'Townhouse',
      bedroomRange: '3-5',
      bathroomRange: '2.5-4',
      sqftRange: '1,500-2,500',
      totalUnits: 50,
      availableUnits: 12,
    },
    completion: {
      date: 'Q1 2026',
      progress: 25,
    },
    features: ['Mountain Views', 'Garage', 'Backyard', 'Fireplace'],
    depositStructure: '10% on signing, 5% at closing',
    status: 'coming-soon',
  },
];

