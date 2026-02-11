import { PropertyListing } from "@/lib/types";

export interface PropertyTaxCalculatorProps {
  property?: PropertyListing;
  initialAssessmentValue?: number;
  initialLocation?: string;
  className?: string;
}

export interface TaxCalculationResult {
  assessmentValue: number;
  cityLevy: number;
  educationLevy: number;
  cityBuildingFund: number;
  cityTaxBreakdown: Array<{
    category: string;
    description: string;
    amount: number;
    percentageOfCityTax: number;
    percentageOfPropertyValue: number;
    percentageOfTotalTax: number;
  }>;
  rebate: number;
  specialCharges: number;
  totalTax: number;
  paymentAmount: number;
  rates: {
    cityRate: number;
    educationRate: number;
    cityBuildingFund: number;
    totalRate: number;
  };
  percentages: {
    cityTaxPercentageOfTotal: number;
    educationTaxPercentageOfTotal: number;
    cityBuildingFundPercentageOfTotal: number;
    totalTaxPercentageOfPropertyValue: number;
  };
}

export interface CalculationParams {
  assessmentValue: number;
  marketValue: number;
  location: string;
  propertyType: string;
  isFirstTimeBuyer: boolean;
  paymentSchedule: string;
  hasSpecialCharges: boolean;
  specialCharges: number;
  useMarketValueEstimate: boolean;
}

