"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DownPaymentCalculator from '@/components/Calculators/DownPaymentCalculator/DownPaymentCalculator';
import CalculatorSidebar from '@/components/Calculators/CalculatorSidebar';
import CalculatorHeader from '@/components/Calculators/CalculatorHeader';
import { calculatorConfigs } from '@/components/Calculators/calculatorConfigs';

const DownPaymentCalculatorPage = () => {
  const config = calculatorConfigs["down-payment"];

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
              <CardHeader className="border-b border-gray-100 bg-brand-icy-blue rounded-t-xl">
                <CardTitle className="text-2xl">{config.title}</CardTitle>
                <CardDescription>
                  {config.about.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 shadow-sm border border-gray-100">
                <DownPaymentCalculator />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownPaymentCalculatorPage;
