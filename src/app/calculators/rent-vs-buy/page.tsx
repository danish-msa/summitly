"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RentVsBuyCalculator from '@/components/Calculators/RentVsBuyCalculator/RentVsBuyCalculator';
import CalculatorSidebar from '@/components/Calculators/CalculatorSidebar';
import CalculatorHeader from '@/components/Calculators/CalculatorHeader';
import { calculatorConfigs } from '@/components/Calculators/calculatorConfigs';

const RentVsBuyCalculatorPage = () => {
  const config = calculatorConfigs['rent-vs-buy'];

  return (
    <div className="min-h-screen bg-gray-50 mt-20">
      {/* Header */}
      <CalculatorHeader 
        icon={config.icon}
        title={config.title}
        subtitle={config.subtitle}
      />

      <div className="container-1400 mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CalculatorSidebar
              aboutConfig={config.about}
              tips={config.tips}
              relatedCalculators={config.related}
            />
          </div>

          {/* Main Calculator */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Rent vs Buy Calculator Canada</CardTitle>
                <CardDescription>
                  Determine if renting or buying is the better financial decision for your situation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RentVsBuyCalculator />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentVsBuyCalculatorPage;

