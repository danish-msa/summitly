import { PropertyListing } from '@/lib/types';
import { UnitListing } from '@/lib/types/units';

/**
 * Mock Pre-Construction Data
 * 
 * This file contains comprehensive mock data for pre-construction properties
 * including project details, development team information, and detailed unit listings.
 */

// ============================================================================
// UNIT DATA
// ============================================================================

export const mockUnitsLuxuryHeights: UnitListing[] = [
  {
    id: 'luxury-heights-101',
    name: '101',
    beds: '1',
    baths: '1',
    sqft: 650,
    images: ['/images/floorplan-1.jpg'],
    status: 'for-sale',
    maintenanceFee: 350,
    price: 450000,
    description: 'Spacious 1-bedroom unit with modern finishes and great natural light. This beautifully designed unit features an open-concept layout, perfect for urban living. The kitchen includes stainless steel appliances and quartz countertops, while the living area offers plenty of space for relaxation and entertainment.',
    features: ['Balcony', 'In-suite Laundry', 'Hardwood Floors', 'Modern Kitchen', 'Stainless Steel Appliances', 'Quartz Countertops', 'Floor-to-Ceiling Windows'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Rooftop Deck', 'Spa', 'Lounge']
  },
  {
    id: 'luxury-heights-102',
    name: '102',
    beds: '1',
    baths: '1',
    sqft: 680,
    images: ['/images/floorplan-1.jpg'],
    status: 'sold-out',
    maintenanceFee: 360,
    price: 465000,
    description: 'Cozy 1-bedroom unit with modern finishes and excellent city views.',
    features: ['Balcony', 'In-suite Laundry', 'Hardwood Floors', 'City Views'],
    amenities: ['Pool', 'Gym', 'Concierge']
  },
  {
    id: 'luxury-heights-201',
    name: '201',
    beds: '2',
    baths: '1',
    sqft: 850,
    images: ['/images/floorplan-2.jpg'],
    status: 'for-sale',
    maintenanceFee: 450,
    price: 580000,
    description: 'Beautiful 2-bedroom corner unit with stunning city views. This corner unit offers exceptional natural light and panoramic views. The spacious layout includes a large master bedroom with walk-in closet, modern kitchen, and a private balcony perfect for outdoor dining.',
    features: ['Corner Unit', 'Large Balcony', 'In-suite Laundry', 'Hardwood Floors', 'Walk-in Closet', 'City Views', 'Open Concept'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Rooftop Deck', 'Spa', 'Private Dining Room']
  },
  {
    id: 'luxury-heights-202',
    name: '202',
    beds: '2',
    baths: '1',
    sqft: 880,
    images: ['/images/floorplan-2.jpg'],
    status: 'sold-out',
    maintenanceFee: 470,
    price: 590000,
    description: 'Beautiful 2-bedroom unit with great views and modern amenities.',
    features: ['Large Balcony', 'In-suite Laundry', 'Hardwood Floors', 'City Views'],
    amenities: ['Pool', 'Gym', 'Concierge']
  },
  {
    id: 'luxury-heights-301',
    name: '301',
    beds: '2',
    baths: '2',
    sqft: 950,
    images: ['/images/floorplan-3.jpg'],
    status: 'for-sale',
    maintenanceFee: 520,
    price: 650000,
    description: 'Premium 2-bedroom, 2-bathroom unit with premium finishes. This luxurious unit features high-end finishes throughout, including premium hardwood flooring, custom cabinetry, and designer fixtures. The master suite includes an ensuite bathroom with soaker tub.',
    features: ['Premium Finishes', 'Large Balcony', 'In-suite Laundry', 'Hardwood Floors', 'Walk-in Closet', 'Ensuite Bathroom', 'Soaker Tub', 'Custom Cabinetry'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Rooftop Deck', 'Spa', 'Private Dining Room', 'Wine Cellar']
  },
  {
    id: 'luxury-heights-401',
    name: '401',
    beds: '3',
    baths: '2',
    sqft: 1200,
    images: ['/images/floorplan-4.jpg'],
    status: 'for-sale',
    maintenanceFee: 650,
    price: 780000,
    description: 'Spacious 3-bedroom family unit with premium amenities. Perfect for families, this large unit offers three bedrooms, two full bathrooms, and a den that can be used as a home office or additional bedroom. The open-concept kitchen and living area provide ample space for family gatherings.',
    features: ['Family Unit', 'Large Balcony', 'In-suite Laundry', 'Hardwood Floors', 'Walk-in Closet', 'Den', 'Home Office Space', 'Gourmet Kitchen'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Rooftop Deck', 'Spa', 'Kids Play Area', 'Party Room', 'Media Room']
  },
  {
    id: 'luxury-heights-501',
    name: '501',
    beds: '3',
    baths: '3',
    sqft: 1450,
    images: ['/images/floorplan-5.jpg'],
    status: 'for-sale',
    maintenanceFee: 780,
    price: 950000,
    description: 'Luxury penthouse-style unit with premium finishes and panoramic views. This exceptional unit features three bedrooms, three bathrooms, and a spacious den. The master suite includes a walk-in closet and luxurious ensuite with double vanity and soaker tub.',
    features: ['Penthouse Style', 'Panoramic Views', 'Large Balcony', 'Premium Finishes', 'Walk-in Closet', 'Ensuite Bathroom', 'Double Vanity', 'Soaker Tub', 'Gourmet Kitchen', 'Wine Storage'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Rooftop Deck', 'Spa', 'Private Dining Room', 'Wine Cellar', 'Media Room']
  }
];

export const mockUnitsWaterfront: UnitListing[] = [
  {
    id: 'waterfront-201',
    name: '201',
    beds: '2',
    baths: '2',
    sqft: 1000,
    images: ['/images/floorplan-2.jpg'],
    status: 'for-sale',
    maintenanceFee: 480,
    price: 680000,
    description: 'Stunning 2-bedroom waterfront unit with breathtaking ocean views. This corner unit features floor-to-ceiling windows, a spacious balcony, and premium finishes throughout.',
    features: ['Waterfront Views', 'Corner Unit', 'Large Balcony', 'In-suite Laundry', 'Hardwood Floors', 'Ocean Views', 'Premium Finishes'],
    amenities: ['Marina Access', 'Pool', 'Gym', 'Concierge', 'Spa', 'Restaurant', 'Rooftop Deck']
  },
  {
    id: 'waterfront-301',
    name: '301',
    beds: '3',
    baths: '2',
    sqft: 1300,
    images: ['/images/floorplan-3.jpg'],
    status: 'for-sale',
    maintenanceFee: 620,
    price: 850000,
    description: 'Spacious 3-bedroom unit with panoramic waterfront views and premium amenities.',
    features: ['Waterfront Views', 'Large Balcony', 'In-suite Laundry', 'Hardwood Floors', 'Walk-in Closet', 'Gourmet Kitchen'],
    amenities: ['Marina Access', 'Pool', 'Gym', 'Concierge', 'Spa', 'Restaurant']
  },
  {
    id: 'waterfront-401',
    name: '401',
    beds: '4',
    baths: '3',
    sqft: 1800,
    images: ['/images/floorplan-4.jpg'],
    status: 'for-sale',
    maintenanceFee: 850,
    price: 1200000,
    description: 'Luxury 4-bedroom penthouse with exceptional waterfront views and premium finishes.',
    features: ['Penthouse', 'Waterfront Views', 'Large Balcony', 'Premium Finishes', 'Walk-in Closet', 'Ensuite Bathroom', 'Gourmet Kitchen', 'Wine Storage'],
    amenities: ['Marina Access', 'Pool', 'Gym', 'Concierge', 'Spa', 'Restaurant', 'Private Dining Room']
  }
];

export const mockUnitsUrbanLoft: UnitListing[] = [
  {
    id: 'urban-loft-101',
    name: '101',
    beds: '1',
    baths: '1',
    sqft: 600,
    images: ['/images/floorplan-1.jpg'],
    status: 'for-sale',
    maintenanceFee: 320,
    price: 420000,
    description: 'Modern 1-bedroom loft-style unit with high ceilings and industrial design elements.',
    features: ['Loft Style', 'High Ceilings', 'Industrial Design', 'In-suite Laundry', 'Concrete Floors', 'Exposed Brick'],
    amenities: ['Rooftop Terrace', 'Gym', 'Co-working Space', 'Bike Storage']
  },
  {
    id: 'urban-loft-201',
    name: '201',
    beds: '2',
    baths: '1',
    sqft: 900,
    images: ['/images/floorplan-2.jpg'],
    status: 'for-sale',
    maintenanceFee: 420,
    price: 550000,
    description: 'Spacious 2-bedroom loft with modern finishes and great natural light.',
    features: ['Loft Style', 'High Ceilings', 'Large Windows', 'In-suite Laundry', 'Modern Kitchen'],
    amenities: ['Rooftop Terrace', 'Gym', 'Co-working Space', 'Bike Storage', 'Lounge']
  }
];

export const mockUnitsDetachedHomes: UnitListing[] = [
  {
    id: 'detached-estates-101',
    name: '101',
    beds: '4',
    baths: '3',
    sqft: 2500,
    images: ['/images/floorplan-4.jpg'],
    status: 'for-sale',
    maintenanceFee: 0,
    price: 1200000,
    description: 'Spacious 4-bedroom detached home with modern finishes and large backyard. Perfect for families seeking luxury and space.',
    features: ['Double Garage', 'Large Backyard', 'Finished Basement', 'Hardwood Floors', 'Gourmet Kitchen', 'Master Ensuite', 'Walk-in Closet'],
    amenities: ['Community Park', 'Walking Trails', 'Playground']
  },
  {
    id: 'detached-estates-102',
    name: '102',
    beds: '5',
    baths: '4',
    sqft: 3200,
    images: ['/images/floorplan-5.jpg'],
    status: 'for-sale',
    maintenanceFee: 0,
    price: 1450000,
    description: 'Luxury 5-bedroom detached home with premium finishes and exceptional outdoor space.',
    features: ['Triple Garage', 'Large Backyard', 'Finished Basement', 'Premium Hardwood', 'Gourmet Kitchen', 'Master Ensuite', 'Walk-in Closet', 'Home Office'],
    amenities: ['Community Park', 'Walking Trails', 'Playground', 'Tennis Courts']
  },
  {
    id: 'detached-estates-103',
    name: '103',
    beds: '3',
    baths: '2',
    sqft: 2000,
    images: ['/images/floorplan-3.jpg'],
    status: 'for-sale',
    maintenanceFee: 0,
    price: 950000,
    description: 'Charming 3-bedroom detached home ideal for first-time buyers or downsizers.',
    features: ['Single Garage', 'Backyard', 'Hardwood Floors', 'Modern Kitchen', 'Master Ensuite'],
    amenities: ['Community Park', 'Walking Trails']
  }
];

export const mockUnitsSemiDetached: UnitListing[] = [
  {
    id: 'semi-detached-village-101',
    name: '101',
    beds: '3',
    baths: '2',
    sqft: 1800,
    images: ['/images/floorplan-3.jpg'],
    status: 'for-sale',
    maintenanceFee: 0,
    price: 750000,
    description: 'Modern 3-bedroom semi-detached home with contemporary design and private backyard.',
    features: ['Single Garage', 'Private Backyard', 'Hardwood Floors', 'Modern Kitchen', 'Master Ensuite', 'Walk-in Closet'],
    amenities: ['Community Centre', 'Parks', 'Schools Nearby']
  },
  {
    id: 'semi-detached-village-102',
    name: '102',
    beds: '4',
    baths: '3',
    sqft: 2200,
    images: ['/images/floorplan-4.jpg'],
    status: 'for-sale',
    maintenanceFee: 0,
    price: 880000,
    description: 'Spacious 4-bedroom semi-detached home perfect for growing families.',
    features: ['Double Garage', 'Private Backyard', 'Finished Basement', 'Hardwood Floors', 'Gourmet Kitchen', 'Master Ensuite'],
    amenities: ['Community Centre', 'Parks', 'Schools Nearby', 'Shopping']
  }
];

export const mockUnitsTownhomes: UnitListing[] = [
  {
    id: 'townhome-collection-101',
    name: '101',
    beds: '3',
    baths: '2',
    sqft: 1600,
    images: ['/images/floorplan-3.jpg'],
    status: 'for-sale',
    maintenanceFee: 250,
    price: 680000,
    description: 'Modern 3-bedroom townhome with attached garage and private patio.',
    features: ['Attached Garage', 'Private Patio', 'Hardwood Floors', 'Modern Kitchen', 'Master Ensuite', 'Walk-in Closet'],
    amenities: ['Community Pool', 'Fitness Centre', 'Parks', 'Playground']
  },
  {
    id: 'townhome-collection-102',
    name: '102',
    beds: '4',
    baths: '3',
    sqft: 2000,
    images: ['/images/floorplan-4.jpg'],
    status: 'for-sale',
    maintenanceFee: 320,
    price: 820000,
    description: 'Spacious 4-bedroom townhome with premium finishes and private yard.',
    features: ['Attached Garage', 'Private Yard', 'Finished Basement', 'Premium Hardwood', 'Gourmet Kitchen', 'Master Ensuite'],
    amenities: ['Community Pool', 'Fitness Centre', 'Parks', 'Playground', 'Clubhouse']
  },
  {
    id: 'townhome-collection-103',
    name: '103',
    beds: '2',
    baths: '2',
    sqft: 1400,
    images: ['/images/floorplan-2.jpg'],
    status: 'for-sale',
    maintenanceFee: 200,
    price: 580000,
    description: 'Cozy 2-bedroom townhome perfect for young professionals or couples.',
    features: ['Attached Garage', 'Private Patio', 'Hardwood Floors', 'Modern Kitchen', 'Ensuite Bathroom'],
    amenities: ['Community Pool', 'Fitness Centre', 'Parks']
  }
];

// ============================================================================
// PRE-CONSTRUCTION PROJECT DATA
// ============================================================================

export const mockPreConProjects: Record<string, PropertyListing> = {
  'luxury-heights-condominiums': {
    mlsNumber: 'luxury-heights-condominiums',
    status: 'selling',
    class: 'residential',
    type: 'Sale',
    listPrice: 450000,
    listDate: new Date('2024-01-15').toISOString(),
    lastStatus: 'selling',
    soldPrice: '',
    soldDate: '',
    address: {
      area: null,
      city: 'Toronto',
      country: 'Canada',
      district: null,
      majorIntersection: 'Main Street & King Street',
      neighborhood: 'Downtown',
      streetDirection: null,
      streetName: 'Main Street',
      streetNumber: '123',
      streetSuffix: null,
      unitNumber: null,
      zip: 'M5H 2N2',
      state: 'Ontario',
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: '123 Main Street, Toronto, Ontario M5H 2N2'
    },
    map: {
      latitude: 43.6532,
      longitude: -79.3832,
      point: null
    },
    details: {
      numBathrooms: 2,
      numBathroomsPlus: 2,
      numBedrooms: 2,
      numBedroomsPlus: 2,
      propertyType: 'Condominium',
      sqft: 850
    },
    updatedOn: new Date().toISOString(),
    lot: {
      acres: 0,
      depth: 0,
      irregular: 0,
      legalDescription: 'Experience luxury living at its finest. Luxury Heights Condominiums offers a perfect blend of modern design and premium amenities.',
      measurement: '',
      width: 0,
      size: 0,
      source: '',
      dimensionsSource: '',
      dimensions: '',
      squareFeet: 850,
      features: '',
      taxLot: ''
    },
    boardId: 0,
    images: {
      imageUrl: '/images/p1.jpg',
      allImages: [
        '/images/p1.jpg',
        '/images/p2.jpg',
        '/images/p3.jpg',
        '/images/p4.jpg',
        '/images/p5.jpg'
      ]
    },
    preCon: {
      projectName: 'Luxury Heights Condominiums',
      developer: 'Premium Developments Inc.',
      startingPrice: 450000,
      priceRange: {
        min: 450000,
        max: 950000
      },
      status: 'selling',
      completion: {
        date: 'Q4 2025',
        progress: 35
      },
      details: {
        bedroomRange: '1-3',
        bathroomRange: '1-3',
        sqftRange: '650-1,450',
        totalUnits: 150,
        availableUnits: 45,
        storeys: 25
      },
      features: ['Rooftop Terrace', 'Gym', 'Pool', 'Concierge', 'Spa', 'Lounge'],
      amenities: [
        'Pet Spa',
        'Spa',
        'Kids Play Room',
        'Private Dining Room',
        'Coffee Bar',
        'Lobby',
        'Lounge',
        'Steam Room',
        'Yoga Studio',
        'Party Room',
        'Conference Rooms',
        'Spin Room',
        'Pool',
        'Fitness Centre',
        'Games Room',
        'Visitor Parking',
        'Screening Room',
        'Porte Cochere',
        'Co Working Space',
        'Billiard Table',
        'Sauna',
        'Training Studio',
        'Media Room',
        'Indoor Childrens Play Spaces',
        'Outdoor Childrens Play Spaces',
        'Parents Lounge',
        'Meditation Garden',
        'Private Treatment Room',
        'Laundry Room',
        'Storage Room',
        'Dining Area',
        'BBQ Permitted',
        'Catering Kitchen',
        'Concierge',
        'Gym',
        'Indoor Child Play Area',
        'Outdoor Patio',
        'Parcel Storage',
        'Rooftop Deck',
        'Library',
        'Billiards / Table Tennis Room',
        'Coin Laundry',
        'On-Site Laundry',
        'Storage',
        'Dining Room',
        'Wine Cellar'
      ],
      depositStructure: '5% on signing, 10% within 6 months, 5% at occupancy',
      description: 'Experience luxury living at its finest. Luxury Heights Condominiums offers a perfect blend of modern design and premium amenities. Located in the heart of the city, this pre-construction project features spacious units with stunning views, world-class amenities, and a prime location close to shopping, dining, and entertainment. Don\'t miss this opportunity to own a piece of luxury before completion.',
      documents: [
        {
          id: 'luxury-heights-brochure',
          name: 'Luxury Heights Condominiums - Project Brochure',
          url: '/documents/luxury-heights-brochure.pdf',
          type: 'brochure',
          size: '2.5 MB',
          uploadedDate: new Date('2024-01-15').toISOString()
        },
        {
          id: 'luxury-heights-floorplan-1br',
          name: '1 Bedroom Floor Plans',
          url: '/documents/luxury-heights-1br-floorplans.pdf',
          type: 'floorplan',
          size: '1.8 MB',
          uploadedDate: new Date('2024-01-20').toISOString()
        },
        {
          id: 'luxury-heights-floorplan-2br',
          name: '2 Bedroom Floor Plans',
          url: '/documents/luxury-heights-2br-floorplans.pdf',
          type: 'floorplan',
          size: '2.1 MB',
          uploadedDate: new Date('2024-01-20').toISOString()
        },
        {
          id: 'luxury-heights-specifications',
          name: 'Building Specifications & Features',
          url: '/documents/luxury-heights-specifications.pdf',
          type: 'specification',
          size: '3.2 MB',
          uploadedDate: new Date('2024-02-01').toISOString()
        },
        {
          id: 'luxury-heights-purchase-agreement',
          name: 'Standard Purchase Agreement Template',
          url: '/documents/luxury-heights-purchase-agreement.pdf',
          type: 'contract',
          size: '850 KB',
          uploadedDate: new Date('2024-02-10').toISOString()
        }
      ],
      developmentTeam: {
        overview: 'Our world-class development team brings together decades of experience in luxury residential development, combining innovative design, exceptional craftsmanship, and sustainable building practices to create this landmark project.',
        developer: {
          name: 'Premium Developments Inc.',
          description: 'A leading real estate developer with over 30 years of experience in creating exceptional residential communities. Known for their commitment to quality, innovation, and sustainable development practices.',
          website: 'https://premiumdevelopments.com',
          stats: {
            totalProjects: 15,
            activelySelling: 5,
            launchingSoon: 2,
            registrationPhase: 3,
            soldOut: 3,
            resale: 2,
            cancelled: 0
          }
        },
        architect: {
          name: 'Modern Architecture Group',
          description: 'Award-winning architectural firm specializing in contemporary residential design. Their innovative approach to space and light has earned them recognition in the industry.',
          website: 'https://modernarch.com',
          stats: {
            totalProjects: 12,
            activelySelling: 4,
            launchingSoon: 2,
            registrationPhase: 2,
            soldOut: 3,
            resale: 1,
            cancelled: 0
          }
        },
        interiorDesigner: {
          name: 'Luxury Interiors Studio',
          description: 'Renowned interior design firm creating sophisticated and timeless living spaces. Their attention to detail and use of premium materials sets them apart in the industry.',
          website: 'https://luxuryinteriors.com',
          stats: {
            totalProjects: 10,
            activelySelling: 3,
            launchingSoon: 1,
            registrationPhase: 2,
            soldOut: 3,
            resale: 1,
            cancelled: 0
          }
        },
        builder: {
          name: 'Elite Construction Ltd.',
          description: 'Premium construction company with a proven track record of delivering high-quality residential projects on time and within budget. Known for their craftsmanship and attention to detail.',
          website: 'https://eliteconstruction.com',
          stats: {
            totalProjects: 18,
            activelySelling: 6,
            launchingSoon: 3,
            registrationPhase: 4,
            soldOut: 4,
            resale: 1,
            cancelled: 0
          }
        },
        landscapeArchitect: {
          name: 'GreenScape Design',
          description: 'Leading landscape architecture firm creating beautiful outdoor spaces that enhance the living experience. Their sustainable and innovative designs have won multiple awards.',
          website: 'https://greenscape.com',
          stats: {
            totalProjects: 8,
            activelySelling: 3,
            launchingSoon: 1,
            registrationPhase: 1,
            soldOut: 2,
            resale: 1,
            cancelled: 0
          }
        },
        marketing: {
          name: 'Prime Realty Marketing',
          description: 'Specialized marketing agency focused on luxury real estate. Their strategic approach and creative campaigns have successfully launched numerous high-profile developments.',
          website: 'https://primerealtymarketing.com',
          stats: {
            totalProjects: 20,
            activelySelling: 7,
            launchingSoon: 3,
            registrationPhase: 5,
            soldOut: 4,
            resale: 1,
            cancelled: 0
          }
        }
      }
    }
  },
  'waterfront-residences': {
    mlsNumber: 'waterfront-residences',
    status: 'selling',
    class: 'residential',
    type: 'Sale',
    listPrice: 680000,
    listDate: new Date('2024-02-01').toISOString(),
    lastStatus: 'selling',
    soldPrice: '',
    soldDate: '',
    address: {
      area: null,
      city: 'Vancouver',
      country: 'Canada',
      district: null,
      majorIntersection: 'Harbor Drive & Waterfront',
      neighborhood: 'Waterfront',
      streetDirection: null,
      streetName: 'Harbor Drive',
      streetNumber: '456',
      streetSuffix: null,
      unitNumber: null,
      zip: 'V6B 1A1',
      state: 'British Columbia',
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: '456 Harbor Drive, Vancouver, British Columbia V6B 1A1'
    },
    map: {
      latitude: 49.2827,
      longitude: -123.1207,
      point: null
    },
    details: {
      numBathrooms: 2,
      numBathroomsPlus: 2,
      numBedrooms: 2,
      numBedroomsPlus: 2,
      propertyType: 'Condominium',
      sqft: 1000
    },
    updatedOn: new Date().toISOString(),
    lot: {
      acres: 0,
      depth: 0,
      irregular: 0,
      legalDescription: 'Luxury waterfront living with stunning ocean views and marina access.',
      measurement: '',
      width: 0,
      size: 0,
      source: '',
      dimensionsSource: '',
      dimensions: '',
      squareFeet: 1000,
      features: '',
      taxLot: ''
    },
    boardId: 0,
    images: {
      imageUrl: '/images/p2.jpg',
      allImages: [
        '/images/p2.jpg',
        '/images/p3.jpg',
        '/images/p4.jpg',
        '/images/p5.jpg',
        '/images/p1.jpg'
      ]
    },
    preCon: {
      projectName: 'Waterfront Residences',
      developer: 'Ocean View Developments',
      startingPrice: 680000,
      priceRange: {
        min: 680000,
        max: 1200000
      },
      status: 'selling',
      completion: {
        date: 'Q2 2026',
        progress: 15
      },
      details: {
        bedroomRange: '2-4',
        bathroomRange: '2-3',
        sqftRange: '1,000-1,800',
        totalUnits: 200,
        availableUnits: 120,
        storeys: 30
      },
      features: ['Waterfront Views', 'Marina Access', 'Spa', 'Restaurant', 'Rooftop Deck'],
      amenities: [
        'Marina Access',
        'Pool',
        'Gym',
        'Concierge',
        'Spa',
        'Restaurant',
        'Rooftop Deck',
        'Private Dining Room',
        'Wine Cellar',
        'Fitness Centre',
        'Steam Room',
        'Sauna',
        'Yoga Studio',
        'Games Room',
        'Visitor Parking',
        'Screening Room',
        'Co Working Space',
        'Media Room',
        'Outdoor Patio',
        'BBQ Permitted',
        'Storage',
        'Library'
      ],
      depositStructure: '10% on signing, 5% every 6 months until occupancy',
      description: 'Luxury waterfront living awaits at Waterfront Residences. This exceptional pre-construction development offers stunning ocean views, direct marina access, and world-class amenities. Located in the heart of Vancouver\'s waterfront district, this project combines modern architecture with the natural beauty of the Pacific Northwest. Each unit is designed to maximize views and natural light, creating a truly exceptional living experience.',
      documents: [
        {
          id: 'waterfront-brochure',
          name: 'Waterfront Residences - Project Brochure',
          url: '/documents/waterfront-residences-brochure.pdf',
          type: 'brochure',
          size: '3.1 MB',
          uploadedDate: new Date('2024-02-15').toISOString()
        },
        {
          id: 'waterfront-floorplans',
          name: 'Complete Floor Plan Collection',
          url: '/documents/waterfront-residences-floorplans.pdf',
          type: 'floorplan',
          size: '4.5 MB',
          uploadedDate: new Date('2024-02-20').toISOString()
        },
        {
          id: 'waterfront-specifications',
          name: 'Building Specifications',
          url: '/documents/waterfront-residences-specifications.pdf',
          type: 'specification',
          size: '2.8 MB',
          uploadedDate: new Date('2024-03-01').toISOString()
        }
      ],
      developmentTeam: {
        overview: 'A collaboration of industry leaders bringing together expertise in waterfront development, sustainable design, and luxury living.',
        developer: {
          name: 'Ocean View Developments',
          description: 'Specialized in waterfront and coastal developments with over 25 years of experience creating exceptional residential communities.',
          website: 'https://oceanviewdevelopments.com',
          stats: {
            totalProjects: 12,
            activelySelling: 4,
            launchingSoon: 2,
            registrationPhase: 2,
            soldOut: 3,
            resale: 1,
            cancelled: 0
          }
        },
        architect: {
          name: 'Coastal Architecture Studio',
          description: 'Award-winning firm specializing in waterfront architecture and sustainable coastal design.',
          website: 'https://coastalarch.com',
          stats: {
            totalProjects: 10,
            activelySelling: 3,
            launchingSoon: 2,
            registrationPhase: 2,
            soldOut: 2,
            resale: 1,
            cancelled: 0
          }
        },
        interiorDesigner: {
          name: 'Maritime Interiors',
          description: 'Luxury interior design firm known for creating sophisticated coastal-inspired living spaces.',
          website: 'https://maritimeinteriors.com',
          stats: {
            totalProjects: 8,
            activelySelling: 2,
            launchingSoon: 1,
            registrationPhase: 2,
            soldOut: 2,
            resale: 1,
            cancelled: 0
          }
        },
        builder: {
          name: 'Pacific Builders Group',
          description: 'Premium construction company with expertise in waterfront and high-rise residential projects.',
          website: 'https://pacificbuilders.com',
          stats: {
            totalProjects: 15,
            activelySelling: 5,
            launchingSoon: 3,
            registrationPhase: 3,
            soldOut: 3,
            resale: 1,
            cancelled: 0
          }
        },
        landscapeArchitect: {
          name: 'Coastal Landscapes',
          description: 'Specialized in creating beautiful waterfront outdoor spaces that complement the natural environment.',
          website: 'https://coastallandscapes.com',
          stats: {
            totalProjects: 7,
            activelySelling: 2,
            launchingSoon: 1,
            registrationPhase: 1,
            soldOut: 2,
            resale: 1,
            cancelled: 0
          }
        },
        marketing: {
          name: 'Waterfront Marketing Solutions',
          description: 'Specialized marketing agency for luxury waterfront properties and developments.',
          website: 'https://waterfrontmarketing.com',
          stats: {
            totalProjects: 18,
            activelySelling: 6,
            launchingSoon: 3,
            registrationPhase: 4,
            soldOut: 4,
            resale: 1,
            cancelled: 0
          }
        }
      }
    }
  },
  'urban-loft-district': {
    mlsNumber: 'urban-loft-district',
    status: 'coming-soon',
    class: 'residential',
    type: 'Sale',
    listPrice: 420000,
    listDate: new Date('2024-03-01').toISOString(),
    lastStatus: 'coming-soon',
    soldPrice: '',
    soldDate: '',
    address: {
      area: null,
      city: 'Montreal',
      country: 'Canada',
      district: null,
      majorIntersection: 'Saint-Laurent & Sherbrooke',
      neighborhood: 'Plateau',
      streetDirection: null,
      streetName: 'Saint-Laurent Boulevard',
      streetNumber: '789',
      streetSuffix: null,
      unitNumber: null,
      zip: 'H2W 1Y1',
      state: 'Quebec',
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: '789 Saint-Laurent Boulevard, Montreal, Quebec H2W 1Y1'
    },
    map: {
      latitude: 45.5088,
      longitude: -73.5878,
      point: null
    },
    details: {
      numBathrooms: 1,
      numBathroomsPlus: 1,
      numBedrooms: 1,
      numBedroomsPlus: 1,
      propertyType: 'Condominium',
      sqft: 600
    },
    updatedOn: new Date().toISOString(),
    lot: {
      acres: 0,
      depth: 0,
      irregular: 0,
      legalDescription: 'Modern loft-style living in the heart of Montreal\'s vibrant Plateau neighborhood.',
      measurement: '',
      width: 0,
      size: 0,
      source: '',
      dimensionsSource: '',
      dimensions: '',
      squareFeet: 600,
      features: '',
      taxLot: ''
    },
    boardId: 0,
    images: {
      imageUrl: '/images/p3.jpg',
      allImages: [
        '/images/p3.jpg',
        '/images/p4.jpg',
        '/images/p5.jpg',
        '/images/p1.jpg',
        '/images/p2.jpg'
      ]
    },
    preCon: {
      projectName: 'Urban Loft District',
      developer: 'Metro Developments',
      startingPrice: 420000,
      priceRange: {
        min: 420000,
        max: 750000
      },
      status: 'coming-soon',
      completion: {
        date: 'Q3 2026',
        progress: 5
      },
      details: {
        bedroomRange: '1-2',
        bathroomRange: '1-2',
        sqftRange: '600-1,200',
        totalUnits: 100,
        availableUnits: 100,
        storeys: 12
      },
      features: ['Loft Style', 'High Ceilings', 'Industrial Design', 'Rooftop Terrace'],
      amenities: [
        'Rooftop Terrace',
        'Gym',
        'Co-working Space',
        'Bike Storage',
        'Lounge',
        'Games Room',
        'Visitor Parking',
        'Storage',
        'Outdoor Patio',
        'BBQ Permitted',
        'Library',
        'Media Room'
      ],
      depositStructure: '5% on signing, 5% at foundation, 5% at occupancy',
      description: 'Urban Loft District brings modern loft-style living to Montreal\'s vibrant Plateau neighborhood. This innovative development features high ceilings, industrial design elements, and contemporary finishes. Perfect for young professionals and creatives, the project offers a unique living experience in one of the city\'s most desirable neighborhoods.',
      developmentTeam: {
        overview: 'A team of innovative designers and builders creating unique urban living spaces.',
        developer: {
          name: 'Metro Developments',
          description: 'Specialized in urban infill and adaptive reuse projects, bringing new life to city neighborhoods.',
          website: 'https://metrodevelopments.com',
          stats: {
            totalProjects: 8,
            activelySelling: 3,
            launchingSoon: 2,
            registrationPhase: 1,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        },
        architect: {
          name: 'Urban Design Collective',
          description: 'Innovative architectural firm specializing in contemporary urban residential design.',
          website: 'https://urbandesigncollective.com',
          stats: {
            totalProjects: 6,
            activelySelling: 2,
            launchingSoon: 2,
            registrationPhase: 1,
            soldOut: 1,
            resale: 0,
            cancelled: 0
          }
        },
        interiorDesigner: {
          name: 'Industrial Interiors',
          description: 'Specialized in industrial and loft-style interior design with modern aesthetics.',
          website: 'https://industrialinteriors.com',
          stats: {
            totalProjects: 5,
            activelySelling: 2,
            launchingSoon: 1,
            registrationPhase: 1,
            soldOut: 1,
            resale: 0,
            cancelled: 0
          }
        },
        builder: {
          name: 'City Builders Inc.',
          description: 'Experienced urban construction company specializing in infill and adaptive reuse projects.',
          website: 'https://citybuilders.com',
          stats: {
            totalProjects: 10,
            activelySelling: 4,
            launchingSoon: 2,
            registrationPhase: 2,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        },
        landscapeArchitect: {
          name: 'Urban Gardens Design',
          description: 'Creating green spaces in urban environments with sustainable and innovative designs.',
          website: 'https://urbangardens.com',
          stats: {
            totalProjects: 5,
            activelySelling: 2,
            launchingSoon: 1,
            registrationPhase: 1,
            soldOut: 1,
            resale: 0,
            cancelled: 0
          }
        },
        marketing: {
          name: 'Urban Marketing Group',
          description: 'Marketing agency focused on urban lifestyle and contemporary living.',
          website: 'https://urbanmarketing.com',
          stats: {
            totalProjects: 12,
            activelySelling: 5,
            launchingSoon: 3,
            registrationPhase: 2,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        }
      }
    }
  },
  'detached-estates': {
    mlsNumber: 'detached-estates',
    status: 'selling',
    class: 'residential',
    type: 'Sale',
    listPrice: 1200000,
    listDate: new Date('2024-04-01').toISOString(),
    lastStatus: 'selling',
    soldPrice: '',
    soldDate: '',
    address: {
      area: null,
      city: 'Oakville',
      country: 'Canada',
      district: null,
      majorIntersection: 'Trafalgar Road & Dundas Street',
      neighborhood: 'Glen Abbey',
      streetDirection: null,
      streetName: 'Abbey Lane',
      streetNumber: '456',
      streetSuffix: null,
      unitNumber: null,
      zip: 'L6M 2X1',
      state: 'Ontario',
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: '456 Abbey Lane, Oakville, Ontario L6M 2X1'
    },
    map: {
      latitude: 43.4474,
      longitude: -79.6665,
      point: null
    },
    details: {
      numBathrooms: 3,
      numBathroomsPlus: 3,
      numBedrooms: 4,
      numBedroomsPlus: 4,
      propertyType: 'Detached',
      sqft: 2500
    },
    updatedOn: new Date().toISOString(),
    lot: {
      acres: 0.15,
      depth: 120,
      irregular: 0,
      legalDescription: 'Luxury detached homes in prestigious Oakville neighborhood with spacious lots and premium finishes.',
      measurement: '',
      width: 50,
      size: 0.15,
      source: '',
      dimensionsSource: '',
      dimensions: '50 x 120',
      squareFeet: 6000,
      features: 'Large Backyard, Double Garage',
      taxLot: ''
    },
    boardId: 0,
    images: {
      imageUrl: '/images/p4.jpg',
      allImages: [
        '/images/p4.jpg',
        '/images/p5.jpg',
        '/images/p1.jpg',
        '/images/p2.jpg',
        '/images/p3.jpg'
      ]
    },
    preCon: {
      projectName: 'Detached Estates',
      developer: 'Elite Home Builders',
      startingPrice: 950000,
      priceRange: {
        min: 950000,
        max: 1450000
      },
      status: 'selling',
      completion: {
        date: 'Q2 2026',
        progress: 20
      },
      details: {
        bedroomRange: '3-5',
        bathroomRange: '2-4',
        sqftRange: '2,000-3,200',
        totalUnits: 45,
        availableUnits: 32,
        storeys: 2
      },
      features: ['Double Garage', 'Large Backyard', 'Finished Basement', 'Premium Finishes'],
      amenities: [
        'Community Park',
        'Walking Trails',
        'Playground',
        'Tennis Courts',
        'Schools Nearby',
        'Shopping Nearby'
      ],
      depositStructure: '10% on signing, 5% at foundation, 5% at occupancy',
      description: 'Detached Estates offers luxury single-family homes in the prestigious Glen Abbey neighborhood of Oakville. These spacious detached homes feature premium finishes, large backyards, and modern designs perfect for families. Each home includes a double or triple garage, finished basement, and exceptional outdoor living spaces.',
      developmentTeam: {
        overview: 'A team of experienced builders specializing in luxury detached home construction.',
        developer: {
          name: 'Elite Home Builders',
          description: 'Premium home builder with over 20 years of experience creating luxury detached homes in the GTA.',
          website: 'https://elitehomebuilders.com',
          stats: {
            totalProjects: 10,
            activelySelling: 4,
            launchingSoon: 2,
            registrationPhase: 2,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        },
        architect: {
          name: 'Residential Design Studio',
          description: 'Specialized in modern detached home architecture with focus on family living.',
          website: 'https://residentialdesign.com',
          stats: {
            totalProjects: 8,
            activelySelling: 3,
            launchingSoon: 1,
            registrationPhase: 2,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        },
        builder: {
          name: 'Elite Home Builders',
          description: 'Experienced construction company specializing in high-quality detached home construction.',
          website: 'https://elitehomebuilders.com',
          stats: {
            totalProjects: 10,
            activelySelling: 4,
            launchingSoon: 2,
            registrationPhase: 2,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        }
      }
    }
  },
  'semi-detached-village': {
    mlsNumber: 'semi-detached-village',
    status: 'selling',
    class: 'residential',
    type: 'Sale',
    listPrice: 750000,
    listDate: new Date('2024-05-01').toISOString(),
    lastStatus: 'selling',
    soldPrice: '',
    soldDate: '',
    address: {
      area: null,
      city: 'Brampton',
      country: 'Canada',
      district: null,
      majorIntersection: 'Bovaird Drive & Chinguacousy Road',
      neighborhood: 'Springdale',
      streetDirection: null,
      streetName: 'Village Way',
      streetNumber: '789',
      streetSuffix: null,
      unitNumber: null,
      zip: 'L6R 1Y2',
      state: 'Ontario',
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: '789 Village Way, Brampton, Ontario L6R 1Y2'
    },
    map: {
      latitude: 43.7315,
      longitude: -79.7624,
      point: null
    },
    details: {
      numBathrooms: 2,
      numBathroomsPlus: 2,
      numBedrooms: 3,
      numBedroomsPlus: 3,
      propertyType: 'Semi-Detached',
      sqft: 1800
    },
    updatedOn: new Date().toISOString(),
    lot: {
      acres: 0.08,
      depth: 100,
      irregular: 0,
      legalDescription: 'Modern semi-detached homes in family-friendly Brampton neighborhood.',
      measurement: '',
      width: 35,
      size: 0.08,
      source: '',
      dimensionsSource: '',
      dimensions: '35 x 100',
      squareFeet: 3500,
      features: 'Private Backyard, Garage',
      taxLot: ''
    },
    boardId: 0,
    images: {
      imageUrl: '/images/p5.jpg',
      allImages: [
        '/images/p5.jpg',
        '/images/p1.jpg',
        '/images/p2.jpg',
        '/images/p3.jpg',
        '/images/p4.jpg'
      ]
    },
    preCon: {
      projectName: 'Semi-Detached Village',
      developer: 'Family Homes Development',
      startingPrice: 750000,
      priceRange: {
        min: 750000,
        max: 880000
      },
      status: 'selling',
      completion: {
        date: 'Q3 2026',
        progress: 10
      },
      details: {
        bedroomRange: '3-4',
        bathroomRange: '2-3',
        sqftRange: '1,800-2,200',
        totalUnits: 60,
        availableUnits: 48,
        storeys: 2
      },
      features: ['Private Backyard', 'Garage', 'Modern Design', 'Energy Efficient'],
      amenities: [
        'Community Centre',
        'Parks',
        'Schools Nearby',
        'Shopping',
        'Transit Access',
        'Playground'
      ],
      depositStructure: '5% on signing, 5% at foundation, 5% at occupancy',
      description: 'Semi-Detached Village offers modern semi-detached homes in the family-friendly Springdale neighborhood of Brampton. These homes feature contemporary designs, private backyards, and attached garages. Perfect for families seeking affordability without compromising on quality and space.',
      developmentTeam: {
        overview: 'A development team focused on creating quality family homes.',
        developer: {
          name: 'Family Homes Development',
          description: 'Specialized in building affordable family homes in the GTA.',
          website: 'https://familyhomesdev.com',
          stats: {
            totalProjects: 12,
            activelySelling: 5,
            launchingSoon: 3,
            registrationPhase: 2,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        },
        builder: {
          name: 'Family Homes Development',
          description: 'Experienced builder of semi-detached and townhome communities.',
          website: 'https://familyhomesdev.com',
          stats: {
            totalProjects: 12,
            activelySelling: 5,
            launchingSoon: 3,
            registrationPhase: 2,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        }
      }
    }
  },
  'townhome-collection': {
    mlsNumber: 'townhome-collection',
    status: 'selling',
    class: 'residential',
    type: 'Sale',
    listPrice: 680000,
    listDate: new Date('2024-06-01').toISOString(),
    lastStatus: 'selling',
    soldPrice: '',
    soldDate: '',
    address: {
      area: null,
      city: 'Mississauga',
      country: 'Canada',
      district: null,
      majorIntersection: 'Hurontario Street & Eglinton Avenue',
      neighborhood: 'Meadowvale',
      streetDirection: null,
      streetName: 'Collection Drive',
      streetNumber: '321',
      streetSuffix: null,
      unitNumber: null,
      zip: 'L5N 2M3',
      state: 'Ontario',
      communityCode: null,
      streetDirectionPrefix: null,
      addressKey: null,
      location: '321 Collection Drive, Mississauga, Ontario L5N 2M3'
    },
    map: {
      latitude: 43.5890,
      longitude: -79.6441,
      point: null
    },
    details: {
      numBathrooms: 2,
      numBathroomsPlus: 2,
      numBedrooms: 3,
      numBedroomsPlus: 3,
      propertyType: 'Townhouse',
      sqft: 1600
    },
    updatedOn: new Date().toISOString(),
    lot: {
      acres: 0,
      depth: 0,
      irregular: 0,
      legalDescription: 'Modern townhome community in Mississauga with premium amenities.',
      measurement: '',
      width: 0,
      size: 0,
      source: '',
      dimensionsSource: '',
      dimensions: '',
      squareFeet: 1600,
      features: 'Attached Garage, Private Patio',
      taxLot: ''
    },
    boardId: 0,
    images: {
      imageUrl: '/images/p1.jpg',
      allImages: [
        '/images/p1.jpg',
        '/images/p2.jpg',
        '/images/p3.jpg',
        '/images/p4.jpg',
        '/images/p5.jpg'
      ]
    },
    preCon: {
      projectName: 'Townhome Collection',
      developer: 'Urban Living Developments',
      startingPrice: 580000,
      priceRange: {
        min: 580000,
        max: 820000
      },
      status: 'selling',
      completion: {
        date: 'Q4 2026',
        progress: 8
      },
      details: {
        bedroomRange: '2-4',
        bathroomRange: '2-3',
        sqftRange: '1,400-2,000',
        totalUnits: 120,
        availableUnits: 95,
        storeys: 3
      },
      features: ['Attached Garage', 'Private Patio/Yard', 'Modern Design', 'Low Maintenance'],
      amenities: [
        'Community Pool',
        'Fitness Centre',
        'Parks',
        'Playground',
        'Clubhouse',
        'Walking Trails',
        'BBQ Areas'
      ],
      depositStructure: '5% on signing, 5% at foundation, 5% at occupancy',
      description: 'Townhome Collection offers modern townhomes in the desirable Meadowvale neighborhood of Mississauga. These thoughtfully designed homes feature attached garages, private patios or yards, and access to premium community amenities. Perfect for families and professionals seeking low-maintenance living with modern conveniences.',
      developmentTeam: {
        overview: 'A development team specializing in modern townhome communities.',
        developer: {
          name: 'Urban Living Developments',
          description: 'Specialized in creating modern townhome communities with premium amenities.',
          website: 'https://urbanlivingdev.com',
          stats: {
            totalProjects: 15,
            activelySelling: 6,
            launchingSoon: 4,
            registrationPhase: 3,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        },
        architect: {
          name: 'Townhome Design Group',
          description: 'Specialized in modern townhome architecture maximizing space and functionality.',
          website: 'https://townhomedesign.com',
          stats: {
            totalProjects: 12,
            activelySelling: 5,
            launchingSoon: 3,
            registrationPhase: 2,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        },
        builder: {
          name: 'Urban Living Developments',
          description: 'Experienced builder of modern townhome communities.',
          website: 'https://urbanlivingdev.com',
          stats: {
            totalProjects: 15,
            activelySelling: 6,
            launchingSoon: 4,
            registrationPhase: 3,
            soldOut: 1,
            resale: 1,
            cancelled: 0
          }
        }
      }
    }
  }
};

// ============================================================================
// UNIT MAPPING - Maps project IDs to their units
// ============================================================================

export const mockPreConUnits: Record<string, UnitListing[]> = {
  'luxury-heights-condominiums': mockUnitsLuxuryHeights,
  'waterfront-residences': mockUnitsWaterfront,
  'urban-loft-district': mockUnitsUrbanLoft,
  'detached-estates': mockUnitsDetachedHomes,
  'semi-detached-village': mockUnitsSemiDetached,
  'townhome-collection': mockUnitsTownhomes
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get pre-construction project data by ID
 */
export const getPreConProject = (projectId: string): PropertyListing | null => {
  return mockPreConProjects[projectId] || null;
};

/**
 * Get units for a specific pre-construction project
 */
export const getPreConUnits = (projectId: string): UnitListing[] => {
  return mockPreConUnits[projectId] || [];
};

/**
 * Get a specific unit by project ID and unit ID
 */
export const getPreConUnit = (projectId: string, unitId: string): UnitListing | null => {
  const units = getPreConUnits(projectId);
  return units.find(unit => unit.id === unitId) || null;
};

/**
 * Get all pre-construction projects
 */
export const getAllPreConProjects = (): PropertyListing[] => {
  return Object.values(mockPreConProjects);
};

/**
 * Get all available units across all projects
 */
export const getAllPreConUnits = (): UnitListing[] => {
  return Object.values(mockPreConUnits).flat();
};

