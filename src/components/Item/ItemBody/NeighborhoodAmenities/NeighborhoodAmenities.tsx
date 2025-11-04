import { useState } from "react";
import { NeighborhoodAmenitiesProps } from './types';
import { MOCK_DATA } from './mockData';
import { CategoryTabs } from './CategoryTabs';
import { CategoryContent } from './CategoryContent';

export const NeighborhoodAmenities = ({ address = "80 Esther Lorrie Drive" }: NeighborhoodAmenitiesProps) => {
  const [activeTab, setActiveTab] = useState("schools");
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({
    schools: "All",
    parks: "All",
    safety: "All",
    transit: "All",
  });
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});

  const currentCategory = MOCK_DATA.find((cat) => cat.id === activeTab);

  const handleFilterChange = (filter: string) => {
    setActiveFilter({ ...activeFilter, [activeTab]: filter });
  };

  const handleToggleShowAll = () => {
    setShowAll({ ...showAll, [activeTab]: !showAll[activeTab] });
  };

  return (
    <div className="w-full p-2">
      <div className="mb-6">
        <p className="text-gray-600">
          Find out information about nearby public amenities for{" "}
          <span className="font-semibold text-gray-900">{address}</span>
        </p>
      </div>

      <div className="w-full">
        <CategoryTabs
          categories={MOCK_DATA}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {MOCK_DATA.map((category) => (
          <div
            key={category.id}
            className={`space-y-6 ${activeTab === category.id ? "block" : "hidden"}`}
          >
            {currentCategory && (
              <CategoryContent
                category={currentCategory}
                activeFilter={activeFilter[category.id]}
                onFilterChange={handleFilterChange}
                showAll={showAll[category.id] || false}
                onToggleShowAll={handleToggleShowAll}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

