"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, ChevronUp, Info, Table2, BarChart3, DollarSign, MapPin, Percent } from "lucide-react";
import * as Tooltip from '@radix-ui/react-tooltip';
import InterestRateChart from "../InterestRateChart";
import AmortizationChart from "../AmortizationChart";
import { PropertyListing } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScenarioSettings {
  downPercent: number;
  downAmount: number;
  amortization: number;
  mortgageRate: number;
  paymentFrequency: string;
}

interface CalculatedScenario extends ScenarioSettings {
  cmhc: number;
  totalMortgage: number;
  payment: number;
}

interface MortgageCalculatorProps {
  property?: PropertyListing;
  initialHomePrice?: number;
  initialLocation?: string;
  className?: string;
}

// Helper functions for number formatting with commas
const formatNumberWithCommas = (value: number): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseNumberFromString = (value: string): number => {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  return Number(cleaned) || 0;
};

const MortgageCalculator = ({ 
  property,
  initialHomePrice = 596000, 
  initialLocation = "Toronto, ON",
  className = ""
}: MortgageCalculatorProps) => {
  // Use property data if available, otherwise fall back to defaults
  const defaultPrice = property?.listPrice || initialHomePrice;
  const defaultLocation = property?.address?.location || 
    (property?.address ? 
      `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim() : 
      initialLocation
    );

  const [homePrice, setHomePrice] = useState(defaultPrice);
  const [location, setLocation] = useState(defaultLocation);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const [propertyType, setPropertyType] = useState(
    property?.details?.propertyType?.toLowerCase().includes('condo') ? "Condo" : "House"
  );
  
  // Individual settings for each scenario
  const [scenarios, setScenarios] = useState<ScenarioSettings[]>([
    { downPercent: 5, downAmount: defaultPrice * 0.05, amortization: 25, mortgageRate: 3.79, paymentFrequency: "Monthly" },
    { downPercent: 10, downAmount: defaultPrice * 0.10, amortization: 25, mortgageRate: 3.79, paymentFrequency: "Monthly" },
    { downPercent: 15, downAmount: defaultPrice * 0.15, amortization: 25, mortgageRate: 3.79, paymentFrequency: "Monthly" },
    { downPercent: 20, downAmount: defaultPrice * 0.20, amortization: 25, mortgageRate: 3.99, paymentFrequency: "Monthly" },
  ]);
  
  // Closing costs
  const [pstOnInsurance, setPstOnInsurance] = useState(152);
  const [lawyerFees, setLawyerFees] = useState(1000);
  const [titleInsurance, setTitleInsurance] = useState(400);
  const [homeInspection, setHomeInspection] = useState(600);
  const [appraisalFees, setAppraisalFees] = useState(300);
  
  // Monthly expenses
  const [propertyTax, setPropertyTax] = useState(24);
  const [monthlyDebt, setMonthlyDebt] = useState(0);
  const [utilities, setUtilities] = useState(195);
  const [propertyInsurance, setPropertyInsurance] = useState(60);
  const [phone, setPhone] = useState(60);
  const [cable, setCable] = useState(20);
  const [internet, setInternet] = useState(60);
  const [condoFees, setCondoFees] = useState(0);
  
  const [cashToCloseExpanded, setCashToCloseExpanded] = useState(false);
  const [monthlyExpensesExpanded, setMonthlyExpensesExpanded] = useState(false);
  const [interestRiskExpanded, setInterestRiskExpanded] = useState(false);
  const [amortizationScheduleExpanded, setAmortizationScheduleExpanded] = useState(false);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [amortizationViewMode, setAmortizationViewMode] = useState<"chart" | "table">("chart");

  // Update home price and location when property changes
  useEffect(() => {
    if (property) {
      const newPrice = property.listPrice || initialHomePrice;
      const newLocation = property.address?.location || 
        (property.address ? 
          `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim() : 
          initialLocation
        );
      
      setHomePrice(newPrice);
      setLocation(newLocation);
      
      // Update property type based on property data
      const newPropertyType = property.details?.propertyType?.toLowerCase().includes('condo') ? "Condo" : "House";
      setPropertyType(newPropertyType);
      
      // Update scenarios with new price using functional update
      setScenarios(prevScenarios => prevScenarios.map(s => ({
        ...s,
        downAmount: newPrice * (s.downPercent / 100)
      })));
    }
  }, [property, initialHomePrice, initialLocation]);

  const calculateCMHC = (downPercent: number, loanAmount: number): number => {
    if (downPercent >= 20) return 0;
    if (downPercent >= 15) return loanAmount * 0.028;
    if (downPercent >= 10) return loanAmount * 0.031;
    return loanAmount * 0.04;
  };

  const calculateLandTransferTax = (purchasePrice: number, isFirstTimeBuyer: boolean, location: string) => {
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

  const calculatePayment = (principal: number, rate: number, years: number, frequency: string): number => {
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

  const calculatedScenarios: CalculatedScenario[] = scenarios.map(scenario => {
    const loanAmount = homePrice - scenario.downAmount;
    const cmhc = calculateCMHC(scenario.downPercent, loanAmount);
    const totalMortgage = loanAmount + cmhc;
    const payment = calculatePayment(totalMortgage, scenario.mortgageRate, scenario.amortization, scenario.paymentFrequency);
    
    return { ...scenario, cmhc, totalMortgage, payment };
  });

  const updateScenario = (index: number, updates: Partial<ScenarioSettings>): void => {
    const newScenarios = [...scenarios];
    newScenarios[index] = { ...newScenarios[index], ...updates };
    
    // Sync down payment percentage and amount
    if (updates.downPercent !== undefined) {
      newScenarios[index].downAmount = homePrice * (updates.downPercent / 100);
    } else if (updates.downAmount !== undefined) {
      newScenarios[index].downPercent = (updates.downAmount / homePrice) * 100;
    }
    
    setScenarios(newScenarios);
  };

  const landTransferTaxCalculation = calculateLandTransferTax(homePrice, isFirstTimeBuyer, location);
  
  const cashNeeded = calculatedScenarios[selectedScenarioIndex].downAmount + landTransferTaxCalculation.netPayable + pstOnInsurance + 
                     lawyerFees + titleInsurance + homeInspection + appraisalFees;
  
  const totalCashToClose = cashNeeded;

  const monthlyExpenses = calculatedScenarios[selectedScenarioIndex].payment + propertyTax + monthlyDebt + utilities + 
                         propertyInsurance + phone + cable + internet + 
                         (propertyType === "Condo" ? condoFees : 0);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper function to calculate amortization schedule data
  const getAmortizationSchedule = (principal: number, rate: number, years: number, paymentFrequency: string) => {
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
    const schedule = [];
    
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

  return (
    <div className={`${className}`}>
      <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="homePrice" className="text-base sm:text-lg font-medium text-gray-700">
                  Property Price
                </Label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="homePrice"
                  type="text"
                  value={formatNumberWithCommas(homePrice)}
                  onChange={(e) => {
                    const newPrice = parseNumberFromString(e.target.value);
                    setHomePrice(newPrice);
                    // Update all down amounts based on percentages
                    const newScenarios = scenarios.map(s => ({
                      ...s,
                      downAmount: newPrice * (s.downPercent / 100)
                    }));
                    setScenarios(newScenarios);
                  }}
                  className="pl-7 h-11 sm:h-12 text-base sm:text-lg border border-gray-300 rounded-lg"
                />
              </div>
              <Slider
                value={[homePrice]}
                onValueChange={([value]) => {
                  setHomePrice(value);
                  // Update all down amounts based on percentages
                  const newScenarios = scenarios.map(s => ({
                    ...s,
                    downAmount: value * (s.downPercent / 100)
                  }));
                  setScenarios(newScenarios);
                }}
                min={100000}
                max={2500000}
                step={10000}
                className="mt-2"
              />
              <p className="text-xs text-gray-500">$100k - $2.5M</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="location" className="text-base sm:text-lg font-medium text-gray-700">
                  Location
                </Label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                </span>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-11 sm:h-12 text-base border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Scenarios Table - Mobile (Single Scenario) */}
          <div className="sm:hidden mb-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Down payment</Label>
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-xs max-w-xs">
                          <p>The minimum down payment in Canada is 5% of the home price</p>
                          <Tooltip.Arrow className="fill-gray-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={scenarios[0].downPercent}
                    onChange={(e) => updateScenario(0, { downPercent: Number(e.target.value) })}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 text-sm rounded-lg pr-8 h-10"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    <Percent className="h-3 w-3" />
                  </span>
                </div>
                <Slider
                  value={[scenarios[0].downPercent]}
                  onValueChange={([value]) => updateScenario(0, { downPercent: value })}
                  min={5}
                  max={100}
                  step={0.5}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500">5% - 100%</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <DollarSign className="h-3 w-3" />
                  </span>
                  <Input
                    type="text"
                    value={formatNumberWithCommas(Math.round(scenarios[0].downAmount))}
                    onChange={(e) => updateScenario(0, { downAmount: parseNumberFromString(e.target.value) })}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 text-sm rounded-lg pl-8 h-10"
                  />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 shadow-sm rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">CMHC</span>
                  <span className="font-bold text-primary">{formatCurrency(calculatedScenarios[0].cmhc)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total mortgage</span>
                  <span className="font-bold text-purple-500">{formatCurrency(calculatedScenarios[0].totalMortgage)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scenarios Table - Desktop (Multiple Scenarios) */}
          <div className="hidden sm:block overflow-x-auto mb-6 sm:mb-8 -mx-4 sm:mx-0">
            <div className="min-w-[600px] px-4 sm:px-0">
              <table className="w-full">
                <thead>
                  <tr className="">
                    <th className="text-left py-3 px-2 w-32 sm:w-48">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm">Down payment</span>
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-xs max-w-xs">
                                <p>The minimum down payment in Canada is 5% of the home price</p>
                                <Tooltip.Arrow className="fill-gray-800" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </div>
                    </th>
                    {scenarios.map((scenario, idx) => (
                      <th key={idx} className="text-center py-3 px-1 sm:px-2 min-w-[120px]">
                        <span className="text-xs sm:text-sm font-medium">Scenario {idx + 1}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm">Down payment</span>
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-xs max-w-xs">
                                <p>The minimum down payment in Canada is 5% of the home price</p>
                                <Tooltip.Arrow className="fill-gray-800" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </div>
                    </td>
                    {scenarios.map((scenario, idx) => (
                      <td key={idx} className="text-center py-3 px-1 sm:px-2">
                        <div className="flex flex-col gap-1">
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              value={scenario.downPercent}
                              onChange={(e) => updateScenario(idx, { downPercent: Number(e.target.value) })}
                              className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 text-xs sm:text-sm rounded-lg pr-6 h-8 sm:h-9"
                            />
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">
                            <Percent className="h-3 w-3" />
                            </span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                              <DollarSign className="h-3 w-3" />
                            </span>
                            <Input
                              type="text"
                              value={formatNumberWithCommas(Math.round(scenario.downAmount))}
                              onChange={(e) => updateScenario(idx, { downAmount: parseNumberFromString(e.target.value) })}
                              className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 text-xs sm:text-sm rounded-lg pl-6 h-8 sm:h-9"
                            />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                <tr>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm">CMHC</span>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-xs max-w-xs">
                              <p>Mortgage default insurance required when down payment is less than 20%</p>
                              <Tooltip.Arrow className="fill-gray-800" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                  </td>
                  {calculatedScenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-1 sm:px-2 font-bold text-primary text-xs sm:text-sm">
                      {formatCurrency(scenario.cmhc)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 shadow-sm">
                  <td className="py-3 px-2 font-medium text-xs sm:text-sm">Total mortgage</td>
                  {calculatedScenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-1 sm:px-2 font-bold text-purple-500 text-xs sm:text-sm">
                      {formatCurrency(scenario.totalMortgage)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          {/* Individual Controls for Each Scenario - Mobile (Single Scenario) */}
          <div className="sm:hidden mb-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Amortization</Label>
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-xs max-w-xs">
                            <p>The total length of time it will take to pay off your mortgage</p>
                            <Tooltip.Arrow className="fill-gray-800" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </div>
                  <Select 
                    value={scenarios[0].amortization.toString()} 
                    onValueChange={(v) => updateScenario(0, { amortization: Number(v) })}
                  >
                    <SelectTrigger className="h-10 bg-gradient-to-r from-blue-50 to-indigo-50 text-sm rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}-year
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mortgage rate</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <Percent className="h-3 w-3" />
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={scenarios[0].mortgageRate}
                      onChange={(e) => updateScenario(0, { mortgageRate: Number(e.target.value) })}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg pl-6 pr-16 h-10 text-sm"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">5-yr/fix</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment frequency</Label>
                  <Select 
                    value={scenarios[0].paymentFrequency} 
                    onValueChange={(v) => updateScenario(0, { paymentFrequency: v })}
                  >
                    <SelectTrigger className="h-10 bg-gradient-to-r from-blue-50 to-indigo-50 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Accelerated Weekly">Accelerated Weekly</SelectItem>
                      <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="Accelerated Bi-weekly">Accelerated Bi-weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Semi-monthly">Semi-monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 shadow-sm rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Mortgage payment</span>
                    <span className="font-bold text-purple-500 text-lg">{formatCurrency(calculatedScenarios[0].payment)}</span>
                  </div>
                </div>

                <Button variant="default" className="w-full rounded-lg bg-brand-midnight hover:bg-brand-midnight/90 h-10">
                  Get this Rate
                </Button>
              </div>
            </div>
          </div>

          {/* Individual Controls for Each Scenario - Desktop (Multiple Scenarios) */}
          <div className="hidden sm:block overflow-x-auto mb-8">
            <div className="min-w-[600px] px-4 sm:px-0">
              <table className="w-full">
              <tbody className="divide-y">
                <tr>
                  <td className="py-3 px-2 w-48">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Amortization</span>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-xs max-w-xs">
                              <p>The total length of time it will take to pay off your mortgage</p>
                              <Tooltip.Arrow className="fill-gray-800" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                  </td>
                  {scenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-2">
                      <Select 
                        value={scenario.amortization.toString()} 
                        onValueChange={(v) => updateScenario(idx, { amortization: Number(v) })}
                      >
                        <SelectTrigger className="h-10 bg-gradient-to-r from-blue-50 to-indigo-50 text-sm rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 30 }, (_, i) => i + 1).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}-year
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Mortgage rate</span>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-xs max-w-xs">
                              <p>The annual interest rate for your mortgage</p>
                              <Tooltip.Arrow className="fill-gray-800" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                  </td>
                  {scenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-2">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            <Percent className="h-3 w-3" />
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            value={scenario.mortgageRate}
                            onChange={(e) => updateScenario(idx, { mortgageRate: Number(e.target.value) })}
                            className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg pl-6 pr-16"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">5-yr/fix</span>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-2">
                    <span className="text-sm">Payment frequency</span>
                  </td>
                  {scenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-2">
                      <Select 
                        value={scenario.paymentFrequency} 
                        onValueChange={(v) => updateScenario(idx, { paymentFrequency: v })}
                      >
                        <SelectTrigger className="h-10 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Accelerated Weekly">Accelerated Weekly</SelectItem>
                          <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="Accelerated Bi-weekly">Accelerated Bi-weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Semi-monthly">Semi-monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  ))}
                </tr>

                {/* Payment Display */}
                <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 shadow-sm">
                  <td className="py-3 px-2 font-bold">
                    <span className="flex items-center gap-2">
                      Mortgage payment
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-xs max-w-xs">
                              <p>Your regular mortgage payment based on selected frequency</p>
                              <Tooltip.Arrow className="fill-gray-800" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </span>
                  </td>
                  {calculatedScenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-2 font-bold text-purple-500 text-lg">
                      {formatCurrency(scenario.payment)}
                    </td>
                  ))}
                </tr>

                {/* Get this Rate Buttons */}
                <tr>
                  <td className="py-3 px-2"></td>
                  {calculatedScenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-2">
                      <Button variant="default" className="w-full rounded-lg bg-brand-midnight hover:bg-brand-midnight/90">
                        Get this Rate
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* First Time Home Buyer */}
          <div className="mb-6 flex flex-row gap-4">
            <div className="w-1/2">
              <Label className="text-sm font-medium mb-3 block">Are you a first time home buyer?</Label>
              <div className="flex gap-4">
                <Button
                  variant={isFirstTimeBuyer ? "default" : "outline"}
                  onClick={() => setIsFirstTimeBuyer(true)}
                  className="min-w-[100px] rounded-lg"
                >
                  Yes
                </Button>
                <Button
                  variant={!isFirstTimeBuyer ? "default" : "outline"}
                  onClick={() => setIsFirstTimeBuyer(false)}
                  className="min-w-[100px] rounded-lg"
                >
                  No
                </Button>
              </div>
            </div>
            <div className="w-1/2">
              {isFirstTimeBuyer && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Provincial Rebate</span>
                    <span className="font-bold">{formatCurrency(Math.min(landTransferTaxCalculation.provincial, 4000))}</span>
                  </div>
                  {location.toLowerCase().includes('toronto') && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Municipal Rebate (Toronto)</span>
                      <span className="font-bold">{formatCurrency(Math.min(landTransferTaxCalculation.municipal, 4475))}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-bold">Total Rebate</span>
                    <span className="font-bold text-accent">{formatCurrency(landTransferTaxCalculation.rebate)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cash to Close Section */}
          <Card className="mb-6">
            <button
              onClick={() => setCashToCloseExpanded(!cashToCloseExpanded)}
              className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-brand-mist/20 transition-colors"
            >
              <h3 className="text-lg font-bold">Cash needed to close</h3>
              {cashToCloseExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {cashToCloseExpanded && (
              <div className="p-4 border-t space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  When you purchase a house, there are a number of costs you will need to pay upfront. Some are required, and others are optional.
                </p>
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                  {/* Down payment options - Hidden on mobile */}
                  <div className="hidden lg:block w-full lg:w-1/2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
                    <h4 className="font-semibold mb-3">Down payment options</h4>
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Select Scenario</Label>
                      <Select 
                        value={selectedScenarioIndex.toString()} 
                        onValueChange={(value) => setSelectedScenarioIndex(Number(value))}
                      >
                        <SelectTrigger className="bg-white w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {scenarios.map((scenario, idx) => (
                            <SelectItem key={idx} value={idx.toString()}>
                              Scenario {idx + 1} - {scenario.downPercent.toFixed(1)}% down ({formatCurrency(scenario.downAmount)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="w-full lg:w-1/2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm">
                    <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Down payment</Label>
                      <span className="font-bold">{formatCurrency(calculatedScenarios[0].downAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label>Provincial Land Transfer Tax</Label>
                      <span className="font-bold">{formatCurrency(landTransferTaxCalculation.provincial)}</span>
                    </div>
                    
                    {location.toLowerCase().includes('toronto') && (
                      <div className="flex justify-between items-center">
                        <Label>Municipal Land Transfer Tax (Toronto)</Label>
                        <span className="font-bold">{formatCurrency(landTransferTaxCalculation.municipal)}</span>
                      </div>
                    )}
                    
                    {landTransferTaxCalculation.rebate > 0 && (
                      <div className="flex justify-between items-center text-accent">
                        <Label>First-Time Buyer Rebate</Label>
                        <span className="font-bold">-{formatCurrency(landTransferTaxCalculation.rebate)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center border-t pt-2">
                      <Label className="font-bold">Net Land Transfer Tax</Label>
                      <span className="font-bold">{formatCurrency(landTransferTaxCalculation.netPayable)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="pstOnInsurance">PST on mortgage insurance</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                          <DollarSign className="h-3 w-3" />
                        </span>
                        <Input
                          id="pstOnInsurance"
                          type="number"
                          value={pstOnInsurance}
                          onChange={(e) => setPstOnInsurance(Number(e.target.value))}
                          className="w-32 text-right bg-white rounded-lg pl-6"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="lawyerFees">Lawyer fees</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                          <DollarSign className="h-3 w-3" />
                        </span>
                        <Input
                          id="lawyerFees"
                          type="number"
                          value={lawyerFees}
                          onChange={(e) => setLawyerFees(Number(e.target.value))}
                          className="w-32 text-right bg-white rounded-lg pl-6"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="titleInsurance">Title insurance</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                          <DollarSign className="h-3 w-3" />
                        </span>
                        <Input
                          id="titleInsurance"
                          type="number"
                          value={titleInsurance}
                          onChange={(e) => setTitleInsurance(Number(e.target.value))}
                          className="w-32 text-right bg-white rounded-lg pl-6"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="homeInspection">Home inspection</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                          <DollarSign className="h-3 w-3" />
                        </span>
                        <Input
                          id="homeInspection"
                          type="number"
                          value={homeInspection}
                          onChange={(e) => setHomeInspection(Number(e.target.value))}
                          className="w-32 text-right bg-white rounded-lg pl-6"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="appraisalFees">Appraisal fees</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                          <DollarSign className="h-3 w-3" />
                        </span>
                        <Input
                          id="appraisalFees"
                          type="number"
                          value={appraisalFees}
                          onChange={(e) => setAppraisalFees(Number(e.target.value))}
                          className="w-32 text-right bg-white rounded-lg pl-6"
                        />
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-bold text-lg">Cash needed to close</span>
                      <span className="font-bold text-lg text-accent">{formatCurrency(totalCashToClose)}</span>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Monthly Expenses Section */}
          <Card className="mb-6">
            <button
              onClick={() => setMonthlyExpensesExpanded(!monthlyExpensesExpanded)}
              className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-brand-mist/20 transition-colors"
            >
              <h3 className="text-lg font-bold">Monthly expenses</h3>
              {monthlyExpensesExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {monthlyExpensesExpanded && (
              <div className="p-4 border-t space-y-4">
                {/* Type of house - Mobile only */}
                <div className="lg:hidden mb-4">
                  <h4 className="font-semibold mb-3 text-sm">Type of house</h4>
                  <div className="flex gap-4">
                    <Button
                      variant={propertyType === "House" ? "default" : "outline"}
                      onClick={() => setPropertyType("House")}
                      className="min-w-[100px] rounded-lg"
                    >
                      House
                    </Button>
                    <Button
                      variant={propertyType === "Condo" ? "default" : "outline"}
                      onClick={() => setPropertyType("Condo")}
                      className="min-w-[100px] rounded-lg"
                    >
                      Condo
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                  {/* Down payment options - Hidden on mobile */}
                  <div className="hidden lg:block w-full lg:w-1/2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
                    <div className="mb-4">
                    <h4 className="font-semibold mb-3">Type of house</h4>
                      <div className="flex gap-4">
                        <Button
                          variant={propertyType === "House" ? "default" : "outline"}
                          onClick={() => setPropertyType("House")}
                          className="min-w-[100px] rounded-lg"
                        >
                          House
                        </Button>
                        <Button
                          variant={propertyType === "Condo" ? "default" : "outline"}
                          onClick={() => setPropertyType("Condo")}
                          className="min-w-[100px] rounded-lg"
                        >
                          Condo
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-semibold mb-3">Down payment options</h4>
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Select Scenario</Label>
                      <Select 
                        value={selectedScenarioIndex.toString()} 
                        onValueChange={(value) => setSelectedScenarioIndex(Number(value))}
                      >
                        <SelectTrigger className="bg-white w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {scenarios.map((scenario, idx) => (
                            <SelectItem key={idx} value={idx.toString()}>
                              Scenario {idx + 1} - {scenario.downPercent.toFixed(1)}% down ({formatCurrency(scenario.downAmount)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Mortgage payment</Label>
                        <span className="font-bold">{formatCurrency(calculatedScenarios[0].payment)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Label htmlFor="propertyTax">Property tax</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            <DollarSign className="h-3 w-3" />
                          </span>
                          <Input
                            id="propertyTax"
                            type="number"
                            value={propertyTax}
                            onChange={(e) => setPropertyTax(Number(e.target.value))}
                            className="w-32 text-right bg-white rounded-lg pl-6"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Label htmlFor="monthlyDebt">Monthly debt payments</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            <DollarSign className="h-3 w-3" />
                          </span>
                          <Input
                            id="monthlyDebt"
                            type="number"
                            value={monthlyDebt}
                            onChange={(e) => setMonthlyDebt(Number(e.target.value))}
                            className="w-32 text-right bg-white rounded-lg pl-6"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Label htmlFor="utilities">Utilities</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            <DollarSign className="h-3 w-3" />
                          </span>
                          <Input
                            id="utilities"
                            type="number"
                            value={utilities}
                            onChange={(e) => setUtilities(Number(e.target.value))}
                            className="w-32 text-right bg-white rounded-lg pl-6"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Label htmlFor="propertyInsurance">Property insurance</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            <DollarSign className="h-3 w-3" />
                          </span>
                          <Input
                            id="propertyInsurance"
                            type="number"
                            value={propertyInsurance}
                            onChange={(e) => setPropertyInsurance(Number(e.target.value))}
                            className="w-32 text-right bg-white rounded-lg pl-6"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Label htmlFor="phone">Phone</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            <DollarSign className="h-3 w-3" />
                          </span>
                          <Input
                            id="phone"
                            type="number"
                            value={phone}
                            onChange={(e) => setPhone(Number(e.target.value))}
                            className="w-32 text-right bg-white rounded-lg pl-6"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Label htmlFor="cable">Cable</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            <DollarSign className="h-3 w-3" />
                          </span>
                          <Input
                            id="cable"
                            type="number"
                            value={cable}
                            onChange={(e) => setCable(Number(e.target.value))}
                            className="w-32 text-right bg-white rounded-lg pl-6"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Label htmlFor="internet">Internet</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            <DollarSign className="h-3 w-3" />
                          </span>
                          <Input
                            id="internet"
                            type="number"
                            value={internet}
                            onChange={(e) => setInternet(Number(e.target.value))}
                            className="w-32 text-right bg-white rounded-lg pl-6"
                          />
                        </div>
                      </div>

                      {propertyType === "Condo" && (
                        <div className="flex justify-between items-center">
                          <Label htmlFor="condoFees">Condo fees</Label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                              <DollarSign className="h-3 w-3" />
                            </span>
                            <Input
                              id="condoFees"
                              type="number"
                              value={condoFees}
                              onChange={(e) => setCondoFees(Number(e.target.value))}
                              className="w-32 text-right bg-white rounded-lg pl-6"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="border-t pt-3 flex justify-between items-center">
                        <span className="font-bold text-lg">Monthly expenses</span>
                        <span className="font-bold text-lg text-accent">{formatCurrency(monthlyExpenses)}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Interest Rate Risk Section */}
          <Card className="mb-6">
            <button
              onClick={() => setInterestRiskExpanded(!interestRiskExpanded)}
              className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-brand-mist/20 transition-colors"
            >
              <h3 className="text-lg font-bold">Interest rate risk</h3>
              {interestRiskExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {interestRiskExpanded && (
              <div className="p-4 border-t space-y-4">
                <div className="flex flex-row gap-6 items-start">
                  <div className="w-[60%]">
                    <div className="bg-gradient-to-r from-brand-celestial to-brand-cb-blue p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2 text-white">Your current mortgage</h4>
                      <div className="space-y-2 text-sm text-white">
                        <div className="flex justify-between">
                          <span>Mortgage amount today</span>
                          <span className="font-bold">{formatCurrency(calculatedScenarios[0].totalMortgage)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Principal paid off over term</span>
                          <span className="font-bold">{formatCurrency(calculatedScenarios[0].totalMortgage * 0.12)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Balance remaining at the end of your current term</span>
                          <span className="font-bold">{formatCurrency(calculatedScenarios[0].totalMortgage * 0.88)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-[40%]">
                    <p className="text-sm text-muted-foreground mb-4">
                      Using the remaining balance above, below we can calculate the mortgage payments you could encounter at renewal based on different interest rates.
                    </p>

                    <div className="space-y-2">
                      {[
                        { label: "Selected Rate", rate: scenarios[0].mortgageRate, payment: calculatedScenarios[0].payment },
                        { label: "Selected Rate -2%", rate: Math.max(0, scenarios[0].mortgageRate - 2), payment: calculatePayment(calculatedScenarios[0].totalMortgage * 0.88, Math.max(0, scenarios[0].mortgageRate - 2), scenarios[0].amortization - 5, scenarios[0].paymentFrequency) },
                        { label: "Selected Rate +2%", rate: scenarios[0].mortgageRate + 2, payment: calculatePayment(calculatedScenarios[0].totalMortgage * 0.88, scenarios[0].mortgageRate + 2, scenarios[0].amortization - 5, scenarios[0].paymentFrequency) },
                        { label: "Selected Rate +5%", rate: scenarios[0].mortgageRate + 5, payment: calculatePayment(calculatedScenarios[0].totalMortgage * 0.88, scenarios[0].mortgageRate + 5, scenarios[0].amortization - 5, scenarios[0].paymentFrequency) },
                      ].map((scenario, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-secondary/20 rounded">
                          <span className="text-sm">{scenario.label}</span>
                          <div className="flex gap-4 items-center">
                            <span className="font-mono">{scenario.rate.toFixed(2)}%</span>
                            <span className="font-bold min-w-[100px] text-right">{formatCurrency(scenario.payment)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>


                

                

                <p className="text-xs text-muted-foreground mt-4">
                  Below is a graph that displays the approximate values of competitive 5-year fixed mortgage rates since 2006.
                </p>

                <InterestRateChart currentRate={scenarios[0].mortgageRate} />
              </div>
            )}
          </Card>

          {/* Amortization Schedule Section */}
          <Card>
            <button
              onClick={() => setAmortizationScheduleExpanded(!amortizationScheduleExpanded)}
              className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-brand-mist/20 transition-colors"
            >
              <h3 className="text-lg font-bold">Amortization schedule</h3>
              {amortizationScheduleExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {amortizationScheduleExpanded && (
              <div className="p-4 border-t space-y-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2 text-teal-600">Choose your amortization scenario</h4>
                    <Select 
                      value={selectedScenarioIndex.toString()} 
                      onValueChange={(value) => setSelectedScenarioIndex(Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {scenarios.map((scenario, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            Scenario {idx + 1} ({scenario.downPercent.toFixed(1)}% down)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant={amortizationViewMode === "table" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setAmortizationViewMode(amortizationViewMode === "chart" ? "table" : "chart")}
                    className="h-9 w-9 mt-9 rounded-lg transition-all duration-300 ml-4"
                    title={amortizationViewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                  >
                    {amortizationViewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                  </Button>
                </div>

                {amortizationViewMode === "chart" ? (
                  <div className="w-full h-[400px]">
                    <AmortizationChart 
                      principal={calculatedScenarios[selectedScenarioIndex].totalMortgage}
                      rate={scenarios[selectedScenarioIndex].mortgageRate}
                      years={scenarios[selectedScenarioIndex].amortization}
                      paymentFrequency={scenarios[selectedScenarioIndex].paymentFrequency}
                    />
                  </div>
                ) : (
                  <div className="w-full overflow-auto max-h-[500px] rounded-lg border border-border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                        <TableRow>
                          <TableHead className="font-semibold">Payment #</TableHead>
                          <TableHead className="text-right font-semibold">Payment Amount</TableHead>
                          <TableHead className="text-right font-semibold">Principal</TableHead>
                          <TableHead className="text-right font-semibold">Interest</TableHead>
                          <TableHead className="text-right font-semibold">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getAmortizationSchedule(
                          calculatedScenarios[selectedScenarioIndex].totalMortgage,
                          scenarios[selectedScenarioIndex].mortgageRate,
                          scenarios[selectedScenarioIndex].amortization,
                          scenarios[selectedScenarioIndex].paymentFrequency
                        ).map((row, index) => (
                          <TableRow 
                            key={index}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="font-medium">{row.payment}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.totalPayment)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.principal)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.interest)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </Card>
      </div>
    </div>
    </div>
  );
};

export default MortgageCalculator;
