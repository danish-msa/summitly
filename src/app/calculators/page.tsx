"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, TrendingUp, DollarSign, PieChart, Building } from "lucide-react";

interface CalculatorCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  category: string;
  status: 'available' | 'coming-soon';
  features: string[];
  estimatedTime: string;
}

const calculators: CalculatorCard[] = [
  {
    id: 'mortgage',
    title: 'Mortgage Calculator',
    description: 'Calculate your mortgage payments, cash needed to close, and monthly expenses with our comprehensive mortgage calculator.',
    icon: Home,
    href: '/calculators/mortgage',
    category: 'Real Estate',
    status: 'available',
    features: ['Payment calculations', 'Land transfer tax', 'CMHC insurance', 'Amortization schedule', 'Interest rate risk analysis'],
    estimatedTime: '2-3 minutes'
  },
  {
    id: 'down-payment',
    title: 'Down Payment Calculator',
    description: 'Determine how much you need to save for your down payment and explore different scenarios.',
    icon: DollarSign,
    href: '/calculators/down-payment',
    category: 'Real Estate',
    status: 'available',
    features: ['Savings timeline', 'Investment scenarios', 'Government programs', 'First-time buyer benefits'],
    estimatedTime: '1-2 minutes'
  },
  {
    id: 'rent-vs-buy',
    title: 'Rent vs Buy Calculator',
    description: 'Compare the financial implications of renting versus buying a home in your area.',
    icon: TrendingUp,
    href: '/calculators/rent-vs-buy',
    category: 'Real Estate',
    status: 'available',
    features: ['Cost comparison', 'Market analysis', 'ROI calculations', 'Break-even analysis'],
    estimatedTime: '3-4 minutes'
  },
  {
    id: 'property-tax',
    title: 'Property Tax Calculator',
    description: 'Estimate your annual property tax based on location and property value.',
    icon: Building,
    href: '/calculators/property-tax',
    category: 'Real Estate',
    status: 'coming-soon',
    features: ['Municipal rates', 'Assessment values', 'Tax exemptions', 'Payment schedules'],
    estimatedTime: '1 minute'
  },
  {
    id: 'budget',
    title: 'Home Buying Budget',
    description: 'Create a comprehensive budget for your home purchase including all associated costs.',
    icon: PieChart,
    href: '/calculators/budget',
    category: 'Planning',
    status: 'coming-soon',
    features: ['Total cost breakdown', 'Monthly affordability', 'Emergency fund planning', 'Moving costs'],
    estimatedTime: '2-3 minutes'
  }
];

const categories = ['All', 'Real Estate', 'Planning', 'Loans'];

const CalculatorsPage = () => {
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredCalculators = selectedCategory === 'All' 
    ? calculators 
    : calculators.filter(calc => calc.category === selectedCategory);

  return (
    <div>
      {/* Header */}
      <header className="border-b bg-gradient-to-b from-brand-icy-blue to-brand-glacier mt-20 pt-16 pb-8">
        <div className="max-w-[1300px] mx-auto px-4 text-center md:px-8">
          <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">
            Financial Calculators
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Make informed financial decisions with our comprehensive suite of calculators.<br /> 
            From mortgage planning to investment analysis, we've got you covered.
          </p>
        </div>
      </header>
      <div className="container-1400 mx-auto mt-8">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Calculators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredCalculators.map((calculator) => {
            const IconComponent = calculator.icon;
            return (
              <Card 
                key={calculator.id} 
                className={`group hover:shadow-xl transition-all duration-300 ${
                  calculator.status === 'coming-soon' ? 'opacity-75' : 'hover:scale-105'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${
                        calculator.status === 'available' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{calculator.title}</CardTitle>
                        <Badge 
                          variant={calculator.status === 'available' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {calculator.status === 'available' ? 'Available' : 'Coming Soon'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-sm text-gray-600 mt-2">
                    {calculator.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Features */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Key Features:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {calculator.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                        {calculator.features.length > 3 && (
                          <li className="text-gray-400">
                            +{calculator.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Time Estimate */}
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Estimated time: {calculator.estimatedTime}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {calculator.status === 'available' ? (
                        <Link href={calculator.href}>
                          <button className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium">
                            Use Calculator
                          </button>
                        </Link>
                      ) : (
                        <button 
                          disabled 
                          className="w-full bg-gray-200 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed font-medium"
                        >
                          Coming Soon
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-b from-brand-celestial to-brand-cb-blue rounded-2xl p-12 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4">
            Need Help Choosing the Right Calculator?
          </h2>
          <p className="text-white mb-6 max-w-2xl mx-auto">
            Our calculators are designed to help you make informed financial decisions. 
            Each tool provides detailed calculations and insights tailored to your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <button className="bg-white text-brand-cb-blue px-6 py-3 rounded-lg hover:bg-primary/90 hover:text-white transition-colors font-medium">
                Get Expert Advice
              </button>
            </Link>
            <Link href="/about">
              <button className="border border-white text-white px-6 py-3 rounded-lg hover:text-brand-cb-blue hover:bg-white transition-colors font-medium">
                Learn More About Us
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clock icon component
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default CalculatorsPage;
