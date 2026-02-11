import type { LngLatLike } from 'mapbox-gl';

export type MapLayout = 'map' | 'split' | 'list';

export function parseNumber(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// URL format (simple + explicit):
// ?lat=43.65&lng=-79.38&z=10&layout=split
export function getZoom(searchParams: URLSearchParams, fallback: number = 10): number {
  const z = parseNumber(searchParams.get('z'));
  return z ?? fallback;
}

export function getCenter(searchParams: URLSearchParams): { lat: number; lng: number } | null {
  const lat = parseNumber(searchParams.get('lat'));
  const lng = parseNumber(searchParams.get('lng'));
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function getLayout(searchParams: URLSearchParams, fallback: MapLayout = 'split'): MapLayout {
  const layout = searchParams.get('layout');
  if (layout === 'map' || layout === 'split' || layout === 'list') return layout;
  return fallback;
}

export function toLngLatLike(center: { lat: number; lng: number } | null): LngLatLike | null {
  if (!center) return null;
  return { lat: center.lat, lng: center.lng };
}

export function buildMapUrl(params: {
  center: { lat: number; lng: number } | null;
  zoom: number;
  layout: MapLayout;
  q?: string | null;
  page?: string | null;
  // Persist any extra filter-like params (already encoded as strings).
  extra?: Record<string, string | null | undefined>;
}): string {
  const sp = new URLSearchParams();

  if (params.center) {
    sp.set('lat', String(params.center.lat));
    sp.set('lng', String(params.center.lng));
  }
  sp.set('z', String(params.zoom));
  sp.set('layout', params.layout);

  if (params.q) sp.set('q', params.q);
  if (params.page) sp.set('page', params.page);

  if (params.extra) {
    for (const [k, v] of Object.entries(params.extra)) {
      if (v == null || v === '') continue;
      sp.set(k, v);
    }
  }

  const query = sp.toString();
  return query ? `?${query}` : '';
}

export function updateWindowHistory(url: string): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', url);
}

