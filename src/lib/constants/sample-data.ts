import { Agent, PropertyType, PropertyClass, City } from '@/lib/types';

// Sample agent data
export const agents: Agent[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    title: "Senior Real Estate Agent",
    phone: "(555) 123-4567",
    email: "sarah.johnson@example.com",
    bio: "With over 15 years of experience in the real estate market, Sarah specializes in luxury properties and has a keen eye for investment opportunities.",
    image: "/images/agent-1.jpg",
    socialMedia: {
      facebook: "https://facebook.com/sarahjohnson",
      twitter: "https://twitter.com/sarahjohnson",
      instagram: "https://instagram.com/sarahjohnson",
      linkedin: "https://linkedin.com/in/sarahjohnson"
    },
    specialties: ["Luxury Homes", "Investment Properties", "First-time Buyers"],
    languages: ["English", "Spanish"],
    reviews: 87,
    rating: 4.9,
    listings: 24
  },
  {
    id: 2,
    name: "Michael Chen",
    title: "Commercial Property Specialist",
    phone: "(555) 234-5678",
    email: "michael.chen@example.com",
    bio: "Michael has helped countless businesses find their perfect commercial space. His background in business administration gives him unique insights into client needs.",
    image: "/images/agent-2.jpg",
    socialMedia: {
      facebook: "https://facebook.com/michaelchen",
      linkedin: "https://linkedin.com/in/michaelchen"
    },
    specialties: ["Commercial Properties", "Office Spaces", "Retail Locations"],
    languages: ["English", "Mandarin", "Cantonese"],
    reviews: 62,
    rating: 4.8,
    listings: 18
  },
  {
    id: 3,
    name: "Jessica Rodriguez",
    title: "Residential Sales Expert",
    phone: "(555) 345-6789",
    email: "jessica.rodriguez@example.com",
    bio: "Jessica is passionate about helping families find their dream homes. Her attention to detail and negotiation skills have earned her a loyal client base.",
    image: "/images/agent-3.jpg",
    socialMedia: {
      instagram: "https://instagram.com/jessicarodriguez",
      facebook: "https://facebook.com/jessicarodriguez",
      twitter: "https://twitter.com/jessicarodriguez"
    },
    specialties: ["Family Homes", "Suburban Properties", "Relocation Services"],
    languages: ["English", "Spanish"],
    reviews: 93,
    rating: 4.7,
    listings: 31
  },
  {
    id: 4,
    name: "David Thompson",
    title: "Luxury Property Consultant",
    phone: "(555) 456-7890",
    email: "david.thompson@example.com",
    bio: "David specializes in high-end properties and has a network of exclusive clients. His background in interior design helps clients visualize potential in every space.",
    image: "/images/agent-4.jpg",
    socialMedia: {
      linkedin: "https://linkedin.com/in/davidthompson",
      instagram: "https://instagram.com/davidthompson"
    },
    specialties: ["Luxury Estates", "Waterfront Properties", "Celebrity Homes"],
    languages: ["English", "French"],
    reviews: 45,
    rating: 4.9,
    listings: 12
  }
];

// Update static data to include class property
export const appartmentTypeData: PropertyType[] = [
  {
    id: 1,
    icon: "/images/a1.png",
    type: "House",
    number: 12,
    class: "residential"
  },
  {
    id: 2,
    icon: "/images/a2.png",
    type: "Appartments",
    number: 22,
    class: "residential"
  },
  {
    id: 3,
    icon: "/images/a3.png",
    type: "Office",
    number: 14,
    class: "commercial"
  },
  {
    id: 4,
    icon: "/images/a4.png",
    type: "Villa",
    number: 9,
    class: "residential"
  },
  {
    id: 5,
    icon: "/images/a5.png",
    type: "TownHouse",
    number: 12,
    class: "residential"
  },
];

export const properties = [
  {
    id: 1,
    propertyName: "Equestrian Family Home",
    location: "New York City, CA, USA",
    bedrooms: 1,
    type: "House",
    bathrooms: 2,
    size: 1200,
    price: 45000,
    imageUrl: "/images/p1.jpg",
  },
  {
    id: 2,
    propertyName: "Modern Urban Retreat",
    location: "Brooklyn, NY, USA",
    bedrooms: 2,
    type: "Appartments",
    bathrooms: 1,
    size: 950,
    price: 50000,
    imageUrl: "/images/p2.jpg",
  },
  {
    id: 3,
    propertyName: "Cozy Countryside Cottage",
    location: "Albany, NY, USA",
    type: "House",
    bedrooms: 3,
    bathrooms: 2,
    size: 1300,
    price: 60000,
    imageUrl: "/images/p3.jpg",
  },
  {
    id: 4,
    propertyName: "Luxury Downtown Apartment",
    location: "Manhattan, NY, USA",
    type: "Appartments",
    bedrooms: 1,
    bathrooms: 1,
    size: 800,
    price: 75000,
    imageUrl: "/images/p4.jpg",
  },
  {
    id: 5,
    propertyName: "Spacious Suburban House",
    location: "Staten Island, NY, USA",
    type: "House",
    bedrooms: 4,
    bathrooms: 3,
    size: 2000,
    price: 90000,
    imageUrl: "/images/p5.jpg",
  },
  {
    id: 6,
    propertyName: "Chic Studio Loft",
    location: "Queens, NY, USA",
    type: "Office",
    bedrooms: 1,
    bathrooms: 1,
    size: 700,
    price: 48000,
    imageUrl: "/images/p6.jpg",
  },
];

export const cities: City[] = [
  {
    id: 1,
    image: "/images/c1.jpg",
    cityName: "New York",
    numberOfProperties: 120,
  },
  {
    id: 2,
    image: "/images/c2.jpg",
    cityName: "Los Angeles",
    numberOfProperties: 85,
  },
  {
    id: 3,
    image: "/images/c3.jpg",
    cityName: "Chicago",
    numberOfProperties: 95,
  },
  {
    id: 4,
    image: "/images/c4.jpg",
    cityName: "San Francisco",
    numberOfProperties: 60,
  },
  {
    id: 5,
    image: "/images/c5.jpg",
    cityName: "Miami",
    numberOfProperties: 70,
  },
  {
    id: 6,
    image: "/images/c6.jpg",
    cityName: "Boston",
    numberOfProperties: 50,
  },
];

export const buildings = [
  {
    id: 1,
    title: "Secure Parking",
    description: "Safe parking with 24/7 surveillance.",
    image: "/images/h1.png",
  },
  {
    id: 2,
    title: "Luxury Swimming Pool",
    description: "A pristine pool for relaxation.",
    image: "/images/h2.png",
  },
  {
    id: 3,
    title: "24/7 Private Security",
    description: "Round-the-clock private security.",
    image: "/images/h3.png",
  },
  {
    id: 4,
    title: "On-Site Medical Center",
    description: "Immediate medical care on-site.",
    image: "/images/h4.png",
  },
  {
    id: 5,
    title: "Quiet Library Area",
    description: "Peaceful space for reading and study.",
    image: "/images/h5.png",
  },
  {
    id: 6,
    title: "King-Size Comfort Beds",
    description: "Luxurious king-size beds for comfort.",
    image: "/images/h6.png",
  },
];

export const blogs = [
  {
    id: 1,
    date: "02 Apr 2024",
    comment: "Comments (3)",
    title: "Find the Perfect Advertiser for Your Needs",
    shortDescription:
      "Find the right advertiser to effectively boost your business.",
    image: "/images/p1.jpg",
  },
  {
    id: 2,
    date: "05 Apr 2024",
    comment: "Comments (2)",
    title: "Maximize Your Business Growth with Smart Marketing",
    shortDescription:
      "Grow your business using smart, effective marketing strategies.",
    image: "/images/p2.jpg",
  },
  {
    id: 3,
    date: "10 Apr 2024",
    comment: "Comments (5)",
    title: "Tips for Choosing the Right Property to Invest In",
    shortDescription:
      "Select the best properties for secure and profitable investments.",
    image: "/images/p3.jpg",
  },
];

export const userReviewData = [
  {
    id: 1,
    name: "John Doe",
    profession: "Real Estate Agent",
    userImage: "/images/u1.jpg",
    review:
      "A wonderful experience! The platform made it easy to find exactly what I needed.",
  },
  {
    id: 2,
    name: "Mike Smith",
    profession: "Property Investor",
    userImage: "/images/u2.jpg",
    review:
      "Great selection of properties and seamless process. Highly recommended for anyone looking to invest.",
  },
  {
    id: 3,
    name: "Alex Johnson",
    profession: "Home Buyer",
    userImage: "/images/u3.jpg",
    review:
      "The website helped me find my dream home quickly and hassle-free. Exceptional service!",
  },
  {
    id: 4,
    name: "Emily Clark",
    profession: "Interior Designer",
    userImage: "/images/u4.jpg",
    review:
      "Fantastic range of properties with clear details. The best platform for home and design inspiration!",
  },
];

export const services = [
  {
    id: 1,
    name: "Buy A New Home",
    description: "Discover your dream home effortlessly. Explore diverse properties and expert guidance for a seamless buying experience.",
    serviceImage: "/images/home-1.png",
    serviceURL: "/buy",
  },
  {
    id: 2,
    name: "Sell a home",
    description: "Sell confidently with expert guidance and effective strategies, showcasing your property's best features for a successful sale.",
    serviceImage: "/images/home-2.png",
    serviceURL: "/sell",
  },
  {
    id: 3,
    name: "Rent a home",
    description: "Discover your perfect rental effortlessly. Explore a diverse variety of listings tailored precisely to suit your unique lifestyle needs.",
    serviceImage: "/images/home-3.png",
    serviceURL: "/rent",
  }
];
