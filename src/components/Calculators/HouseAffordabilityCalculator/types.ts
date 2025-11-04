import { LucideIcon } from "lucide-react";

export interface AffordabilityResults {
  maxHomePrice: number;
  monthlyPayment: number;
  principalAndInterest: number;
  propertyTaxes: number;
  insurance: number;
  pmi: number;
  hoaFees: number;
  dtiRatio: number;
  frontEndDTI: number;
}

export interface AmortizationScheduleEntry {
  month: number;
  totalPayment: number;
  interestPaid: number;
  principalPaid: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  remainingBalance: number;
}

export interface BudgetStatus {
  message: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
  iconColor: string;
}

export interface PaymentBreakdownItem {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

export interface CalculationParams {
  annualIncome: number;
  monthlyDebts: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  hoaFees: number;
  annualPropertyTax: number;
  annualInsurance: number;
  pmiRate: number;
  dtiBackEnd: number;
  dtiFrontEnd: number;
}

