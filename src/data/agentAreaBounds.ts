/**
 * Approximate bounding boxes for Ontario cities/areas (used for agent service area map).
 * Each value is [west, south, east, north] in lng/lat; converted to polygon ring [lng,lat][].
 */
const RAW_BOUNDS: Record<string, [number, number, number, number]> = {
  toronto: [-79.64, 43.58, -79.11, 43.85],
  "north york": [-79.55, 43.72, -79.35, 43.82],
  mississauga: [-79.72, 43.50, -79.55, 43.65],
  brampton: [-79.80, 43.68, -79.60, 43.78],
  oakville: [-79.72, 43.38, -79.62, 43.48],
  pickering: [-79.15, 43.80, -79.02, 43.92],
  ajax: [-79.08, 43.82, -78.98, 43.92],
  whitby: [-78.98, 43.82, -78.88, 43.92],
  oshawa: [-78.95, 43.82, -78.82, 43.95],
  burlington: [-79.88, 43.28, -79.72, 43.42],
  hamilton: [-80.05, 43.18, -79.78, 43.32],
  vaughan: [-79.62, 43.78, -79.42, 43.88],
  markham: [-79.42, 43.82, -79.25, 43.92],
  "richmond hill": [-79.48, 43.85, -79.38, 43.95],
  newmarket: [-79.50, 43.98, -79.42, 44.08],
  aurora: [-79.48, 43.95, -79.38, 44.02],
  "king city": [-79.55, 43.92, -79.45, 44.02],
  georgetown: [-79.95, 43.62, -79.82, 43.72],
  milton: [-79.95, 43.48, -79.82, 43.58],
  etobicoke: [-79.62, 43.58, -79.48, 43.72],
  scarborough: [-79.32, 43.72, -79.18, 43.82],
  "east york": [-79.32, 43.68, -79.28, 43.72],
  york: [-79.48, 43.68, -79.42, 43.72],
  "niagara falls": [-79.12, 43.05, -78.95, 43.15],
  "st catharines": [-79.32, 43.12, -79.18, 43.22],
  kitchener: [-80.55, 43.38, -80.42, 43.48],
  waterloo: [-80.58, 43.42, -80.48, 43.52],
  cambridge: [-80.38, 43.32, -80.28, 43.42],
  guelph: [-80.32, 43.50, -80.22, 43.58],
  barrie: [-79.72, 44.35, -79.62, 44.42],
  orillia: [-79.45, 44.58, -79.38, 44.65],
  peterborough: [-78.38, 44.25, -78.25, 44.35],
  london: [-81.32, 42.95, -81.18, 43.05],
  windsor: [-83.08, 42.25, -82.95, 42.35],
};

function toPolygon(bbox: [number, number, number, number]): Array<[number, number]> {
  const [west, south, east, north] = bbox;
  return [
    [west, south],
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ];
}

function normalizeAreaName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getPolygonForArea(areaName: string): Array<[number, number]> | null {
  const key = normalizeAreaName(areaName);
  const bbox = RAW_BOUNDS[key];
  if (!bbox) return null;
  return toPolygon(bbox);
}

export function getPolygonsForAreas(areaNames: string[]): Array<Array<[number, number]>> {
  const seen = new Set<string>();
  const polygons: Array<Array<[number, number]>> = [];
  for (const name of areaNames) {
    const key = normalizeAreaName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    const poly = getPolygonForArea(name);
    if (poly && poly.length >= 3) polygons.push(poly);
  }
  return polygons;
}

export function getBoundsForPolygons(polygons: Array<Array<[number, number]>>): {
  west: number;
  south: number;
  east: number;
  north: number;
} | null {
  if (polygons.length === 0) return null;
  let west = Infinity,
    south = Infinity,
    east = -Infinity,
    north = -Infinity;
  for (const ring of polygons) {
    for (const [lng, lat] of ring) {
      west = Math.min(west, lng);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      north = Math.max(north, lat);
    }
  }
  if (west === Infinity) return null;
  return { west, south, east, north };
}
