"use client";

import React, { useEffect, useRef, useState } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { Pencil, PencilOff, X } from "lucide-react";

import { useMapOptions } from "../providers/MapOptionsProvider";
import { useSearch } from "../providers/SearchProvider";

import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

type EditMode = "draw" | null;

export default function MapDrawButton() {
  const { mapRef } = useMapOptions();
  const { polygon, setPolygon, clearPolygon } = useSearch();

  const [editMode, setEditMode] = useState<EditMode>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const map = mapRef.current;

  const updatePolygonFromDraw = () => {
    const data = drawRef.current?.getAll()?.features;
    if (!data?.length) return;
    const feature = data[0];
    if (feature.geometry.type !== "Polygon") return;
    const coords = feature.geometry.coordinates?.[0] as Array<[number, number]> | undefined;
    if (!coords || coords.length < 3) return;
    // Remove the last coordinate if it closes the ring.
    const cleaned = coords.length >= 2 && coords[0][0] === coords.at(-1)?.[0] && coords[0][1] === coords.at(-1)?.[1]
      ? coords.slice(0, -1)
      : coords;
    setPolygon(cleaned);
  };

  useEffect(() => {
    if (!map) return;

    if (editMode === "draw") {
      if (!drawRef.current) {
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          defaultMode: "draw_polygon",
          controls: { polygon: false, trash: false },
        });
        drawRef.current = draw;
        map.addControl(draw);

        map.on("draw.create", updatePolygonFromDraw);
        map.on("draw.update", updatePolygonFromDraw);
        map.on("draw.delete", () => setPolygon(null));
      } else {
        // If draw already exists, ensure we're in draw mode.
        drawRef.current.changeMode("draw_polygon");
      }
    } else {
      if (drawRef.current) {
        map.off("draw.create", updatePolygonFromDraw);
        map.off("draw.update", updatePolygonFromDraw);
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    }

    return () => {
      if (!map) return;
      if (drawRef.current) {
        map.off("draw.create", updatePolygonFromDraw);
        map.off("draw.update", updatePolygonFromDraw);
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, editMode]);

  const toggleDraw = () => {
    if (editMode === "draw") {
      setEditMode(null);
    } else {
      // Start fresh to match the other project's behavior.
      clearPolygon();
      setEditMode("draw");
    }
  };

  const clear = () => {
    clearPolygon();
    setEditMode(null);
    if (drawRef.current) {
      drawRef.current.deleteAll();
    }
  };

  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
      <button
        type="button"
        onClick={toggleDraw}
        className={`h-10 w-10 rounded-lg shadow-md border border-white/60 backdrop-blur bg-white/80 flex items-center justify-center ${
          editMode === "draw" ? "ring-2 ring-primary" : ""
        }`}
        aria-label={editMode === "draw" ? "Exit draw mode" : "Draw polygon"}
        title={editMode === "draw" ? "Exit draw mode" : "Draw polygon"}
      >
        {editMode === "draw" ? <PencilOff className="h-5 w-5 text-primary" /> : <Pencil className="h-5 w-5 text-primary" />}
      </button>

      {polygon && polygon.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="h-10 w-10 rounded-lg shadow-md border border-white/60 backdrop-blur bg-white/80 flex items-center justify-center"
          aria-label="Clear polygon"
          title="Clear polygon"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
      )}
    </div>
  );
}

