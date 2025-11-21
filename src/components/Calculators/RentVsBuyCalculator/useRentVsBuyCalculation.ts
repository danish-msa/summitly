import { useMemo } from 'react';

interface CalculationParams {
  homePrice: number;
  downPaymentPercent: number;
  monthlyRent: number;
  mortgageRate: number;
  amortization: number;
  annualRentIncrease: number;
  homeAppreciation: number;
  investmentReturn: number;
  annualPropertyTax: number;
  annualInsurance: number;
  annualMaintenance: number;
  closingCosts: number;
}

interface YearlyData {
  year: number;
  buyCost: number;
  rentCost: number;
  buyEquity: number;
  rentInvestment: number;
}

interface CalculationResult {
  breakevenYear: number | null;
  yearlyData: YearlyData[];
}

export function useMemoizedCalculation(params: CalculationParams): CalculationResult {
  return useMemo(() => {
    const {
      homePrice,
      downPaymentPercent,
      monthlyRent,
      mortgageRate,
      amortization,
      annualRentIncrease,
      homeAppreciation,
      investmentReturn,
      annualPropertyTax,
      annualInsurance,
      annualMaintenance,
      closingCosts,
    } = params;

    // Calculate mortgage details
    const downPayment = homePrice * (downPaymentPercent / 100);
    const loanAmount = homePrice - downPayment;
    const monthlyRate = mortgageRate / 100 / 12;
    const numberOfPayments = amortization * 12;

    // Calculate CMHC insurance if down payment < 20%
    const cmhcInsurance = downPaymentPercent < 20 
      ? (downPaymentPercent >= 15 ? loanAmount * 0.028 :
         downPaymentPercent >= 10 ? loanAmount * 0.031 :
         loanAmount * 0.04)
      : 0;

    const totalLoanAmount = loanAmount + cmhcInsurance;

    // Recalculate monthly payment with CMHC
    const monthlyPaymentWithCMHC = totalLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                                   (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    // Calculate yearly data for 30 years
    const yearlyData: YearlyData[] = [];
    let remainingPrincipal = totalLoanAmount;
    let cumulativeBuyCost = downPayment + closingCosts;
    let cumulativeRentCost = 0;
    let totalRentInvestment = downPayment; // Start with down payment that's not used
    let breakevenYear: number | null = null;
    let currentHomeValue = homePrice;
    let currentMonthlyRent = monthlyRent;

    for (let year = 1; year <= 30; year++) {
      // Calculate buy costs for this year
      const yearlyMortgagePayments = monthlyPaymentWithCMHC * 12;
      const yearlyInterest = remainingPrincipal * (mortgageRate / 100);
      const yearlyPrincipal = yearlyMortgagePayments - yearlyInterest;
      
      remainingPrincipal = Math.max(0, remainingPrincipal - yearlyPrincipal);
      
      const yearlyBuyCost = yearlyMortgagePayments + annualPropertyTax + annualInsurance + annualMaintenance;
      cumulativeBuyCost += yearlyBuyCost;

      // Calculate home value appreciation
      currentHomeValue = currentHomeValue * (1 + homeAppreciation / 100);
      const homeEquity = currentHomeValue - remainingPrincipal;

      // Calculate rent costs for this year
      const yearlyRentCost = currentMonthlyRent * 12;
      cumulativeRentCost += yearlyRentCost;
      
      // Update rent for next year
      currentMonthlyRent = currentMonthlyRent * (1 + annualRentIncrease / 100);

      // Calculate investment growth from savings
      // Savings = mortgage payment + property tax + insurance + maintenance - rent
      const monthlySavings = monthlyPaymentWithCMHC + (annualPropertyTax + annualInsurance + annualMaintenance) / 12 - currentMonthlyRent;
      if (monthlySavings > 0) {
        // If renting saves money, invest it
        for (let month = 1; month <= 12; month++) {
          totalRentInvestment = totalRentInvestment * (1 + investmentReturn / 100 / 12) + Math.max(0, monthlySavings);
        }
      }

      yearlyData.push({
        year,
        buyCost: cumulativeBuyCost,
        rentCost: cumulativeRentCost,
        buyEquity: homeEquity,
        rentInvestment: totalRentInvestment,
      });

      // Find breakeven point (when buying total cost < renting total cost + opportunity cost of down payment)
      // Simplified: when cumulative buy cost < cumulative rent cost + lost investment on down payment
      if (!breakevenYear) {
        const downPaymentOpportunityCost = downPayment * Math.pow(1 + investmentReturn / 100, year);
        const rentTotalWithInvestment = cumulativeRentCost + (downPaymentOpportunityCost - downPayment);
        
        // Consider equity gain in buy scenario
        const buyNetCost = cumulativeBuyCost - (homeEquity - downPayment);
        
        if (buyNetCost < rentTotalWithInvestment) {
          breakevenYear = year;
        }
      }
    }

    return {
      breakevenYear,
      yearlyData,
    };
  }, [
    params.homePrice,
    params.downPaymentPercent,
    params.monthlyRent,
    params.mortgageRate,
    params.amortization,
    params.annualRentIncrease,
    params.homeAppreciation,
    params.investmentReturn,
    params.annualPropertyTax,
    params.annualInsurance,
    params.annualMaintenance,
    params.closingCosts,
     
  ]);
}

