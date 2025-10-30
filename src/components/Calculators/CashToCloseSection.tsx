"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, DollarSign } from "lucide-react";

interface Scenario {
  downPercent: number;
  downAmount: number;
}

interface LandTransferTaxCalculation {
  provincial: number;
  municipal: number;
  rebate: number;
  netPayable: number;
}

interface CashToCloseSectionProps {
  // State values
  downAmount: number;
  landTransferTaxCalculation: LandTransferTaxCalculation;
  location: string;
  pstOnInsurance: number;
  lawyerFees: number;
  titleInsurance: number;
  homeInspection: number;
  appraisalFees: number;
  scenarios: Scenario[];
  selectedScenarioIndex: number;
  
  // State setters
  setPstOnInsurance: (value: number) => void;
  setLawyerFees: (value: number) => void;
  setTitleInsurance: (value: number) => void;
  setHomeInspection: (value: number) => void;
  setAppraisalFees: (value: number) => void;
  setSelectedScenarioIndex: (value: number) => void;
  
  // Calculated values
  totalCashToClose: number;
  
  // Formatters
  formatCurrency: (value: number) => string;
}

const CashToCloseSection = ({
  downAmount,
  landTransferTaxCalculation,
  location,
  pstOnInsurance,
  lawyerFees,
  titleInsurance,
  homeInspection,
  appraisalFees,
  scenarios,
  selectedScenarioIndex,
  setPstOnInsurance,
  setLawyerFees,
  setTitleInsurance,
  setHomeInspection,
  setAppraisalFees,
  setSelectedScenarioIndex,
  totalCashToClose,
  formatCurrency,
}: CashToCloseSectionProps) => {
  const [cashToCloseExpanded, setCashToCloseExpanded] = useState(false);

  return (
    <Card className="mb-6">
      <button
        onClick={() => setCashToCloseExpanded(!cashToCloseExpanded)}
        className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-brand-mist/20 transition-colors"
      >
        <h3 className="text-lg font-bold">Cash needed to close</h3>
        {cashToCloseExpanded ? <ChevronUp /> : <ChevronDown />}
      </button>
      
      {cashToCloseExpanded && (
        <div className="p-4 border-t space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            When you purchase a house, there are a number of costs you will need to pay upfront. Some are required, and others are optional.
          </p>
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* Down payment options - Hidden on mobile */}
            <div className="hidden lg:block w-full lg:w-1/2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Down payment options</h4>
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Select Scenario</Label>
                <Select 
                  value={selectedScenarioIndex.toString()} 
                  onValueChange={(value) => setSelectedScenarioIndex(Number(value))}
                >
                  <SelectTrigger className="bg-white w-full h-10">
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
                  <Label className="text-sm">Down payment</Label>
                  <span className="font-bold text-sm sm:text-base">{formatCurrency(downAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Provincial Land Transfer Tax</Label>
                  <span className="font-bold text-sm sm:text-base">{formatCurrency(landTransferTaxCalculation.provincial)}</span>
                </div>
                
                {location.toLowerCase().includes('toronto') && (
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Municipal Land Transfer Tax (Toronto)</Label>
                    <span className="font-bold text-sm sm:text-base">{formatCurrency(landTransferTaxCalculation.municipal)}</span>
                  </div>
                )}
                
                {landTransferTaxCalculation.rebate > 0 && (
                  <div className="flex justify-between items-center text-accent">
                    <Label className="text-sm">First-Time Buyer Rebate</Label>
                    <span className="font-bold text-sm sm:text-base">-{formatCurrency(landTransferTaxCalculation.rebate)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center border-t pt-2">
                  <Label className="font-bold text-sm sm:text-base">Net Land Transfer Tax</Label>
                  <span className="font-bold text-sm sm:text-base">{formatCurrency(landTransferTaxCalculation.netPayable)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="pstOnInsurance">PST on mortgage insurance</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="pstOnInsurance"
                      type="number"
                      value={pstOnInsurance}
                      onChange={(e) => setPstOnInsurance(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="lawyerFees">Lawyer fees</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="lawyerFees"
                      type="number"
                      value={lawyerFees}
                      onChange={(e) => setLawyerFees(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="titleInsurance">Title insurance</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="titleInsurance"
                      type="number"
                      value={titleInsurance}
                      onChange={(e) => setTitleInsurance(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="homeInspection">Home inspection</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="homeInspection"
                      type="number"
                      value={homeInspection}
                      onChange={(e) => setHomeInspection(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label htmlFor="appraisalFees">Appraisal fees</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-3 w-3" />
                    </span>
                    <Input
                      id="appraisalFees"
                      type="number"
                      value={appraisalFees}
                      onChange={(e) => setAppraisalFees(Number(e.target.value))}
                      className="w-32 text-right bg-white rounded-lg pl-6"
                    />
                  </div>
                </div>
                
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-bold text-lg">Cash needed to close</span>
                  <span className="font-bold text-lg text-accent">{formatCurrency(totalCashToClose)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CashToCloseSection;

