"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Info, DollarSign, MapPin, Percent } from "lucide-react";
import * as Tooltip from '@radix-ui/react-tooltip';
import CashToCloseSection from "../CashToCloseSection";
import MonthlyExpensesSection from "../MonthlyExpensesSection";
import { DownPaymentCalculatorProps, ScenarioSettings, CalculatedScenario } from "./types";
import { formatNumberWithCommas, parseNumberFromString, formatCurrency } from "./utils";
import { calculateCMHC, calculateLandTransferTax, calculatePayment } from "../MortgageCalculator/calculations";

const DownPaymentCalculator = ({ 
  property,
  initialHomePrice = 600000, 
  initialLocation = "Toronto, ON",
  className = ""
}: DownPaymentCalculatorProps) => {
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
  const [propertyType, setPropertyType] = useState<"House" | "Condo">(
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
  
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);

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
          <div className="hidden sm:block overflow-x-auto mb-6 sm:mb-8 -mx-4 sm:mx-0">
            <div className="min-w-[600px] px-4 sm:px-0">
              <table className="w-full">
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 px-2 w-32 sm:w-48">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm">Amortization</span>
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
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
                      <td key={idx} className="text-center py-3 px-1 sm:px-2">
                        <Select 
                          value={scenario.amortization.toString()} 
                          onValueChange={(v) => updateScenario(idx, { amortization: Number(v) })}
                        >
                          <SelectTrigger className="h-8 sm:h-10 bg-gradient-to-r from-blue-50 to-indigo-50 text-xs sm:text-sm rounded-lg">
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
                      <span className="text-xs sm:text-sm">Mortgage rate</span>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
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
                    <td key={idx} className="text-center py-3 px-1 sm:px-2">
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
                            className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg pl-6 pr-12 sm:pr-16 h-8 sm:h-9 text-xs sm:text-sm"
                          />
                          <span className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">5-yr/fix</span>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-2">
                    <span className="text-xs sm:text-sm">Payment frequency</span>
                  </td>
                  {scenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-1 sm:px-2">
                      <Select 
                        value={scenario.paymentFrequency} 
                        onValueChange={(v) => updateScenario(idx, { paymentFrequency: v })}
                      >
                        <SelectTrigger className="h-8 sm:h-10 bg-gradient-to-r from-blue-50 to-indigo-50 text-xs sm:text-sm">
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
                      <span className="text-xs sm:text-sm">Mortgage payment</span>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
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
                    <td key={idx} className="text-center py-3 px-1 sm:px-2 font-bold text-purple-500 text-sm sm:text-lg">
                      {formatCurrency(scenario.payment)}
                    </td>
                  ))}
                </tr>

                {/* Get this Rate Buttons */}
                <tr>
                  <td className="py-3 px-2"></td>
                  {calculatedScenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-1 sm:px-2">
                      <Button variant="default" className="w-full rounded-lg bg-brand-midnight hover:bg-brand-midnight/90 text-xs sm:text-sm h-8 sm:h-10">
                        Get this Rate
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          {/* First Time Home Buyer */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
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
            <div className="w-full sm:w-1/2">
              {isFirstTimeBuyer && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Provincial Rebate</span>
                    <span className="font-bold text-sm sm:text-base">{formatCurrency(Math.min(landTransferTaxCalculation.provincial, 4000))}</span>
                  </div>
                  {location.toLowerCase().includes('toronto') && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Municipal Rebate (Toronto)</span>
                      <span className="font-bold text-sm sm:text-base">{formatCurrency(Math.min(landTransferTaxCalculation.municipal, 4475))}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-bold text-sm sm:text-base">Total Rebate</span>
                    <span className="font-bold text-accent text-sm sm:text-base">{formatCurrency(landTransferTaxCalculation.rebate)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cash to Close Section */}
          <CashToCloseSection
            downAmount={calculatedScenarios[selectedScenarioIndex].downAmount}
            landTransferTaxCalculation={landTransferTaxCalculation}
            location={location}
            pstOnInsurance={pstOnInsurance}
            lawyerFees={lawyerFees}
            titleInsurance={titleInsurance}
            homeInspection={homeInspection}
            appraisalFees={appraisalFees}
            scenarios={scenarios}
            selectedScenarioIndex={selectedScenarioIndex}
            setPstOnInsurance={setPstOnInsurance}
            setLawyerFees={setLawyerFees}
            setTitleInsurance={setTitleInsurance}
            setHomeInspection={setHomeInspection}
            setAppraisalFees={setAppraisalFees}
            setSelectedScenarioIndex={setSelectedScenarioIndex}
            totalCashToClose={totalCashToClose}
            formatCurrency={formatCurrency}
          />

          {/* Monthly Expenses Section */}
          <MonthlyExpensesSection
            mortgagePayment={calculatedScenarios[selectedScenarioIndex].payment}
            propertyTax={propertyTax}
            monthlyDebt={monthlyDebt}
            utilities={utilities}
            propertyInsurance={propertyInsurance}
            phone={phone}
            cable={cable}
            internet={internet}
            condoFees={condoFees}
            propertyType={propertyType}
            scenarios={scenarios}
            selectedScenarioIndex={selectedScenarioIndex}
            setPropertyTax={setPropertyTax}
            setMonthlyDebt={setMonthlyDebt}
            setUtilities={setUtilities}
            setPropertyInsurance={setPropertyInsurance}
            setPhone={setPhone}
            setCable={setCable}
            setInternet={setInternet}
            setCondoFees={setCondoFees}
            setPropertyType={setPropertyType}
            setSelectedScenarioIndex={setSelectedScenarioIndex}
            monthlyExpenses={monthlyExpenses}
            formatCurrency={formatCurrency}
          />
      </div>
    </div>
  );
};

export default DownPaymentCalculator;