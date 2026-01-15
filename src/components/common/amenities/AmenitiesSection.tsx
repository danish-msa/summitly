"use client";

import { useState, useEffect } from "react";
import { AmenitiesSectionProps, AmenityCategory, Amenity } from './types';
import { CategoryTabs } from './CategoryTabs';
import { CategoryContent } from './CategoryContent';
import { AmenityDetailModal } from './AmenityDetailModal';

export const AmenitiesSection = ({
  address = "80 Esther Lorrie Drive",
  latitude,
  longitude,
  categories: categoryDefinitions,
  apiEndpoint,
  descriptionText,
  showDirections = false,
}: AmenitiesSectionProps) => {
  const [activeTab, setActiveTab] = useState(categoryDefinitions[0]?.id || "");
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<AmenityCategory[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize activeFilter state for all categories
  // For schools, default to "Public"
  useEffect(() => {
    const initialFilters: Record<string, string> = {};
    categoryDefinitions.forEach(cat => {
      // Schools default to "Public", others default to "All"
      initialFilters[cat.id] = cat.id === 'schools' ? "Public" : "All";
    });
    setActiveFilter(initialFilters);
  }, [categoryDefinitions]);

  // Fetch amenities for a specific category with optional filter
  const fetchCategoryData = async (categoryId: string, filter?: string) => {
    if (!latitude || !longitude) {
      setError('Location coordinates are required');
      return;
    }

    // For schools, check if we need to fetch based on filter
    // Only fetch if filter is selected (lazy loading)
    if (categoryId === 'schools' && !filter) {
      return; // Don't fetch until a filter is selected
    }

    // Check if already loaded for this filter combination
    if (categoryId === 'schools' && filter) {
      // For schools, check if we already have data for this specific filter
      const existing = categories.find(cat => cat.id === categoryId);
      if (existing && activeFilter[categoryId] === filter) {
        return; // Already loaded for this filter
      }
    } else {
      // For non-schools, check if category is already loaded
      if (categories.find(cat => cat.id === categoryId)) {
        return; // Already loaded
      }
    }

    setLoading(prev => ({ ...prev, [categoryId]: true }));
    setError(null);

    try {
      // Build URL with schoolType parameter for schools
      // Handle both absolute and relative URLs
      const baseUrl = apiEndpoint.startsWith('http') 
        ? apiEndpoint 
        : `${window.location.origin}${apiEndpoint}`;
      
      const url = new URL(baseUrl);
      url.searchParams.set('lat', latitude.toString());
      url.searchParams.set('lng', longitude.toString());
      url.searchParams.set('category', categoryId);
      if (categoryId === 'schools' && filter && filter !== 'All') {
        url.searchParams.set('schoolType', filter);
      }

      const response = await fetch(url.toString());

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
        // For schools, replace existing data when filter changes
        if (categoryId === 'schools' && filter) {
          const filtered = prev.filter(cat => cat.id !== categoryId);
          return [...filtered, data.category];
        }
        // For other categories, only add if not exists
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
    if (latitude && longitude && activeTab) {
      const currentFilter = activeFilter[activeTab];
      // For schools, only fetch if filter is selected (default is "Public")
      if (activeTab === 'schools') {
        if (currentFilter && currentFilter !== 'All') {
          fetchCategoryData(activeTab, currentFilter);
        }
      } else {
        fetchCategoryData(activeTab);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, latitude, longitude]);

  // Fetch initial category on mount
  useEffect(() => {
    if (latitude && longitude && categoryDefinitions[0]?.id) {
      const categoryId = categoryDefinitions[0].id;
      // For schools, fetch with default "Public" filter
      if (categoryId === 'schools') {
        fetchCategoryData(categoryId, 'Public');
      } else {
        fetchCategoryData(categoryId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const currentCategory = categories.find((cat) => cat.id === activeTab);

  const handleFilterChange = (filter: string) => {
    setActiveFilter({ ...activeFilter, [activeTab]: filter });
    
    // For schools, fetch data when filter changes (lazy loading)
    if (activeTab === 'schools' && latitude && longitude) {
      fetchCategoryData(activeTab, filter);
    }
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

  const handleAmenityClick = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setIsModalOpen(true);
  };

  // Create category list with loading states
  const categoryList: AmenityCategory[] = categoryDefinitions.map(cat => {
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
          {descriptionText}{" "}
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
                activeFilter={activeFilter[category.id] || "All"}
                onFilterChange={handleFilterChange}
                showAll={showAll[category.id] || false}
                onToggleShowAll={handleToggleShowAll}
                showDirections={showDirections}
                onAmenityClick={handleAmenityClick}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No {category.label.toLowerCase()} found nearby</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <AmenityDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        amenity={selectedAmenity}
        categoryId={activeTab}
      />
    </div>
  );
};

