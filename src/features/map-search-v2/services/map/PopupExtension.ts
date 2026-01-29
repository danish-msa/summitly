"use client";

import React from "react";
import type { Map, Marker } from "mapbox-gl";
import { Popup } from "mapbox-gl";
import { createRoot, type Root } from "react-dom/client";

import type { PropertyListing } from "@/lib/types";

import PopupCard from "./PopupCard";

export class PopupExtension {
  private popup: Popup | null = null;
  private root: Root | null = null;

  removePopup(): void {
    try {
      this.root?.unmount();
    } catch {
      // ignore
    }
    this.root = null;
    this.popup?.remove();
    this.popup = null;
  }

  showPopup(property: PropertyListing, marker: Marker, map: Map): void {
    this.removePopup();

    const container = document.createElement("div");
    this.root = createRoot(container);
    this.root.render(React.createElement(PopupCard, { property }));

    this.popup = new Popup({
      offset: 26,
      closeButton: false,
      closeOnMove: true,
      maxWidth: "280px",
      className: "summitly-popup",
    })
      .setLngLat(marker.getLngLat())
      .setDOMContent(container)
      .addTo(map);
  }
}

const popupExtensionInstance = new PopupExtension();
export default popupExtensionInstance;

