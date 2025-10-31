import { LandTransferTaxResult, AmortizationScheduleEntry } from './types';

export const calculateCMHC = (downPercent: number, loanAmount: number): number => {
  if (downPercent >= 20) return 0;
  if (downPercent >= 15) return loanAmount * 0.028;
  if (downPercent >= 10) return loanAmount * 0.031;
  return loanAmount * 0.04;
};

export const calculateLandTransferTax = (purchasePrice: number, isFirstTimeBuyer: boolean, location: string): LandTransferTaxResult => {
  // Provincial Land Transfer Tax calculation
  const provincialTax = 
    0.005 * Math.min(purchasePrice, 55000) +
    0.01 * Math.max(0, Math.min(purchasePrice, 250000) - 55000) +
    0.015 * Math.max(0, Math.min(purchasePrice, 400000) - 250000) +
    0.02 * Math.max(0, Math.min(purchasePrice, 2000000) - 400000) +
    0.025 * Math.max(0, purchasePrice - 2000000);

  // Municipal Land Transfer Tax (Toronto only)
  const isToronto = location.toLowerCase().includes('toronto');
  const municipalTax = isToronto ? 
    0.005 * Math.min(purchasePrice, 55000) +
    0.01 * Math.max(0, Math.min(purchasePrice, 250000) - 55000) +
    0.015 * Math.max(0, Math.min(purchasePrice, 400000) - 250000) +
    0.02 * Math.max(0, Math.min(purchasePrice, 2000000) - 400000) +
    0.025 * Math.max(0, purchasePrice - 2000000) : 0;

  // First-time buyer rebates
  const provincialRebate = isFirstTimeBuyer ? Math.min(provincialTax, 4000) : 0;
  const municipalRebate = (isFirstTimeBuyer && isToronto) ? Math.min(municipalTax, 4475) : 0;
  const totalRebate = provincialRebate + municipalRebate;

  // Net payable
  const netPayable = provincialTax + municipalTax - totalRebate;

  return {
    provincial: provincialTax,
    municipal: municipalTax,
    rebate: totalRebate,
    netPayable: netPayable
  };
};

export const calculatePayment = (principal: number, rate: number, years: number, frequency: string): number => {
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = years * 12;
  
  if (rate === 0) {
    return principal / numberOfPayments;
  }
  
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  switch (frequency) {
    case "Weekly":
      return (monthlyPayment * 12) / 52;
    case "Accelerated Weekly":
      return monthlyPayment / 4;
    case "Bi-weekly":
      return (monthlyPayment * 12) / 26;
    case "Accelerated Bi-weekly":
      return monthlyPayment / 2;
    case "Semi-monthly":
      return monthlyPayment / 2;
    case "Quarterly":
      return monthlyPayment * 3;
    case "Annually":
      return monthlyPayment * 12;
    default:
      return monthlyPayment;
  }
};

export const getAmortizationSchedule = (principal: number, rate: number, years: number, paymentFrequency: string): AmortizationScheduleEntry[] => {
  const getPaymentsPerYear = (frequency: string) => {
    switch (frequency) {
      case "Weekly":
      case "Accelerated Weekly":
        return 52;
      case "Bi-weekly":
      case "Accelerated Bi-weekly":
        return 26;
      case "Semi-monthly":
        return 24;
      case "Monthly":
        return 12;
      case "Quarterly":
        return 4;
      case "Annually":
        return 1;
      default:
        return 12;
    }
  };

  const paymentsPerYear = getPaymentsPerYear(paymentFrequency);
  const totalPayments = years * paymentsPerYear;
  const ratePerPeriod = rate / 100 / paymentsPerYear;
  
  // Calculate payment amount
  const payment = principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPayments)) / 
                  (Math.pow(1 + ratePerPeriod, totalPayments) - 1);
  
  // Generate full amortization schedule
  let balance = principal;
  const schedule: AmortizationScheduleEntry[] = [];
  
  for (let i = 1; i <= totalPayments; i++) {
    const interestPayment = balance * ratePerPeriod;
    const principalPayment = payment - interestPayment;
    balance -= principalPayment;
    
    schedule.push({
      payment: i,
      interest: interestPayment,
      principal: principalPayment,
      balance: Math.max(0, balance),
      totalPayment: payment
    });
  }

  return schedule;
};

