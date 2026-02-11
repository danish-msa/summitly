"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, ChevronUp, DollarSign, Percent } from "lucide-react";
import { useMemoizedCalculation } from './useRentVsBuyCalculation';
import RentVsBuyChart from './RentVsBuyChart';
import { RentVsBuyCalculatorProps } from './types';
import { formatNumberWithCommas, parseNumberFromString, formatCurrency, formatYearsMonths } from './utils';

const RentVsBuyCalculator = ({ className = "" }: RentVsBuyCalculatorProps) => {
  // Main inputs
  const [homePrice, setHomePrice] = useState(500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [monthlyRent, setMonthlyRent] = useState(2500);
  
  // Mortgage details
  const [mortgageRate, setMortgageRate] = useState(5.5);
  const [amortization, setAmortization] = useState(25);
  
  // Assumptions
  const [annualRentIncrease, setAnnualRentIncrease] = useState(3);
  const [homeAppreciation, setHomeAppreciation] = useState(3);
  const [investmentReturn, setInvestmentReturn] = useState(6);
  
  // Homeownership costs
  const [annualPropertyTax, setAnnualPropertyTax] = useState(3000);
  const [annualInsurance, setAnnualInsurance] = useState(1500);
  const [annualMaintenance, setAnnualMaintenance] = useState(3000);
  const [closingCosts, setClosingCosts] = useState(10000);
  
  const [expanded, setExpanded] = useState(false);
  const [selectedYear, setSelectedYear] = useState(3);

  // Calculate all values using memoized hook
  const calculations = useMemoizedCalculation({
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
  });

  // Get data for selected year
  const selectedYearData = calculations.yearlyData[selectedYear - 1] || calculations.yearlyData[0];
  const downPayment = homePrice * (downPaymentPercent / 100);

  // Calculate net costs and gains
  const rentGain = selectedYearData.rentCost < selectedYearData.buyCost 
    ? selectedYearData.buyCost - selectedYearData.rentCost 
    : 0;
  const investmentGain = selectedYearData.rentInvestment - downPayment;

  return (
    <div className={className}>
      {/* Main Inputs */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="w-full md:w-[35%] space-y-4">
          <div className="space-y-2">
            <Label htmlFor="homePrice" className="text-sm font-medium text-gray-700">
              What is your comfortable home price?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="homePrice"
                type="text"
                value={formatNumberWithCommas(homePrice)}
                onChange={(e) => setHomePrice(parseNumberFromString(e.target.value))}
                className="pl-7 h-11 sm:h-12 text-base sm:text-lg bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
              />
            </div>
            <Slider
              value={[homePrice]}
              onValueChange={([value]) => setHomePrice(value)}
              min={100000}
              max={2500000}
              step={10000}
              className="mt-10"
            />
            <p className="text-xs text-gray-500">$100k - $2.5M</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="downPayment" className="text-sm font-medium text-gray-700">
              How much is your down payment?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Percent className="h-4 w-4" />
              </span>
              <Input
                id="downPayment"
                type="number"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="pl-10 h-11 sm:h-12 text-base sm:text-lg bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
              />
            </div>
            <Slider
              value={[downPaymentPercent]}
              onValueChange={([value]) => setDownPaymentPercent(value)}
              min={5}
              max={100}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-gray-500">5% - 100%</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyRent" className="text-sm font-medium text-gray-700">
              What is your comfortable monthly rent?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="monthlyRent"
                type="text"
                value={formatNumberWithCommas(monthlyRent)}
                onChange={(e) => setMonthlyRent(parseNumberFromString(e.target.value))}
                className="pl-7 h-11 sm:h-12 text-base sm:text-lg bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
              />
            </div>
            <Slider
              value={[monthlyRent]}
              onValueChange={([value]) => setMonthlyRent(value)}
              min={500}
              max={10000}
              step={100}
              className="mt-2"
            />
            <p className="text-xs text-gray-500">$500 - $10k</p>
          </div>
        </div>
        {/* Chart */}
        <Card className="border-none shadow-none w-full md:w-[65%]">
          <CardHeader>
            <CardTitle className="text-xl text-center">Cost Comparison Over Time</CardTitle>
            <CardDescription className="text-center">
              See how renting vs buying costs compare over the years
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RentVsBuyChart data={calculations.yearlyData} />
          </CardContent>
        </Card>
      </div>

      {/* Breakeven Result - Zillow Style */}
      {calculations.breakevenYear && (
        <Card className="my-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-center mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Breakeven Horizon</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                After {formatYearsMonths(calculations.breakevenYear)}, buying will be cheaper than renting.
              </h2>
            </div>

            {/* Interactive Year Selector */}
            <div className="mb-6 sm:mb-8">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-sm sm:text-base font-medium">YEAR</Label>
                <span className="text-base sm:text-lg font-bold text-primary">{selectedYear}</span>
              </div>
              <Slider
                value={[selectedYear]}
                onValueChange={([value]) => setSelectedYear(value)}
                min={1}
                max={Math.min(30, calculations.yearlyData.length)}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>1 year</span>
                <span>{Math.min(30, calculations.yearlyData.length)} years</span>
              </div>
            </div>

            {/* Cost Section - Zillow Style */}
            <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 border border-gray-200">
              <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Cost
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                After <strong>{selectedYear}</strong> {selectedYear === 1 ? 'year' : 'years'}, your total cost of homeownership (down payment, mortgage, taxes, etc.) for a <strong>{formatCurrency(homePrice)}</strong> home would be <strong>{formatCurrency(selectedYearData.buyCost)}</strong>. Your total cost to rent would be <strong>{formatCurrency(selectedYearData.rentCost)}</strong>. Renting leaves you with <strong className="text-green-600">{formatCurrency(rentGain)}</strong> in your pocket (including the money you didn't spend on a down payment).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">BUY</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedYearData.buyCost)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">RENT</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedYearData.rentCost)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">RENT GAIN</p>
                  <p className="text-2xl font-bold text-purple-500">{formatCurrency(rentGain)}</p>
                </div>
              </div>
            </div>

            {/* Gain Section - Zillow Style */}
            <div className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Percent className="h-5 w-5 text-purple-500" />
                Gain
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                After <strong>{selectedYear}</strong> {selectedYear === 1 ? 'year' : 'years'}, if you buy, your home will have <strong>{formatCurrency(selectedYearData.buyEquity)}</strong> in equity (available to you when you sell). However, if you instead rent and invest your down payment and the other money you save, at a <strong>{investmentReturn}%</strong> return rate it will earn around <strong>{formatCurrency(investmentGain)}</strong> in <strong>{selectedYear}</strong> {selectedYear === 1 ? 'year' : 'years'}.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Home Equity (Buy)</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedYearData.buyEquity)}</p>
                  <p className="text-xs text-gray-500 mt-1">Your stake in the home</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Investment Returns (Rent)</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(selectedYearData.rentInvestment)}</p>
                  <p className="text-xs text-gray-500 mt-1">Down payment + savings invested</p>
                </div>
              </div>
            </div>

            {/* Bottom Line */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20">
              <h3 className="font-bold text-lg mb-3">Bottom Line</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Looking at your gross costs, equity and investment potential, it's{' '}
                <strong className="text-primary">
                  {calculations.breakevenYear && selectedYear >= calculations.breakevenYear 
                    ? 'better for you to buy than rent' 
                    : 'better for you to rent than buy'}
                </strong>
                {calculations.breakevenYear && (
                  <> if you plan to live in your home more than <strong className="text-primary">{formatYearsMonths(calculations.breakevenYear)}</strong>.</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      

      {/* Year-by-Year Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Detailed Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Year 1</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Buy Cost:</span>
                  <span className="font-bold">{formatCurrency(calculations.yearlyData[0]?.buyCost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rent Cost:</span>
                  <span className="font-bold">{formatCurrency(calculations.yearlyData[0]?.rentCost || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Renting Saves:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency((calculations.yearlyData[0]?.buyCost || 0) - (calculations.yearlyData[0]?.rentCost || 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Year 5</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Buy Cost:</span>
                  <span className="font-bold">{formatCurrency(calculations.yearlyData[4]?.buyCost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rent Cost:</span>
                  <span className="font-bold">{formatCurrency(calculations.yearlyData[4]?.rentCost || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Renting Saves:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency((calculations.yearlyData[4]?.buyCost || 0) - (calculations.yearlyData[4]?.rentCost || 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Year 10</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Buy Cost:</span>
                  <span className="font-bold">{formatCurrency(calculations.yearlyData[9]?.buyCost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rent Cost:</span>
                  <span className="font-bold">{formatCurrency(calculations.yearlyData[9]?.rentCost || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">
                    {calculations.yearlyData[9] && calculations.yearlyData[9].buyCost > calculations.yearlyData[9].rentCost ? 'Buying Saves:' : 'Renting Saves:'}
                  </span>
                  <span className={`font-bold ${calculations.yearlyData[9] && calculations.yearlyData[9].buyCost > calculations.yearlyData[9].rentCost ? 'text-green-600' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs((calculations.yearlyData[9]?.buyCost || 0) - (calculations.yearlyData[9]?.rentCost || 0)))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-brand-mist/20 transition-colors"
        >
          <h3 className="text-lg font-bold">Advanced Options</h3>
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        {expanded && (
          <div className="p-4 border-t space-y-6">
            {/* Mortgage Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mortgageRate" className="text-sm font-medium">
                  Mortgage Rate (%)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Percent className="h-4 w-4" />
                  </span>
                  <Input
                    id="mortgageRate"
                    type="number"
                    step="0.1"
                    value={mortgageRate}
                    onChange={(e) => setMortgageRate(Number(e.target.value))}
                    className="pl-10 h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amortization" className="text-sm font-medium">
                  Amortization (years)
                </Label>
                <Input
                  id="amortization"
                  type="number"
                  value={amortization}
                  onChange={(e) => setAmortization(Number(e.target.value))}
                  className="h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                />
              </div>
            </div>

            {/* Assumptions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentIncrease" className="text-sm font-medium">
                  Annual Rent Increase (%)
                </Label>
                <Input
                  id="rentIncrease"
                  type="number"
                  step="0.1"
                  value={annualRentIncrease}
                  onChange={(e) => setAnnualRentIncrease(Number(e.target.value))}
                  className="h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeAppreciation" className="text-sm font-medium">
                  Home Appreciation (%)
                </Label>
                <Input
                  id="homeAppreciation"
                  type="number"
                  step="0.1"
                  value={homeAppreciation}
                  onChange={(e) => setHomeAppreciation(Number(e.target.value))}
                  className="h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentReturn" className="text-sm font-medium">
                  Investment Return (%)
                </Label>
                <Input
                  id="investmentReturn"
                  type="number"
                  step="0.1"
                  value={investmentReturn}
                  onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                  className="h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                />
              </div>
            </div>

            {/* Homeownership Costs */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyTax" className="text-sm font-medium">
                  Annual Property Tax
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <DollarSign className="h-3 w-3" />
                  </span>
                  <Input
                    id="propertyTax"
                    type="text"
                    value={formatNumberWithCommas(annualPropertyTax)}
                    onChange={(e) => setAnnualPropertyTax(parseNumberFromString(e.target.value))}
                    className="pl-7 h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance" className="text-sm font-medium">
                  Annual Insurance
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <DollarSign className="h-3 w-3" />
                  </span>
                  <Input
                    id="insurance"
                    type="text"
                    value={formatNumberWithCommas(annualInsurance)}
                    onChange={(e) => setAnnualInsurance(parseNumberFromString(e.target.value))}
                    className="pl-7 h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance" className="text-sm font-medium">
                  Annual Maintenance
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <DollarSign className="h-3 w-3" />
                  </span>
                  <Input
                    id="maintenance"
                    type="text"
                    value={formatNumberWithCommas(annualMaintenance)}
                    onChange={(e) => setAnnualMaintenance(parseNumberFromString(e.target.value))}
                    className="pl-7 h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closingCosts" className="text-sm font-medium">
                  Closing Costs
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <DollarSign className="h-3 w-3" />
                  </span>
                  <Input
                    id="closingCosts"
                    type="text"
                    value={formatNumberWithCommas(closingCosts)}
                    onChange={(e) => setClosingCosts(parseNumberFromString(e.target.value))}
                    className="pl-7 h-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RentVsBuyCalculator;
