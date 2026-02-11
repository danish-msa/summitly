"use client";
import React, { useState, useEffect, useCallback } from 'react';
import SectionHeading from '@/components/Helper/SectionHeading';

interface CalculatorResults {
  minimumDownPayment: number;
  yourContributionAfterBoost: number;
  summitlyDownPaymentBoost: number;
  mortgageInterestSavings: number;
  totalSavingsWithSummitly: number;
}

const BuyingPowerCalculator = () => {
  const [homePrice, setHomePrice] = useState(8640337); // Default value from example

  const [results, setResults] = useState<CalculatorResults | null>(null);

  const calculateSavings = useCallback(() => {
    // Constants based on the buy.ca example
    const downPaymentPercent = 20; // 20% down payment
    const summitlyBoost = 50000; // Fixed $50,000 boost
    const otherLenderRate = 3.89; // Other lenders rate
    const summitlyRate = 3.64; // Summitly rate
    const loanTermYears = 30;

    // Calculate minimum down payment (20% of home price)
    const minimumDownPayment = homePrice * (downPaymentPercent / 100);
    
    // Your contribution after the boost
    const yourContributionAfterBoost = minimumDownPayment - summitlyBoost;
    
    // Calculate mortgage interest savings
    const loanAmount = homePrice - minimumDownPayment;
    const monthlyRateOther = otherLenderRate / 100 / 12;
    const monthlyRateSummitly = summitlyRate / 100 / 12;
    const numPayments = loanTermYears * 12;
    
    // Calculate monthly payments
    const monthlyPaymentOther = loanAmount * (monthlyRateOther * Math.pow(1 + monthlyRateOther, numPayments)) / (Math.pow(1 + monthlyRateOther, numPayments) - 1);
    const monthlyPaymentSummitly = loanAmount * (monthlyRateSummitly * Math.pow(1 + monthlyRateSummitly, numPayments)) / (Math.pow(1 + monthlyRateSummitly, numPayments) - 1);
    
    // Calculate total interest paid over 30 years
    const totalInterestOther = (monthlyPaymentOther * numPayments) - loanAmount;
    const totalInterestSummitly = (monthlyPaymentSummitly * numPayments) - loanAmount;
    
    // Mortgage interest savings
    const mortgageInterestSavings = totalInterestOther - totalInterestSummitly;
    
    // Total savings
    const totalSavingsWithSummitly = summitlyBoost + mortgageInterestSavings;

    setResults({
      minimumDownPayment,
      yourContributionAfterBoost,
      summitlyDownPaymentBoost: summitlyBoost,
      mortgageInterestSavings,
      totalSavingsWithSummitly,
    });
  }, [homePrice]);

  useEffect(() => {
    calculateSavings();
  }, [calculateSavings]);

  const handleSliderChange = (value: number) => {
    setHomePrice(value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className='pt-16 pb-16 bg-background'>
      <div className='max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8'>
        <SectionHeading 
          heading='Down Payment Calculator' 
          subheading='Calculate Your Savings' 
          description='Discover how much you can save with Summitly down payment boost and lower mortgage rates.' 
        />
        
        <div className='mt-10 backdrop-blur-md bg-white/50 p-8 rounded-2xl shadow-lg'>
          <div className='grid lg:grid-cols-2 gap-8'>
            {/* Left Column - Main Calculator */}
            <div className='space-y-6'>
              {results && (
                <>
                  {/* Minimum Down Payment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Minimum Down Payment</label>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(results.minimumDownPayment)}
                    </div>
                  </div>

                  {/* Your Contribution After The Boost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Your Contribution After The Boost</label>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(results.yourContributionAfterBoost)}
                    </div>
                  </div>

                  {/* Home Price Input */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 text-center mb-2">Home Price</label>
                    <div className="flex items-center border hover:border-secondary border-gray-300 rounded-lg p-3 bg-white transition-all delay-75">
                      <span className="text-gray-500 text-lg">$</span>
                      <input
                        type="number"
                        min={100000}
                        max={20000000}
                        step={1000}
                        value={homePrice}
                        onChange={(e) => handleSliderChange(Number(e.target.value))}
                        className="w-full text-gray-800 text-2xl bg-white text-center border-0 font-semibold outline-none px-2"
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-black font-light text-lg">$100K</span>
                      <input 
                        type="range" 
                        min={100000} 
                        max={20000000} 
                        step={1000} 
                        value={homePrice} 
                        onChange={(e) => handleSliderChange(Number(e.target.value))} 
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider-thumb"
                      />
                      <span className="text-black font-light text-lg">$20M</span>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="text-sm text-gray-500 mt-6">
                    <p>
                      This calculation assumes a 2.5% commission through which savings are passed on to you! 
                      We also assume a 3.89% interest rate from other lenders, in contrast to 3.64% from Summitly Mortgages. 
                      This tool is for demonstrative purposes only, and your down payment savings will vary based upon your unique circumstances.
                    </p>
                  </div>

                  {/* Links */}
                  <div className="flex gap-4 mt-4">
                    <button className="text-secondary hover:text-secondary/80 font-medium flex items-center gap-2">
                      <span>View Full Calculator</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="text-secondary hover:text-secondary/80 font-medium">
                      See how it works
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Savings Details */}
            <div className='space-y-6'>
              {results && (
                <>
                  {/* Summitly Down Payment Boost */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-l-4 border-green-500">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Summitly Down Payment Boost®</label>
                    <div className="text-3xl font-bold text-green-700">
                      {formatCurrency(results.summitlyDownPaymentBoost)}
                    </div>
                  </div>

                  {/* Mortgage Interest Savings */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-l-4 border-green-500">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Mortgage Interest Savings</label>
                    <div className="text-3xl font-bold text-green-700">
                      {formatCurrency(results.mortgageInterestSavings)}
                    </div>
                  </div>

                  {/* Total Savings */}
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Total Savings With Summitly</label>
                    <div className="text-4xl font-bold text-blue-600 mb-4">
                      {formatCurrency(results.totalSavingsWithSummitly)}
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Get Your Down Payment Boost®</h3>
                      <p className="text-gray-600 mb-4">Apply today to get qualified and increase your buying power!</p>
                      <button className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors">
                        Check If I Qualify
                      </button>
                      <p className="text-sm text-gray-500 mt-2">(In just 60 seconds)</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Description */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-center">
            Whether you're an investor, a renter, a first-time buyer, or getting back into the market, 
            we increase your buying power through debt-free down payment boost®. Plus you'll get the lowest 
            guaranteed mortgage rates from our partner, Summitly Mortgages.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyingPowerCalculator;
