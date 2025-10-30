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
  },
  {
    id: 'property-tax',
    title: 'Property Tax Calculator',
    description: 'Calculate your annual property taxes using official 2025 rates for Toronto and major Ontario municipalities.',
    icon: Building,
    href: '/calculators/property-tax',
    category: 'Real Estate',
    status: 'available',
    features: ['2025 official rates', 'Multiple property types', 'First-time buyer rebates', 'Payment schedules'],
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
  }
];

const categories = ['All', 'Real Estate', 'Planning', 'Loans'];

const CalculatorsPage = () => {
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredCalculators = selectedCategory === 'All' 
    ? calculators 
    : calculators.filter(calc => calc.category === selectedCategory);

  return (
    <div className="bg-white">
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
      <div className="container-1300 mx-auto mt-8">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-base font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-brand-celestial rounded-lg text-white shadow-md'
                  : 'bg-white rounded-lg text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Calculators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredCalculators.map((calculator, index) => {
            const IconComponent = calculator.icon;
            
            // Different light background colors for each card
            const cardStyles = [
              { bg: 'bg-purple-50', title: 'text-purple-700', button: 'bg-purple-600 hover:bg-purple-700', icon: 'bg-purple-100 text-purple-600' },      // Mortgage Calculator
              { bg: 'bg-green-50', title: 'text-green-700', button: 'bg-green-600 hover:bg-green-700', icon: 'bg-green-100 text-green-600' },    // Down Payment Calculator
              { bg: 'bg-blue-50', title: 'text-blue-700', button: 'bg-blue-600 hover:bg-blue-700', icon: 'bg-blue-100 text-blue-600' },    // Rent vs Buy Calculator
              { bg: 'bg-orange-50', title: 'text-orange-700', button: 'bg-orange-600 hover:bg-orange-700', icon: 'bg-orange-100 text-orange-600' },     // Property Tax Calculator
              { bg: 'bg-pink-50', title: 'text-pink-700', button: 'bg-pink-600 hover:bg-pink-700', icon: 'bg-pink-100 text-pink-600' },        // Home Buying Budget
            ];
            
            const cardStyle = cardStyles[index % cardStyles.length];
            
            return (
              <Card 
                key={calculator.id} 
                className={`group hover:shadow-xl rounded-3xl border-none transition-all duration-300 ${cardStyle.bg} ${
                  calculator.status === 'coming-soon' ? 'opacity-75' : 'hover:scale-101'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${
                        calculator.status === 'available' 
                          ? cardStyle.icon
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className={`text-lg ${cardStyle.title}`}>{calculator.title}</CardTitle>
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

                    {/* Action Button */}
                    <div className="pt-2">
                      {calculator.status === 'available' ? (
                        <Link href={calculator.href}>
                          <button className={`w-full text-white py-2 px-4 rounded-lg transition-colors font-medium ${cardStyle.button}`}>
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

export default CalculatorsPage;
