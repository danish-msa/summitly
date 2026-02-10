"use client";

import React, { useCallback, useEffect, useRef } from "react";
import mapboxgl, { Map as MapboxMap, Marker, NavigationControl } from "mapbox-gl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FLY_AROUND } from "./constants";
import { startOrbit } from "./orbitRunner";
import "mapbox-gl/dist/mapbox-gl.css";

const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

const ORBIT_START_DELAY_MS = 400;
const FLY_IN_DURATION_MS = 1800;
const ORBIT_RESTART_AFTER_IDLE_MS = 10_000;

function createPinElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "fly-around-pin";
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="40" height="40" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="hsl(var(--primary))"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `;
  el.style.cursor = "default";
  return el;
}

export interface FlyAroundViewProps {
  latitude: number;
  longitude: number;
  address?: string;
  onClose: () => void;
}

export function FlyAroundView({ latitude, longitude, address, onClose }: FlyAroundViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const stopOrbitRef = useRef<(() => void) | null>(null);
  const orbitStoppedRef = useRef(true);
  const orbitStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orbitRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const center: [number, number] = [longitude, latitude];

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!containerRef.current || !mapboxAccessToken) return;

    const c = center;
    mapboxgl.accessToken = mapboxAccessToken;

    const map = new MapboxMap({
      container: containerRef.current,
      style: FLY_AROUND.MAP_STYLE,
      center: c,
      zoom: FLY_AROUND.ZOOM,
      pitch: FLY_AROUND.PITCH,
      bearing: 0,
      attributionControl: true,
    });

    mapRef.current = map;
    const container = map.getContainer();

    function stopOrbit() {
      orbitStoppedRef.current = true;
      stopOrbitRef.current?.();
      stopOrbitRef.current = null;
    }

    function scheduleRestart() {
      if (orbitRestartTimeoutRef.current) {
        clearTimeout(orbitRestartTimeoutRef.current);
        orbitRestartTimeoutRef.current = null;
      }
      orbitRestartTimeoutRef.current = setTimeout(() => {
        orbitRestartTimeoutRef.current = null;
        if (!mapRef.current) return;
        orbitStoppedRef.current = false;
        stopOrbitRef.current = startOrbit(mapRef.current, {
          center: c,
          zoom: FLY_AROUND.ZOOM,
          pitch: FLY_AROUND.PITCH,
          orbitDurationMs: FLY_AROUND.ORBIT_DURATION_MS,
          getStopped: () => orbitStoppedRef.current,
        });
      }, ORBIT_RESTART_AFTER_IDLE_MS);
    }

    function onInteraction() {
      stopOrbit();
      scheduleRestart();
    }

    // Only stop orbit on actual user input (click/touch). Do NOT use map events
    // (dragstart, zoomstart, rotatestart) – they fire when we programmatically
    // call jumpTo() in the orbit loop and would stop the orbit immediately.
    container.addEventListener("pointerdown", onInteraction, true);
    container.addEventListener("touchstart", onInteraction, true);

    map.addControl(new NavigationControl({ showCompass: true, showZoom: false }), "top-right");

    map.on("load", () => {
      try {
        if (!map.getSource("mapbox-dem")) {
          map.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          });
        }
        map.setTerrain({
          source: "mapbox-dem",
          exaggeration: FLY_AROUND.TERRAIN_EXAGGERATION,
        });
      } catch {
        // ignore
      }

      try {
        if (map.setFog) {
          map.setFog({
            range: [0.5, 12],
            "horizon-blend": 0.15,
            color: "rgb(186, 210, 235)",
          });
        }
      } catch {
        // ignore
      }

      const marker = new Marker({ element: createPinElement(), anchor: "bottom" })
        .setLngLat(c)
        .addTo(map);
      markerRef.current = marker;

      // Start view a bit higher and flatter, then “fly in” to the 3D angle
      map.jumpTo({
        center: c,
        zoom: 16,
        pitch: 48,
        bearing: 0,
      });

      orbitStartTimeoutRef.current = setTimeout(() => {
        orbitStartTimeoutRef.current = null;
        if (!mapRef.current) return;

        const startOrbitAfterFlyIn = () => {
          if (!mapRef.current) return;
          orbitStoppedRef.current = false;
          stopOrbitRef.current = startOrbit(map, {
            center: c,
            zoom: FLY_AROUND.ZOOM,
            pitch: FLY_AROUND.PITCH,
            orbitDurationMs: FLY_AROUND.ORBIT_DURATION_MS,
            getStopped: () => orbitStoppedRef.current,
          });
        };

        map.once("moveend", startOrbitAfterFlyIn);
        map.easeTo({
          center: c,
          zoom: FLY_AROUND.ZOOM,
          pitch: FLY_AROUND.PITCH,
          bearing: 0,
          duration: FLY_IN_DURATION_MS,
        });
      }, ORBIT_START_DELAY_MS);
    });

    return () => {
      if (orbitStartTimeoutRef.current) {
        clearTimeout(orbitStartTimeoutRef.current);
        orbitStartTimeoutRef.current = null;
      }
      if (orbitRestartTimeoutRef.current) {
        clearTimeout(orbitRestartTimeoutRef.current);
        orbitRestartTimeoutRef.current = null;
      }
      orbitStoppedRef.current = true;
      stopOrbitRef.current?.();
      stopOrbitRef.current = null;
      container.removeEventListener("pointerdown", onInteraction, true);
      container.removeEventListener("touchstart", onInteraction, true);
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  if (!mapboxAccessToken) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Mapbox token not configured.</p>
        <Button variant="outline" onClick={handleClose} className="ml-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Fly around map view"
    >
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-4 bg-background/90 px-4 py-3 shadow-sm backdrop-blur-sm">
        <p className="truncate text-sm font-medium text-foreground">
          {address ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="shrink-0"
          aria-label="Close fly around view"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="h-full w-full pt-12" ref={containerRef} />
    </div>
  );
}
