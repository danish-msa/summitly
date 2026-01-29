"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, MapPin, Bed, Bath, Car, Home } from "lucide-react";
import { useAutocompleteSearch } from "@/hooks/useAutocompleteSearch";
import { getPropertyUrl } from "@/lib/utils/propertyUrl";
import type { PropertyListing } from "@/lib/types";
import type { Location } from "@/lib/api/repliers/services/locations";
import { cn } from "@/lib/utils";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function getStatusTagClass(status: string): string {
  const s = (status || "").toLowerCase();
  if (s.includes("sold conditionally") || s.includes("pending") || s.includes("active under contract"))
    return "bg-amber-100 text-amber-800";
  if (s.includes("sold") || s.includes("closed")) return "bg-sky-100 text-sky-800";
  if (s.includes("terminated") || s.includes("expired") || s.includes("withdrawn"))
    return "bg-red-100 text-red-800";
  return "bg-emerald-100 text-emerald-800"; // For Sale / Active
}

function getListingImageUrl(listing: PropertyListing): string {
  const url = listing.images?.imageUrl || listing.images?.allImages?.[0];
  if (url?.startsWith("http")) return url;
  if (url) return url;
  return "/images/p1.jpg";
}

function getLocationSecondaryText(loc: Location): string {
  const type =
    loc.type === "city"
      ? "City"
      : loc.type === "neighborhood"
        ? "Neighborhood"
        : "Area";
  const addr = loc.address;
  if (addr?.city && addr?.state) return `${type} in ${addr.city}, ${addr.state}`;
  if (addr?.state) return `${type} in ${addr.state}`;
  return type;
}

export interface AutocompleteSearchProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSelectListing?: (listing: PropertyListing) => void;
  onSelectLocation?: (location: Location) => void;
}

export function AutocompleteSearch({
  placeholder = "Search properties or locations...",
  className,
  inputClassName,
  onSelectListing,
  onSelectLocation,
}: AutocompleteSearchProps) {
  const {
    query,
    setQuery,
    listings,
    count,
    locations,
    loading,
    error,
    hasResults,
    minQueryLength,
  } = useAutocompleteSearch();

  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown =
    isOpen &&
    (query.length >= minQueryLength || (listings.length > 0 || locations.length > 0));

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length >= minQueryLength && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 sm:h-12 pl-10 pr-10 rounded-full text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500",
            inputClassName
          )}
          aria-label="Search properties and locations"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
          <Search className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-[70vh] overflow-y-auto"
        >
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              Loading...
            </div>
          )}

          {!loading && error && (
            <div className="px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && query.length < minQueryLength && (
            <div className="px-4 py-3 text-sm text-slate-500">
              Type at least {minQueryLength} characters to search.
            </div>
          )}

          {!loading && !error && query.length >= minQueryLength && listings.length === 0 && locations.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500 text-center">
              No properties or locations found.
            </div>
          )}

          {!loading && !error && (listings.length > 0 || locations.length > 0) && (
            <div className="py-2">
              {listings.length > 0 && (
                <section className="px-4 py-2 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      PROPERTIES
                    </h3>
                    {count > 0 && (
                      <span className="text-xs text-slate-500">({count.toLocaleString()})</span>
                    )}
                  </div>
                  <ul className="space-y-0">
                    {listings.map((listing) => {
                      const href = getPropertyUrl(listing);
                      const content = (
                        <>
                          <div className="relative h-[70px] w-[70px] shrink-0 rounded overflow-hidden bg-slate-100">
                            <Image
                              src={getListingImageUrl(listing)}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="70px"
                            />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatPrice(listing.listPrice)} | {listing.mlsNumber}
                            </p>
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              {listing.address?.location ?? ""}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1">
                              <span className="inline-flex items-center gap-1">
                                <Bed className="h-3 w-3" aria-hidden="true" />
                                {listing.details?.numBedrooms ?? "N/A"} Bedroom
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Bath className="h-3 w-3" aria-hidden="true" />
                                {listing.details?.numBathrooms ?? "N/A"} Bath
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Car className="h-3 w-3" aria-hidden="true" />
                                {listing.details?.numGarageSpaces ?? "N/A"} Garage
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Home className="h-3 w-3" aria-hidden="true" />
                                {listing.details?.propertyType ?? "—"}
                              </span>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 px-2.5 py-1 rounded-full text-xs font-medium",
                              getStatusTagClass(listing.lastStatus || listing.status)
                            )}
                          >
                            {listing.lastStatus || listing.status || "Active"}
                          </span>
                        </>
                      );
                      return (
                        <li key={listing.mlsNumber} role="option">
                          {onSelectListing ? (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectListing(listing);
                                setIsOpen(false);
                              }}
                              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-b-0 transition-colors"
                            >
                              {content}
                            </button>
                          ) : (
                            <Link
                              href={href}
                              onClick={() => setIsOpen(false)}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                            >
                              {content}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {locations.length > 0 && (
                <section className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    LOCATIONS
                  </h3>
                  <ul className="space-y-0" role="list">
                    {locations.map((loc, idx) => (
                      <li key={`${loc.locationId}-${idx}`} role="option">
                        {onSelectLocation ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectLocation(loc);
                              setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-b-0 transition-colors"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                              <MapPin className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {loc.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {getLocationSecondaryText(loc)}
                              </p>
                            </div>
                          </button>
                        ) : (
                          <Link
                            href={`/listings?location=${encodeURIComponent(loc.name)}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                              <MapPin className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {loc.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {getLocationSecondaryText(loc)}
                              </p>
                            </div>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutocompleteSearch;
