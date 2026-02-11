import { AffordabilityResults, PaymentBreakdownItem } from './types';
import { calculateMonthlyPayment } from './calculations';

interface PaymentBreakdownParams {
  sliderPrice: number;
  maxHomePrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  hoaFees: number;
  annualPropertyTax: number;
  annualInsurance: number;
  pmiRate: number;
  results: AffordabilityResults;
}

// Get payment breakdown data for chart
export const getPaymentBreakdownData = (params: PaymentBreakdownParams) => {
  const {
    sliderPrice,
    maxHomePrice,
    downPaymentPercent,
    interestRate,
    loanTerm,
    propertyTaxRate,
    insuranceRate,
    hoaFees,
    annualPropertyTax,
    annualInsurance,
    pmiRate,
    results,
  } = params;

  const currentResults = sliderPrice > 0 && sliderPrice !== maxHomePrice ? (() => {
    const selectedDownPayment = Math.min(sliderPrice * (downPaymentPercent / 100), sliderPrice * 0.99);
    const selectedLoanAmount = sliderPrice - selectedDownPayment;
    const selectedPAndI = calculateMonthlyPayment(selectedLoanAmount, interestRate, loanTerm);
    const selectedPropertyTax = annualPropertyTax > 0 
      ? annualPropertyTax / 12 
      : (sliderPrice * propertyTaxRate / 100) / 12;
    const selectedInsurance = annualInsurance > 0
      ? annualInsurance / 12
      : (sliderPrice * insuranceRate / 1000) / 12;
    const selectedDownPaymentPercent = (selectedDownPayment / sliderPrice) * 100;
    const selectedPMI = selectedDownPaymentPercent < 20
      ? (selectedLoanAmount * pmiRate / 100) / 12
      : 0;
    
    return {
      principalAndInterest: selectedPAndI,
      propertyTaxes: selectedPropertyTax,
      insurance: selectedInsurance,
      pmi: selectedPMI,
      hoaFees: hoaFees,
      total: selectedPAndI + selectedPropertyTax + selectedInsurance + selectedPMI + hoaFees
    };
  })() : results;

  const total = currentResults.principalAndInterest + currentResults.propertyTaxes + currentResults.insurance + currentResults.pmi + currentResults.hoaFees;
  
  const data: PaymentBreakdownItem[] = [
    { name: "Principal & Interest (P&I)", value: currentResults.principalAndInterest, color: "#3b82f6" },
    { name: "Property Taxes", value: currentResults.propertyTaxes, color: "#10b981" },
    { name: "Homeowner's Insurance", value: currentResults.insurance, color: "#f59e0b" },
  ];
  
  if (currentResults.pmi > 0) {
    data.push({ name: "Mortgage Insurance (PMI)", value: currentResults.pmi, color: "#ef4444" });
  }
  
  if (currentResults.hoaFees > 0) {
    data.push({ name: "HOA Dues", value: currentResults.hoaFees, color: "#8b5cf6" });
  }

  // Calculate percentages
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0
  }));

  return { data: dataWithPercentages, total, currentResults };
};

