"use client";

import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PropertyListing } from '@/lib/types';
import type { LngLat, LngLatBounds } from 'mapbox-gl';
import { LngLat as LngLatCtor } from 'mapbox-gl';
import MapRoot from '@/features/map-search-v2/components/MapRoot';
import MapService from '@/features/map-search-v2/services/map/MapService';
import SearchService from '@/features/map-search-v2/services/search/SearchService';
import { MapOptionsProvider } from '@/features/map-search-v2/providers/MapOptionsProvider';
import { DEFAULT_FILTER_STATE } from '@/lib/types/filters';

interface HomeSalesSectionProps {
  latitude?: number;
  longitude?: number;
  city?: string;
  neighborhood?: string;
  addressQuery?: string;
}

const HomeSalesSection: React.FC<HomeSalesSectionProps> = ({ latitude, longitude, city, neighborhood, addressQuery }) => {
  const [activeSubTab, setActiveSubTab] = useState<'sold' | 'active'>('sold');
  const [visibleListings, setVisibleListings] = useState<PropertyListing[]>(() => []);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [geocodedCenter, setGeocodedCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const initialCenter = useMemo(() => {
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      return { lat: latitude, lng: longitude };
    }
    return undefined;
  }, [latitude, longitude]);

  const resolvedCenter = initialCenter ?? geocodedCenter ?? undefined;

  React.useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (resolvedCenter || !addressQuery || !token) return;

    let cancelled = false;
    setIsGeocoding(true);

    (async () => {
      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
          `${encodeURIComponent(addressQuery)}.json?access_token=${encodeURIComponent(token)}` +
          `&limit=1&types=address`;

        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const coords = data?.features?.[0]?.center; // [lng, lat]
        if (!cancelled && Array.isArray(coords) && coords.length >= 2) {
          setGeocodedCenter({ lng: Number(coords[0]), lat: Number(coords[1]) });
        }
      } catch {
        // ignore - we fall back to the "location not available" view
      } finally {
        if (!cancelled) setIsGeocoding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addressQuery, resolvedCenter]);

  const listingStatus = activeSubTab === 'sold' ? 'U' : 'A';
  const listingLastStatus = activeSubTab === 'sold' ? 'sld' : undefined;

  const emptyTitle = activeSubTab === 'sold' ? 'NO SOLD LISTINGS' : 'NO ACTIVE LISTINGS';
  const emptyDescription =
    activeSubTab === 'sold'
      ? 'No recent sold listings were found in this area.'
      : 'You live in a great neighborhood! So great that no one is moving.';

  const mapCenter: LngLat | null = useMemo(() => {
    if (!resolvedCenter) return null;
    return new LngLatCtor(resolvedCenter.lng, resolvedCenter.lat);
  }, [resolvedCenter?.lat, resolvedCenter?.lng]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapPosition, setMapPosition] = useState<{ bounds: LngLatBounds | null; center: LngLat | null; zoom: number }>({
    bounds: null,
    center: mapCenter,
    zoom: 14,
  });

  const fetchForPosition = useCallback(
    async (bounds: LngLatBounds, zoom: number) => {
      const resp = await SearchService.fetch({
        bounds,
        polygon: null,
        zoom,
        pageNum: 1,
        resultsPerPage: 200,
        status: listingStatus,
        lastStatus: listingLastStatus,
        city: city || null,
        // Note: SearchService adapter reads only a subset of filters; use defaults + neighborhood mapping.
        filters: {
          ...DEFAULT_FILTER_STATE,
          community: neighborhood || 'all',
          listingType: 'all',
        },
      });

      if (!resp) return;
      setVisibleListings(resp.list);
      MapService.update(resp.list, resp.clusters, resp.count);
    },
    [listingStatus, listingLastStatus, city]
  );

  const handleMapLoad = useCallback(
    (bounds: LngLatBounds, center: LngLat, zoom: number) => {
      setMapLoaded(true);
      setMapPosition({ bounds, center, zoom });
      fetchForPosition(bounds, zoom);
    },
    [fetchForPosition]
  );

  const handleMapMove = useCallback(
    (bounds: LngLatBounds, center: LngLat, zoom: number) => {
      setMapPosition({ bounds, center, zoom });
      fetchForPosition(bounds, zoom);
    },
    [fetchForPosition]
  );

  // Render markers for fetched list
  React.useEffect(() => {
    if (!mapLoaded) return;
    MapService.showMarkers({
      properties: visibleListings,
      onTap: (p) => setSelectedProperty(p),
      onClick: (_e, p) => setSelectedProperty(p),
    });
  }, [mapLoaded, visibleListings]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Sub-tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveSubTab('sold')}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors duration-200 relative",
            activeSubTab === 'sold'
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Home Sold
        </button>
        <button
          onClick={() => setActiveSubTab('active')}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors duration-200 relative",
            activeSubTab === 'active'
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Active Listings
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-50 rounded-lg overflow-hidden">
        {resolvedCenter ? (
          <div className="h-[380px] bg-gray-100">
            <MapOptionsProvider initialLayout="map">
              <div className="relative w-full h-full">
                <MapRoot
                  zoom={mapPosition.zoom}
                  center={mapCenter}
                  polygon={null}
                  onLoad={handleMapLoad}
                  onMove={handleMapMove}
                />
              </div>
            </MapOptionsProvider>
          </div>
        ) : (
          <div className="p-6 text-sm text-gray-600">
            {isGeocoding
              ? "Finding this home on the map…"
              : "Location not available for this home, so we can’t show neighborhood listings on the map."}
          </div>
        )}

        {/* Simple results summary / empty state */}
        <div className="p-6 border-t border-gray-200">
          {visibleListings.length > 0 ? (
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {visibleListings.length} {activeSubTab === 'sold' ? 'sold' : 'active'} listings in view
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleListings.slice(0, 6).map((p) => (
                  <div
                    key={p.mlsNumber}
                    className="rounded-lg bg-white border border-gray-200 p-3"
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      ${Number(p.listPrice || 0).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {p.address?.location || `${p.address?.streetNumber || ''} ${p.address?.streetName || ''}`.trim()}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {p.details?.numBedrooms ?? 0} bd • {p.details?.numBathrooms ?? 0} ba • {p.details?.sqft ?? 0} sqft
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 p-2">
              {/* Text Content */}
              <div className="flex-1 max-w-md text-center lg:text-left">
                <p className="text-base text-gray-500 mb-3">
                  {emptyDescription}
                </p>
                <p className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
                  {emptyTitle}
                </p>
              </div>

              {/* Illustration */}
              <div className="flex-shrink-0 relative w-64 h-48">
                {/* House */}
                <svg 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2" 
                  width="200" 
                  height="150" 
                  viewBox="0 0 200 150" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Main house body */}
                  <rect x="50" y="70" width="100" height="80" rx="4" fill="#E5E7EB" />
                  {/* Roof */}
                  <path d="M50 70L100 20L150 70H50Z" fill="#9CA3AF" />
                  {/* Windows */}
                  <rect x="65" y="90" width="20" height="25" rx="4" fill="white" />
                  <rect x="115" y="90" width="20" height="25" rx="4" fill="white" />
                  {/* Door */}
                  <rect x="85" y="120" width="30" height="30" rx="4" fill="white" />
                  {/* Ground line */}
                  <rect x="40" y="145" width="120" height="5" fill="#9CA3AF" />
                </svg>

                {/* Tree 1 (left, taller) */}
                <svg 
                  className="absolute bottom-0 left-1/4 -translate-x-1/2" 
                  width="40" 
                  height="80" 
                  viewBox="0 0 40 80" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="20" cy="20" r="20" fill="#E5E7EB" />
                  <rect x="18" y="40" width="4" height="40" fill="#6B7280" />
                </svg>

                {/* Tree 2 (right, shorter) */}
                <svg 
                  className="absolute bottom-0 left-3/4 -translate-x-1/2" 
                  width="30" 
                  height="60" 
                  viewBox="0 0 30 60" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="15" cy="15" r="15" fill="#E5E7EB" />
                  <rect x="13" y="30" width="4" height="30" fill="#6B7280" />
                </svg>

                {/* Magnifying Glass */}
                <svg 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" 
                  width="80" 
                  height="80" 
                  viewBox="0 0 80 80" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Lens circle */}
                  <circle cx="30" cy="30" r="25" stroke="#14B8A6" strokeWidth="4" fill="#14B8A6" fillOpacity="0.2" />
                  {/* Handle */}
                  <path d="M48 48L70 70" stroke="#14B8A6" strokeWidth="4" strokeLinecap="round" />
                  {/* Small house inside lens */}
                  <rect x="20" y="25" width="20" height="15" rx="2" fill="#5EEAD4" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeSalesSection;
