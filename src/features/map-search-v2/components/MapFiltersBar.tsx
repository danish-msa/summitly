"use client";

import React, { useMemo } from "react";

import GlobalFilters from "@/components/common/filters/GlobalFilters";
import { LOCATIONS, type FilterChangeEvent, type FilterState } from "@/lib/types/filters";

import { useSearch } from "../providers/SearchProvider";

export default function MapFiltersBar({ communities }: { communities: string[] }) {
  const { filters, setFilters, resetFilters } = useSearch();

  const handleFilterChange = (e: FilterChangeEvent) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      // Ignore unknown keys (defensive; some filter UIs emit extra keys)
      if (!(name in prev)) return prev;
      return {
        ...prev,
        [name as keyof FilterState]: value as FilterState[keyof FilterState],
      };
    });
  };

  const locations = useMemo(() => LOCATIONS, []);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <GlobalFilters
        filters={filters}
        handleFilterChange={handleFilterChange}
        resetFilters={resetFilters}
        communities={communities}
        locations={locations}
        showLocation={true}
        showPropertyType={true}
        showCommunity={true}
        showPrice={true}
        showBedrooms={true}
        showBathrooms={true}
        showAdvanced={true}
        layout="horizontal"
        className="w-full"
      />
    </div>
  );
}

