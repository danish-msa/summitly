/**
 * Resolve agent service area names to real polygon boundaries from GeoJSON.
 * Use this for accurate city/area shapes instead of bounding boxes.
 * Match is by normalized feature name (properties.name or properties.area_name).
 */

import { getPolygonForArea } from "./agentAreaBounds";

export type PolygonRing = Array<[number, number]>;

type GeoJSONPoint = [number, number];
type GeoJSONRing = GeoJSONPoint[];
type GeoJSONPolygon = GeoJSONRing[];
type GeoJSONMultiPolygon = GeoJSONPolygon[];

interface GeoJSONFeature {
  type: "Feature";
  properties?: { name?: string; area_name?: string; [key: string]: unknown };
  geometry: {
    type: "Polygon";
    coordinates: GeoJSONPolygon;
  } | {
    type: "MultiPolygon";
    coordinates: GeoJSONMultiPolygon;
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractRingsFromFeature(feature: GeoJSONFeature): PolygonRing[] {
  const rings: PolygonRing[] = [];
  const { geometry } = feature;
  if (geometry.type === "Polygon") {
    // First ring is exterior
    const ring = geometry.coordinates[0] as GeoJSONRing;
    if (ring.length >= 3) rings.push(ring as PolygonRing);
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      const ring = poly[0] as GeoJSONRing;
      if (ring && ring.length >= 3) rings.push(ring as PolygonRing);
    }
  }
  return rings;
}

/**
 * Build a lookup map from normalized area name to feature.
 */
function buildNameToFeatureMap(collection: GeoJSONFeatureCollection): Map<string, GeoJSONFeature> {
  const map = new Map<string, GeoJSONFeature>();
  for (const f of collection.features) {
    const name = f.properties?.name ?? f.properties?.area_name;
    if (typeof name === "string") {
      map.set(normalizeName(name), f);
    }
  }
  return map;
}

/**
 * Get polygon rings for the given area names from GeoJSON.
 * For each area name: if a matching feature exists, use its geometry; otherwise use bbox fallback from agentAreaBounds.
 */
export function getPolygonsFromGeoJSON(
  collection: GeoJSONFeatureCollection | null,
  areaNames: string[]
): Array<PolygonRing> {
  const nameToFeature = collection ? buildNameToFeatureMap(collection) : null;
  const seen = new Set<string>();
  const polygons: PolygonRing[] = [];

  for (const name of areaNames) {
    const key = normalizeName(name);
    if (seen.has(key)) continue;
    seen.add(key);

    if (nameToFeature) {
      const feature = nameToFeature.get(key);
      if (feature) {
        const rings = extractRingsFromFeature(feature);
        for (const ring of rings) polygons.push(ring);
        continue;
      }
    }

    const bboxPoly = getPolygonForArea(name);
    if (bboxPoly && bboxPoly.length >= 3) polygons.push(bboxPoly);
  }

  return polygons;
}
