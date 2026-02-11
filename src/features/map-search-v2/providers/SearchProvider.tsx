"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

import type { PropertyListing } from "@/lib/types";
import type { Cluster } from "@/lib/api/repliers";
import { DEFAULT_FILTER_STATE, type FilterState } from "@/lib/types/filters";

import SearchService, { type SearchResponse } from "../services/search/SearchService";

type SearchContextValue = {
  loading: boolean;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  polygon: Array<[number, number]> | null;
  setPolygon: React.Dispatch<React.SetStateAction<Array<[number, number]> | null>>;
  clearPolygon: () => void;
  list: PropertyListing[];
  clusters: Cluster[];
  count: number;
  page: number;
  pages: number;
  search: (args: Parameters<typeof SearchService.fetch>[0]) => Promise<SearchResponse | null>;
  save: (resp: SearchResponse) => SearchResponse;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

const EMPTY: Pick<SearchContextValue, "list" | "clusters" | "count" | "page" | "pages"> = {
  list: [],
  clusters: [],
  count: 0,
  page: 1,
  pages: 1,
};

export function SearchProvider({
  children,
  initialFilters,
}: {
  children: React.ReactNode;
  initialFilters?: FilterState;
}) {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters ?? DEFAULT_FILTER_STATE);
  const [polygon, setPolygon] = useState<Array<[number, number]> | null>(null);
  const [saved, setSaved] = useState(EMPTY);

  const setFilter: SearchContextValue["setFilter"] = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const resetFilters = () => setFilters(DEFAULT_FILTER_STATE);
  const clearPolygon = () => setPolygon(null);

  const save = (resp: SearchResponse) => {
    setSaved({
      list: resp.list,
      clusters: resp.clusters,
      count: resp.count,
      page: resp.page,
      pages: resp.pages,
    });
    return resp;
  };

  const search: SearchContextValue["search"] = async (args) => {
    setLoading(true);
    try {
      return await SearchService.fetch(args);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<SearchContextValue>(
    () => ({
      loading,
      filters,
      setFilters,
      setFilter,
      resetFilters,
      polygon,
      setPolygon,
      clearPolygon,
      ...saved,
      search,
      save,
    }),
    [loading, filters, polygon, saved]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}

