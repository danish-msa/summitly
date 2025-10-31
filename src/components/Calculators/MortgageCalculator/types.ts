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

export interface MortgageCalculatorProps {
  property?: PropertyListing;
  initialHomePrice?: number;
  initialLocation?: string;
  className?: string;
}

export interface LandTransferTaxResult {
  provincial: number;
  municipal: number;
  rebate: number;
  netPayable: number;
}

export interface AmortizationScheduleEntry {
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  totalPayment: number;
}

