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

// Extracted to avoid parser confusion with square brackets / # in JSX attribute values
const INPUT_EASE = "ease-[cubic-bezier(0.4,0,0.2,1)]";
const MODERN_INPUT_CLASSES =
  "h-12 pl-10 pr-10 rounded-2xl border-[1.5px] border-zinc-400 bg-transparent py-4 text-base text-foreground transition-[border] duration-150 " +
  INPUT_EASE +
  " focus:border-[#3b82f6] focus:ring-0";
const MODERN_INPUT_FOCUS_BORDER = "border-[#3b82f6]";
const MODERN_LABEL_BASE =
  "absolute left-10 pointer-events-none text-zinc-500 transition-all duration-150 " +
  INPUT_EASE +
  " origin-left";
const MODERN_LABEL_FLOATING =
  "top-0 -translate-y-1/2 scale-[0.8] bg-white px-2 text-[#3b82f6]";
const LEGACY_INPUT_CLASSES =
  "h-10 sm:h-12 rounded-full text-sm border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

// Repliers lastStatus abbreviations → human-readable labels
const LAST_STATUS_LABELS: Record<string, string> = {
  Sus: "Suspended",
  Exp: "Expired",
  Sld: "Sold",
  Ter: "Terminated",
  Dft: "Deal Fell Through",
  Lsd: "Leased",
  Sc: "Sold Conditionally",
  Sce: "Sold Conditionally (Escape Clause)",
  Lc: "Leased Conditionally",
  Pc: "Price Change",
  Ext: "Extension",
  New: "New",
  Cs: "Coming Soon",
};

function getLastStatusLabel(status: string): string {
  if (!status) return "Active";
  const key = status.trim();
  return LAST_STATUS_LABELS[key] ?? status;
}

// Distinct color per lastStatus (abbrev → Tailwind bg/text classes)
const LAST_STATUS_COLORS: Record<string, string> = {
  New: "bg-emerald-100 text-emerald-800",
  Cs: "bg-teal-100 text-teal-800",
  Pc: "bg-amber-100 text-amber-800",
  Ext: "bg-sky-100 text-sky-800",
  Sld: "bg-blue-100 text-blue-800",
  Lsd: "bg-indigo-100 text-indigo-800",
  Sc: "bg-violet-100 text-violet-800",
  Sce: "bg-yellow-100 text-yellow-800",
  Lc: "bg-orange-100 text-orange-800",
  Ter: "bg-red-100 text-red-800",
  Exp: "bg-slate-200 text-slate-700",
  Sus: "bg-rose-100 text-rose-800",
  Dft: "bg-red-100 text-red-800",
};

function getStatusTagClass(status: string): string {
  const key = (status || "").trim();
  if (LAST_STATUS_COLORS[key]) return LAST_STATUS_COLORS[key];
  const s = key.toLowerCase();
  if (s.includes("sold conditionally") && !s.includes("escape")) return LAST_STATUS_COLORS.Sc;
  if (s.includes("sold conditionally") && s.includes("escape")) return LAST_STATUS_COLORS.Sce;
  if (s.includes("leased conditionally")) return LAST_STATUS_COLORS.Lc;
  if (s.includes("sold") || s.includes("closed")) return LAST_STATUS_COLORS.Sld;
  if (s.includes("leased")) return LAST_STATUS_COLORS.Lsd;
  if (s.includes("price change")) return LAST_STATUS_COLORS.Pc;
  if (s.includes("extension")) return LAST_STATUS_COLORS.Ext;
  if (s.includes("coming soon")) return LAST_STATUS_COLORS.Cs;
  if (s.includes("terminated") || s.includes("withdrawn")) return LAST_STATUS_COLORS.Ter;
  if (s.includes("expired")) return LAST_STATUS_COLORS.Exp;
  if (s.includes("suspended")) return LAST_STATUS_COLORS.Sus;
  if (s.includes("deal fell through")) return LAST_STATUS_COLORS.Dft;
  if (s.includes("new")) return LAST_STATUS_COLORS.New;
  return "bg-emerald-100 text-emerald-800"; // Active / default
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

const PROPERTY_SKELETON_COUNT = 3;
const LOCATION_SKELETON_COUNT = 4;

function AutocompleteLoadingSkeleton() {
  return (
    <div className="py-2 animate-in fade-in duration-200">
      <section className="px-4 py-2 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="h-3.5 w-20 rounded bg-slate-200 animate-pulse" />
          <div className="h-3 w-8 rounded bg-slate-100 animate-pulse" />
        </div>
        <ul className="space-y-0">
          {Array.from({ length: PROPERTY_SKELETON_COUNT }).map((_, i) => (
            <li
              key={i}
              className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0"
            >
              <div className="h-[70px] w-[70px] shrink-0 rounded bg-slate-200 animate-pulse" />
              <div className="flex-1 min-w-0 py-1 space-y-2">
                <div className="h-4 w-3/4 max-w-[200px] rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-full max-w-[180px] rounded bg-slate-100 animate-pulse" />
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="h-6 w-16 shrink-0 rounded-full bg-slate-200 animate-pulse" />
            </li>
          ))}
        </ul>
      </section>
      <section className="px-4 py-2">
        <div className="h-3.5 w-24 rounded bg-slate-200 animate-pulse mb-2" />
        <ul className="space-y-0">
          {Array.from({ length: LOCATION_SKELETON_COUNT }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0"
            >
              <div className="h-8 w-8 shrink-0 rounded bg-slate-200 animate-pulse" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export interface AutocompleteSearchProps {
  /** Placeholder when no label is used. Ignored when `label` is set. */
  placeholder?: string;
  /** When set, uses modern floating label UI (label animates up on focus/value). Omit for simple input with placeholder. */
  label?: string;
  className?: string;
  inputClassName?: string;
  onSelectListing?: (listing: PropertyListing) => void;
  onSelectLocation?: (location: Location) => void;
}

export function AutocompleteSearch({
  placeholder = "Search properties or locations...",
  label,
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
  const [isFocused, setIsFocused] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const useModernLabel = !!label;
  const isFloating = isFocused || query.trim().length > 0;

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

  const inputVariantClass = useModernLabel ? MODERN_INPUT_CLASSES : LEGACY_INPUT_CLASSES;
  const inputFocusClass = useModernLabel && isFloating ? MODERN_INPUT_FOCUS_BORDER : null;

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
          onFocus={() => {
            setIsFocused(true);
            if (query.length >= minQueryLength) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={useModernLabel ? undefined : placeholder}
          className={cn(
            "w-full pl-10 pr-10 focus:outline-none",
            inputVariantClass,
            inputFocusClass,
            inputClassName
          )}
          aria-label={label ?? "Search properties and locations"}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />
        {useModernLabel && (
          <label
            className={cn(
              MODERN_LABEL_BASE,
              isFloating ? MODERN_LABEL_FLOATING : "top-3"
            )}
          >
            {label}
          </label>
        )}
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
          {loading && <AutocompleteLoadingSkeleton />}

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
              {locations.length > 0 && (
                <section
                  className={cn(
                    "px-4 py-2",
                    listings.length > 0 && "border-b border-slate-100"
                  )}
                >
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

              {listings.length > 0 && (
                <section className="px-4 py-2 border-b border-slate-100 last:border-b-0">
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
                            {getLastStatusLabel(listing.lastStatus || listing.status)}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutocompleteSearch;
