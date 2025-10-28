import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import * as Tooltip from '@radix-ui/react-tooltip';
import InterestRateChart from "./InterestRateChart";
import AmortizationChart from "./AmortizationChart";
import { PropertyListing } from "@/lib/types";

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
      
      // Update scenarios with new price
      const newScenarios = scenarios.map(s => ({
        ...s,
        downAmount: newPrice * (s.downPercent / 100)
      }));
      setScenarios(newScenarios);
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

  const generateAmortizationSchedule = (principal: number, rate: number, years: number) => {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = years * 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    const schedule = [];
    let balance = principal;
    
    for (let year = 0; year < years; year++) {
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;
      
      for (let month = 0; month < 12; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        
        yearlyInterest += interestPayment;
        yearlyPrincipal += principalPayment;
        balance -= principalPayment;
      }
      
      schedule.push({
        year: year + 1,
        balance: Math.max(0, balance),
        interest: yearlyInterest,
        principal: yearlyPrincipal,
        totalPayment: yearlyInterest + yearlyPrincipal
      });
    }
    
    return schedule;
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

  return (
    <div className={`py-8 px-4 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mortgage Payment Calculator Canada</h1>
          <p className="text-muted-foreground">
            Get a sense for your mortgage payments, the cash you'll need to close and the monthly carrying costs with our mortgage payment calculator.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div>
              <Label htmlFor="homePrice" className="text-sm font-medium mb-2 block">
                Property Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="homePrice"
                  type="number"
                  value={homePrice}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    setHomePrice(newPrice);
                    // Update all down amounts based on percentages
                    const newScenarios = scenarios.map(s => ({
                      ...s,
                      downAmount: newPrice * (s.downPercent / 100)
                    }));
                    setScenarios(newScenarios);
                  }}
                  className="pl-7 h-12 text-lg rounded-lg"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location" className="text-sm font-medium mb-2 block">
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-12 rounded-lg"
              />
            </div>
          </div>

          {/* Scenarios Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full">
              <thead>
                <tr className="">
                  <th className="text-left py-3 px-2 w-48"></th>
                  
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Down payment</span>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
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
                    <td key={idx} className="text-center py-3 px-2">
                      <div className="flex flex-col gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={scenario.downPercent}
                          onChange={(e) => updateScenario(idx, { downPercent: Number(e.target.value) })}
                          className="text-center h-8 text-sm rounded-lg"
                        />
                        <Input
                          type="number"
                          value={Math.round(scenario.downAmount)}
                          onChange={(e) => updateScenario(idx, { downAmount: Number(e.target.value) })}
                          className="text-center h-8 text-sm rounded-lg"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">CMHC</span>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
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
                    <td key={idx} className="text-center py-3 px-2 text-accent">
                      {formatCurrency(scenario.cmhc)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-secondary/20">
                  <td className="py-3 px-2 font-medium text-sm">Total mortgage</td>
                  {calculatedScenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-2 font-bold">
                      {formatCurrency(scenario.totalMortgage)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Individual Controls for Each Scenario */}
          <div className="overflow-x-auto mb-8">
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
                        <SelectTrigger className="h-10">
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
                      <div className="flex items-center justify-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={scenario.mortgageRate}
                          onChange={(e) => updateScenario(idx, { mortgageRate: Number(e.target.value) })}
                          className="text-center w-24 rounded-lg"
                        />
                        <span className="text-xs text-muted-foreground">5-yr/fix</span>
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
                        <SelectTrigger className="h-10">
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
                <tr className="bg-secondary/20">
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
                    <td key={idx} className="text-center py-3 px-2 font-bold text-primary text-lg">
                      {formatCurrency(scenario.payment)}
                    </td>
                  ))}
                </tr>

                {/* Get this Rate Buttons */}
                <tr>
                  <td className="py-3 px-2"></td>
                  {calculatedScenarios.map((scenario, idx) => (
                    <td key={idx} className="text-center py-3 px-2">
                      <Button className="min-w-[120px] rounded-lg">
                        Get this Rate
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* First Time Home Buyer */}
          <div className="mb-6">
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
            {isFirstTimeBuyer && (
              <div className="mt-4 p-4 bg-secondary/30 rounded-lg space-y-3">
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

          {/* Cash to Close Section */}
          <Card className="mb-6">
            <button
              onClick={() => setCashToCloseExpanded(!cashToCloseExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
            >
              <h3 className="text-lg font-bold">Cash needed to close</h3>
              {cashToCloseExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {cashToCloseExpanded && (
              <div className="p-4 border-t space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  When you purchase a house, there are a number of costs you will need to pay upfront. Some are required, and others are optional.
                </p>
                
                <h4 className="font-semibold mb-3">Down payment options</h4>
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Select Scenario</Label>
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
                          Scenario {idx + 1} - {scenario.downPercent.toFixed(1)}% down ({formatCurrency(scenario.downAmount)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Selected: Scenario {selectedScenarioIndex + 1} ({scenarios[selectedScenarioIndex].downPercent.toFixed(1)}% down)
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Down payment</Label>
                    <span className="font-bold">{formatCurrency(calculatedScenarios[selectedScenarioIndex].downAmount)}</span>
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
                    <Input
                      id="pstOnInsurance"
                      type="number"
                      value={pstOnInsurance}
                      onChange={(e) => setPstOnInsurance(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="lawyerFees">Lawyer fees</Label>
                    <Input
                      id="lawyerFees"
                      type="number"
                      value={lawyerFees}
                      onChange={(e) => setLawyerFees(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="titleInsurance">Title insurance</Label>
                    <Input
                      id="titleInsurance"
                      type="number"
                      value={titleInsurance}
                      onChange={(e) => setTitleInsurance(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="homeInspection">Home inspection</Label>
                    <Input
                      id="homeInspection"
                      type="number"
                      value={homeInspection}
                      onChange={(e) => setHomeInspection(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="appraisalFees">Appraisal fees</Label>
                    <Input
                      id="appraisalFees"
                      type="number"
                      value={appraisalFees}
                      onChange={(e) => setAppraisalFees(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-bold text-lg">Cash needed to close</span>
                    <span className="font-bold text-lg text-accent">{formatCurrency(totalCashToClose)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Monthly Expenses Section */}
          <Card className="mb-6">
            <button
              onClick={() => setMonthlyExpensesExpanded(!monthlyExpensesExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
            >
              <h3 className="text-lg font-bold">Monthly expenses</h3>
              {monthlyExpensesExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {monthlyExpensesExpanded && (
              <div className="p-4 border-t space-y-4">
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-3 block">Type of house</Label>
                  <div className="flex gap-4">
                    <Button
                      variant={propertyType === "House" ? "default" : "outline"}
                      onClick={() => setPropertyType("House")}
                      className="min-w-[100px]"
                    >
                      House
                    </Button>
                    <Button
                      variant={propertyType === "Condo" ? "default" : "outline"}
                      onClick={() => setPropertyType("Condo")}
                      className="min-w-[100px]"
                    >
                      Condo
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Mortgage payment</Label>
                  <span className="font-bold">{formatCurrency(calculatedScenarios[selectedScenarioIndex].payment)}</span>
                </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="propertyTax">Property tax</Label>
                    <Input
                      id="propertyTax"
                      type="number"
                      value={propertyTax}
                      onChange={(e) => setPropertyTax(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="monthlyDebt">Monthly debt payments</Label>
                    <Input
                      id="monthlyDebt"
                      type="number"
                      value={monthlyDebt}
                      onChange={(e) => setMonthlyDebt(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="utilities">Utilities</Label>
                    <Input
                      id="utilities"
                      type="number"
                      value={utilities}
                      onChange={(e) => setUtilities(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="propertyInsurance">Property insurance</Label>
                    <Input
                      id="propertyInsurance"
                      type="number"
                      value={propertyInsurance}
                      onChange={(e) => setPropertyInsurance(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="number"
                      value={phone}
                      onChange={(e) => setPhone(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="cable">Cable</Label>
                    <Input
                      id="cable"
                      type="number"
                      value={cable}
                      onChange={(e) => setCable(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="internet">Internet</Label>
                    <Input
                      id="internet"
                      type="number"
                      value={internet}
                      onChange={(e) => setInternet(Number(e.target.value))}
                      className="w-32 text-right"
                    />
                  </div>

                  {propertyType === "Condo" && (
                    <div className="flex justify-between items-center">
                      <Label htmlFor="condoFees">Condo fees</Label>
                      <Input
                        id="condoFees"
                        type="number"
                        value={condoFees}
                        onChange={(e) => setCondoFees(Number(e.target.value))}
                        className="w-32 text-right"
                      />
                    </div>
                  )}
                  
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-bold text-lg">Monthly expenses</span>
                    <span className="font-bold text-lg text-accent">{formatCurrency(monthlyExpenses)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Interest Rate Risk Section */}
          <Card className="mb-6">
            <button
              onClick={() => setInterestRiskExpanded(!interestRiskExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
            >
              <h3 className="text-lg font-bold">Interest rate risk</h3>
              {interestRiskExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {interestRiskExpanded && (
              <div className="p-4 border-t space-y-4">
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
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
            >
              <h3 className="text-lg font-bold">Amortization schedule</h3>
              {amortizationScheduleExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {amortizationScheduleExpanded && (
              <div className="p-4 border-t space-y-4">
                <div className="mb-4">
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

                <div className="w-full h-[400px]">
                  <AmortizationChart 
                    principal={calculatedScenarios[selectedScenarioIndex].totalMortgage}
                    rate={scenarios[selectedScenarioIndex].mortgageRate}
                    years={scenarios[selectedScenarioIndex].amortization}
                    paymentFrequency={scenarios[selectedScenarioIndex].paymentFrequency}
                  />
                </div>
              </div>
            )}
          </Card>
        </Card>
      </div>
    </div>
  );
};

export default MortgageCalculator;
