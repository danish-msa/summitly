"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PropertyListing } from "@/lib/types";
import type { Location } from "@/lib/api/repliers/services/locations";
import { getRouteSuggestions, type RouteSuggestion } from "@/lib/search/routeSuggestions";

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;
const ROUTE_SUGGESTIONS_LIMIT = 6;

export interface AutocompleteSearchResult {
  listings: PropertyListing[];
  count: number;
  locations: Location[];
  routeSuggestions: RouteSuggestion[];
}

export function useAutocompleteSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [count, setCount] = useState(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LENGTH) {
      setListings([]);
      setCount(0);
      setLocations([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/autocomplete-search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Search failed");
        setListings([]);
        setLocations([]);
        setCount(0);
        return;
      }

      setListings(data.listings ?? []);
      setCount(data.count ?? 0);
      setLocations(data.locations ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Autocomplete search failed";
      setError(message);
      setListings([]);
      setLocations([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  // Route suggestions (buy/rent/pre-con) from current query – sync, no debounce
  const routeSuggestions = useMemo(
    () =>
      getRouteSuggestions(query, {
        limit: ROUTE_SUGGESTIONS_LIMIT,
        includePopularWhenShort: true,
      }),
    [query]
  );

  return {
    query,
    setQuery,
    listings,
    count,
    locations,
    routeSuggestions,
    loading,
    error,
    hasResults:
      (listings.length > 0 || locations.length > 0 || routeSuggestions.length > 0) &&
      (query.length >= 1 || debouncedQuery.length >= MIN_QUERY_LENGTH),
    minQueryLength: MIN_QUERY_LENGTH,
  };
}
