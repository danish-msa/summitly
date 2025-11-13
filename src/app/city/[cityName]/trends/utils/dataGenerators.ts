import { PropertyListing } from '@/lib/types';
import { calculateAvgPrice } from './helpers';

// Sales Volume Data Types
export interface SalesVolumeRow {
  bedroom: string;
  current: number;
  threeMonthsAgo: number;
  sixMonthsAgo: number;
  oneYearAgo: number;
  yoyChange: number;
}

export interface SalesVolumeData {
  detached: SalesVolumeRow[];
  townhouse: SalesVolumeRow[];
  condo: SalesVolumeRow[];
}

// Inventory Data Types
export interface InventoryRow {
  bedroom: string;
  newListings: number;
  soldListings: number;
  activeListings: number;
  daysOnMarket: number;
  saleToList: number;
}

export interface InventoryData {
  detached: InventoryRow[];
  townhouse: InventoryRow[];
  condo: InventoryRow[];
}

// Ranking Data Types
export interface RankingPriceRow {
  rank: number;
  city: string;
  averagePrice: number;
  medianPrice: number;
  isCurrentCity: boolean;
}

export interface RankingGrowthRow {
  rank: number;
  city: string;
  priceGrowth: number;
  isCurrentCity: boolean;
}

export interface RankingDaysRow {
  rank: number;
  city: string;
  daysOnMarket: number;
  isCurrentCity: boolean;
}

export interface RankingTurnoverRow {
  rank: number;
  city: string;
  turnover: number;
  isCurrentCity: boolean;
}

export interface RankingData {
  price: RankingPriceRow[];
  growth: RankingGrowthRow[];
  daysOnMarket: RankingDaysRow[];
  turnover: RankingTurnoverRow[];
}

// Generate Sales Volume Mock Data
export const generateSalesVolumeMockData = (): SalesVolumeData => {
  const baseSalesData = {
    detached: {
      1: { base: 5, distribution: [0.1, 0.15, 0.2, 0.25, 0.3] },
      2: { base: 12, distribution: [0.2, 0.25, 0.3, 0.25] },
      3: { base: 18, distribution: [0.25, 0.3, 0.25, 0.2] },
      4: { base: 8, distribution: [0.15, 0.2, 0.25, 0.4] },
      all: { base: 43, distribution: [0.2, 0.25, 0.25, 0.3] }
    },
    townhouse: {
      1: { base: 8, distribution: [0.15, 0.2, 0.25, 0.4] },
      2: { base: 15, distribution: [0.25, 0.3, 0.25, 0.2] },
      3: { base: 20, distribution: [0.3, 0.25, 0.25, 0.2] },
      4: { base: 6, distribution: [0.1, 0.15, 0.25, 0.5] },
      all: { base: 49, distribution: [0.25, 0.25, 0.25, 0.25] }
    },
    condo: {
      1: { base: 25, distribution: [0.3, 0.25, 0.25, 0.2] },
      2: { base: 30, distribution: [0.35, 0.3, 0.2, 0.15] },
      3: { base: 15, distribution: [0.25, 0.3, 0.25, 0.2] },
      4: { base: 5, distribution: [0.2, 0.25, 0.25, 0.3] },
      all: { base: 75, distribution: [0.3, 0.28, 0.22, 0.2] }
    }
  };

  const generatePropertyTypeData = (propertyType: 'detached' | 'townhouse' | 'condo'): SalesVolumeRow[] => {
    const bedrooms = [1, 2, 3, 4, 'all'];
    
    return bedrooms.map(bedroom => {
      const bedKey = bedroom === 'all' ? 'all' : bedroom;
      const bedData = baseSalesData[propertyType][bedKey as keyof typeof baseSalesData.detached];
      
      const current = Math.round(bedData.base * bedData.distribution[0]);
      const threeMonthsAgo = Math.round(bedData.base * bedData.distribution[1]);
      const sixMonthsAgo = Math.round(bedData.base * bedData.distribution[2]);
      const oneYearAgo = Math.round(bedData.base * bedData.distribution[3]);
      
      const totalCurrent = current + threeMonthsAgo + sixMonthsAgo;
      const totalOneYearAgo = oneYearAgo;
      const yoyChange = totalOneYearAgo > 0 
        ? ((totalCurrent - (oneYearAgo * 3)) / (oneYearAgo * 3)) * 100 
        : 0;
      
      return {
        bedroom: bedroom === 'all' ? 'All' : `${bedroom} Bd`,
        current,
        threeMonthsAgo,
        sixMonthsAgo,
        oneYearAgo,
        yoyChange: Math.round(yoyChange)
      };
    });
  };

  return {
    detached: generatePropertyTypeData('detached'),
    townhouse: generatePropertyTypeData('townhouse'),
    condo: generatePropertyTypeData('condo')
  };
};

// Generate Average Sold Price Data
export const generateAverageSoldPriceData = (properties: PropertyListing[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const basePrice = calculateAvgPrice(properties) || 1400000;
  const prices = months.map((_, index) => {
    const variation = 1 + (Math.sin(index * Math.PI / 6) * 0.1) - 0.05;
    return Math.round(basePrice * variation);
  });
  return { months, prices };
};

// Generate Sales Volume Graph Data
export const generateSalesVolumeData = (tableData: SalesVolumeData) => {
  const months = ['Nov 24', 'Dec 24', 'Jan 25', 'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov'];
  
  const detachedTotal = tableData.detached.find(r => r.bedroom === 'All')?.current || 43;
  const townhouseTotal = tableData.townhouse.find(r => r.bedroom === 'All')?.current || 49;
  const condoTotal = tableData.condo.find(r => r.bedroom === 'All')?.current || 75;
  
  const detachedData = months.map((_, index) => {
    const base = detachedTotal;
    const variation = 0.7 + (Math.sin(index * Math.PI / 6) * 0.3);
    return Math.round(base * variation);
  });
  
  const townhouseData = months.map((_, index) => {
    const base = townhouseTotal;
    const variation = 0.75 + (Math.cos(index * Math.PI / 6) * 0.25);
    return Math.round(base * variation);
  });
  
  const condoData = months.map((_, index) => {
    const base = condoTotal;
    const variation = 0.8 + (Math.sin((index + 2) * Math.PI / 6) * 0.2);
    return Math.round(base * variation);
  });
  
  return {
    months,
    detached: detachedData,
    townhouse: townhouseData,
    condo: condoData
  };
};

// Generate Inventory Overview Data
export const generateInventoryOverviewData = () => {
  return {
    newListings: 1269,
    homesSold: 434,
    avgDaysOnMarket: 27,
    saleToListRatio: 96
  };
};

// Generate Inventory Table Data
export const generateInventoryTableData = (): InventoryData => {
  const baseInventoryData = {
    detached: {
      1: { newListings: 12, soldListings: 5, activeListings: 45, daysOnMarket: 32, saleToList: 98 },
      2: { newListings: 28, soldListings: 12, activeListings: 78, daysOnMarket: 25, saleToList: 97 },
      3: { newListings: 45, soldListings: 18, activeListings: 120, daysOnMarket: 22, saleToList: 96 },
      4: { newListings: 18, soldListings: 8, activeListings: 65, daysOnMarket: 28, saleToList: 95 },
      all: { newListings: 103, soldListings: 43, activeListings: 308, daysOnMarket: 26, saleToList: 96 }
    },
    townhouse: {
      1: { newListings: 15, soldListings: 8, activeListings: 52, daysOnMarket: 28, saleToList: 97 },
      2: { newListings: 32, soldListings: 15, activeListings: 95, daysOnMarket: 24, saleToList: 96 },
      3: { newListings: 48, soldListings: 20, activeListings: 142, daysOnMarket: 21, saleToList: 95 },
      4: { newListings: 12, soldListings: 6, activeListings: 38, daysOnMarket: 30, saleToList: 94 },
      all: { newListings: 107, soldListings: 49, activeListings: 327, daysOnMarket: 25, saleToList: 95 }
    },
    condo: {
      1: { newListings: 85, soldListings: 65, activeListings: 245, daysOnMarket: 18, saleToList: 98 },
      2: { newListings: 120, soldListings: 90, activeListings: 320, daysOnMarket: 15, saleToList: 97 },
      3: { newListings: 45, soldListings: 35, activeListings: 125, daysOnMarket: 20, saleToList: 96 },
      4: { newListings: 15, soldListings: 12, activeListings: 48, daysOnMarket: 25, saleToList: 95 },
      all: { newListings: 265, soldListings: 202, activeListings: 738, daysOnMarket: 19, saleToList: 97 }
    }
  };

  const generatePropertyTypeInventoryData = (propertyType: 'detached' | 'townhouse' | 'condo'): InventoryRow[] => {
    const bedrooms = [1, 2, 3, 4, 'all'];
    
    return bedrooms.map(bedroom => {
      const bedKey = bedroom === 'all' ? 'all' : bedroom;
      const data = baseInventoryData[propertyType][bedKey as keyof typeof baseInventoryData.detached];
      
      return {
        bedroom: bedroom === 'all' ? 'All' : `${bedroom} Bd`,
        newListings: data.newListings,
        soldListings: data.soldListings,
        activeListings: data.activeListings,
        daysOnMarket: data.daysOnMarket,
        saleToList: data.saleToList
      };
    });
  };

  return {
    detached: generatePropertyTypeInventoryData('detached'),
    townhouse: generatePropertyTypeInventoryData('townhouse'),
    condo: generatePropertyTypeInventoryData('condo')
  };
};

// Generate Sales and Inventory Graph Data
export const generateSalesAndInventoryData = () => {
  const months = ['Nov 24', 'Dec 24', 'Jan 25', 'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov'];
  
  const salesData = months.map((_, index) => {
    const base = 434;
    const variation = 0.6 + (Math.sin(index * Math.PI / 6) * 0.4);
    return Math.round(base * variation);
  });
  
  const inventoryData = months.map((_, index) => {
    const base = 1373;
    const variation = 0.8 + (Math.cos(index * Math.PI / 6) * 0.2);
    return Math.round(base * variation);
  });
  
  return {
    months,
    sales: salesData,
    inventory: inventoryData
  };
};

// Generate Days on Market Data
export const generateDaysOnMarketData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const lastYearData = months.map((_, index) => {
    const base = 30;
    const variation = 0.8 + (Math.sin(index * Math.PI / 6) * 0.2);
    return Math.round(base * variation);
  });
  
  const currentYearData = months.map((_, index) => {
    const base = 27;
    const variation = 0.85 + (Math.sin((index + 1) * Math.PI / 6) * 0.15);
    return Math.round(base * variation);
  });
  
  return {
    months,
    lastYear: lastYearData,
    currentYear: currentYearData
  };
};

// Generate Ranking Overview Data
export const generateRankingOverviewData = () => {
  return {
    mostExpensive: 18,
    fastestGrowing: 5,
    fastestSelling: 12,
    highestTurnover: 24
  };
};

// Generate Ranking Table Data
export const generateRankingTableData = (currentCityName: string): RankingData => {
  const cities = [
    'Toronto', 'Mississauga', 'Brampton', 'Markham', 'Vaughan', 'Richmond Hill',
    'Oakville', 'Burlington', 'Ajax', 'Pickering', 'Whitby', 'Oshawa',
    'Aurora', 'Milton', 'Caledon', 'Newmarket', 'Georgina', 'East Gwillimbury',
    'Halton Hills', 'Orangeville', 'Bradford', 'Innisfil', 'Barrie', 'Hamilton',
    'St. Catharines', 'Niagara Falls', 'Kitchener', 'Waterloo', 'Cambridge', 'Guelph'
  ];

  // Price data
  const priceData = cities.map((city, index) => {
    const basePrice = 800000 + (index * 50000) + Math.random() * 100000;
    const medianPrice = basePrice * (0.85 + Math.random() * 0.1);
    return {
      rank: index + 1,
      city,
      averagePrice: Math.round(basePrice),
      medianPrice: Math.round(medianPrice),
      isCurrentCity: city.toLowerCase() === currentCityName.toLowerCase()
    };
  }).sort((a, b) => b.averagePrice - a.averagePrice)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  // Growth data
  const growthData = cities.map((city, index) => {
    const growth = -5 + (index * 0.5) + Math.random() * 2;
    return {
      rank: index + 1,
      city,
      priceGrowth: parseFloat(growth.toFixed(1)),
      isCurrentCity: city.toLowerCase() === currentCityName.toLowerCase()
    };
  }).sort((a, b) => b.priceGrowth - a.priceGrowth)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  // Days on Market data
  const daysOnMarketData = cities.map((city, index) => {
    const days = 10 + (index * 1.5) + Math.random() * 5;
    return {
      rank: index + 1,
      city,
      daysOnMarket: Math.round(days),
      isCurrentCity: city.toLowerCase() === currentCityName.toLowerCase()
    };
  }).sort((a, b) => a.daysOnMarket - b.daysOnMarket)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  // Turnover data
  const turnoverData = cities.map((city, index) => {
    const turnover = 20 + (index * 1.2) + Math.random() * 3;
    return {
      rank: index + 1,
      city,
      turnover: parseFloat(turnover.toFixed(1)),
      isCurrentCity: city.toLowerCase() === currentCityName.toLowerCase()
    };
  }).sort((a, b) => b.turnover - a.turnover)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    price: priceData,
    growth: growthData,
    daysOnMarket: daysOnMarketData,
    turnover: turnoverData
  };
};

// Generate Price Overview Data
export const generatePriceOverviewData = (properties: PropertyListing[]) => {
  const avgPrice = calculateAvgPrice(properties) || 1400000;
  
  return {
    current: {
      avgPrice,
      monthlyChange: -0.7,
      quarterlyChange: 0.3,
      yearlyChange: -2.0
    },
    past: {
      avgPrice: avgPrice * 1.007 || 1409800,
      monthlyChange: 0.5,
      quarterlyChange: -0.2,
      yearlyChange: -1.5
    }
  };
};

