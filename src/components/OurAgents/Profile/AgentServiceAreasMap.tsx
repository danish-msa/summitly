"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import mapboxgl, { LngLatBounds } from "mapbox-gl";

import { MapOptionsProvider, useMapOptions } from "@/features/map-search-v2/providers/MapOptionsProvider";
import MapRoot from "@/features/map-search-v2/components/MapRoot";
import MapService from "@/features/map-search-v2/services/map/MapService";
import SearchService, { type SearchResponse } from "@/features/map-search-v2/services/search/SearchService";
import { getPolygonsForAreas, getBoundsForPolygons } from "@/data/agentAreaBounds";
import { DEFAULT_FILTER_STATE } from "@/lib/types/filters";
import type { AgentServiceArea } from "@prisma/client";

const DEFAULT_CENTER = { lng: -79.3832, lat: 43.6532 };
const DEFAULT_ZOOM = 9;

function AgentServiceAreasMapInner({
  areaPolygons,
  combinedBounds,
  onLoad,
}: {
  areaPolygons: Array<Array<[number, number]>>;
  combinedBounds: { west: number; south: number; east: number; north: number };
  onLoad: () => void;
}) {
  const { mapRef } = useMapOptions();
  const [mapReady, setMapReady] = useState(false);

  const center = useMemo(
    () =>
      new mapboxgl.LngLat(
        (combinedBounds.west + combinedBounds.east) / 2,
        (combinedBounds.south + combinedBounds.north) / 2
      ),
    [combinedBounds]
  );

  const handleMapLoad = useCallback(
    (_bounds: mapboxgl.LngLatBounds, _center: mapboxgl.LngLat, _zoom: number) => {
      onLoad();
      setMapReady(true);
    },
    [onLoad]
  );

  const handleMapMove = useCallback(
    (_bounds: mapboxgl.LngLatBounds, _center: mapboxgl.LngLat, _zoom: number) => {},
    []
  );

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const b = new LngLatBounds(
      [combinedBounds.west, combinedBounds.south],
      [combinedBounds.east, combinedBounds.north]
    );
    map.fitBounds(b, { padding: 48, maxZoom: 14, duration: 0 });
  }, [mapReady, combinedBounds]);

  return (
    <MapRoot
      zoom={DEFAULT_ZOOM}
      center={center}
      polygon={null}
      areaPolygons={areaPolygons}
      onLoad={handleMapLoad}
      onMove={handleMapMove}
    />
  );
}

export interface AgentServiceAreasMapProps {
  serviceAreas: Pick<AgentServiceArea, "area_name">[];
  className?: string;
}

export function AgentServiceAreasMap({
  serviceAreas,
  className = "",
}: AgentServiceAreasMapProps) {
  const areaNames = useMemo(
    () => serviceAreas.map((a) => a.area_name),
    [serviceAreas]
  );
  const areaPolygons = useMemo(
    () => getPolygonsForAreas(areaNames),
    [areaNames]
  );
  const combinedBounds = useMemo(
    () => getBoundsForPolygons(areaPolygons),
    [areaPolygons]
  );

  const [listings, setListings] = useState<SearchResponse["list"]>([]);
  const [clusters, setClusters] = useState<SearchResponse["clusters"]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleMapLoad = useCallback(() => {
    if (!combinedBounds) return;
    setLoading(true);
    const bounds = new LngLatBounds(
      [combinedBounds.west, combinedBounds.south],
      [combinedBounds.east, combinedBounds.north]
    );
    SearchService.fetch({
      bounds,
      polygon: null,
      zoom: DEFAULT_ZOOM,
      pageNum: 1,
      resultsPerPage: 50,
      status: "A",
      filters: DEFAULT_FILTER_STATE,
    }).then((res) => {
      if (!res) {
        setLoading(false);
        return;
      }
      setListings(res.list);
      setClusters(res.clusters);
      setCount(res.count);
      MapService.update(res.list, res.clusters, res.count);
      MapService.showMarkers({
        properties: res.list,
        onClick: () => {},
        onTap: () => {},
      });
      setLoading(false);
    });
  }, [combinedBounds]);

  if (areaPolygons.length === 0 || !combinedBounds) return null;

  return (
    <div className={className}>
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        Service areas
      </h2>
      <p className="text-muted-foreground text-sm mb-4">
        Areas this agent serves. Properties shown within these boundaries.
      </p>
      <div className="relative rounded-xl overflow-hidden border border-border bg-card shadow-sm h-[400px] sm:h-[450px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        <MapOptionsProvider initialLayout="map">
          <AgentServiceAreasMapInner
            areaPolygons={areaPolygons}
            combinedBounds={combinedBounds}
            onLoad={handleMapLoad}
          />
        </MapOptionsProvider>
      </div>
    </div>
  );
}
