"use client";

import type { MouseEvent } from "react";
import type { Map, Marker } from "mapbox-gl";

import type { Cluster } from "@/lib/api/repliers";
import type { PropertyListing } from "@/lib/types";

import { MAP_CONSTANTS } from "./constants";
import MarkerExtension from "./MarkerExtension";
import PopupExtension from "./PopupExtension";

export enum MapDataMode {
  SINGLE_MARKER = "single",
  CLUSTER = "cluster",
}

export class MapService {
  private sharedMap: Map | null = null;

  dataMode: MapDataMode = MapDataMode.SINGLE_MARKER;

  markerExtension = MarkerExtension;
  popupExtension = PopupExtension;

  setMap(map: Map): void {
    this.sharedMap = map;
  }

  removeMap(): void {
    this.sharedMap?.remove();
    this.sharedMap = null;
    this.markerExtension.resetMarkers();
    this.markerExtension.resetClusters();
    this.popupExtension.removePopup();
  }

  get map(): Map | null {
    return this.sharedMap;
  }

  settleDataMode(count: number): void {
    this.dataMode =
      count > MAP_CONSTANTS.API_COUNT_TO_ENABLE_CLUSTERING ? MapDataMode.CLUSTER : MapDataMode.SINGLE_MARKER;
  }

  pinsZoomLevel(): boolean {
    if (!this.map) return false;
    return this.map.getZoom() >= MAP_CONSTANTS.MIN_ZOOM_FOR_MARKERS;
  }

  update(list: PropertyListing[], clusters: Cluster[], count: number): void {
    this.settleDataMode(count);

    if (!count) {
      this.markerExtension.resetMarkers();
      this.markerExtension.resetClusters();
      return;
    }

    if (this.dataMode === MapDataMode.CLUSTER) {
      this.markerExtension.resetMarkers();
      // clusters are updated via showClusterMarkers effect
    } else {
      this.markerExtension.resetClusters();
      // markers are updated via showMarkers effect
    }
  }

  showMarkers(args: {
    properties: PropertyListing[];
    onClick?: (e: MouseEvent, property: PropertyListing) => void;
    onTap?: (property: PropertyListing) => void;
  }): void {
    if (!this.map || !this.pinsZoomLevel() || this.dataMode !== MapDataMode.SINGLE_MARKER) return;
    this.markerExtension.showMarkers({ map: this.map, ...args });
  }

  showClusterMarkers(args: { clusters: Cluster[] }): void {
    if (!this.map || !this.pinsZoomLevel() || this.dataMode !== MapDataMode.CLUSTER) return;
    this.markerExtension.showClusterMarkers({ map: this.map, clusters: args.clusters });
  }

  getMarker(mlsNumber: string): Marker | undefined {
    return this.markerExtension.markers[mlsNumber];
  }

  hidePopup(): void {
    this.popupExtension.removePopup();
  }
}

const mapServiceInstance = new MapService();
export default mapServiceInstance;

