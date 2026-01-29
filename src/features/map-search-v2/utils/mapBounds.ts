import type { LngLatBounds } from 'mapbox-gl';
import type { MapBounds } from '@/lib/api/repliers';

export function toMapBounds(bounds: LngLatBounds): MapBounds {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    north: ne.lat,
    south: sw.lat,
    east: ne.lng,
    west: sw.lng,
  };
}

// Repliers expects the `map` query param as a string that looks like:
// `[[[lng,lat],[lng,lat],[lng,lat],[lng,lat],[lng,lat]]]`
export function toRectangleString(bounds: MapBounds): string {
  const ring: Array<[number, number]> = [
    [bounds.east, bounds.north], // NE
    [bounds.west, bounds.north], // NW
    [bounds.west, bounds.south], // SW
    [bounds.east, bounds.south], // SE
    [bounds.east, bounds.north], // close
  ];
  return `[[${ring.map(([lng, lat]) => `[${lng},${lat}]`).join(',')}]]`;
}

export function polygonToMapParam(polygon: Array<[number, number]>): string {
  // polygon already in [lng,lat] points
  return `[[${polygon.map(([lng, lat]) => `[${lng},${lat}]`).join(',')}]]`;
}

