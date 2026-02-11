import { PropertyListing } from "@/lib/types";

export interface ScenarioSettings {
  downPercent: number;
  downAmount: number;
  amortization: number;
  mortgageRate: number;
  paymentFrequency: string;
}

export interface CalculatedScenario extends ScenarioSettings {
  cmhc: number;
  totalMortgage: number;
  payment: number;
}

export interface DownPaymentCalculatorProps {
  property?: PropertyListing;
  initialHomePrice?: number;
  initialLocation?: string;
  className?: string;
}

