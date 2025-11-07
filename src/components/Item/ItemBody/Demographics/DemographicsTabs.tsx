import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart } from './PieChart';
import {
  householdIncomeData,
  ageData,
  occupationData,
  ethnicityData,
  languageData,
  yearBuiltData,
  propertyTypeData,
  commuteMethodData,
} from './mockData';

interface DemographicsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DemographicsTabs = ({ activeTab, onTabChange }: DemographicsTabsProps) => {
  const tabConfigs = [
    { value: "income", label: "Household Income", data: householdIncomeData, title: "Household Income Distribution" },
    { value: "age", label: "Age", data: ageData, title: "Age Distribution" },
    { value: "occupation", label: "Occupation", data: occupationData, title: "Occupation Distribution" },
    { value: "ethnicity", label: "Ethnicity", data: ethnicityData, title: "Ethnicity Distribution" },
    { value: "language", label: "Language", data: languageData, title: "Language Distribution" },
    { value: "yearBuilt", label: "Year Built", data: yearBuiltData, title: "Year Built Distribution" },
    { value: "propertyType", label: "Property Type", data: propertyTypeData, title: "Property Type Distribution" },
    { value: "commute", label: "Commute Method", data: commuteMethodData, title: "Commute Method Distribution" },
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="flex w-full flex-wrap justify-between mb-6 bg-white gap-2">
        {tabConfigs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="bg-brand-tide text-black border border-border/50 rounded-lg px-2 py-1"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabConfigs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          <div className="pt-2 pb-4">
            <h3 className="text-xl font-semibold mb-2">{tab.title}</h3>
            <PieChart data={tab.data} title={tab.label} />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

