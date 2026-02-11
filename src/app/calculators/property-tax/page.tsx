"use client";

import { CalculatorHeader, CalculatorSidebar } from "@/components/Calculators";
import { calculatorConfigs } from "@/components/Calculators/calculatorConfigs";
import PropertyTaxCalculator from "@/components/Calculators/PropertyTaxCalculator/PropertyTaxCalculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const config = calculatorConfigs["property-tax"];

export default function PropertyTaxPage() {
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
                <CardTitle className="text-2xl">{config.title}</CardTitle>
                <CardDescription>
                  {config.about.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PropertyTaxCalculator />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>




      
      <div className="container-1300 mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Calculator */}
          <div className="lg:col-span-3">
            
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            
          </div>
        </div>
      </div>
    </div>
  );
}
