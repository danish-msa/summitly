"use client";

import type { MouseEvent } from "react";
import type { Map } from "mapbox-gl";
import { Marker, type LngLatBoundsLike } from "mapbox-gl";

import type { Cluster } from "@/lib/api/repliers";
import type { PropertyListing } from "@/lib/types";
import { getPropertyUrl } from "@/lib/utils/propertyUrl";

import { MAP_CONSTANTS } from "./constants";
import PopupExtension from "./PopupExtension";
import { createMarkerElement } from "./createMarkerElement";

type Markers = Record<string, Marker>;

export class MarkerExtension {
  markers: Markers = {};
  clusterMarkers: Markers = {};

  resetMarkers(): void {
    Object.values(this.markers).forEach((m) => m.remove());
    this.markers = {};
  }

  resetClusters(): void {
    Object.values(this.clusterMarkers).forEach((m) => m.remove());
    this.clusterMarkers = {};
  }

  showMarkers(args: {
    map: Map;
    properties: PropertyListing[];
    onClick?: (e: MouseEvent, property: PropertyListing) => void;
    onTap?: (property: PropertyListing) => void;
  }): void {
    const { map, properties } = args;
    const nextKeys = new Set(properties.map((p) => p.mlsNumber));

    // Remove stale markers.
    Object.keys(this.markers).forEach((key) => {
      if (!nextKeys.has(key)) {
        this.markers[key].remove();
        delete this.markers[key];
      }
    });

    properties.forEach((property) => {
      const mlsNumber = property.mlsNumber;
      if (!mlsNumber) return;
      const lat = property.map?.latitude;
      const lng = property.map?.longitude;
      if (lat == null || lng == null) return;
      if (this.markers[mlsNumber]) return;

      const label = formatMarkerLabel(property);
      const href = getPropertyUrl(property);

      const el = createMarkerElement({
        id: `m-${mlsNumber}`,
        label,
        href,
        size: "single",
        onClick: (e) => args.onClick?.(e, property),
        onTap: () => args.onTap?.(property),
      });

      const marker = new Marker(el).setLngLat([Number(lng), Number(lat)]).addTo(map);
      el.addEventListener("mouseenter", () => PopupExtension.showPopup(property, marker, map));
      el.addEventListener("mouseleave", () => PopupExtension.removePopup());
      this.markers[mlsNumber] = marker;
    });
  }

  showClusterMarkers(args: { map: Map; clusters: Cluster[] }): void {
    const { map, clusters } = args;
    const nextKeys = new Set(clusters.map((c) => clusterKey(c)));

    Object.keys(this.clusterMarkers).forEach((key) => {
      if (!nextKeys.has(key)) {
        this.clusterMarkers[key].remove();
        delete this.clusterMarkers[key];
      }
    });

    clusters.forEach((cluster) => {
      const key = clusterKey(cluster);
      if (this.clusterMarkers[key]) return;

      const center = [cluster.location.longitude, cluster.location.latitude] as [number, number];

      const diff = cluster.bounds.bottom_right.longitude - cluster.bounds.top_left.longitude;
      const buffer = diff * MAP_CONSTANTS.ZOOM_TO_MARKER_BUFFER;

      const bounds: LngLatBoundsLike = [
        [cluster.bounds.top_left.longitude - buffer, cluster.bounds.bottom_right.latitude - buffer],
        [cluster.bounds.bottom_right.longitude + buffer, cluster.bounds.top_left.latitude + buffer],
      ];

      const el = createMarkerElement({
        id: key,
        label: String(cluster.count),
        size: "cluster",
        onClick: (e) => {
          map.fitBounds(bounds, { padding: 48, duration: 450 });
          e.preventDefault();
        },
      });

      const marker = new Marker(el).setLngLat(center).addTo(map);
      this.clusterMarkers[key] = marker;
    });
  }
}

function formatMarkerLabel(p: PropertyListing): string {
  const price = Number(p.listPrice || 0);
  if (!Number.isFinite(price) || price <= 0) return "View";
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(price / 1_000)}K`;
}

function clusterKey(cluster: Cluster): string {
  return `c-${cluster.count}-lat-${cluster.location.latitude}-lng-${cluster.location.longitude}`;
}

const markerExtensionInstance = new MarkerExtension();
export default markerExtensionInstance;

