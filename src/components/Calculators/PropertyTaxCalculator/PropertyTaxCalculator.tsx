"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Info, DollarSign, MapPin, Table2, BarChart3, Download, ChevronDown, ChevronUp } from "lucide-react";
import * as Tooltip from '@radix-ui/react-tooltip';
import ReactECharts from "echarts-for-react";
import { toast } from "sonner";
import { PropertyTaxCalculatorProps } from "./types";
import { MUNICIPALITIES, PROPERTY_TYPES, PAYMENT_SCHEDULES } from "./constants";
import { formatNumberWithCommas, parseNumberFromString, formatCurrency } from "./utils";
import { calculatePropertyTaxes } from "./calculations";
import { getPieChartOption, getHorizontalBarChartOption } from "./chartOptions";
import { 
  downloadCSV, 
  downloadChartAsPNG, 
  prepareOverallTaxTableData, 
  prepareCityBreakdownTableData 
} from "./exportUtils";

const PropertyTaxCalculator = ({ 
  property,
  initialAssessmentValue = 600000, 
  initialLocation = "Toronto, ON",
  className = ""
}: PropertyTaxCalculatorProps) => {
  // Use property data if available, otherwise fall back to defaults
  const defaultAssessment = property?.listPrice ? property.listPrice * 0.85 : initialAssessmentValue; // Rough estimate: assessment is typically 85% of market value
  const defaultLocation = property?.address?.location || 
    (property?.address ? 
      `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim() : 
      initialLocation
    );

  const [assessmentValue, setAssessmentValue] = useState(defaultAssessment);
  const [marketValue, setMarketValue] = useState(defaultAssessment / 0.85); // Reverse calculation
  const [location, setLocation] = useState(defaultLocation);
  const [propertyType, setPropertyType] = useState("residential");
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState("monthly");
  const [hasSpecialCharges, setHasSpecialCharges] = useState(false);
  const [specialCharges, setSpecialCharges] = useState(0);
  const [useMarketValueEstimate, setUseMarketValueEstimate] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "chart">("chart");
  const [cityBreakdownViewMode, setCityBreakdownViewMode] = useState<"table" | "chart">("chart");
  const [isOverallTaxExpanded, setIsOverallTaxExpanded] = useState(true);
  const [isCityBreakdownExpanded, setIsCityBreakdownExpanded] = useState(true);
  
  // Refs for chart instances
  const overallTaxChartRef = useRef<ReactECharts | null>(null);
  const cityBreakdownChartRef = useRef<ReactECharts | null>(null);

  // Update assessment and market value when property changes
  useEffect(() => {
    if (property) {
      const newMarketValue = property.listPrice || initialAssessmentValue;
      const newAssessment = newMarketValue * 0.85; // Rough estimate
      const newLocation = property.address?.location || 
        (property.address ? 
          `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim() : 
          initialLocation
        );
      
      setMarketValue(newMarketValue);
      setAssessmentValue(newAssessment);
      setLocation(newLocation);
    }
  }, [property, initialAssessmentValue, initialLocation]);

  // Calculate property taxes
  const taxCalculation = calculatePropertyTaxes({
    assessmentValue,
    marketValue,
    location,
    propertyType,
    isFirstTimeBuyer,
    paymentSchedule,
    hasSpecialCharges,
    specialCharges,
    useMarketValueEstimate
  });

  // Button handlers
  const handleToggleView = () => {
    setViewMode(viewMode === "table" ? "chart" : "table");
  };

  const handleCityBreakdownToggleView = () => {
    setCityBreakdownViewMode(cityBreakdownViewMode === "table" ? "chart" : "table");
  };

  // Handle download for Overall Tax Structure
  const handleOverallTaxDownload = () => {
    if (viewMode === "table") {
      const tableData = prepareOverallTaxTableData(taxCalculation);
      downloadCSV(tableData, `Property_Tax_Structure_${new Date().toISOString().split('T')[0]}`);
      toast.success("Tax structure data downloaded as CSV");
    } else {
      downloadChartAsPNG(overallTaxChartRef, `Property_Tax_Structure_Chart_${new Date().toISOString().split('T')[0]}`);
      toast.success("Tax structure chart downloaded as PNG");
    }
  };

  // Handle download for City Tax Breakdown
  const handleCityBreakdownDownload = () => {
    if (cityBreakdownViewMode === "table") {
      const tableData = prepareCityBreakdownTableData(taxCalculation);
      downloadCSV(tableData, `City_Tax_Breakdown_${new Date().toISOString().split('T')[0]}`);
      toast.success("City tax breakdown data downloaded as CSV");
    } else {
      downloadChartAsPNG(cityBreakdownChartRef, `City_Tax_Breakdown_Chart_${new Date().toISOString().split('T')[0]}`);
      toast.success("City tax breakdown chart downloaded as PNG");
    }
  };

  // Prepare data for pie chart
  const taxStructureData = [
    { 
      name: "City Tax", 
      value: taxCalculation.percentages.cityTaxPercentageOfTotal,
      color: "#3b82f6"
    },
    { 
      name: "Education Tax", 
      value: taxCalculation.percentages.educationTaxPercentageOfTotal,
      color: "#10b981"
    },
    { 
      name: "City Building Fund", 
      value: taxCalculation.percentages.cityBuildingFundPercentageOfTotal,
      color: "#f59e0b"
    }
  ];

  // Prepare data for horizontal bar chart
  const cityBreakdownData = taxCalculation.cityTaxBreakdown.map((item, index) => ({
    name: item.category.replace(/([A-Z])/g, ' $1').trim(),
    amount: item.amount,
    percentageOfCityTax: item.percentageOfCityTax,
    color: `hsl(${(index * 360) / taxCalculation.cityTaxBreakdown.length}, 70%, 60%)`
  }));

  const selectedPropertyType = PROPERTY_TYPES.find(p => p.value === propertyType);
  const selectedSchedule = PAYMENT_SCHEDULES.find(s => s.value === paymentSchedule);

  return (
    <div className={`${className}`}>
      <div>
        {/* Main Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="assessmentValue" className="text-base sm:text-lg font-medium text-gray-700">
                Assessment Value
              </Label>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-xs max-w-xs">
                      <p>Your property's assessed value as determined by MPAC</p>
                      <Tooltip.Arrow className="fill-gray-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="assessmentValue"
                type="text"
                value={formatNumberWithCommas(assessmentValue)}
                onChange={(e) => setAssessmentValue(parseNumberFromString(e.target.value))}
                className="pl-7 h-11 sm:h-12 text-base sm:text-lg bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
              />
            </div>
            <Slider
              value={[assessmentValue]}
              onValueChange={([value]) => setAssessmentValue(value)}
              min={100000}
              max={5000000}
              step={10000}
              className="mt-2"
            />
            <p className="text-xs text-gray-500">$100k - $5M</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="location" className="text-base sm:text-lg font-medium text-gray-700">
                Location
              </Label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <MapPin className="h-4 w-4" />
              </span>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="pl-10 h-11 sm:h-12 text-base border border-gray-300 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MUNICIPALITIES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Property Type, Payment Schedule, and First-Time Buyer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Property Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="propertyType" className="text-base sm:text-lg font-medium text-gray-700">
              Property Type
            </Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="h-11 sm:h-12 text-base border border-gray-300 rounded-lg">
                <SelectValue>
                  {selectedPropertyType && (
                    <div className="flex items-center gap-2">
                      <selectedPropertyType.icon className="h-4 w-4" />
                      <span>{selectedPropertyType.label}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Schedule */}
          <div className="space-y-2">
            <Label className="text-base sm:text-lg font-medium text-gray-700">Payment Schedule</Label>
            <Select value={paymentSchedule} onValueChange={setPaymentSchedule}>
              <SelectTrigger className="h-11 sm:h-12 text-base border border-gray-300 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_SCHEDULES.map((schedule) => (
                  <SelectItem key={schedule.value} value={schedule.value}>
                    {schedule.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* First-Time Buyer */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base sm:text-lg font-medium text-gray-700">First-Time Buyer</Label>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-xs max-w-xs">
                      <p>15% rebate on city levy (up to $1,000) for residential properties</p>
                      <Tooltip.Arrow className="fill-gray-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <Select value={isFirstTimeBuyer ? "yes" : "no"} onValueChange={(value) => setIsFirstTimeBuyer(value === "yes")}>
              <SelectTrigger className="h-11 sm:h-12 text-base border border-gray-300 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Market Value Estimation and Special Charges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 items-start">
          {/* Market Value Estimation Toggle */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Market Value Estimation</h3>
                <Button
                  variant={useMarketValueEstimate ? "default" : "outline"}
                  onClick={() => setUseMarketValueEstimate(!useMarketValueEstimate)}
                  className="rounded-lg text-sm"
                >
                  {useMarketValueEstimate ? "Using Market Value" : "Use Assessment Value"}
                </Button>
              </div>
              {useMarketValueEstimate && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="marketValue" className="text-sm font-medium text-gray-700">
                    Market Value (Estimated Assessment: {formatCurrency(marketValue * 0.85)})
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="marketValue"
                      type="text"
                      value={formatNumberWithCommas(marketValue)}
                      onChange={(e) => {
                        const newMarketValue = parseNumberFromString(e.target.value);
                        setMarketValue(newMarketValue);
                        setAssessmentValue(newMarketValue * 0.85);
                      }}
                      className="pl-7 h-10 text-sm bg-white rounded-lg"
                    />
                  </div>
                  <Slider
                    value={[marketValue]}
                    onValueChange={([value]) => {
                      setMarketValue(value);
                      setAssessmentValue(value * 0.85);
                    }}
                    min={100000}
                    max={6000000}
                    step={10000}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500">$100k - $6M</p>
                </div>
              )}
            </div>
          </Card>

          {/* Special Charges */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 shadow-sm">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Special Charges</h3>
                <Button
                  variant={hasSpecialCharges ? "default" : "outline"}
                  onClick={() => setHasSpecialCharges(!hasSpecialCharges)}
                  className="rounded-lg text-sm"
                >
                  {hasSpecialCharges ? "Remove Charges" : "Add Charges"}
                </Button>
              </div>
              {hasSpecialCharges && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="specialCharges" className="text-sm font-medium text-gray-700">
                    Special Charges (BIA levies, local improvements, etc.)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <DollarSign className="h-4 w-4" />
                    </span>
                    <Input
                      id="specialCharges"
                      type="text"
                      value={formatNumberWithCommas(specialCharges)}
                      onChange={(e) => setSpecialCharges(parseNumberFromString(e.target.value))}
                      className="pl-10 h-10 text-sm bg-white rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Overall Tax Structure */}
        <Card className="mb-6">
          <button
            onClick={() => setIsOverallTaxExpanded(!isOverallTaxExpanded)}
            className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-xl font-bold">Overall Tax Structure</h3>
            {isOverallTaxExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {isOverallTaxExpanded && (
            <div className="p-6 border-t">
              <div className="flex justify-end gap-2 mb-4">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleToggleView()}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title={viewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                >
                  {viewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOverallTaxDownload}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            {viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold">Tax Component</th>
                      <th className="text-right py-3 px-2 font-semibold">Amount</th>
                      <th className="text-right py-3 px-2 font-semibold">Tax Rate (%)</th>
                      <th className="text-right py-3 px-2 font-semibold">% of Total Taxes</th>
                      <th className="text-right py-3 px-2 font-semibold">% of Property Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">City Tax</td>
                      <td className="text-right py-3 px-2 font-bold">{formatCurrency(taxCalculation.cityLevy)}</td>
                      <td className="text-right py-3 px-2">{taxCalculation.rates.cityRate.toFixed(6)}</td>
                      <td className="text-right py-3 px-2">{taxCalculation.percentages.cityTaxPercentageOfTotal.toFixed(2)}%</td>
                      <td className="text-right py-3 px-2">{taxCalculation.rates.cityRate.toFixed(6)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">Education Tax</td>
                      <td className="text-right py-3 px-2 font-bold">{formatCurrency(taxCalculation.educationLevy)}</td>
                      <td className="text-right py-3 px-2">{taxCalculation.rates.educationRate.toFixed(6)}</td>
                      <td className="text-right py-3 px-2">{taxCalculation.percentages.educationTaxPercentageOfTotal.toFixed(2)}%</td>
                      <td className="text-right py-3 px-2">{taxCalculation.rates.educationRate.toFixed(6)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">City Building Fund</td>
                      <td className="text-right py-3 px-2 font-bold">{formatCurrency(taxCalculation.cityBuildingFund)}</td>
                      <td className="text-right py-3 px-2">{taxCalculation.rates.cityBuildingFund.toFixed(6)}</td>
                      <td className="text-right py-3 px-2">{taxCalculation.percentages.cityBuildingFundPercentageOfTotal.toFixed(2)}%</td>
                      <td className="text-right py-3 px-2">{taxCalculation.rates.cityBuildingFund.toFixed(6)}</td>
                    </tr>
                    {taxCalculation.rebate > 0 && (
                      <tr className="hover:bg-gray-50 text-green-600">
                        <td className="py-3 px-2 font-medium">First-Time Buyer Rebate</td>
                        <td className="text-right py-3 px-2 font-bold">-{formatCurrency(taxCalculation.rebate)}</td>
                        <td className="text-right py-3 px-2">-</td>
                        <td className="text-right py-3 px-2">-</td>
                        <td className="text-right py-3 px-2">-</td>
                      </tr>
                    )}
                    {taxCalculation.specialCharges > 0 && (
                      <tr className="hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">Special Charges</td>
                        <td className="text-right py-3 px-2 font-bold">{formatCurrency(taxCalculation.specialCharges)}</td>
                        <td className="text-right py-3 px-2">-</td>
                        <td className="text-right py-3 px-2">-</td>
                        <td className="text-right py-3 px-2">-</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                      <td className="py-3 px-2">TOTAL TAXES</td>
                      <td className="text-right py-3 px-2 text-lg">{formatCurrency(taxCalculation.totalTax)}</td>
                      <td className="text-right py-3 px-2">{taxCalculation.rates.totalRate.toFixed(6)}</td>
                      <td className="text-right py-3 px-2">100.00%</td>
                      <td className="text-right py-3 px-2">{taxCalculation.percentages.totalTaxPercentageOfPropertyValue.toFixed(6)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[500px]">
                <ReactECharts
                  ref={overallTaxChartRef}
                  option={getPieChartOption(taxStructureData, "Tax Structure")}
                  style={{ height: "100%", width: "100%" }}
                  opts={{ renderer: "canvas" }}
                />
              </div>
            )}
            </div>
          )}
        </Card>

        {/* Detailed City Tax Breakdown */}
        <Card className="mb-6">
          <button
            onClick={() => setIsCityBreakdownExpanded(!isCityBreakdownExpanded)}
            className="w-full p-4 flex items-center justify-between rounded-xl hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-xl font-bold">City Tax Breakdown Analysis</h3>
            {isCityBreakdownExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {isCityBreakdownExpanded && (
            <div className="p-6 border-t">
              <div className="flex justify-end gap-2 mb-4">
                <Button
                  variant={cityBreakdownViewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleCityBreakdownToggleView()}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title={cityBreakdownViewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                >
                  {cityBreakdownViewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCityBreakdownDownload}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            {cityBreakdownViewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold">Service Category</th>
                      <th className="text-right py-3 px-2 font-semibold">Dollar Amount</th>
                      <th className="text-right py-3 px-2 font-semibold">% of Total City Tax</th>
                      <th className="text-right py-3 px-2 font-semibold">% of Property Value</th>
                      <th className="text-right py-3 px-2 font-semibold">% of Total Taxes Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {taxCalculation.cityTaxBreakdown.map((item) => (
                      <tr key={item.category} className="hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div>
                            <div className="font-medium capitalize">{item.category.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 font-bold">{formatCurrency(item.amount)}</td>
                        <td className="text-right py-3 px-2">{item.percentageOfCityTax.toFixed(2)}%</td>
                        <td className="text-right py-3 px-2">{item.percentageOfPropertyValue.toFixed(6)}</td>
                        <td className="text-right py-3 px-2">{item.percentageOfTotalTax.toFixed(2)}%</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                      <td className="py-3 px-2">TOTAL CITY TAX</td>
                      <td className="text-right py-3 px-2 text-lg">{formatCurrency(taxCalculation.cityLevy)}</td>
                      <td className="text-right py-3 px-2">100.00%</td>
                      <td className="text-right py-3 px-2">{taxCalculation.rates.cityRate.toFixed(6)}</td>
                      <td className="text-right py-3 px-2">{taxCalculation.percentages.cityTaxPercentageOfTotal.toFixed(2)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[600px]">
                <ReactECharts
                  ref={cityBreakdownChartRef}
                  option={getHorizontalBarChartOption(cityBreakdownData, "City Tax Breakdown")}
                  style={{ height: "100%", width: "100%" }}
                  opts={{ renderer: "canvas" }}
                />
              </div>
            )}
            </div>
          )}
        </Card>

        {/* Payment Summary */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Payment Summary</h3>
            <div className="bg-gradient-to-r from-brand-celestial to-brand-cb-blue rounded-lg p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-white mb-1">Assessment Value</div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(taxCalculation.assessmentValue)}</div>
                </div>
                <div>
                  <div className="text-sm text-white mb-1">{selectedSchedule?.label} Payment</div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(taxCalculation.paymentAmount)}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PropertyTaxCalculator;
