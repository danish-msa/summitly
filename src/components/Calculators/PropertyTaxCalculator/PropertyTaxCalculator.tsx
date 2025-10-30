"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Info, DollarSign, MapPin, Home, Building, TreePine, Table2, BarChart3, Download, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import * as Tooltip from '@radix-ui/react-tooltip';
import { PropertyListing } from "@/lib/types";
import ReactECharts from "echarts-for-react";
import { toast } from "sonner";

interface PropertyTaxCalculatorProps {
  property?: PropertyListing;
  initialAssessmentValue?: number;
  initialLocation?: string;
  className?: string;
}

// 2025 Property Tax Rates for Toronto (from official source)
const TORONTO_TAX_RATES = {
  residential: {
    cityRate: 0.592653,
    educationRate: 0.153000,
    cityBuildingFund: 0.008434,
    totalRate: 0.754087
  },
  multiResidential: {
    cityRate: 1.036734,
    educationRate: 0.153000,
    cityBuildingFund: 0.007571,
    totalRate: 1.197305
  },
  newMultiResidential: {
    cityRate: 0.592653,
    educationRate: 0.153000,
    cityBuildingFund: 0.008434,
    totalRate: 0.754087
  },
  commercial: {
    cityRate: 1.385397,
    educationRate: 0.880000,
    cityBuildingFund: 0.010081,
    totalRate: 2.275478
  },
  industrial: {
    cityRate: 1.483217,
    educationRate: 0.880000,
    cityBuildingFund: 0.021086,
    totalRate: 2.384303
  },
  farmlands: {
    cityRate: 0.148163,
    educationRate: 0.038250,
    cityBuildingFund: 0.002109,
    totalRate: 0.188522
  },
  managedForests: {
    cityRate: 0.148163,
    educationRate: 0.038250,
    cityBuildingFund: 0.002109,
    totalRate: 0.188522
  }
};

// Major Ontario municipalities with estimated tax rates (relative to Toronto)
const MUNICIPALITIES = {
  "Toronto, ON": { multiplier: 1.0, name: "Toronto" },
  "Mississauga, ON": { multiplier: 0.85, name: "Mississauga" },
  "Brampton, ON": { multiplier: 0.82, name: "Brampton" },
  "Hamilton, ON": { multiplier: 0.78, name: "Hamilton" },
  "London, ON": { multiplier: 0.75, name: "London" },
  "Markham, ON": { multiplier: 0.88, name: "Markham" },
  "Vaughan, ON": { multiplier: 0.90, name: "Vaughan" },
  "Kitchener, ON": { multiplier: 0.80, name: "Kitchener" },
  "Windsor, ON": { multiplier: 0.72, name: "Windsor" },
  "Ottawa, ON": { multiplier: 0.95, name: "Ottawa" }
};

const PROPERTY_TYPES = [
  { value: "residential", label: "Residential", icon: Home, description: "Single-family homes, townhouses" },
  { value: "multiResidential", label: "Multi-Residential", icon: Building, description: "Apartment buildings, rental properties" },
  { value: "newMultiResidential", label: "New Multi-Residential", icon: Building, description: "New rental properties (15% reduction)" },
  { value: "commercial", label: "Commercial", icon: Building, description: "Office buildings, retail spaces" },
  { value: "industrial", label: "Industrial", icon: Building, description: "Manufacturing, warehouses" },
  { value: "farmlands", label: "Farmlands", icon: TreePine, description: "Agricultural properties" },
  { value: "managedForests", label: "Managed Forests", icon: TreePine, description: "Forest management properties" }
];

const PAYMENT_SCHEDULES = [
  { value: "monthly", label: "Monthly (12 payments)", multiplier: 1/12 },
  { value: "quarterly", label: "Quarterly (4 payments)", multiplier: 1/4 },
  { value: "semi-annually", label: "Semi-annually (2 payments)", multiplier: 1/2 },
  { value: "annually", label: "Annually (1 payment)", multiplier: 1 }
];

// Detailed City Tax Breakdown by Service Category (based on Toronto's 2025 structure)
const CITY_TAX_BREAKDOWN = {
  transit: { percentage: 19.58905092, description: "Public transit operations and infrastructure" },
  police: { percentage: 17.26876205, description: "Police services and law enforcement" },
  capitalInvestments: { percentage: 12.42697027, description: "Capital investments & corporate financing" },
  socialPrograms: { percentage: 11.29160849, description: "Cost shared social programs" },
  fireParamedic: { percentage: 9.589725851, description: "Fire and paramedic services" },
  otherOperations: { percentage: 9.18202488, description: "Other city operations" },
  otherAgencies: { percentage: 8.981232679, description: "Other agencies and boards" },
  governance: { percentage: 8.92323073, description: "Governance and corporate services" },
  transportation: { percentage: 4.170445582, description: "Transportation infrastructure" }
};

// Helper functions for number formatting with commas
const formatNumberWithCommas = (value: number): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseNumberFromString = (value: string): number => {
  const cleaned = value.replace(/[^\d.]/g, '');
  return Number(cleaned) || 0;
};

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOverallTaxExpanded, setIsOverallTaxExpanded] = useState(true);
  const [isCityBreakdownExpanded, setIsCityBreakdownExpanded] = useState(true);

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
  const calculatePropertyTaxes = () => {
    const currentAssessment = useMarketValueEstimate ? marketValue * 0.85 : assessmentValue;
    const municipality = MUNICIPALITIES[location as keyof typeof MUNICIPALITIES] || MUNICIPALITIES["Toronto, ON"];
    const baseRates = TORONTO_TAX_RATES[propertyType as keyof typeof TORONTO_TAX_RATES] || TORONTO_TAX_RATES.residential;
    
    // Apply municipality multiplier
    const adjustedRates = {
      cityRate: baseRates.cityRate * municipality.multiplier,
      educationRate: baseRates.educationRate * municipality.multiplier,
      cityBuildingFund: baseRates.cityBuildingFund * municipality.multiplier,
      totalRate: baseRates.totalRate * municipality.multiplier
    };

    const cityLevy = (currentAssessment * adjustedRates.cityRate) / 100;
    const educationLevy = (currentAssessment * adjustedRates.educationRate) / 100;
    const cityBuildingFund = (currentAssessment * adjustedRates.cityBuildingFund) / 100;
    
    // Calculate detailed city tax breakdown
    const cityTaxBreakdown = Object.entries(CITY_TAX_BREAKDOWN).map(([key, data]) => ({
      category: key,
      description: data.description,
      amount: (cityLevy * data.percentage) / 100,
      percentageOfCityTax: data.percentage,
      percentageOfPropertyValue: (data.percentage * adjustedRates.cityRate) / 100,
      percentageOfTotalTax: (data.percentage * adjustedRates.cityRate) / adjustedRates.totalRate * 100
    }));
    
    let totalTax = cityLevy + educationLevy + cityBuildingFund;
    
    // Apply first-time buyer rebate (if applicable for residential properties)
    let rebate = 0;
    if (isFirstTimeBuyer && propertyType === "residential") {
      rebate = Math.min(cityLevy * 0.15, 1000); // 15% rebate up to $1000
    }
    
    totalTax = Math.max(0, totalTax - rebate);
    
    // Add special charges
    if (hasSpecialCharges) {
      totalTax += specialCharges;
    }

    // Calculate percentages
    const cityTaxPercentageOfTotal = (cityLevy / totalTax) * 100;
    const educationTaxPercentageOfTotal = (educationLevy / totalTax) * 100;
    const cityBuildingFundPercentageOfTotal = (cityBuildingFund / totalTax) * 100;
    const totalTaxPercentageOfPropertyValue = (totalTax / currentAssessment) * 100;

    return {
      assessmentValue: currentAssessment,
      cityLevy,
      educationLevy,
      cityBuildingFund,
      cityTaxBreakdown,
      rebate,
      specialCharges: hasSpecialCharges ? specialCharges : 0,
      totalTax,
      paymentAmount: totalTax * (PAYMENT_SCHEDULES.find(s => s.value === paymentSchedule)?.multiplier || 1/12),
      rates: adjustedRates,
      percentages: {
        cityTaxPercentageOfTotal,
        educationTaxPercentageOfTotal,
        cityBuildingFundPercentageOfTotal,
        totalTaxPercentageOfPropertyValue
      }
    };
  };

  const taxCalculation = calculatePropertyTaxes();

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Chart helper functions
  const getPieChartOption = (data: Array<{name: string, value: number, color?: string}>, title: string) => {
    return {
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e5e7eb",
        textStyle: {
          color: "#1f2937",
        },
      },
      legend: {
        orient: "vertical",
        left: "left",
        textStyle: {
          color: "#1f2937",
        },
        formatter: (name: string) => {
          const item = data.find((d) => d.name === name);
          return item ? `${name} (${item.value}%)` : name;
        },
      },
      series: [
        {
          name: title,
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: "#ffffff",
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "outside",
            formatter: "{d}%",
            color: "#1f2937",
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: "bold",
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          data: data.map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`,
            },
          })),
        },
      ],
    };
  };

  // Chart helper functions
  const getHorizontalBarChartOption = (data: Array<{name: string, amount: number, percentageOfCityTax: number, color?: string}>, title: string) => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        },
        formatter: (params: any) => {
          const item = params[0];
          return `${item.name}: ${formatCurrency(item.value)} (${item.data.percentage}%)`;
        },
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e5e7eb",
        textStyle: {
          color: "#1f2937",
        },
      },
      grid: {
        left: "15%",
        right: "10%",
        top: "10%",
        bottom: "10%",
        containLabel: true
      },
      xAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => formatCurrency(value)
        },
        axisLine: {
          lineStyle: {
            color: "#e5e7eb"
          }
        },
        splitLine: {
          lineStyle: {
            color: "#f3f4f6"
          }
        }
      },
      yAxis: {
        type: "category",
        data: data.map(item => item.name),
        axisLine: {
          lineStyle: {
            color: "#e5e7eb"
          }
        },
        axisLabel: {
          color: "#1f2937",
          fontSize: 12
        }
      },
      series: [
        {
          name: title,
          type: "bar",
          data: data.map((item, index) => ({
            value: item.amount,
            name: item.name,
            percentage: item.percentageOfCityTax.toFixed(1),
            itemStyle: {
              color: item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`,
              borderRadius: [0, 4, 4, 0]
            }
          })),
          barWidth: "60%",
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            }
          }
        }
      ]
    };
  };

  // Button handlers
  const handleToggleView = () => {
    setViewMode(viewMode === "table" ? "chart" : "table");
  };

  const handleCityBreakdownToggleView = () => {
    setCityBreakdownViewMode(cityBreakdownViewMode === "table" ? "chart" : "table");
  };

  const handleDownload = () => {
    toast.info("Download functionality coming soon!");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed!");
    }, 1000);
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleView();
                  }}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title={viewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                >
                  {viewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info("Trend analysis coming soon!");
                  }}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Trend analysis"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                  }}
                  disabled={isRefreshing}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {isOverallTaxExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>
          
          {isOverallTaxExpanded && (
            <div className="p-6 border-t">

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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={cityBreakdownViewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCityBreakdownToggleView();
                  }}
                  className="h-9 w-9 rounded-lg transition-all duration-300"
                  title={cityBreakdownViewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
                >
                  {cityBreakdownViewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info("Trend analysis coming soon!");
                  }}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Trend analysis"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Download data"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                  }}
                  disabled={isRefreshing}
                  className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {isCityBreakdownExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>
          
          {isCityBreakdownExpanded && (
            <div className="p-6 border-t">

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
                    {taxCalculation.cityTaxBreakdown.map((item, index) => (
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
