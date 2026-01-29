"use client";

import React, { useCallback, useEffect, useRef } from "react";
import mapboxgl, { Map as MapboxMap, type LngLat, type LngLatBounds } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import MapService from "../services/map/MapService";
import SearchService from "../services/search/SearchService";
import { useMapOptions } from "../providers/MapOptionsProvider";

type MapRootProps = {
  zoom: number;
  center: LngLat | null;
  polygon?: Array<[number, number]> | null;
  onMove: (bounds: LngLatBounds, center: LngLat, zoom: number) => void;
  onLoad: (bounds: LngLatBounds, center: LngLat, zoom: number) => void;
};

const DEFAULT_CENTER: [number, number] = [-79.3832, 43.6532]; // Toronto [lng,lat]
const DEFAULT_ZOOM = 10;

export default function MapRoot({ zoom, center, polygon, onMove, onLoad }: MapRootProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const { setMapRef } = useMapOptions();

  const onLoadRef = useRef(onLoad);
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const onUserInteractionStart = useCallback(() => {
    SearchService.disableRequests();
    MapService.hidePopup();
  }, []);

  const onUserInteractionEnd = useCallback(() => {
    SearchService.enableRequests();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    const initialCenter = center ? ([center.lng, center.lat] as [number, number]) : DEFAULT_CENTER;
    const initialZoom = Number.isFinite(zoom) ? zoom : DEFAULT_ZOOM;

    const map = new MapboxMap({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
    });

    mapRef.current = map;
    setMapRef(map);
    MapService.setMap(map);

    map.on("load", () => {
      const bounds = map.getBounds();
      if (bounds) onLoadRef.current(bounds, map.getCenter(), map.getZoom());
      upsertPolygon(map, polygon);
    });

    map.on("moveend", () => {
      const bounds = map.getBounds();
      if (bounds) onMoveRef.current(bounds, map.getCenter(), map.getZoom());
    });

    map.on("dragstart", onUserInteractionStart);
    map.on("zoomstart", onUserInteractionStart);
    map.on("dragend", onUserInteractionEnd);
    map.on("zoomend", onUserInteractionEnd);
    map.on("click", () => MapService.hidePopup());

    return () => {
      MapService.removeMap();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync polygon overlay when it changes.
  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapRef.current.isStyleLoaded()) return;
    upsertPolygon(mapRef.current, polygon);
  }, [polygon]);

  // Sync center/zoom updates (e.g. from URL or autosuggest)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!center) return;
    map.jumpTo({ center: [center.lng, center.lat], zoom });
  }, [center, zoom]);

  return <div ref={containerRef} className="h-full w-full" />;
}

const POLY_SOURCE_ID = "map-search-polygon";
const POLY_FILL_ID = "map-search-polygon-fill";
const POLY_LINE_ID = "map-search-polygon-line";

function upsertPolygon(map: MapboxMap, polygon?: Array<[number, number]> | null) {
  const hasPolygon = polygon && polygon.length >= 3;
  const feature = hasPolygon
    ? {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [[...polygon, polygon[0]]], // close ring
        },
        properties: {},
      }
    : null;

  const existing = map.getSource(POLY_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;

  if (!hasPolygon) {
    if (existing) {
      // Clear geometry instead of removing source/layers to avoid style races.
      existing.setData({ type: "FeatureCollection", features: [] });
    }
    return;
  }

  const data = { type: "FeatureCollection" as const, features: [feature!] };

  if (!existing) {
    map.addSource(POLY_SOURCE_ID, { type: "geojson", data });

    map.addLayer({
      id: POLY_FILL_ID,
      type: "fill",
      source: POLY_SOURCE_ID,
      paint: {
        "fill-color": "#14B8A6",
        "fill-opacity": 0.15,
      },
    });

    map.addLayer({
      id: POLY_LINE_ID,
      type: "line",
      source: POLY_SOURCE_ID,
      paint: {
        "line-color": "#0F766E",
        "line-width": 2,
      },
    });
  } else {
    existing.setData(data);
  }
}

