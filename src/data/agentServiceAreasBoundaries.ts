/**
 * Real polygon boundaries for agent service areas (GTA/Ontario).
 * Used so the map draws city/area shapes instead of bounding boxes.
 * Add or replace features; match by properties.name (normalized, case-insensitive).
 */
import type { GeoJSONFeatureCollection } from "./agentAreaGeoJSON";

export const agentServiceAreasBoundaries: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Toronto" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.64, 43.58],
            [-79.55, 43.59],
            [-79.42, 43.61],
            [-79.28, 43.65],
            [-79.18, 43.7],
            [-79.12, 43.76],
            [-79.11, 43.8],
            [-79.15, 43.84],
            [-79.22, 43.86],
            [-79.38, 43.87],
            [-79.5, 43.86],
            [-79.58, 43.83],
            [-79.62, 43.78],
            [-79.64, 43.7],
            [-79.64, 43.58],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Brampton" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.78, 43.68],
            [-79.8, 43.71],
            [-79.76, 43.75],
            [-79.65, 43.78],
            [-79.6, 43.75],
            [-79.62, 43.72],
            [-79.68, 43.69],
            [-79.74, 43.68],
            [-79.78, 43.68],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Vaughan" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.6, 43.78],
            [-79.62, 43.82],
            [-79.5, 43.87],
            [-79.42, 43.86],
            [-79.44, 43.83],
            [-79.5, 43.8],
            [-79.56, 43.79],
            [-79.6, 43.78],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Markham" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.4, 43.82],
            [-79.42, 43.86],
            [-79.28, 43.91],
            [-79.25, 43.89],
            [-79.28, 43.85],
            [-79.35, 43.83],
            [-79.38, 43.82],
            [-79.4, 43.82],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Mississauga" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.72, 43.5],
            [-79.68, 43.52],
            [-79.62, 43.54],
            [-79.58, 43.58],
            [-79.55, 43.62],
            [-79.56, 43.64],
            [-79.6, 43.65],
            [-79.66, 43.64],
            [-79.7, 43.6],
            [-79.72, 43.56],
            [-79.72, 43.5],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "North York" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.55, 43.72],
            [-79.48, 43.74],
            [-79.42, 43.78],
            [-79.38, 43.8],
            [-79.35, 43.82],
            [-79.38, 43.81],
            [-79.45, 43.78],
            [-79.52, 43.75],
            [-79.55, 43.72],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Scarborough" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.32, 43.72],
            [-79.28, 43.74],
            [-79.24, 43.76],
            [-79.2, 43.79],
            [-79.18, 43.82],
            [-79.22, 43.81],
            [-79.28, 43.78],
            [-79.3, 43.75],
            [-79.32, 43.72],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Etobicoke" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.62, 43.58],
            [-79.58, 43.62],
            [-79.52, 43.66],
            [-79.48, 43.7],
            [-79.5, 43.69],
            [-79.55, 43.65],
            [-79.58, 43.61],
            [-79.62, 43.58],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Richmond Hill" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.48, 43.85],
            [-79.45, 43.88],
            [-79.4, 43.94],
            [-79.38, 43.95],
            [-79.4, 43.9],
            [-79.44, 43.87],
            [-79.48, 43.85],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Oakville" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.72, 43.38],
            [-79.68, 43.42],
            [-79.62, 43.46],
            [-79.62, 43.48],
            [-79.66, 43.47],
            [-79.7, 43.42],
            [-79.72, 43.38],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Pickering" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.15, 43.8],
            [-79.12, 43.84],
            [-79.02, 43.9],
            [-79.02, 43.92],
            [-79.08, 43.88],
            [-79.12, 43.83],
            [-79.15, 43.8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Ajax" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.08, 43.82],
            [-79.05, 43.86],
            [-78.98, 43.91],
            [-78.98, 43.92],
            [-79.02, 43.88],
            [-79.06, 43.84],
            [-79.08, 43.82],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Whitby" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-78.98, 43.82],
            [-78.95, 43.86],
            [-78.88, 43.9],
            [-78.88, 43.92],
            [-78.92, 43.88],
            [-78.96, 43.84],
            [-78.98, 43.82],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Oshawa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-78.95, 43.82],
            [-78.9, 43.86],
            [-78.82, 43.92],
            [-78.82, 43.95],
            [-78.88, 43.9],
            [-78.92, 43.85],
            [-78.95, 43.82],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Burlington" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.88, 43.28],
            [-79.82, 43.34],
            [-79.72, 43.4],
            [-79.72, 43.42],
            [-79.78, 43.36],
            [-79.84, 43.31],
            [-79.88, 43.28],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Hamilton" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-80.05, 43.18],
            [-79.95, 43.24],
            [-79.82, 43.3],
            [-79.78, 43.32],
            [-79.85, 43.26],
            [-79.98, 43.21],
            [-80.05, 43.18],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Newmarket" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.5, 43.98],
            [-79.46, 44.02],
            [-79.42, 44.06],
            [-79.42, 44.08],
            [-79.46, 44.04],
            [-79.48, 44.0],
            [-79.5, 43.98],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Aurora" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.48, 43.95],
            [-79.44, 43.98],
            [-79.38, 44.01],
            [-79.38, 44.02],
            [-79.42, 43.99],
            [-79.46, 43.96],
            [-79.48, 43.95],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Milton" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.95, 43.48],
            [-79.9, 43.52],
            [-79.82, 43.56],
            [-79.82, 43.58],
            [-79.88, 43.54],
            [-79.92, 43.51],
            [-79.95, 43.48],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "East York" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.32, 43.68],
            [-79.28, 43.7],
            [-79.28, 43.72],
            [-79.32, 43.7],
            [-79.32, 43.68],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "York" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-79.48, 43.68],
            [-79.42, 43.7],
            [-79.42, 43.72],
            [-79.48, 43.7],
            [-79.48, 43.68],
          ],
        ],
      },
    },
  ],
};
