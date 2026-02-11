import { TORONTO_TAX_RATES, MUNICIPALITIES, CITY_TAX_BREAKDOWN, PAYMENT_SCHEDULES } from './constants';
import { TaxCalculationResult, CalculationParams } from './types';

export const calculatePropertyTaxes = (params: CalculationParams): TaxCalculationResult => {
  const {
    assessmentValue,
    marketValue,
    location,
    propertyType,
    isFirstTimeBuyer,
    paymentSchedule,
    hasSpecialCharges,
    specialCharges,
    useMarketValueEstimate
  } = params;

  const currentAssessment = useMarketValueEstimate ? marketValue * 0.85 : assessmentValue;
  const municipality = MUNICIPALITIES[location as keyof typeof MUNICIPALITIES] || MUNICIPALITIES["Toronto, ON"];
  const baseRates = TORONTO_TAX_RATES[propertyType as keyof typeof TORONTO_TAX_RATES] || TORONTO_TAX_RATES.residential;
  
  // Apply municipality multiplier
  const adjustedRates = {
    cityRate: baseRates.cityRate * municipality.multiplier,
    educationRate: baseRates.educationRate * municipality.multiplier,
    cityBuildingFund: baseRates.cityBuildingFund * municipality.multiplier,
    totalRate: baseRates.totalRate * municipality.multiplier
  };

  const cityLevy = (currentAssessment * adjustedRates.cityRate) / 100;
  const educationLevy = (currentAssessment * adjustedRates.educationRate) / 100;
  const cityBuildingFund = (currentAssessment * adjustedRates.cityBuildingFund) / 100;
  
  // Calculate detailed city tax breakdown
  const cityTaxBreakdown = Object.entries(CITY_TAX_BREAKDOWN).map(([key, data]) => ({
    category: key,
    description: data.description,
    amount: (cityLevy * data.percentage) / 100,
    percentageOfCityTax: data.percentage,
    percentageOfPropertyValue: (data.percentage * adjustedRates.cityRate) / 100,
    percentageOfTotalTax: (data.percentage * adjustedRates.cityRate) / adjustedRates.totalRate * 100
  }));
  
  let totalTax = cityLevy + educationLevy + cityBuildingFund;
  
  // Apply first-time buyer rebate (if applicable for residential properties)
  let rebate = 0;
  if (isFirstTimeBuyer && propertyType === "residential") {
    rebate = Math.min(cityLevy * 0.15, 1000); // 15% rebate up to $1000
  }
  
  totalTax = Math.max(0, totalTax - rebate);
  
  // Add special charges
  if (hasSpecialCharges) {
    totalTax += specialCharges;
  }

  // Calculate percentages
  const cityTaxPercentageOfTotal = (cityLevy / totalTax) * 100;
  const educationTaxPercentageOfTotal = (educationLevy / totalTax) * 100;
  const cityBuildingFundPercentageOfTotal = (cityBuildingFund / totalTax) * 100;
  const totalTaxPercentageOfPropertyValue = (totalTax / currentAssessment) * 100;

  return {
    assessmentValue: currentAssessment,
    cityLevy,
    educationLevy,
    cityBuildingFund,
    cityTaxBreakdown,
    rebate,
    specialCharges: hasSpecialCharges ? specialCharges : 0,
    totalTax,
    paymentAmount: totalTax * (PAYMENT_SCHEDULES.find(s => s.value === paymentSchedule)?.multiplier || 1/12),
    rates: adjustedRates,
    percentages: {
      cityTaxPercentageOfTotal,
      educationTaxPercentageOfTotal,
      cityBuildingFundPercentageOfTotal,
      totalTaxPercentageOfPropertyValue
    }
  };
};

