"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, DollarSign } from "lucide-react";

interface Scenario {
  downPercent: number;
  downAmount: number;
}

interface MonthlyExpensesSectionProps {
  // State values
  mortgagePayment: number;
  propertyTax: number;
  monthlyDebt: number;
  utilities: number;
  propertyInsurance: number;
  phone: number;
  cable: number;
  internet: number;
  condoFees: number;
  propertyType: "House" | "Condo";
  scenarios: Scenario[];
  selectedScenarioIndex: number;
  
  // State setters
  setPropertyTax: (value: number) => void;
  setMonthlyDebt: (value: number) => void;
  setUtilities: (value: number) => void;
  setPropertyInsurance: (value: number) => void;
  setPhone: (value: number) => void;
  setCable: (value: number) => void;
  setInternet: (value: number) => void;
  setCondoFees: (value: number) => void;
  setPropertyType: (value: "House" | "Condo") => void;
  setSelectedScenarioIndex: (value: number) => void;
  
  // Calculated values
  monthlyExpenses: number;
  
  // Formatters
  formatCurrency: (value: number) => string;
}

const MonthlyExpensesSection = ({
  mortgagePayment,
  propertyTax,
  monthlyDebt,
  utilities,
  propertyInsurance,
  phone,
  cable,
  internet,
  condoFees,
  propertyType,
  scenarios,
  selectedScenarioIndex,
  setPropertyTax,
  setMonthlyDebt,
  setUtilities,
  setPropertyInsurance,
  setPhone,
  setCable,
  setInternet,
  setCondoFees,
  setPropertyType,
  setSelectedScenarioIndex,
  monthlyExpenses,
  formatCurrency,
}: MonthlyExpensesSectionProps) => {
  const [monthlyExpensesExpanded, setMonthlyExpensesExpanded] = useState(false);

  return (
    <Card className="mb-6">
      <button
        onClick={() => setMonthlyExpensesExpanded(!monthlyExpensesExpanded)}
        className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-brand-mist/20 transition-colors"
      >
        <h3 className="text-lg font-bold">Monthly expenses</h3>
        {monthlyExpensesExpanded ? <ChevronUp /> : <ChevronDown />}
      </button>
      
      {monthlyExpensesExpanded && (
        <div className="p-4 border-t space-y-4">
          {/* Type of house - Mobile only */}
          <div className="lg:hidden mb-4">
            <h4 className="font-semibold mb-3 text-sm">Type of house</h4>
            <div className="flex gap-4">
              <Button
                variant={propertyType === "House" ? "default" : "outline"}
                onClick={() => setPropertyType("House")}
                className="min-w-[100px] rounded-lg"
              >
                House
              </Button>
              <Button
                variant={propertyType === "Condo" ? "default" : "outline"}
                onClick={() => setPropertyType("Condo")}
                className="min-w-[100px] rounded-lg"
              >
                Condo
              </Button>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* Down payment options - Hidden on mobile */}
            <div className="hidden lg:block w-full lg:w-1/2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
              <div className="mb-4">
                <h4 className="font-semibold mb-3">Type of house</h4>
                <div className="flex gap-4">
                  <Button
                    variant={propertyType === "House" ? "default" : "outline"}
                    onClick={() => setPropertyType("House")}
                    className="min-w-[100px] rounded-lg"
                  >
                    House
                  </Button>
                  <Button
                    variant={propertyType === "Condo" ? "default" : "outline"}
                    onClick={() => setPropertyType("Condo")}
                    className="min-w-[100px] rounded-lg"
                  >
                    Condo
                  </Button>
                </div>
              </div>
              <h4 className="font-semibold mb-3">Down payment options</h4>
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Select Scenario</Label>
                <Select 
                  value={selectedScenarioIndex.toString()} 
                  onValueChange={(value) => setSelectedScenarioIndex(Number(value))}
                >
                  <SelectTrigger className="bg-white w-full">
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
            </div>
            <div className="w-full lg:w-1/2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Mortgage payment</Label>
                  <span className="font-bold">{formatCurrency(mortgagePayment)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="propertyTax">Property tax</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="propertyTax"
                      type="number"
                      value={propertyTax}
                      onChange={(e) => setPropertyTax(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="monthlyDebt">Monthly debt payments</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="monthlyDebt"
                      type="number"
                      value={monthlyDebt}
                      onChange={(e) => setMonthlyDebt(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="utilities">Utilities</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="utilities"
                      type="number"
                      value={utilities}
                      onChange={(e) => setUtilities(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="propertyInsurance">Property insurance</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="propertyInsurance"
                      type="number"
                      value={propertyInsurance}
                      onChange={(e) => setPropertyInsurance(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="phone"
                      type="number"
                      value={phone}
                      onChange={(e) => setPhone(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="cable">Cable</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="cable"
                      type="number"
                      value={cable}
                      onChange={(e) => setCable(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="internet">Internet</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="internet"
                      type="number"
                      value={internet}
                      onChange={(e) => setInternet(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>

                {propertyType === "Condo" && (
                  <div className="flex justify-between items-center">
                    <Label htmlFor="condoFees">Condo fees</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                        <DollarSign className="h-3 w-3" />
                      </span>
                      <Input
                        id="condoFees"
                        type="number"
                        value={condoFees}
                        onChange={(e) => setCondoFees(Number(e.target.value))}
                        className="w-32 text-right bg-white rounded-lg pl-6"
                      />
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-bold text-lg">Monthly expenses</span>
                  <span className="font-bold text-lg text-accent">{formatCurrency(monthlyExpenses)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MonthlyExpensesSection;

