export const generateMockListingData = () => ({
  keyFacts: {
    "Property Type": "Single Family",
    "fOfeic": "Residential",
    "Class": "A",
    "CommercialProperty": "No",
    "Type": "Lease",
    "Price per Sq Ft": "$198",
    "Year Built": "2018",
    "Lot Size": "0.25 acres",
    "Square Feet": "2,450",
    "Bedrooms": "4",
    "Bathrooms": "3",
    "Garage": "2-car attached",
    "HOA Fee": "$150/month",
    "Property Tax": "$4,200/year"
  },
  listingHistory: [
    {
      dateStart: "2024-01-15",
      dateEnd: "2024-03-20",
      listPrice: "$485,000",
      price: "$485,000",
      event: "For Sale",
      listingId: "MLS-2024-001"
    },
    {
      dateStart: "2023-09-10",
      dateEnd: "2023-12-15",
      listPrice: "$495,000",
      price: "$475,000",
      event: "Sold",
      listingId: "MLS-2023-045"
    },
    {
      dateStart: "2023-06-01",
      dateEnd: "2023-08-30",
      listPrice: "$510,000",
      price: "$510,000",
      event: "For Sale",
      listingId: "MLS-2023-023"
    }
  ],
  pricePrediction: {
    lower: 450000,
    mid: 485000,
    higher: 520000,
    confidence: 85,
    appreciation: 12.5,
    rentalIncome: 2800
  },
  propertyDetails: {
    property: {
      "Property Type": "Single Family Residence",
      "Style": "Traditional",
      "Stories": "2",
      "Exterior": "Brick & Vinyl Siding",
      "Roof": "Asphalt Shingle",
      "Foundation": "Concrete Slab"
    },
    inside: {
      "Total Square Feet": 2450,
      "Living Area": 2200,
      "Bedrooms": 4,
      "Bathrooms": 3,
      "Half Baths": 1,
      "Fireplaces": 1,
      "Ceiling Height": "9 ft"
    },
    utilities: {
      "Heating": "Central Air",
      "Cooling": "Central Air",
      "Water": "Public",
      "Sewer": "Public",
      "Electric": "Public",
      "Gas": "Natural Gas"
    },
    building: {
      "Construction": "Frame",
      "Year Built": "2018",
      "Condition": "Excellent",
      "Roof Age": "6 years",
      "HVAC Age": "6 years",
      "Water Heater": "Electric"
    },
    parking: {
      "Garage Spaces": 2,
      "Driveway": "Concrete",
      "Parking Type": "Attached Garage",
      "Covered Spaces": 2
    },
    highlights: {
      "Updated Kitchen": "2022",
      "Hardwood Floors": "Main Level",
      "Granite Countertops": "Kitchen",
      "Stainless Appliances": "Kitchen",
      "Walk-in Closets": "Master Bedroom",
      "Crown Molding": "Living Areas"
    },
    land: {
      "Lot Size": "0.25 acres",
      "Lot Dimensions": "100x110",
      "Zoning": "Residential",
      "Topography": "Level",
      "View": "Neighborhood",
      "Fencing": "Privacy Fence"
    }
  },
  rooms: [
    {
      name: "Master Bedroom",
      dimensions: "16' x 14'",
      features: ["Walk-in Closet", "En-suite Bath", "Crown Molding"],
      level: "Second Floor"
    },
    {
      name: "Kitchen",
      dimensions: "12' x 10'",
      features: ["Granite Countertops", "Stainless Appliances", "Island", "Pantry"],
      level: "Main Floor"
    },
    {
      name: "Living Room",
      dimensions: "18' x 16'",
      features: ["Fireplace", "Hardwood Floors", "Crown Molding", "Large Windows"],
      level: "Main Floor"
    },
    {
      name: "Dining Room",
      dimensions: "12' x 10'",
      features: ["Hardwood Floors", "Crown Molding", "Chandelier"],
      level: "Main Floor"
    },
    {
      name: "Guest Bedroom 1",
      dimensions: "12' x 10'",
      features: ["Closet", "Window"],
      level: "Second Floor"
    },
    {
      name: "Guest Bedroom 2",
      dimensions: "11' x 9'",
      features: ["Closet", "Window"],
      level: "Second Floor"
    },
    {
      name: "Guest Bedroom 3",
      dimensions: "10' x 9'",
      features: ["Closet", "Window"],
      level: "Second Floor"
    }
  ],
  comparableSales: {
    count: 12,
    medianPrice: 475000,
    avgDaysOnMarket: 45
  }
});
