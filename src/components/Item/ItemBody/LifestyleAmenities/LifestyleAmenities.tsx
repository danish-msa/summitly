import { useState, useEffect } from "react";
import { LifestyleAmenitiesProps, AmenityCategory } from './types';
import { CategoryTabs } from './CategoryTabs';
import { CategoryContent } from './CategoryContent';

const CATEGORIES = [
  { id: "entertainment", label: "Entertainment" },
  { id: "shopping", label: "Shopping" },
  { id: "worship", label: "Worship" },
  { id: "sports", label: "Sports" },
  { id: "food", label: "Food" },
  { id: "miscellaneous", label: "Miscellaneous" },
];

export const LifestyleAmenities = ({ 
  address = "80 Esther Lorrie Drive",
  latitude,
  longitude 
}: LifestyleAmenitiesProps) => {
  const [activeTab, setActiveTab] = useState("entertainment");
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({
    entertainment: "All",
    shopping: "All",
    worship: "All",
    sports: "All",
    food: "All",
    miscellaneous: "All",
  });
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<AmenityCategory[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch amenities for a specific category
  const fetchCategoryData = async (categoryId: string) => {
    if (!latitude || !longitude) {
      setError('Location coordinates are required');
      return;
    }

    // Check if already loaded
    if (categories.find(cat => cat.id === categoryId)) {
      return;
    }

    setLoading(prev => ({ ...prev, [categoryId]: true }));
    setError(null);

    try {
      const response = await fetch(
        `/api/neighborhood-amenities?lat=${latitude}&lng=${longitude}&category=${categoryId}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch ${categoryId} amenities (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.category) {
        throw new Error(`Invalid response format for ${categoryId} amenities`);
      }

      setCategories(prev => {
        const existing = prev.find(cat => cat.id === categoryId);
        if (existing) return prev;
        return [...prev, data.category];
      });
    } catch (err) {
      console.error(`Error fetching ${categoryId} amenities:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load amenities');
    } finally {
      setLoading(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (latitude && longitude) {
      fetchCategoryData(activeTab);
    }
  }, [activeTab, latitude, longitude]);

  // Fetch initial category on mount
  useEffect(() => {
    if (latitude && longitude) {
      fetchCategoryData("entertainment");
    }
  }, [latitude, longitude]);

  const currentCategory = categories.find((cat) => cat.id === activeTab);

  const handleFilterChange = (filter: string) => {
    setActiveFilter({ ...activeFilter, [activeTab]: filter });
  };

  const handleToggleShowAll = () => {
    setShowAll({ ...showAll, [activeTab]: !showAll[activeTab] });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (latitude && longitude) {
      fetchCategoryData(tabId);
    }
  };

  // Create category list with loading states
  const categoryList: AmenityCategory[] = CATEGORIES.map(cat => {
    const loaded = categories.find(c => c.id === cat.id);
    return loaded || {
      id: cat.id,
      label: cat.label,
      items: [],
      filters: [{ label: "All", count: 0 }],
    };
  });

  return (
    <div className="w-full p-2">
      <div className="mb-6">
        <p className="text-gray-600">
          Discover lifestyle amenities and services near{" "}
          <span className="font-semibold text-gray-900">{address}</span>
        </p>
        {!latitude || !longitude ? (
          <p className="text-sm text-amber-600 mt-2">
            Location coordinates are required to load amenities
          </p>
        ) : null}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="w-full">
        <CategoryTabs
          categories={categoryList}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {categoryList.map((category) => (
          <div
            key={category.id}
            className={`space-y-6 ${activeTab === category.id ? "block" : "hidden"}`}
          >
            {loading[category.id] ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-sm text-gray-600">Loading {category.label.toLowerCase()}...</p>
                </div>
              </div>
            ) : currentCategory && currentCategory.id === category.id ? (
              <CategoryContent
                category={currentCategory}
                activeFilter={activeFilter[category.id]}
                onFilterChange={handleFilterChange}
                showAll={showAll[category.id] || false}
                onToggleShowAll={handleToggleShowAll}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No {category.label.toLowerCase()} found nearby</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

