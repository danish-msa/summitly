export interface MarketAnalyticsProps {
  propertyAddress: string;
  propertyClass: string;
  latitude?: number;
  longitude?: number;
  city?: string; // Optional city name (preferred over parsing address)
}

export interface ChartParam {
  axisValue: string;
  seriesName: string;
  value: number;
  color: string;
}

export interface MarketData {
  months: string[];
  prices: number[];
  days: number[];
}

export interface ListingsData {
  months: string[];
  newListings: number[];
  closedListings: number[];
}

export interface SoldPriceData {
  months: string[];
  medianPrices: number[];
  averagePrices: number[];
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

