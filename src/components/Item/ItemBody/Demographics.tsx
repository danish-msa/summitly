import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Map from "@/components/ui/map";
// Sample demographic data
const demographicStats = {
  population: 894,
  averageAge: 38.6,
  averageIncome: 128500,
  renters: 54.7,
  householdSize: 1.9,
  single: 61.1,
  householdsWithChildren: 231,
  notInLabourForce: 23.9,
};

const householdIncomeData = [
  { name: "$0 - $29,999", value: 70, percentage: 16 },
  { name: "$30,000 - $59,999", value: 95, percentage: 20 },
  { name: "$60,000 - $79,999", value: 60, percentage: 13 },
  { name: "$80,000 - $99,999", value: 55, percentage: 12 },
  { name: "$100,000 - $149,999", value: 75, percentage: 16 },
  { name: "$150,000 - $199,999", value: 50, percentage: 11 },
  { name: "$200,000+", value: 70, percentage: 15 },
];

const propertyTypeData = [
  { name: "Condominium", value: 72.34 },
  { name: "Semi-Detached", value: 9.56 },
  { name: "Freehold Townhouse", value: 5.51 },
  { name: "Detached", value: 6.37 },
  { name: "Duplex", value: 1.09 },
  { name: "Multiplex", value: 0.87 },
  { name: "Triplex", value: 0.86 },
  { name: "Condo Townhouse", value: 0.92 },
  { name: "Other", value: 0.16 },
  { name: "Vacant Land", value: 0.01 },
  { name: "Upper Level", value: 0.63 },
  { name: "Comm Element Condo", value: 1.67 },
];

const ageData = [
  { name: "0-14 years", value: 12 },
  { name: "15-24 years", value: 15 },
  { name: "25-34 years", value: 22 },
  { name: "35-44 years", value: 18 },
  { name: "45-54 years", value: 14 },
  { name: "55-64 years", value: 11 },
  { name: "65+ years", value: 8 },
];

const occupationData = [
  { name: "Management", value: 18 },
  { name: "Business & Finance", value: 22 },
  { name: "Natural Sciences", value: 15 },
  { name: "Health", value: 12 },
  { name: "Education", value: 10 },
  { name: "Arts & Culture", value: 8 },
  { name: "Sales & Service", value: 15 },
];

const ethnicityData = [
  { name: "European", value: 35 },
  { name: "Asian", value: 28 },
  { name: "Middle Eastern", value: 12 },
  { name: "Latin American", value: 8 },
  { name: "African", value: 7 },
  { name: "Other", value: 10 },
];

const languageData = [
  { name: "English", value: 65 },
  { name: "French", value: 5 },
  { name: "Mandarin", value: 8 },
  { name: "Cantonese", value: 6 },
  { name: "Spanish", value: 4 },
  { name: "Other", value: 12 },
];

const yearBuiltData = [
  { name: "Before 1960", value: 15 },
  { name: "1960-1979", value: 20 },
  { name: "1980-1999", value: 25 },
  { name: "2000-2009", value: 22 },
  { name: "2010-2020", value: 18 },
];

const commuteMethodData = [
  { name: "Public Transit", value: 45 },
  { name: "Car", value: 30 },
  { name: "Walk", value: 15 },
  { name: "Bike", value: 8 },
  { name: "Other", value: 2 },
];

const NeighbourhoodDemographics = ({ latitude, longitude, address }: { latitude?: number | null, longitude?: number | null, address?: string }) => {
  const [activeTab, setActiveTab] = useState("income");

  const getChartData = (tab: string) => {
    switch (tab) {
      case "income":
        return householdIncomeData;
      case "age":
        return ageData;
      case "occupation":
        return occupationData;
      case "ethnicity":
        return ethnicityData;
      case "language":
        return languageData;
      case "yearBuilt":
        return yearBuiltData;
      case "propertyType":
        return propertyTypeData;
      case "commute":
        return commuteMethodData;
      default:
        return householdIncomeData;
    }
  };

  const getPieChartOption = (data: any[], title: string) => {
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
          return item ? `${name} (${item.value}${title.includes('Type') ? '%' : ''})` : name;
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
              color: `hsl(${(index * 360) / data.length}, 70%, 60%)`,
            },
          })),
        },
      ],
    };
  };

  return (
    <div className="w-full">
      <div className="">
        <p className="text-sm text-muted-foreground mb-1">
          Gain quick insights into local demographics with Statistics Canada's data on this Dissemination Area. 
          A dissemination area is essentially a small neighbourhood consisting of 400 to 700 residents.
        </p>
        <div className="py-6">
          {/* Map */}
          <div className="w-full rounded-lg mb-6">
            <div className="text-center text-muted-foreground">
            <Map 
              latitude={latitude || undefined} 
              longitude={longitude || undefined}
              address={address}
              height="256px"
              width="100%"
              zoom={16}
              mapType="roadmap"
              showControls={true}
              showFullscreen={true}
              showExternalLink={true}
              showMarker={true}
              markerTitle={address}
              markerDescription={address}
              loading={false}
              />
            </div>
          </div>

          {/* Key Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
              <p className="text-sm text-muted-foreground mb-1">Population (2021):</p>
              <p className="text-2xl font-bold text-foreground">{demographicStats.population}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
              <p className="text-sm text-muted-foreground mb-1">Average Age:</p>
              <p className="text-2xl font-bold text-foreground">{demographicStats.averageAge}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
              <p className="text-sm text-muted-foreground mb-1">Average Household Income:</p>
              <p className="text-2xl font-bold text-foreground">${demographicStats.averageIncome.toLocaleString()}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
              <p className="text-sm text-muted-foreground mb-1">Renters:</p>
              <p className="text-2xl font-bold text-foreground">{demographicStats.renters}%</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
              <p className="text-sm text-muted-foreground mb-1">Household Average Size:</p>
              <p className="text-2xl font-bold text-foreground">{demographicStats.householdSize}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
              <p className="text-sm text-muted-foreground mb-1">Single:</p>
              <p className="text-2xl font-bold text-foreground">{demographicStats.single}%</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
              <p className="text-sm text-muted-foreground mb-1">Households With Children:</p>
              <p className="text-2xl font-bold text-foreground">{demographicStats.householdsWithChildren}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
              <p className="text-sm text-muted-foreground mb-1">Not in Labour Force:</p>
              <p className="text-2xl font-bold text-foreground">{demographicStats.notInLabourForce}%</p>
            </div>
          </div>

          {/* Tabs and Charts */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full flex-wrap justify-between mb-6 bg-white gap-2">
              <TabsTrigger value="income" className="bg-brand-tide text-black border border-border/50 rounded-lg px-2 py-1">Household Income</TabsTrigger>
              <TabsTrigger value="age" className="bg-brand-tide text-black border border-border/50 rounded-lg px-2 py-1">Age</TabsTrigger>
              <TabsTrigger value="occupation" className="bg-brand-tide text-black border border-border/50 rounded-lg px-2 py-1">Occupation</TabsTrigger>
              <TabsTrigger value="ethnicity" className="bg-brand-tide text-black border border-border/50 rounded-lg px-2 py-1">Ethnicity</TabsTrigger>
              <TabsTrigger value="language" className="bg-brand-tide text-black border border-border/50 rounded-lg px-2 py-1">Language</TabsTrigger>
              <TabsTrigger value="yearBuilt" className="bg-brand-tide text-black border border-border/50 rounded-lg px-2 py-1">Year Built</TabsTrigger>
              <TabsTrigger value="propertyType" className="bg-brand-tide text-black border border-border/50 rounded-lg px-2 py-1">Property Type</TabsTrigger>
              <TabsTrigger value="commute" className="bg-brand-tide text-black border border-border/50 rounded-lg px-2 py-1">Commute Method</TabsTrigger>
            </TabsList>

            <TabsContent value="income" className="mt-6">
              <div className="py-6">
                <h3 className="text-xl font-semibold mb-4">Household Income Distribution</h3>
                <div className="h-[500px]">
                  <ReactECharts
                    option={getPieChartOption(householdIncomeData, "Household Income")}
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: "canvas" }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="age" className="mt-6">
              <div className="py-6">
                <h3 className="text-xl font-semibold mb-4">Age Distribution</h3>
                <div className="h-[500px]">
                  <ReactECharts
                    option={getPieChartOption(ageData, "Age")}
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: "canvas" }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="occupation" className="mt-6">
              <div className="py-6">
                <h3 className="text-xl font-semibold mb-4">Occupation Distribution</h3>
                <div className="h-[500px]">
                  <ReactECharts
                    option={getPieChartOption(occupationData, "Occupation")}
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: "canvas" }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ethnicity" className="mt-6">
              <div className="py-6">
                <h3 className="text-xl font-semibold mb-4">Ethnicity Distribution</h3>
                <div className="h-[500px]">
                  <ReactECharts
                    option={getPieChartOption(ethnicityData, "Ethnicity")}
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: "canvas" }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="language" className="mt-6">
              <div className="py-6">
                <h3 className="text-xl font-semibold mb-4">Language Distribution</h3>
                <div className="h-[500px]">
                  <ReactECharts
                    option={getPieChartOption(languageData, "Language")}
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: "canvas" }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="yearBuilt" className="mt-6">
              <div className="py-6">
                <h3 className="text-xl font-semibold mb-4">Year Built Distribution</h3>
                <div className="h-[500px]">
                  <ReactECharts
                    option={getPieChartOption(yearBuiltData, "Year Built")}
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: "canvas" }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="propertyType" className="mt-6">
              <div className="py-6">
                <h3 className="text-xl font-semibold mb-4">Property Type Distribution</h3>
                <div className="h-[500px]">
                  <ReactECharts
                    option={getPieChartOption(propertyTypeData, "Property Type")}
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: "canvas" }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="commute" className="mt-6">
              <div className="py-6">
                <h3 className="text-xl font-semibold mb-4">Commute Method Distribution</h3>
                <div className="h-[500px]">
                  <ReactECharts
                    option={getPieChartOption(commuteMethodData, "Commute Method")}
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: "canvas" }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NeighbourhoodDemographics;