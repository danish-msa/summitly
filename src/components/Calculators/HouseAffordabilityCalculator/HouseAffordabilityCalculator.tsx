"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import { Info, DollarSign, Percent, ChevronDown, ChevronUp, TrendingUp, AlertCircle, CheckCircle2, Table2, BarChart3 } from "lucide-react";
import * as Tooltip from '@radix-ui/react-tooltip';
import ReactECharts from "echarts-for-react";

interface AffordabilityResults {
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

// Helper functions for number formatting
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseNumberFromString = (value: string): number => {
  const cleaned = value.replace(/[^\d.]/g, '');
  return Number(cleaned) || 0;
};

const HouseAffordabilityCalculator = () => {
  // Input fields
  const [annualIncome, setAnnualIncome] = useState(75000);
  const [monthlyDebts, setMonthlyDebts] = useState(300);
  const [downPaymentPercent, setDownPaymentPercent] = useState(3.0);
  const [downPaymentAmount, setDownPaymentAmount] = useState(15000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.25);
  const [insuranceRate, setInsuranceRate] = useState(0.35); // per $1000 of home value
  const [hoaFees, setHoaFees] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sliderPrice, setSliderPrice] = useState(0);
  const [paymentBreakdownExpanded, setPaymentBreakdownExpanded] = useState(false);
  const [paymentViewMode, setPaymentViewMode] = useState<"table" | "chart">("table");

  // Advanced fields
  const [annualPropertyTax, setAnnualPropertyTax] = useState(0);
  const [annualInsurance, setAnnualInsurance] = useState(0);
  const [pmiRate, setPmiRate] = useState(0.55); // PMI as % of loan amount annually
  const [dtiBackEnd, setDtiBackEnd] = useState(43);
  const [dtiFrontEnd, setDtiFrontEnd] = useState(36);

  const [results, setResults] = useState<AffordabilityResults>({
    maxHomePrice: 0,
    monthlyPayment: 0,
    principalAndInterest: 0,
    propertyTaxes: 0,
    insurance: 0,
    pmi: 0,
    hoaFees: 0,
    dtiRatio: 0,
    frontEndDTI: 0,
  });

  // Calculate monthly mortgage payment (P&I)
  const calculateMonthlyPayment = (loanAmount: number, rate: number, termYears: number): number => {
    if (loanAmount === 0) return 0;
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = termYears * 12;
    
    if (monthlyRate === 0) {
      return loanAmount / numberOfPayments;
    }
    
    return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  // Calculate affordability
  useEffect(() => {
    calculateFromIncome();
  }, [
    annualIncome, monthlyDebts, downPaymentPercent, downPaymentAmount, interestRate, loanTerm,
    propertyTaxRate, insuranceRate, hoaFees, showAdvanced, annualPropertyTax,
    annualInsurance, pmiRate, dtiBackEnd, dtiFrontEnd
  ]);

  const calculateFromIncome = () => {
    const grossMonthlyIncome = annualIncome / 12;
    
    // Calculate maximum monthly housing payment (front-end DTI)
    const maxHousingPayment = grossMonthlyIncome * (dtiFrontEnd / 100);
    
    // Calculate maximum total debt payment (back-end DTI)
    const maxTotalDebtPayment = grossMonthlyIncome * (dtiBackEnd / 100);
    const maxMonthlyDebtAfterHousing = maxTotalDebtPayment - monthlyDebts;
    
    // The limiting factor is the smaller of the two
    const availableForHousing = Math.min(maxHousingPayment, maxMonthlyDebtAfterHousing);
    
    if (availableForHousing <= 0) {
      setResults({
        maxHomePrice: 0,
        monthlyPayment: 0,
        principalAndInterest: 0,
        propertyTaxes: 0,
        insurance: 0,
        pmi: 0,
        hoaFees: hoaFees,
        dtiRatio: 0,
        frontEndDTI: 0,
      });
      return;
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
      
      // Update the dollar amount to match the calculated percentage
      setDownPaymentAmount(Math.round(finalDownPayment));
      
      // Set slider price to max home price if not already set or if it's the initial calculation
      if (sliderPrice === 0 || sliderPrice > maxHomePrice) {
        setSliderPrice(maxHomePrice);
      }
      
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
      
      setResults({
        maxHomePrice: maxHomePrice,
        monthlyPayment: finalMonthlyPayment,
        principalAndInterest: finalPAndI,
        propertyTaxes: finalPropertyTax,
        insurance: finalInsurance,
        pmi: finalPMI,
        hoaFees: hoaFees,
        dtiRatio: ((finalMonthlyPayment + monthlyDebts) / grossMonthlyIncome) * 100,
        frontEndDTI: (finalMonthlyPayment / grossMonthlyIncome) * 100,
      });
    } else {
      setResults({
        maxHomePrice: 0,
        monthlyPayment: 0,
        principalAndInterest: 0,
        propertyTaxes: 0,
        insurance: 0,
        pmi: 0,
        hoaFees: hoaFees,
        dtiRatio: 0,
        frontEndDTI: 0,
      });
    }
  };



  // Determine budget status message based on slider price or max home price
  const getBudgetStatus = (priceToCheck: number) => {
    if (priceToCheck === 0 || results.maxHomePrice === 0) {
      return {
        message: "Unable to calculate affordability with current inputs.",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        icon: AlertCircle,
        iconColor: "text-gray-500"
      };
    }
    
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
    const isAboveAffordable = priceToCheck > results.maxHomePrice;
    
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

  // Use slider price if set, otherwise use max home price
  const currentPrice = sliderPrice > 0 ? sliderPrice : results.maxHomePrice;
  const budgetStatus = getBudgetStatus(currentPrice);
  const StatusIcon = budgetStatus.icon;

  // Get payment breakdown data for chart
  const getPaymentBreakdownData = () => {
    const currentResults = sliderPrice > 0 && sliderPrice !== results.maxHomePrice ? (() => {
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
    
    const data = [
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

  // Pie chart option generator
  const getPieChartOption = (data: Array<{name: string, value: number, color?: string, percentage?: number}>, title: string) => {
    return {
      tooltip: {
        trigger: "item",
        formatter: (params: { name: string; value: number; percent: number }) => {
          return `${params.name}: ${formatCurrency(params.value)} (${params.percent}%)`;
        },
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e5e7eb",
        textStyle: {
          color: "#1f2937",
        },
      },
      legend: {
        orient: "vertical",
        left: "left",
        textStyle: {
          color: "#1f2937",
        },
        formatter: (name: string) => {
          const item = data.find((d) => d.name === name);
          return item ? `${name} (${item.percentage?.toFixed(1)}%)` : name;
        },
      },
      series: [
        {
          name: title,
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: "#ffffff",
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "outside",
            formatter: "{d}%",
            color: "#1f2937",
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: "bold",
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          data: data.map((item) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: item.color || `hsl(${(data.indexOf(item) * 360) / data.length}, 70%, 60%)`,
            },
          })),
        },
      ],
    };
  };

  return (
    <div className="space-y-6">
      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column - Input Fields Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y">
                {/* Annual Income Row */}
                <tr>
                  <td className="py-3 px-2 w-32 sm:w-48">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="annualIncome" className="text-xs sm:text-sm">Annual Income</Label>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                              Your total pre-tax annual income. Include all income sources if co-borrowing.
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="annualIncome"
                        type="text"
                        value={formatNumber(annualIncome)}
                        onChange={(e) => setAnnualIncome(parseNumberFromString(e.target.value))}
                        className="pl-9 rounded-lg"
                        placeholder="75,000"
                      />
                    </div>
                  </td>
                </tr>

                {/* Down Payment Row */}
                <tr>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="downPayment" className="text-xs sm:text-sm">Down Payment</Label>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                              Amount you plan to put down upfront. A 20% down payment eliminates PMI.
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={downPaymentPercent}
                          onChange={(e) => {
                            const newPercent = Number(e.target.value);
                            setDownPaymentPercent(newPercent);
                            // Update dollar amount based on current max home price if available
                            if (results.maxHomePrice > 0) {
                              setDownPaymentAmount(Math.round(results.maxHomePrice * (newPercent / 100)));
                            }
                          }}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 text-xs sm:text-sm rounded-lg pr-6 h-8 sm:h-9"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">
                          <Percent className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                          <DollarSign className="h-4 w-4" />
                        </span>
                        <Input
                          type="text"
                          value={formatNumber(Math.round(downPaymentAmount))}
                          onChange={(e) => {
                            const value = parseNumberFromString(e.target.value);
                            setDownPaymentAmount(value);
                            // Update percentage based on estimated home price
                            if (results.maxHomePrice > 0) {
                              setDownPaymentPercent((value / results.maxHomePrice) * 100);
                            }
                          }}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 text-xs sm:text-sm rounded-lg pl-9 h-8 sm:h-9"
                        />
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Monthly Debts Row */}
                <tr>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="monthlyDebts" className="text-xs sm:text-sm">Monthly Debts</Label>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground cursor-help" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                              Total of all monthly debt payments (car loans, credit cards, student loans, etc.)
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="monthlyDebts"
                        type="text"
                        value={formatNumber(monthlyDebts)}
                        onChange={(e) => setMonthlyDebts(parseNumberFromString(e.target.value))}
                        className="pl-9 rounded-lg"
                        placeholder="300"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Column - Status Info & Slider */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">You can afford a house up to</h3>
                <div className="text-4xl font-bold text-primary mb-4">
                  {formatCurrency(results.maxHomePrice || 0)}
                </div>
              </div>

              {/* Budget Status Message */}
              <div className={`${budgetStatus.bgColor} ${budgetStatus.color} p-4 rounded-lg border`}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={`h-5 w-5 ${budgetStatus.iconColor} mt-0.5 flex-shrink-0`} />
                  <p className="text-sm font-medium leading-relaxed">{budgetStatus.message}</p>
                </div>
              </div>

              {/* Interactive Price Slider */}
              {results.maxHomePrice > 0 && (
                <div className="space-y-3 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Explore Price Range</span>
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(sliderPrice || results.maxHomePrice)}
                    </span>
                  </div>
                  
                  {/* Interactive Slider */}
                  <div className="py-6">
                    <Slider
                      value={[sliderPrice || results.maxHomePrice]}
                      onValueChange={([value]) => setSliderPrice(value)}
                      min={50000}
                      max={Math.max(results.maxHomePrice * 1.5, 2000000)}
                      step={10000}
                      className="w-full"
                    />
                    
                    {/* Calculate payment for selected price */}
                    {sliderPrice > 0 && (() => {
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
                      const selectedTotalPayment = selectedPAndI + selectedPropertyTax + selectedInsurance + selectedPMI + hoaFees;
                      const grossMonthlyIncome = annualIncome / 12;
                      const selectedFrontEndDTI = (selectedTotalPayment / grossMonthlyIncome) * 100;
                      
                      return (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-primary/20">
                          <div className="text-xs text-muted-foreground mb-2">Payment at this price:</div>
                          <div className="text-lg font-bold text-primary mb-1">
                            {formatCurrency(selectedTotalPayment)}/mo
                          </div>
                          <div className="text-xs text-muted-foreground">
                            DTI: {selectedFrontEndDTI.toFixed(1)}% | 
                            {sliderPrice > results.maxHomePrice ? (
                              <span className="text-orange-600 ml-1"> Above affordable range</span>
                            ) : (
                              <span className="text-green-600 ml-1"> Within affordable range</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Price markers */}
                    <div className="flex justify-between text-xs text-muted-foreground mt-4 pt-2">
                      <span>$50K</span>
                      <span>$500K</span>
                      <span>$1M</span>
                      <span>$1.5M</span>
                      <span>$2M+</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-center text-muted-foreground">
                    Drag the slider to explore different price points and see payment amounts
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Additional Input Fields */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
                      Annual mortgage interest rate. Current national average is around 6.5%.
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <Input
              id="interestRate"
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
              placeholder="6.5"
            />
            <Slider
              value={[interestRate]}
              onValueChange={([value]) => setInterestRate(value)}
              min={2}
              max={10}
              step={0.1}
              className="mt-2"
            />
          </div>

          {/* Loan Term */}
          <div className="space-y-2">
            <Label htmlFor="loanTerm">Loan Term (Years)</Label>
            <Select value={loanTerm.toString()} onValueChange={(v) => setLoanTerm(parseInt(v))}>
              <SelectTrigger id="loanTerm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 years</SelectItem>
                <SelectItem value="20">20 years</SelectItem>
                <SelectItem value="30">30 years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* HOA Dues */}
          <div className="space-y-2">
            <Label htmlFor="hoaFees">HOA Dues (Monthly)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="hoaFees"
                type="text"
                value={formatNumber(hoaFees)}
                onChange={(e) => setHoaFees(parseNumberFromString(e.target.value))}
                className="pl-9"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mt-6">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-between"
          >
            <span>Advanced Options</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg">
              {/* Property Tax Rate */}
              <div className="space-y-2">
                <Label htmlFor="propertyTaxRate">Property Tax Rate (%)</Label>
                <Input
                  id="propertyTaxRate"
                  type="number"
                  step="0.1"
                  value={propertyTaxRate}
                  onChange={(e) => setPropertyTaxRate(parseFloat(e.target.value) || 0)}
                  placeholder="1.25"
                />
              </div>

              {/* Annual Property Tax (Override) */}
              <div className="space-y-2">
                <Label htmlFor="annualPropertyTax">Annual Property Tax (Override)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="annualPropertyTax"
                    type="text"
                    value={formatNumber(annualPropertyTax)}
                    onChange={(e) => setAnnualPropertyTax(parseNumberFromString(e.target.value))}
                    className="pl-9"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Insurance Rate */}
              <div className="space-y-2">
                <Label htmlFor="insuranceRate">Homeowner's Insurance Rate (per $1,000)</Label>
                <Input
                  id="insuranceRate"
                  type="number"
                  step="0.01"
                  value={insuranceRate}
                  onChange={(e) => setInsuranceRate(parseFloat(e.target.value) || 0)}
                  placeholder="0.35"
                />
              </div>

              {/* Annual Insurance (Override) */}
              <div className="space-y-2">
                <Label htmlFor="annualInsurance">Annual Homeowner's Insurance (Override)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="annualInsurance"
                    type="text"
                    value={formatNumber(annualInsurance)}
                    onChange={(e) => setAnnualInsurance(parseNumberFromString(e.target.value))}
                    className="pl-9"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* PMI Rate */}
              <div className="space-y-2">
                <Label htmlFor="pmiRate">Mortgage Insurance (PMI) Rate (% of loan/year)</Label>
                <Input
                  id="pmiRate"
                  type="number"
                  step="0.01"
                  value={pmiRate}
                  onChange={(e) => setPmiRate(parseFloat(e.target.value) || 0)}
                  placeholder="0.55"
                />
              </div>

              {/* DTI Ratios */}
              <div className="space-y-2">
                <Label htmlFor="dtiFrontEnd">Front-End DTI (%)</Label>
                <Input
                  id="dtiFrontEnd"
                  type="number"
                  step="1"
                  value={dtiFrontEnd}
                  onChange={(e) => setDtiFrontEnd(parseInt(e.target.value) || 36)}
                  placeholder="36"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dtiBackEnd">Back-End DTI (%)</Label>
                <Input
                  id="dtiBackEnd"
                  type="number"
                  step="1"
                  value={dtiBackEnd}
                  onChange={(e) => setDtiBackEnd(parseInt(e.target.value) || 43)}
                  placeholder="43"
                />
              </div>
            </div>
          )}
        </div>
        </Card>

      {/* Monthly Payment Breakdown */}
      {results.maxHomePrice > 0 && (() => {
        const { data: paymentBreakdownData, total, currentResults } = getPaymentBreakdownData();
        
        return (
          <Card className="mb-6">
            <button
              onClick={() => setPaymentBreakdownExpanded(!paymentBreakdownExpanded)}
              className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-xl font-bold">Monthly Payment Breakdown</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={paymentViewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPaymentViewMode(paymentViewMode === "chart" ? "table" : "chart");
                  }}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title={paymentViewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                >
                  {paymentViewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                </Button>
                {paymentBreakdownExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>
            
            {paymentBreakdownExpanded && (
              <div className="p-6 border-t">
                {paymentViewMode === "table" ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 font-semibold">Payment Component</th>
                          <th className="text-right py-3 px-2 font-semibold">Amount</th>
                          <th className="text-right py-3 px-2 font-semibold">% of Total Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">Principal & Interest (P&I)</td>
                          <td className="text-right py-3 px-2 font-bold">{formatCurrency(currentResults.principalAndInterest)}</td>
                          <td className="text-right py-3 px-2">{paymentBreakdownData.find(d => d.name === "Principal & Interest (P&I)")?.percentage.toFixed(1) || "0.0"}%</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">Property Taxes</td>
                          <td className="text-right py-3 px-2 font-bold">{formatCurrency(currentResults.propertyTaxes)}</td>
                          <td className="text-right py-3 px-2">{paymentBreakdownData.find(d => d.name === "Property Taxes")?.percentage.toFixed(1) || "0.0"}%</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">Homeowner's Insurance</td>
                          <td className="text-right py-3 px-2 font-bold">{formatCurrency(currentResults.insurance)}</td>
                          <td className="text-right py-3 px-2">{paymentBreakdownData.find(d => d.name === "Homeowner's Insurance")?.percentage.toFixed(1) || "0.0"}%</td>
                        </tr>
                        {currentResults.pmi > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="py-3 px-2 font-medium">Mortgage Insurance (PMI)</td>
                            <td className="text-right py-3 px-2 font-bold">{formatCurrency(currentResults.pmi)}</td>
                            <td className="text-right py-3 px-2">{paymentBreakdownData.find(d => d.name === "Mortgage Insurance (PMI)")?.percentage.toFixed(1) || "0.0"}%</td>
                          </tr>
                        )}
                        {currentResults.hoaFees > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="py-3 px-2 font-medium">HOA Dues</td>
                            <td className="text-right py-3 px-2 font-bold">{formatCurrency(currentResults.hoaFees)}</td>
                            <td className="text-right py-3 px-2">{paymentBreakdownData.find(d => d.name === "HOA Dues")?.percentage.toFixed(1) || "0.0"}%</td>
                          </tr>
                        )}
                        <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                          <td className="py-3 px-2">TOTAL MONTHLY PAYMENT</td>
                          <td className="text-right py-3 px-2 text-lg">{formatCurrency(total)}</td>
                          <td className="text-right py-3 px-2">100.0%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-[500px]">
                    <ReactECharts
                      option={getPieChartOption(paymentBreakdownData, "Payment Breakdown")}
                      style={{ height: "100%", width: "100%" }}
                      opts={{ renderer: "canvas" }}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })()}

      {/* DTI Ratios Summary */}
      {results.maxHomePrice > 0 && (
        <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-2">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Front-End DTI</div>
              <div className="text-2xl font-bold text-primary">{results.frontEndDTI.toFixed(1)}%</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Back-End DTI</div>
              <div className="text-2xl font-bold text-primary">{results.dtiRatio.toFixed(1)}%</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HouseAffordabilityCalculator;
