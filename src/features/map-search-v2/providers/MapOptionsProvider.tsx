"use client";

import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LngLat, LngLatBounds, Map as MapboxMap } from "mapbox-gl";

import { getCenter, getLayout, getZoom, type MapLayout } from "../utils/mapUrl";

export type MapPosition = {
  center: LngLat | null;
  bounds: LngLatBounds | null;
  zoom: number;
};

type MapOptionsContextValue = {
  position: MapPosition;
  setPosition: (pos: MapPosition) => void;
  layout: MapLayout;
  setLayout: (layout: MapLayout) => void;
  mapRef: React.MutableRefObject<MapboxMap | null>;
  setMapRef: (map: MapboxMap) => void;
};

const MapOptionsContext = createContext<MapOptionsContextValue | undefined>(undefined);

export function MapOptionsProvider({
  children,
  initialLayout = "split",
}: {
  children: React.ReactNode;
  initialLayout?: MapLayout;
}) {
  const searchParams = useSearchParams();
  const mapRef = useRef<MapboxMap | null>(null);

  const initial = useMemo(() => {
    const usp = new URLSearchParams(searchParams?.toString() ?? "");
    const center = getCenter(usp);
    const zoom = getZoom(usp, 10);
    const layout = getLayout(usp, initialLayout);
    return { center, zoom, layout };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [layout, setLayout] = useState<MapLayout>(initial.layout);
  const [position, setPosition] = useState<MapPosition>({
    center: initial.center ? ({ lat: initial.center.lat, lng: initial.center.lng } as LngLat) : null,
    bounds: null,
    zoom: initial.zoom,
  });

  const value = useMemo<MapOptionsContextValue>(
    () => ({
      position,
      setPosition,
      layout,
      setLayout,
      mapRef,
      setMapRef: (map: MapboxMap) => {
        mapRef.current = map;
      },
    }),
    [position, layout]
  );

  return <MapOptionsContext.Provider value={value}>{children}</MapOptionsContext.Provider>;
}

export function useMapOptions(): MapOptionsContextValue {
  const ctx = useContext(MapOptionsContext);
  if (!ctx) throw new Error("useMapOptions must be used within MapOptionsProvider");
  return ctx;
}

