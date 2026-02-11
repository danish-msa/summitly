"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { DEFAULT_FILTER_STATE, type FilterState } from "@/lib/types/filters";

import { MapOptionsProvider } from "@/features/map-search-v2/providers/MapOptionsProvider";
import { SearchProvider } from "@/features/map-search-v2/providers/SearchProvider";
import MapPageContent from "@/features/map-search-v2/components/MapPageContent";
import { getLayout } from "@/features/map-search-v2/utils/mapUrl";

function parseInitialFilters(sp: URLSearchParams): FilterState {
  const next: FilterState = { ...DEFAULT_FILTER_STATE };

  const str = (k: string) => sp.get(k);
  const num = (k: string) => {
    const v = sp.get(k);
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const location = str("location");
  const community = str("community");
  const propertyType = str("propertyType");
  const listingType = str("listingType");

  if (location) next.location = location;
  if (community) next.community = community;
  if (propertyType) next.propertyType = propertyType;
  if (listingType) next.listingType = listingType;

  const minPrice = num("minPrice");
  const maxPrice = num("maxPrice");
  const bedrooms = num("bedrooms");
  const bathrooms = num("bathrooms");

  if (minPrice != null) next.minPrice = minPrice;
  if (maxPrice != null) next.maxPrice = maxPrice;
  if (bedrooms != null) next.bedrooms = bedrooms;
  if (bathrooms != null) next.bathrooms = bathrooms;

  return next;
}

export default function MapSearchV2() {
  const sp = useSearchParams();
  const usp = useMemo(() => new URLSearchParams(sp?.toString() ?? ""), [sp]);

  const initialFilters = useMemo(() => parseInitialFilters(usp), [usp]);
  const initialLayout = useMemo(() => getLayout(usp, "split"), [usp]);

  return (
    <MapOptionsProvider initialLayout={initialLayout}>
      <SearchProvider initialFilters={initialFilters}>
        <MapPageContent />
      </SearchProvider>
    </MapOptionsProvider>
  );
}

