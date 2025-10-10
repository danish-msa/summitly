"use client";

import React, { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as Tooltip from '@radix-ui/react-tooltip';
import { FiInfo, FiDollarSign, FiPercent, FiChevronDown } from 'react-icons/fi';

// Add interfaces for your state
interface FormData {
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  amortizationPeriod: number;
  paymentFrequency: string;
  cmhcInsuranceRate: number;
  comparisonRate: number;
}

interface Calculations {
  downPaymentPercent: number;
  cmhcInsurance: number;
  mortgagedAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  buyContribution: number;
  yourContribution: number;
  comparisonMonthlyPayment: number;
  comparisonTotalPayment: number;
  savings: number;
}

const DownPaymentCalculator = () => {
  // Update initial state values
  const [formData, setFormData] = useState<FormData>({
    purchasePrice: 600000,
    downPayment: 35000,
    interestRate: 3.89,
    amortizationPeriod: 25,
    paymentFrequency: 'Monthly',
    cmhcInsuranceRate: 4.0,
    comparisonRate: 4.49
  });

  // Update initial calculations
  const [calculations, setCalculations] = useState<Calculations>({
    downPaymentPercent: 5.83,
    cmhcInsurance: 0,
    mortgagedAmount: 0,
    monthlyPayment: 0,
    totalInterest: 0,
    totalPayment: 0,
    buyContribution: 12000,
    yourContribution: 0,
    comparisonMonthlyPayment: 0,
    comparisonTotalPayment: 0,
    savings: 0
  });

  // Options
  const amortizationOptions = [
    { value: 5, label: '5 Years' },
    { value: 10, label: '10 Years' },
    { value: 15, label: '15 Years' },
    { value: 20, label: '20 Years' },
    { value: 25, label: '25 Years' },
    { value: 30, label: '30 Years' }
  ];

  const frequencyOptions = [
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Bi-Weekly', label: 'Bi-Weekly' },
    { value: 'Semi-Monthly', label: 'Semi-Monthly' },
    { value: 'Monthly', label: 'Monthly' }
  ];

  // Calculate CMHC insurance rate based on down payment percentage
  const getCmhcRate = (percent: number): number => {
    if (percent >= 20) return 0;
    if (percent >= 15) return 2.8;
    if (percent >= 10) return 3.1;
    if (percent >= 5) return 4.0;
    return 0;
  };

  // Calculate mortgage payment with proper types
  const calculatePayment = (principal: number, annualRate: number, years: number, paymentsPerYear: number): number => {
    const rate = annualRate / 100 / paymentsPerYear;
    const periods = years * paymentsPerYear;
    
    if (rate === 0) {
      return principal / periods;
    }
    
    return principal * rate * Math.pow(1 + rate, periods) / 
           (Math.pow(1 + rate, periods) - 1);
  };

  // Update all calculations when form changes
  useEffect(() => {
    const downPaymentPercent = (formData.downPayment / formData.purchasePrice) * 100;
    const cmhcRate = getCmhcRate(downPaymentPercent);
    const loanAmount = formData.purchasePrice - formData.downPayment;
    const cmhcInsurance = downPaymentPercent < 20 ? 
      (loanAmount * cmhcRate / 100) : 0;
    const mortgagedAmount = loanAmount + cmhcInsurance;
    
    const paymentsPerYear = 
      formData.paymentFrequency === 'Weekly' ? 52 :
      formData.paymentFrequency === 'Bi-Weekly' ? 26 :
      formData.paymentFrequency === 'Semi-Monthly' ? 24 : 12;
    
    const payment = calculatePayment(
      mortgagedAmount,
      formData.interestRate,
      formData.amortizationPeriod,
      paymentsPerYear
    );
    
    // Calculate comparison payment (other lenders)
    const comparisonPayment = calculatePayment(
      mortgagedAmount,
      formData.comparisonRate,
      formData.amortizationPeriod,
      paymentsPerYear
    );
    
    const totalPayments = payment * paymentsPerYear * formData.amortizationPeriod;
    const comparisonTotalPayments = comparisonPayment * paymentsPerYear * formData.amortizationPeriod;
    const totalInterest = totalPayments - mortgagedAmount;
    const yourContribution = formData.downPayment - calculations.buyContribution;
    const savings = comparisonTotalPayments - totalPayments;

    setCalculations({
      downPaymentPercent,
      cmhcInsurance,
      mortgagedAmount,
      monthlyPayment: payment,
      totalInterest,
      totalPayment: totalPayments,
      yourContribution: yourContribution > 0 ? yourContribution : 0,
      buyContribution: calculations.buyContribution,
      comparisonMonthlyPayment: comparisonPayment,
      comparisonTotalPayment: comparisonTotalPayments,
      savings
    });
  }, [formData, calculations.buyContribution]);

  // Format currency with proper type
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage with proper type
  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mt-20 bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Down Payment Calculator
        </h1>
        
        {/* Calculator Form - Compact Design */}
        <div className="mb-8">
          {/* Purchase Price and Down Payment in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Purchase Price Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-lg font-medium text-gray-700 flex items-center">
                  Purchase Price
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button className="ml-2 text-gray-400">
                          <FiInfo size={16} />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content 
                          className="bg-gray-800 text-white p-2 rounded text-sm max-w-xs"
                          sideOffset={5}
                        >
                          The total price of the property you're purchasing
                          <Tooltip.Arrow className="fill-gray-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <FiDollarSign />
                  </span>
                  <input
                    type="text"
                    className="w-32 p-2 pl-8 border border-gray-300 rounded-md text-right"
                    value={formatCurrency(formData.purchasePrice).replace('$', '')}
                    onChange={(e) => {
                      const value = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                      if (!isNaN(value)) {
                        setFormData({...formData, purchasePrice: value});
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-6"
                  value={[formData.purchasePrice]}
                  min={100000}
                  max={10000000}
                  step={10000}
                  onValueChange={([value]) => setFormData({...formData, purchasePrice: value})}
                >
                  <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb 
                    className="block w-6 h-6 bg-white border-2 border-blue-500 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md"
                    aria-label="Purchase price"
                  />
                </Slider.Root>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>$100k</span>
                <span>$10M</span>
              </div>
            </div>

            {/* Down Payment Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-lg font-medium text-gray-700 flex items-center">
                  Down Payment
                  <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Min: {formatPercent(5.83)}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <FiDollarSign />
                    </span>
                    <input
                      type="text"
                      className="w-32 p-2 pl-8 border border-gray-300 rounded-md text-right"
                      value={formatCurrency(formData.downPayment).replace('$', '')}
                      onChange={(e) => {
                        const value = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                        if (!isNaN(value)) {
                          setFormData({...formData, downPayment: value});
                        }
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 bg-blue-50 px-2 py-1 rounded-md">
                    {formatPercent(calculations.downPaymentPercent)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-6"
                  value={[formData.downPayment]}
                  min={formData.purchasePrice * 0.0583}
                  max={formData.purchasePrice * 0.95}
                  step={5000}
                  onValueChange={([value]) => setFormData({...formData, downPayment: value})}
                >
                  <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb 
                    className="block w-6 h-6 bg-white border-2 border-blue-500 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md"
                    aria-label="Down payment"
                  />
                </Slider.Root>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatPercent(5.83)}</span>
                <span>{formatPercent(95)}</span>
              </div>
            </div>
          </div>

          {/* Interest Rate, Amortization Period and Payment Frequency in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Interest Rate Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-lg font-medium text-gray-700 flex items-center">
                  Interest Rate
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-24 p-2 border border-gray-300 rounded-md text-right"
                    value={formData.interestRate.toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                      if (!isNaN(value)) {
                        setFormData({...formData, interestRate: value});
                      }
                    }}
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <FiPercent />
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-6"
                  value={[formData.interestRate]}
                  min={0.1}
                  max={10}
                  step={0.01}
                  onValueChange={([value]) => setFormData({...formData, interestRate: value})}
                >
                  <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb 
                    className="block w-6 h-6 bg-white border-2 border-blue-500 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md"
                    aria-label="Interest rate"
                  />
                </Slider.Root>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.1%</span>
                <span>10%</span>
              </div>
            </div>
            
            {/* Amortization Period */}
            <div className="space-y-2">
              <label className="text-lg font-medium text-gray-700">
                Amortization Period
              </label>
              <div className="relative">
                <select
                  className="w-full p-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.amortizationPeriod}
                  onChange={(e) => setFormData({...formData, amortizationPeriod: parseInt(e.target.value)})}
                >
                  {amortizationOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            
            {/* Payment Frequency */}
            <div className="space-y-2">
              <label className="text-lg font-medium text-gray-700">
                Payment Frequency
              </label>
              <div className="relative">
                <select
                  className="w-full p-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.paymentFrequency}
                  onChange={(e) => setFormData({...formData, paymentFrequency: e.target.value})}
                >
                  {frequencyOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Section - More compact layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Down Payment Details */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mr-2 text-xs">1</span>
              Down Payment Details
            </h3>
            
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                <p className="text-xs text-gray-500">Property Price</p>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(formData.purchasePrice)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                <p className="text-xs text-gray-500">Down Payment Required</p>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(formData.downPayment)}
                  <span className="text-xs text-blue-600 ml-1">
                    ({formatPercent(calculations.downPaymentPercent)})
                  </span>
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 shadow-sm border border-green-200 relative">
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full shadow-sm">
                  Bonus
                </div>
                <p className="text-xs text-gray-500">Our Contribution</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(calculations.buyContribution)}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                <p className="text-xs text-gray-500">Your Contribution</p>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(calculations.yourContribution)}
                </p>
              </div>
            </div>
          </div>

          {/* Mortgage Details */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mr-2 text-xs">2</span>
              Mortgage Details
            </h3>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center mr-2 text-gray-500 text-xs">+</span>
                    <span className="text-sm text-gray-700">Property Price</span>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(formData.purchasePrice)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center mr-2 text-gray-500 text-xs">-</span>
                    <span className="text-sm text-gray-700">Down Payment</span>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(formData.downPayment)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center mr-2 text-gray-500 text-xs">+</span>
                    <span className="text-sm text-gray-700">CMHC Insurance</span>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(calculations.cmhcInsurance)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center">
                    <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-2 text-purple-500 text-xs">=</span>
                    <span className="text-sm text-gray-700 font-medium">Mortgaged Amount</span>
                  </div>
                  <span className="font-bold text-purple-700">{formatCurrency(calculations.mortgagedAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-2 text-xs">3</span>
              Payment Comparison
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <h4 className="text-center text-sm font-medium text-gray-700 mb-2 pb-1 border-b border-gray-100">Other lenders</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Payment</span>
                    <span className="font-semibold">{formatCurrency(calculations.comparisonMonthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest Rate</span>
                    <span className="font-semibold">{formData.comparisonRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-100">
                    <span className="text-gray-600 font-medium">Total</span>
                    <span className="font-bold">{formatCurrency(calculations.comparisonTotalPayment)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 shadow-sm border-2 border-green-500 relative">
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full shadow-sm">
                  Best
                </div>
                <h4 className="text-center text-sm font-medium text-green-700 mb-2 pb-1 border-b border-green-100">Us</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Payment</span>
                    <span className="font-semibold">{formatCurrency(calculations.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest Rate</span>
                    <span className="font-semibold">{formData.interestRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-green-100">
                    <span className="text-gray-600 font-medium">Total</span>
                    <span className="font-bold">{formatCurrency(calculations.totalPayment)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Savings Highlight */}
            <div className="mt-3 bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-lg text-center shadow-sm">
              <p className="text-sm text-gray-700">You Saved</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(calculations.savings)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
};

export default DownPaymentCalculator;