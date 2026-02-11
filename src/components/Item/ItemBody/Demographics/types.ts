export interface DemographicsProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
}

export interface DemographicStats {
  population: number;
  averageAge: number;
  averageIncome: number;
  renters: number;
  householdSize: number;
  single: number;
  householdsWithChildren: number;
  notInLabourForce: number;
}

export interface ChartDataItem {
  name: string;
  value: number;
  percentage?: number;
}

