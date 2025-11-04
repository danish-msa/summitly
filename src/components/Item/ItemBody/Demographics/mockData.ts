import { DemographicStats, ChartDataItem } from './types';

export const demographicStats: DemographicStats = {
  population: 894,
  averageAge: 38.6,
  averageIncome: 128500,
  renters: 54.7,
  householdSize: 1.9,
  single: 61.1,
  householdsWithChildren: 231,
  notInLabourForce: 23.9,
};

export const householdIncomeData: ChartDataItem[] = [
  { name: "$0 - $29,999", value: 70, percentage: 16 },
  { name: "$30,000 - $59,999", value: 95, percentage: 20 },
  { name: "$60,000 - $79,999", value: 60, percentage: 13 },
  { name: "$80,000 - $99,999", value: 55, percentage: 12 },
  { name: "$100,000 - $149,999", value: 75, percentage: 16 },
  { name: "$150,000 - $199,999", value: 50, percentage: 11 },
  { name: "$200,000+", value: 70, percentage: 15 },
];

export const propertyTypeData: ChartDataItem[] = [
  { name: "Condominium", value: 72.34 },
  { name: "Semi-Detached", value: 9.56 },
  { name: "Freehold Townhouse", value: 5.51 },
  { name: "Detached", value: 6.37 },
  { name: "Duplex", value: 1.09 },
  { name: "Multiplex", value: 0.87 },
  { name: "Triplex", value: 0.86 },
  { name: "Condo Townhouse", value: 0.92 },
  { name: "Other", value: 0.16 },
  { name: "Vacant Land", value: 0.01 },
  { name: "Upper Level", value: 0.63 },
  { name: "Comm Element Condo", value: 1.67 },
];

export const ageData: ChartDataItem[] = [
  { name: "0-14 years", value: 12 },
  { name: "15-24 years", value: 15 },
  { name: "25-34 years", value: 22 },
  { name: "35-44 years", value: 18 },
  { name: "45-54 years", value: 14 },
  { name: "55-64 years", value: 11 },
  { name: "65+ years", value: 8 },
];

export const occupationData: ChartDataItem[] = [
  { name: "Management", value: 18 },
  { name: "Business & Finance", value: 22 },
  { name: "Natural Sciences", value: 15 },
  { name: "Health", value: 12 },
  { name: "Education", value: 10 },
  { name: "Arts & Culture", value: 8 },
  { name: "Sales & Service", value: 15 },
];

export const ethnicityData: ChartDataItem[] = [
  { name: "European", value: 35 },
  { name: "Asian", value: 28 },
  { name: "Middle Eastern", value: 12 },
  { name: "Latin American", value: 8 },
  { name: "African", value: 7 },
  { name: "Other", value: 10 },
];

export const languageData: ChartDataItem[] = [
  { name: "English", value: 65 },
  { name: "French", value: 5 },
  { name: "Mandarin", value: 8 },
  { name: "Cantonese", value: 6 },
  { name: "Spanish", value: 4 },
  { name: "Other", value: 12 },
];

export const yearBuiltData: ChartDataItem[] = [
  { name: "Before 1960", value: 15 },
  { name: "1960-1979", value: 20 },
  { name: "1980-1999", value: 25 },
  { name: "2000-2009", value: 22 },
  { name: "2010-2020", value: 18 },
];

export const commuteMethodData: ChartDataItem[] = [
  { name: "Public Transit", value: 45 },
  { name: "Car", value: 30 },
  { name: "Walk", value: 15 },
  { name: "Bike", value: 8 },
  { name: "Other", value: 2 },
];

