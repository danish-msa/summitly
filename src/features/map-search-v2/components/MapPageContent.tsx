"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LngLat, LngLatBounds } from "mapbox-gl";

import PropertyCard from "@/components/Helper/PropertyCard";

import MapService from "../services/map/MapService";
import { useMapOptions, type MapPosition } from "../providers/MapOptionsProvider";
import { useSearch } from "../providers/SearchProvider";
import { buildMapUrl, updateWindowHistory } from "../utils/mapUrl";

import MapFiltersBar from "./MapFiltersBar";
import MapRoot from "./MapRoot";
import MapDrawButton from "./MapDrawButton";

export default function MapPageContent() {
  const searchParams = useSearchParams();
  const [mapLoaded, setMapLoaded] = useState(false);

  const { search, save, filters, polygon, list, clusters, count, loading } = useSearch();
  const { layout, setLayout, position, setPosition } = useMapOptions();

  const query = searchParams?.get("q") ?? null;
  const page = searchParams?.get("page") ?? null;

  const [communities, setCommunities] = useState<string[]>([]);

  const fetchData = async (pos: MapPosition) => {
    const response = await search({
      bounds: pos.bounds,
      polygon,
      zoom: pos.zoom,
      pageNum: page ? Number(page) : 1,
      resultsPerPage: 20,
      status: "A",
      filters,
      city: filters.location !== "all" ? filters.location : null,
    });

    if (!response) return;
    const saved = save(response);
    MapService.update(saved.list, saved.clusters, saved.count);
  };

  const handleMapLoad = (bounds: LngLatBounds, center: LngLat, zoom: number) => {
    setMapLoaded(true);
    setPosition({ bounds, center, zoom });
  };

  const handleMapMove = (bounds: LngLatBounds, center: LngLat, zoom: number) => {
    setPosition({ bounds, center, zoom });
  };

  useEffect(() => {
    if (!mapLoaded) return;
    if (!position.bounds) return;
    fetchData(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, filters, polygon, mapLoaded]);

  // URL sync (center/zoom/layout + filters + q)
  const prevParams = useRef("");
  const curParams = JSON.stringify({
    center: position.center ? { lat: position.center.lat, lng: position.center.lng } : null,
    zoom: position.zoom,
    layout,
    // Only a subset to avoid huge URLs; you can extend this list later.
    filters: {
      location: filters.location,
      community: filters.community,
      propertyType: filters.propertyType,
      listingType: filters.listingType,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      bedrooms: filters.bedrooms,
      bathrooms: filters.bathrooms,
    },
    query,
  });

  useEffect(() => {
    if (!position.center) return;
    if (curParams === prevParams.current) return;
    prevParams.current = curParams;

    const extra: Record<string, string | null> = {
      location: filters.location,
      community: filters.community,
      propertyType: filters.propertyType,
      listingType: filters.listingType,
      minPrice: String(filters.minPrice ?? ""),
      maxPrice: String(filters.maxPrice ?? ""),
      bedrooms: String(filters.bedrooms ?? ""),
      bathrooms: String(filters.bathrooms ?? ""),
    };

    const url = buildMapUrl({
      center: { lat: position.center.lat, lng: position.center.lng },
      zoom: position.zoom,
      layout,
      q: query,
      page: null, // reset page when these change
      extra,
    });
    updateWindowHistory(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curParams]);

  // Keep URL updated when layout changes (preserve page).
  useEffect(() => {
    if (!position.center) return;
    const extra: Record<string, string | null> = {
      location: filters.location,
      community: filters.community,
      propertyType: filters.propertyType,
      listingType: filters.listingType,
      minPrice: String(filters.minPrice ?? ""),
      maxPrice: String(filters.maxPrice ?? ""),
      bedrooms: String(filters.bedrooms ?? ""),
      bathrooms: String(filters.bathrooms ?? ""),
    };

    const url = buildMapUrl({
      center: { lat: position.center.lat, lng: position.center.lng },
      zoom: position.zoom,
      layout,
      q: query,
      page,
      extra,
    });
    updateWindowHistory(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // Drive map rendering from provider state
  useEffect(() => {
    MapService.showMarkers({
      properties: list,
    });
  }, [list]);

  useEffect(() => {
    MapService.showClusterMarkers({ clusters });
  }, [clusters]);

  // Derive communities list for filter dropdown
  useEffect(() => {
    const uniq = Array.from(new Set(list.map((p) => p.address?.neighborhood).filter(Boolean) as string[])).sort();
    setCommunities(uniq);
  }, [list]);

  const resultsLabel = useMemo(() => {
    if (loading) return "Loading…";
    if (!count) return "0 results";
    return `${count.toLocaleString()} results`;
  }, [count, loading]);

  return (
    <div className="h-screen flex flex-col">
      <MapFiltersBar communities={communities} />

      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="text-sm text-gray-700">{resultsLabel}</div>
        <div className="flex border rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setLayout("list")}
            className={`px-3 py-2 text-sm ${layout === "list" ? "bg-primary text-white" : "bg-white text-gray-700"}`}
            aria-label="List view"
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setLayout("split")}
            className={`px-3 py-2 text-sm ${layout === "split" ? "bg-primary text-white" : "bg-white text-gray-700"}`}
            aria-label="Split view"
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setLayout("map")}
            className={`px-3 py-2 text-sm ${layout === "map" ? "bg-primary text-white" : "bg-white text-gray-700"}`}
            aria-label="Map view"
          >
            Map
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {(layout === "list" || layout === "split") && (
          <aside className={`${layout === "split" ? "md:w-1/2" : "w-full"} overflow-y-auto p-4 bg-white`}>
            {list.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {list.map((p) => (
                  <div key={p.mlsNumber}>
                    <PropertyCard property={p} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-600">{loading ? "Loading listings…" : "No results."}</div>
            )}
          </aside>
        )}

        {(layout === "map" || layout === "split") && (
          <section className={`${layout === "split" ? "md:w-1/2" : "w-full"} relative`}>
            <MapRoot zoom={position.zoom} center={position.center} polygon={polygon} onMove={handleMapMove} onLoad={handleMapLoad} />
            <MapDrawButton />
          </section>
        )}
      </div>
    </div>
  );
}

