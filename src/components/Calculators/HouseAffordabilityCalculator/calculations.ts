import { AffordabilityResults, BudgetStatus, CalculationParams } from './types';
import { formatCurrency } from './utils';
import { AlertCircle, CheckCircle2, Info, TrendingUp } from "lucide-react";

// Calculate monthly mortgage payment (P&I)
export const calculateMonthlyPayment = (loanAmount: number, rate: number, termYears: number): number => {
  if (loanAmount === 0) return 0;
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = termYears * 12;
  
  if (monthlyRate === 0) {
    return loanAmount / numberOfPayments;
  }
  
  return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
         (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
};

// Calculate affordability from income
export const calculateFromIncome = (params: CalculationParams): AffordabilityResults => {
  const {
    annualIncome,
    monthlyDebts,
    downPaymentPercent,
    interestRate,
    loanTerm,
    propertyTaxRate,
    insuranceRate,
    hoaFees,
    annualPropertyTax,
    annualInsurance,
    pmiRate,
    dtiBackEnd,
    dtiFrontEnd,
  } = params;

  const grossMonthlyIncome = annualIncome / 12;
  
  // Calculate maximum monthly housing payment (front-end DTI)
  const maxHousingPayment = grossMonthlyIncome * (dtiFrontEnd / 100);
  
  // Calculate maximum total debt payment (back-end DTI)
  const maxTotalDebtPayment = grossMonthlyIncome * (dtiBackEnd / 100);
  const maxMonthlyDebtAfterHousing = maxTotalDebtPayment - monthlyDebts;
  
  // The limiting factor is the smaller of the two
  const availableForHousing = Math.min(maxHousingPayment, maxMonthlyDebtAfterHousing);
  
  if (availableForHousing <= 0) {
    return {
      maxHomePrice: 0,
      monthlyPayment: 0,
      principalAndInterest: 0,
      propertyTaxes: 0,
      insurance: 0,
      pmi: 0,
      hoaFees: hoaFees,
      dtiRatio: 0,
      frontEndDTI: 0,
    };
  }

  // Binary search for maximum affordable home price
  let low = 50000;
  let high = 5000000; // Maximum search range
  let maxHomePrice = 0;
  const tolerance = 100; // Acceptable error in dollars
  
  while (high - low > tolerance) {
    const homePrice = Math.floor((low + high) / 2);
    
    // Use percentage as primary, but ensure it doesn't exceed 99%
    const calculatedDownPayment = Math.min(homePrice * (downPaymentPercent / 100), homePrice * 0.99);
    
    const loanAmount = homePrice - calculatedDownPayment;
    
    if (loanAmount <= 0) {
      low = homePrice + 1;
      continue;
    }
    
    // Calculate monthly costs
    const pAndI = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
    
    // Property taxes (use annual or calculate from rate)
    const monthlyPropertyTax = annualPropertyTax > 0 
      ? annualPropertyTax / 12 
      : (homePrice * propertyTaxRate / 100) / 12;
    
    // Insurance (use annual or calculate from rate)
    const monthlyInsurance = annualInsurance > 0
      ? annualInsurance / 12
      : (homePrice * insuranceRate / 1000) / 12;
    
    // PMI (only if down payment < 20%)
    const calculatedDownPaymentPercent = (calculatedDownPayment / homePrice) * 100;
    const monthlyPMI = calculatedDownPaymentPercent < 20 
      ? (loanAmount * pmiRate / 100) / 12 
      : 0;
    
    const totalMonthlyPayment = pAndI + monthlyPropertyTax + monthlyInsurance + monthlyPMI + hoaFees;
    
    if (totalMonthlyPayment <= availableForHousing) {
      maxHomePrice = homePrice;
      low = homePrice + 1;
    } else {
      high = homePrice - 1;
    }
  }

  // Calculate final results
  if (maxHomePrice > 0) {
    const finalDownPayment = Math.min(maxHomePrice * (downPaymentPercent / 100), maxHomePrice * 0.99);
    const finalLoanAmount = maxHomePrice - finalDownPayment;
    
    const finalPAndI = calculateMonthlyPayment(finalLoanAmount, interestRate, loanTerm);
    const finalPropertyTax = annualPropertyTax > 0
      ? annualPropertyTax / 12
      : (maxHomePrice * propertyTaxRate / 100) / 12;
    const finalInsurance = annualInsurance > 0
      ? annualInsurance / 12
      : (maxHomePrice * insuranceRate / 1000) / 12;
    const finalDownPaymentPercent = (finalDownPayment / maxHomePrice) * 100;
    const finalPMI = finalDownPaymentPercent < 20
      ? (finalLoanAmount * pmiRate / 100) / 12
      : 0;
    const finalMonthlyPayment = finalPAndI + finalPropertyTax + finalInsurance + finalPMI + hoaFees;
    
    return {
      maxHomePrice: maxHomePrice,
      monthlyPayment: finalMonthlyPayment,
      principalAndInterest: finalPAndI,
      propertyTaxes: finalPropertyTax,
      insurance: finalInsurance,
      pmi: finalPMI,
      hoaFees: hoaFees,
      dtiRatio: ((finalMonthlyPayment + monthlyDebts) / grossMonthlyIncome) * 100,
      frontEndDTI: (finalMonthlyPayment / grossMonthlyIncome) * 100,
    };
  } else {
    return {
      maxHomePrice: 0,
      monthlyPayment: 0,
      principalAndInterest: 0,
      propertyTaxes: 0,
      insurance: 0,
      pmi: 0,
      hoaFees: hoaFees,
      dtiRatio: 0,
      frontEndDTI: 0,
    };
  }
};

// Determine budget status message based on slider price or max home price
export const getBudgetStatus = (
  priceToCheck: number,
  maxHomePrice: number,
  params: CalculationParams,
  results: AffordabilityResults
): BudgetStatus => {
  if (priceToCheck === 0 || maxHomePrice === 0) {
    return {
      message: "Unable to calculate affordability with current inputs.",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      icon: AlertCircle,
      iconColor: "text-gray-500"
    };
  }
  
  const {
    annualIncome,
    monthlyDebts,
    downPaymentPercent,
    interestRate,
    loanTerm,
    propertyTaxRate,
    insuranceRate,
    hoaFees,
    annualPropertyTax,
    annualInsurance,
    pmiRate,
  } = params;
  
  // Calculate DTI for the selected price
  const selectedDownPayment = Math.min(priceToCheck * (downPaymentPercent / 100), priceToCheck * 0.99);
  const selectedLoanAmount = priceToCheck - selectedDownPayment;
  const selectedPAndI = calculateMonthlyPayment(selectedLoanAmount, interestRate, loanTerm);
  const selectedPropertyTax = annualPropertyTax > 0 
    ? annualPropertyTax / 12 
    : (priceToCheck * propertyTaxRate / 100) / 12;
  const selectedInsurance = annualInsurance > 0
    ? annualInsurance / 12
    : (priceToCheck * insuranceRate / 1000) / 12;
  const selectedDownPaymentPercent = (selectedDownPayment / priceToCheck) * 100;
  const selectedPMI = selectedDownPaymentPercent < 20
    ? (selectedLoanAmount * pmiRate / 100) / 12
    : 0;
  const selectedTotalPayment = selectedPAndI + selectedPropertyTax + selectedInsurance + selectedPMI + hoaFees;
  const grossMonthlyIncome = annualIncome / 12;
  const selectedFrontEndDTI = (selectedTotalPayment / grossMonthlyIncome) * 100;
  const selectedBackEndDTI = ((selectedTotalPayment + monthlyDebts) / grossMonthlyIncome) * 100;
  
  // Determine if price is above affordable range
  const isAboveAffordable = priceToCheck > maxHomePrice;
  
  if (isAboveAffordable) {
    return {
      message: `Based on your income, a house at ${formatCurrency(priceToCheck)} may stretch your budget too thin. Consider reducing other debts or increasing your down payment.`,
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      icon: TrendingUp,
      iconColor: "text-orange-500"
    };
  } else if (selectedFrontEndDTI >= 35 || selectedBackEndDTI >= 42) {
    return {
      message: `Based on your income, a house at ${formatCurrency(priceToCheck)} may stretch your budget too thin. Consider reducing other debts or increasing your down payment.`,
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      icon: TrendingUp,
      iconColor: "text-orange-500"
    };
  } else if (selectedFrontEndDTI <= 28 && selectedBackEndDTI <= 36) {
    return {
      message: `Based on your income, a house at ${formatCurrency(priceToCheck)} should fit comfortably within your budget.`,
      color: "text-green-700",
      bgColor: "bg-green-50",
      icon: CheckCircle2,
      iconColor: "text-green-500"
    };
  } else {
    return {
      message: `Based on your income, a house at ${formatCurrency(priceToCheck)} should be manageable, but monitor your spending carefully.`,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      icon: Info,
      iconColor: "text-blue-500"
    };
  }
};

// Get amortization schedule data
export const getAmortizationSchedule = (
  homePrice: number,
  downPaymentPercent: number,
  interestRate: number,
  loanTerm: number
): Array<{
  month: number;
  totalPayment: number;
  interestPaid: number;
  principalPaid: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  remainingBalance: number;
}> => {
  if (homePrice === 0) return [];

  const selectedDownPayment = Math.min(homePrice * (downPaymentPercent / 100), homePrice * 0.99);
  const selectedLoanAmount = homePrice - selectedDownPayment;
  
  if (selectedLoanAmount <= 0) return [];
  
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  
  // Calculate monthly payment based on the loan amount
  const monthlyPayment = calculateMonthlyPayment(selectedLoanAmount, interestRate, loanTerm);
  
  if (monthlyPayment === 0) return [];

  const schedule: Array<{
    month: number;
    totalPayment: number;
    interestPaid: number;
    principalPaid: number;
    cumulativeInterest: number;
    cumulativePrincipal: number;
    remainingBalance: number;
  }> = [];

  let remainingBalance = selectedLoanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  for (let month = 1; month <= numberOfPayments && remainingBalance > 0.01; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
    const actualPayment = principalPayment + interestPayment;
    
    remainingBalance -= principalPayment;
    cumulativeInterest += interestPayment;
    cumulativePrincipal += principalPayment;

    // Round to avoid floating point errors
    if (remainingBalance < 0.01) {
      remainingBalance = 0;
    }

    schedule.push({
      month,
      totalPayment: actualPayment,
      interestPaid: interestPayment,
      principalPaid: principalPayment,
      cumulativeInterest,
      cumulativePrincipal,
      remainingBalance,
    });
  }

  return schedule;
};

