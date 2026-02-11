"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { LngLat, LngLatBounds } from "mapbox-gl";
import { LngLat as LngLatCtor } from "mapbox-gl";

import type { Cluster } from "@/lib/api/repliers";
import type { PropertyListing } from "@/lib/types";

import { MapOptionsProvider } from "../providers/MapOptionsProvider";
import MapRoot from "./MapRoot";
import MapService from "../services/map/MapService";

export default function StaticPropertyMap({
  properties,
  clusters = [],
  count,
  selectedProperty,
  onPropertySelect,
  initialCenter,
  initialZoom = 12,
  className = "w-full h-full",
}: {
  properties: PropertyListing[];
  clusters?: Cluster[];
  count?: number;
  selectedProperty: PropertyListing | null;
  onPropertySelect: (p: PropertyListing | null) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  className?: string;
}) {
  const [mapLoaded, setMapLoaded] = useState(false);

  const centerLngLat: LngLat = useMemo(() => {
    const c = initialCenter ?? { lat: 43.6532, lng: -79.3832 };
    return new LngLatCtor(c.lng, c.lat);
  }, [initialCenter?.lat, initialCenter?.lng]);

  const [position, setPosition] = useState<{ bounds: LngLatBounds | null; center: LngLat | null; zoom: number }>({
    bounds: null,
    center: centerLngLat,
    zoom: initialZoom,
  });

  const handleMapLoad = useCallback((bounds: LngLatBounds, center: LngLat, zoom: number) => {
    setMapLoaded(true);
    setPosition({ bounds, center, zoom });
  }, []);

  const handleMapMove = useCallback((bounds: LngLatBounds, center: LngLat, zoom: number) => {
    setPosition({ bounds, center, zoom });
  }, []);

  // Update marker/cluster mode based on count.
  useEffect(() => {
    if (!mapLoaded) return;
    MapService.update(properties, clusters, count ?? properties.length);
  }, [mapLoaded, properties, clusters, count]);

  // Show markers/clusters
  useEffect(() => {
    if (!mapLoaded) return;
    MapService.showMarkers({
      properties,
      onClick: (_e, p) => onPropertySelect(p),
      onTap: (p) => onPropertySelect(p),
    });
  }, [mapLoaded, properties, onPropertySelect]);

  useEffect(() => {
    if (!mapLoaded) return;
    MapService.showClusterMarkers({ clusters });
  }, [mapLoaded, clusters]);

  // When selected property changes, nudge map to it.
  useEffect(() => {
    if (!selectedProperty?.map?.latitude || !selectedProperty?.map?.longitude) return;
    const map = MapService.map;
    if (!map) return;
    map.flyTo({
      center: [Number(selectedProperty.map.longitude), Number(selectedProperty.map.latitude)],
      zoom: Math.max(map.getZoom(), 12),
      curve: 1,
    });
  }, [selectedProperty?.mlsNumber]);

  return (
    <MapOptionsProvider initialLayout="map">
      <div className={className}>
        <MapRoot
          zoom={position.zoom}
          center={centerLngLat}
          polygon={null}
          onLoad={handleMapLoad}
          onMove={handleMapMove}
        />
      </div>
    </MapOptionsProvider>
  );
}

