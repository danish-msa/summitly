"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import { Info, DollarSign, Percent, ChevronDown, ChevronUp, TrendingUp, AlertCircle, CheckCircle2, Table2, BarChart3, Download } from "lucide-react";
import * as Tooltip from '@radix-ui/react-tooltip';
import ReactECharts from "echarts-for-react";

import { AffordabilityResults, CalculationParams } from './types';
import { formatCurrency, formatNumber, parseNumberFromString } from './utils';
import { calculateMonthlyPayment, calculateFromIncome, getBudgetStatus, getAmortizationSchedule } from './calculations';
import { getPieChartOption, getAmortizationChartOption, getPrincipalVsInterestChartOption } from './chartOptions';
import { getPaymentBreakdownData } from './dataHelpers';
import { downloadCSV, downloadChartAsPNG, preparePaymentBreakdownTableData, prepareAmortizationTableData, preparePrincipalVsInterestTableData } from './exportUtils';

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
  const [paymentBreakdownExpanded, setPaymentBreakdownExpanded] = useState(true);
  const [paymentViewMode, setPaymentViewMode] = useState<"table" | "chart">("chart");
  const [amortizationExpanded, setAmortizationExpanded] = useState(true);
  const [amortizationViewMode, setAmortizationViewMode] = useState<"table" | "chart">("chart");
  const [principalVsInterestExpanded, setPrincipalVsInterestExpanded] = useState(true);
  const [principalVsInterestViewMode, setPrincipalVsInterestViewMode] = useState<"table" | "chart">("chart");

  // Chart refs for export
  const paymentBreakdownChartRef = useRef<ReactECharts | null>(null);
  const amortizationChartRef = useRef<ReactECharts | null>(null);
  const principalVsInterestChartRef = useRef<ReactECharts | null>(null);

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

  // Calculate affordability
  useEffect(() => {
    const params: CalculationParams = {
      annualIncome,
      monthlyDebts,
      downPaymentPercent,
      downPaymentAmount,
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
    };

    const newResults = calculateFromIncome(params);
    
    // Update the dollar amount to match the calculated percentage
    if (newResults.maxHomePrice > 0) {
      const finalDownPayment = Math.min(newResults.maxHomePrice * (downPaymentPercent / 100), newResults.maxHomePrice * 0.99);
      setDownPaymentAmount(Math.round(finalDownPayment));
      
      // Set slider price to max home price if not already set or if it's the initial calculation
      if (sliderPrice === 0 || sliderPrice > newResults.maxHomePrice) {
        setSliderPrice(newResults.maxHomePrice);
      }
    }
    
    setResults(newResults);
  }, [
    annualIncome, monthlyDebts, downPaymentPercent, downPaymentAmount, interestRate, loanTerm,
    propertyTaxRate, insuranceRate, hoaFees, showAdvanced, annualPropertyTax,
    annualInsurance, pmiRate, dtiBackEnd, dtiFrontEnd
  ]);




  // Use slider price if set, otherwise use max home price
  const currentPrice = sliderPrice > 0 ? sliderPrice : results.maxHomePrice;
  const params: CalculationParams = {
    annualIncome,
    monthlyDebts,
    downPaymentPercent,
    downPaymentAmount,
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
  };
  const budgetStatus = getBudgetStatus(currentPrice, results.maxHomePrice, params, results);
  const StatusIcon = budgetStatus.icon;



  // Get payment breakdown data
  const paymentBreakdownData = getPaymentBreakdownData({
    sliderPrice,
    maxHomePrice: results.maxHomePrice,
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
  });

  // Get amortization schedule data
  const currentPriceForSchedule = sliderPrice > 0 ? sliderPrice : results.maxHomePrice;
  const amortizationSchedule = getAmortizationSchedule(
    currentPriceForSchedule,
    downPaymentPercent,
    interestRate,
    loanTerm
  );

  // Legacy function wrapper for compatibility
  const getAmortizationChartOption = (schedule: typeof amortizationSchedule) => {
    if (schedule.length === 0) {
      return {
        title: { text: "No Data Available", left: "center" },
      };
    }

    // For longer loans, show first 12 months, then yearly, then every 5 years
    let displaySchedule = schedule;
    if (schedule.length > 24) {
      const firstYear = schedule.slice(0, 12);
      const yearlyData: typeof schedule = [];
      for (let i = 11; i < schedule.length; i += 12) {
        if (i < schedule.length) yearlyData.push(schedule[i]);
      }
      displaySchedule = [...firstYear, ...yearlyData.filter((_, idx) => idx > 0)];
    }

    const months = displaySchedule.map(s => s.month);
    const interestData = displaySchedule.map(s => s.interestPaid);
    const principalData = displaySchedule.map(s => s.principalPaid);
    const balanceData = displaySchedule.map(s => s.remainingBalance);

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
        },
        formatter: (params: Array<{ seriesName: string; value: number; axisValue: number }>) => {
          const scheduleItem = displaySchedule.find(s => s.month === params[0].axisValue);
          if (!scheduleItem) return "";
          
          return `
            <strong>Month ${scheduleItem.month}</strong><br/>
            Total Payment: ${formatCurrency(scheduleItem.totalPayment)}<br/>
            Principal: ${formatCurrency(scheduleItem.principalPaid)}<br/>
            Interest: ${formatCurrency(scheduleItem.interestPaid)}<br/>
            Remaining Balance: ${formatCurrency(scheduleItem.remainingBalance)}
          `;
        },
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e5e7eb",
        textStyle: {
          color: "#1f2937",
        },
      },
      legend: {
        data: ["Principal", "Interest", "Remaining Balance"],
        top: 30,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: months,
        name: "Month",
      },
      yAxis: [
        {
          type: "value",
          name: "Amount ($)",
          position: "left",
          axisLabel: {
            formatter: (value: number) => formatCurrency(value),
          },
        },
        {
          type: "value",
          name: "Balance ($)",
          position: "right",
          axisLabel: {
            formatter: (value: number) => formatCurrency(value),
          },
        },
      ],
      series: [
        {
          name: "Principal",
          type: "bar",
          stack: "payment",
          data: principalData,
          itemStyle: {
            color: "#10b981",
          },
        },
        {
          name: "Interest",
          type: "bar",
          stack: "payment",
          data: interestData,
          itemStyle: {
            color: "#ef4444",
          },
        },
        {
          name: "Remaining Balance",
          type: "line",
          yAxisIndex: 1,
          data: balanceData,
          itemStyle: {
            color: "#3b82f6",
          },
          lineStyle: {
            width: 2,
          },
          symbol: "circle",
          symbolSize: 4,
        },
      ],
    };
  };

  // Legacy function wrapper for compatibility
  const getPrincipalVsInterestChartOption = (schedule: typeof amortizationSchedule) => {
    if (schedule.length === 0) {
      return {
        title: { text: "No Data Available", left: "center" },
      };
    }

    // For longer loans, sample data intelligently
    let displaySchedule = schedule;
    if (schedule.length > 360) {
      // For 30-year loans, show first year, then every year
      const firstYear = schedule.slice(0, 12);
      const yearlyData: typeof schedule = [];
      for (let i = 11; i < schedule.length; i += 12) {
        if (i < schedule.length) yearlyData.push(schedule[i]);
      }
      displaySchedule = [...firstYear, ...yearlyData.filter((_, idx) => idx > 0)];
    } else if (schedule.length > 24) {
      // For shorter loans, show first 12 months, then yearly
      const firstYear = schedule.slice(0, 12);
      const yearlyData: typeof schedule = [];
      for (let i = 11; i < schedule.length; i += 12) {
        if (i < schedule.length) yearlyData.push(schedule[i]);
      }
      displaySchedule = [...firstYear, ...yearlyData.filter((_, idx) => idx > 0)];
    }

    const months = displaySchedule.map(s => s.month);
    const cumulativePrincipal = displaySchedule.map(s => s.cumulativePrincipal);
    const cumulativeInterest = displaySchedule.map(s => s.cumulativeInterest);

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
        },
        formatter: (params: Array<{ seriesName: string; value: number; axisValue: number; color: string }>) => {
          const scheduleItem = displaySchedule.find(s => s.month === params[0].axisValue);
          if (!scheduleItem) return "";
          
          const principalPercent = scheduleItem.cumulativePrincipal > 0
            ? ((scheduleItem.cumulativePrincipal / (scheduleItem.cumulativePrincipal + scheduleItem.cumulativeInterest)) * 100).toFixed(1)
            : "0.0";
          const interestPercent = scheduleItem.cumulativeInterest > 0
            ? ((scheduleItem.cumulativeInterest / (scheduleItem.cumulativePrincipal + scheduleItem.cumulativeInterest)) * 100).toFixed(1)
            : "0.0";
          
          return `
            <strong>Month ${scheduleItem.month}</strong><br/>
            Cumulative Principal: ${formatCurrency(scheduleItem.cumulativePrincipal)} (${principalPercent}%)<br/>
            Cumulative Interest: ${formatCurrency(scheduleItem.cumulativeInterest)} (${interestPercent}%)<br/>
            Total Paid: ${formatCurrency(scheduleItem.cumulativePrincipal + scheduleItem.cumulativeInterest)}
          `;
        },
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e5e7eb",
        textStyle: {
          color: "#1f2937",
        },
      },
      legend: {
        data: ["Cumulative Principal", "Cumulative Interest"],
        top: 30,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: months,
        name: "Month",
      },
      yAxis: {
        type: "value",
        name: "Cumulative Amount ($)",
        axisLabel: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
      series: [
        {
          name: "Cumulative Principal",
          type: "line",
          data: cumulativePrincipal,
          itemStyle: {
            color: "#10b981",
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(16, 185, 129, 0.3)" },
                { offset: 1, color: "rgba(16, 185, 129, 0.05)" },
              ],
            },
          },
          lineStyle: {
            width: 3,
          },
          symbol: "circle",
          symbolSize: 4,
          smooth: true,
        },
        {
          name: "Cumulative Interest",
          type: "line",
          data: cumulativeInterest,
          itemStyle: {
            color: "#ef4444",
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(239, 68, 68, 0.3)" },
                { offset: 1, color: "rgba(239, 68, 68, 0.05)" },
              ],
            },
          },
          lineStyle: {
            width: 3,
          },
          symbol: "circle",
          symbolSize: 4,
          smooth: true,
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
              className="rounded-lg"
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
                className="pl-9 rounded-lg"
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
                  className="rounded-lg"
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
                    className="pl-9 rounded-lg"
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
                  className="rounded-lg"
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
                    className="pl-9 rounded-lg"
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
                  className="rounded-lg"
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
                  className="rounded-lg"
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
                  className="rounded-lg"
                  placeholder="43"
                />
              </div>
            </div>
          )}
        </div>
        </Card>

      {/* Monthly Payment Breakdown */}
      {results.maxHomePrice > 0 && (() => {
        const { data: paymentBreakdownDataItems, total, currentResults } = paymentBreakdownData;
        
        return (
          <Card className="mb-6">
            <button
              onClick={() => setPaymentBreakdownExpanded(!paymentBreakdownExpanded)}
              className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-xl font-bold">Monthly Payment Breakdown</h3>
              {paymentBreakdownExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {paymentBreakdownExpanded && (
              <div className="p-6 border-t">
                <div className="flex justify-end gap-2 mb-4">
                  <Button
                    variant={paymentViewMode === "table" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setPaymentViewMode(paymentViewMode === "chart" ? "table" : "chart")}
                    className="h-9 w-9 rounded-lg transition-all duration-300"
                    title={paymentViewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                  >
                    {paymentViewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (paymentViewMode === "table") {
                        const tableData = preparePaymentBreakdownTableData(paymentBreakdownDataItems, currentResults, total);
                        downloadCSV(tableData, "monthly-payment-breakdown");
                      } else {
                        downloadChartAsPNG(paymentBreakdownChartRef, "monthly-payment-breakdown");
                      }
                    }}
                    className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    title="Download data"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
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
                          <td className="text-right py-3 px-2">{paymentBreakdownDataItems.find(d => d.name === "Principal & Interest (P&I)")?.percentage.toFixed(1) || "0.0"}%</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">Property Taxes</td>
                          <td className="text-right py-3 px-2 font-bold">{formatCurrency(currentResults.propertyTaxes)}</td>
                          <td className="text-right py-3 px-2">{paymentBreakdownDataItems.find(d => d.name === "Property Taxes")?.percentage.toFixed(1) || "0.0"}%</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">Homeowner's Insurance</td>
                          <td className="text-right py-3 px-2 font-bold">{formatCurrency(currentResults.insurance)}</td>
                          <td className="text-right py-3 px-2">{paymentBreakdownDataItems.find(d => d.name === "Homeowner's Insurance")?.percentage.toFixed(1) || "0.0"}%</td>
                        </tr>
                        {currentResults.pmi > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="py-3 px-2 font-medium">Mortgage Insurance (PMI)</td>
                            <td className="text-right py-3 px-2 font-bold">{formatCurrency(currentResults.pmi)}</td>
                            <td className="text-right py-3 px-2">{paymentBreakdownDataItems.find(d => d.name === "Mortgage Insurance (PMI)")?.percentage.toFixed(1) || "0.0"}%</td>
                          </tr>
                        )}
                        {currentResults.hoaFees > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="py-3 px-2 font-medium">HOA Dues</td>
                            <td className="text-right py-3 px-2 font-bold">{formatCurrency(currentResults.hoaFees)}</td>
                            <td className="text-right py-3 px-2">{paymentBreakdownDataItems.find(d => d.name === "HOA Dues")?.percentage.toFixed(1) || "0.0"}%</td>
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
                      ref={paymentBreakdownChartRef}
                      option={getPieChartOption(paymentBreakdownDataItems, "Payment Breakdown")}
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

      {/* Amortization Schedule */}
      {results.maxHomePrice > 0 && (() => {
        // Use the amortizationSchedule calculated above
        
        return (
          <Card className="mb-6">
            <button
              onClick={() => setAmortizationExpanded(!amortizationExpanded)}
              className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-xl font-bold">Amortization Schedule</h3>
              {amortizationExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {amortizationExpanded && (
              <div className="p-6 border-t">
                <div className="flex justify-end gap-2 mb-4">
                  <Button
                    variant={amortizationViewMode === "table" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setAmortizationViewMode(amortizationViewMode === "chart" ? "table" : "chart")}
                    className="h-9 w-9 rounded-lg transition-all duration-300"
                    title={amortizationViewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                  >
                    {amortizationViewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (amortizationViewMode === "table") {
                        const tableData = prepareAmortizationTableData(amortizationSchedule);
                        downloadCSV(tableData, "amortization-schedule");
                      } else {
                        downloadChartAsPNG(amortizationChartRef, "amortization-schedule");
                      }
                    }}
                    className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    title="Download data"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                {amortizationViewMode === "table" ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-center py-3 px-2 font-semibold">Month</th>
                          <th className="text-right py-3 px-2 font-semibold">Total Payment (P&I)</th>
                          <th className="text-right py-3 px-2 font-semibold">Interest Paid</th>
                          <th className="text-right py-3 px-2 font-semibold">Principal Paid</th>
                          <th className="text-right py-3 px-2 font-semibold">Cumulative Interest</th>
                          <th className="text-right py-3 px-2 font-semibold">Cumulative Principal</th>
                          <th className="text-right py-3 px-2 font-semibold">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {amortizationSchedule.slice(0, 12).map((row) => (
                          <tr key={row.month} className="hover:bg-gray-50">
                            <td className="text-center py-3 px-2 font-medium">{row.month}</td>
                            <td className="text-right py-3 px-2">{formatCurrency(row.totalPayment)}</td>
                            <td className="text-right py-3 px-2">{formatCurrency(row.interestPaid)}</td>
                            <td className="text-right py-3 px-2 font-bold text-green-600">{formatCurrency(row.principalPaid)}</td>
                            <td className="text-right py-3 px-2 text-red-600">{formatCurrency(row.cumulativeInterest)}</td>
                            <td className="text-right py-3 px-2 text-green-600">{formatCurrency(row.cumulativePrincipal)}</td>
                            <td className="text-right py-3 px-2">{formatCurrency(row.remainingBalance)}</td>
                          </tr>
                        ))}
                        {amortizationSchedule.length > 12 && (
                          <tr className="bg-gray-50 font-medium">
                            <td colSpan={7} className="text-center py-3 px-2 text-muted-foreground">
                              Showing first 12 months of {amortizationSchedule.length} total payments
                            </td>
                          </tr>
                        )}
                        {amortizationSchedule.length > 0 && (
                          <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                            <td className="py-3 px-2">TOTALS</td>
                            <td className="text-right py-3 px-2">{formatCurrency(amortizationSchedule.reduce((sum, r) => sum + r.totalPayment, 0))}</td>
                            <td className="text-right py-3 px-2 text-red-600">{formatCurrency(amortizationSchedule[amortizationSchedule.length - 1]?.cumulativeInterest || 0)}</td>
                            <td className="text-right py-3 px-2 text-green-600">{formatCurrency(amortizationSchedule[amortizationSchedule.length - 1]?.cumulativePrincipal || 0)}</td>
                            <td colSpan={3}></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-[500px]">
                    <ReactECharts
                      ref={amortizationChartRef}
                      option={getAmortizationChartOption(amortizationSchedule)}
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

      {/* Principal vs Interest */}
      {results.maxHomePrice > 0 && (() => {
        // Use the amortizationSchedule calculated above
        
        return (
          <Card className="mb-6">
            <button
              onClick={() => setPrincipalVsInterestExpanded(!principalVsInterestExpanded)}
              className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-xl font-bold">Principal vs. Interest</h3>
              {principalVsInterestExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {principalVsInterestExpanded && (
              <div className="p-6 border-t">
                <div className="flex justify-end gap-2 mb-4">
                  <Button
                    variant={principalVsInterestViewMode === "table" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setPrincipalVsInterestViewMode(principalVsInterestViewMode === "chart" ? "table" : "chart")}
                    className="h-9 w-9 rounded-lg transition-all duration-300"
                    title={principalVsInterestViewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                  >
                    {principalVsInterestViewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (principalVsInterestViewMode === "table") {
                        const tableData = preparePrincipalVsInterestTableData(amortizationSchedule);
                        downloadCSV(tableData, "principal-vs-interest");
                      } else {
                        downloadChartAsPNG(principalVsInterestChartRef, "principal-vs-interest");
                      }
                    }}
                    className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    title="Download data"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                {principalVsInterestViewMode === "table" ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-center py-3 px-2 font-semibold">Month</th>
                          <th className="text-right py-3 px-2 font-semibold">Cumulative Principal</th>
                          <th className="text-right py-3 px-2 font-semibold">Cumulative Interest</th>
                          <th className="text-right py-3 px-2 font-semibold">Total Paid</th>
                          <th className="text-right py-3 px-2 font-semibold">Principal %</th>
                          <th className="text-right py-3 px-2 font-semibold">Interest %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {amortizationSchedule.slice(0, 12).map((row) => {
                          const totalPaid = row.cumulativePrincipal + row.cumulativeInterest;
                          const principalPercent = totalPaid > 0 ? (row.cumulativePrincipal / totalPaid) * 100 : 0;
                          const interestPercent = totalPaid > 0 ? (row.cumulativeInterest / totalPaid) * 100 : 0;
                          
                          return (
                            <tr key={row.month} className="hover:bg-gray-50">
                              <td className="text-center py-3 px-2 font-medium">{row.month}</td>
                              <td className="text-right py-3 px-2 font-bold text-green-600">{formatCurrency(row.cumulativePrincipal)}</td>
                              <td className="text-right py-3 px-2 font-bold text-red-600">{formatCurrency(row.cumulativeInterest)}</td>
                              <td className="text-right py-3 px-2">{formatCurrency(totalPaid)}</td>
                              <td className="text-right py-3 px-2 text-green-600">{principalPercent.toFixed(1)}%</td>
                              <td className="text-right py-3 px-2 text-red-600">{interestPercent.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                        {amortizationSchedule.length > 12 && (
                          <tr className="bg-gray-50 font-medium">
                            <td colSpan={6} className="text-center py-3 px-2 text-muted-foreground">
                              Showing first 12 months of {amortizationSchedule.length} total payments
                            </td>
                          </tr>
                        )}
                        {amortizationSchedule.length > 0 && (() => {
                          const finalRow = amortizationSchedule[amortizationSchedule.length - 1];
                          const totalPaid = finalRow.cumulativePrincipal + finalRow.cumulativeInterest;
                          const principalPercent = totalPaid > 0 ? (finalRow.cumulativePrincipal / totalPaid) * 100 : 0;
                          const interestPercent = totalPaid > 0 ? (finalRow.cumulativeInterest / totalPaid) * 100 : 0;
                          
                          return (
                            <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                              <td className="py-3 px-2">TOTALS</td>
                              <td className="text-right py-3 px-2 text-green-600">{formatCurrency(finalRow.cumulativePrincipal)}</td>
                              <td className="text-right py-3 px-2 text-red-600">{formatCurrency(finalRow.cumulativeInterest)}</td>
                              <td className="text-right py-3 px-2">{formatCurrency(totalPaid)}</td>
                              <td className="text-right py-3 px-2 text-green-600">{principalPercent.toFixed(1)}%</td>
                              <td className="text-right py-3 px-2 text-red-600">{interestPercent.toFixed(1)}%</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-[500px]">
                    <ReactECharts
                      ref={principalVsInterestChartRef}
                      option={getPrincipalVsInterestChartOption(amortizationSchedule)}
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
