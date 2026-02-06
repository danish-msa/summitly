"use client";

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PreConstructionProperty } from "@/components/PreCon/PropertyCards/types";
import PreConPopupCard from "./PreConPopupCard";

const DEFAULT_CENTER: [number, number] = [-79.3832, 43.6532];
const DEFAULT_ZOOM = 10;
const MIN_ZOOM = 8;
const MAX_ZOOM = 18;

function formatPriceLabel(price: number | null): string {
  if (price == null || !Number.isFinite(price) || price <= 0) return "View";
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(price / 1_000)}K`;
}

function createPreConMarkerElement(args: {
  id: string;
  label: string;
  href: string;
  isSelected: boolean;
  onClick: (e: mapboxgl.MapMouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}): HTMLAnchorElement {
  const el = document.createElement("a");
  el.id = args.id;
  el.href = args.href;
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `Pre-construction project ${args.label}`);
  el.className =
    "select-none cursor-pointer no-underline shadow-md hover:shadow-lg " +
    "border font-semibold text-xs leading-none " +
    "focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 " +
    (args.isSelected
      ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2"
      : "bg-white text-gray-900 border-white/70 rounded-lg px-2.5 py-1.5");
  el.style.textDecoration = "none";
  el.innerText = args.label;
  el.addEventListener("click", (ev) => {
    ev.preventDefault();
    args.onClick(ev as unknown as mapboxgl.MapMouseEvent);
  });
  if (args.onMouseEnter) el.addEventListener("mouseenter", args.onMouseEnter);
  if (args.onMouseLeave) el.addEventListener("mouseleave", args.onMouseLeave);
  return el;
}

interface PreConMapProps {
  projects: PreConstructionProperty[];
  selectedProject: PreConstructionProperty | null;
  onProjectSelect: (project: PreConstructionProperty) => void;
  initialZoom?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Standalone map for pre-construction projects. Uses mapbox-gl directly and does
 * not use MapService, so it does not affect the Repliers/properties map setup.
 * Shows a simple price-tag marker per project (no clusters).
 */
export function PreConMap({
  projects,
  selectedProject,
  onProjectSelect,
  initialZoom = DEFAULT_ZOOM,
  className = "w-full h-full",
  style,
}: PreConMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const popupRootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  const removePopup = useCallback(() => {
    try {
      popupRootRef.current?.unmount();
    } catch {
      // ignore
    }
    popupRootRef.current = null;
    popupRef.current?.remove();
    popupRef.current = null;
  }, []);

  const showPopup = useCallback(
    (project: PreConstructionProperty, marker: mapboxgl.Marker) => {
      const map = mapRef.current;
      if (!map) return;
      removePopup();
      const container = document.createElement("div");
      const root = createRoot(container);
      popupRootRef.current = root;
      root.render(React.createElement(PreConPopupCard, { project }));
      const popup = new mapboxgl.Popup({
        offset: 26,
        closeButton: false,
        closeOnMove: true,
        maxWidth: "280px",
        className: "summitly-popup",
      })
        .setLngLat(marker.getLngLat())
        .setDOMContent(container)
        .addTo(map);
      popupRef.current = popup;
    },
    [removePopup]
  );

  const projectsWithCoords = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.address?.latitude != null &&
          p.address?.longitude != null &&
          Number.isFinite(p.address.latitude) &&
          Number.isFinite(p.address.longitude)
      ),
    [projects]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: initialZoom,
      attributionControl: false,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
    });

    mapRef.current = map;
    map.on("load", () => setMapLoaded(true));

    return () => {
      setMapLoaded(false);
      removePopup();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [initialZoom, removePopup]);

  // Fit bounds when the project list changes (e.g. filters), not when selection changes
  const projectIdsKey = projectsWithCoords.map((p) => p.id).join(",");
  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map || projectsWithCoords.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    projectsWithCoords.forEach((p) => {
      bounds.extend([Number(p.address!.longitude), Number(p.address!.latitude)]);
    });
    try {
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
    } catch {
      // ignore
    }
  }, [mapLoaded, projectIdsKey]);

  // Update markers when projects or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    projectsWithCoords.forEach((project) => {
      const lat = Number(project.address!.latitude);
      const lng = Number(project.address!.longitude);
      const label = formatPriceLabel(project.startingPrice ?? null);
      const href = `/pre-con/${project.id}`;
      const isSelected = selectedProject?.id === project.id;

      const el = createPreConMarkerElement({
        id: `precon-m-${project.id}`,
        label,
        href,
        isSelected,
        onClick: () => onProjectSelect(project),
        onMouseLeave: () => removePopup(),
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
      el.addEventListener("mouseenter", () => showPopup(project, marker));
      markersRef.current.push(marker);
    });
  }, [mapLoaded, projectsWithCoords, selectedProject?.id, onProjectSelect, showPopup, removePopup]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map || !selectedProject?.address?.latitude || !selectedProject?.address?.longitude) return;
    map.flyTo({
      center: [
        Number(selectedProject.address.longitude),
        Number(selectedProject.address.latitude),
      ],
      zoom: Math.max(map.getZoom(), 12),
      curve: 1,
    });
  }, [mapLoaded, selectedProject?.id, selectedProject?.address?.latitude, selectedProject?.address?.longitude]);

  return <div ref={containerRef} className={className} style={style} />;
}
