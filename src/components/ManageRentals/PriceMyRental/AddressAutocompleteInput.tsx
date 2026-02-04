"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useAutocompleteSearch } from "@/hooks/useAutocompleteSearch";
import type { PropertyListing } from "@/lib/types";
import type { Location } from "@/lib/api/repliers/services/locations";
import { cn } from "@/lib/utils";

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

export interface AddressAutocompleteInputProps {
  /** Controlled value for form submission (selected address). */
  value: string;
  /** Called when user selects a listing or location; pass the display address. */
  onSelect: (address: string) => void;
  /** Optional hidden input name for form submit. */
  name?: string;
  /** Optional additional class for the wrapper. */
  className?: string;
}

/**
 * Street address input that keeps the same Input UI as the rest of the form
 * but shows property/location suggestions from the autocomplete API.
 */
export function AddressAutocompleteInput({
  value,
  onSelect,
  name = "streetAddress",
  className,
}: AddressAutocompleteInputProps) {
  const {
    query,
    setQuery,
    listings,
    locations,
    loading,
    error,
    minQueryLength,
  } = useAutocompleteSearch();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // When user selects, sync query so the input shows the selected address
  useEffect(() => {
    if (value) setQuery(value);
  }, [value, setQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown =
    isOpen &&
    (query.length >= minQueryLength ||
      listings.length > 0 ||
      locations.length > 0);

  const handleSelectAddress = (address: string) => {
    setQuery(address);
    onSelect(address);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <Input
        type="text"
        label="Street Address"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (query.length >= minQueryLength) setIsOpen(true);
        }}
        aria-label="Street address"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
      />
      {name && (
        <input type="hidden" name={name} value={value} readOnly aria-hidden />
      )}

      {showDropdown && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[60vh] overflow-y-auto"
        >
          {loading && (
            <div className="px-4 py-3 text-sm text-slate-500">
              Searching...
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

          {!loading &&
            !error &&
            query.length >= minQueryLength &&
            listings.length === 0 &&
            locations.length === 0 && (
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
                    Locations
                  </h3>
                  <ul className="space-y-0" role="list">
                    {locations.map((loc, idx) => (
                      <li key={`${loc.locationId}-${idx}`} role="option">
                        <button
                          type="button"
                          onClick={() => handleSelectAddress(loc.name)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                            <MapPin className="h-4 w-4" aria-hidden />
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
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {listings.length > 0 && (
                <section className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    Properties
                  </h3>
                  <ul className="space-y-0">
                    {listings.map((listing) => {
                      const address =
                        listing.address?.location ?? "Unknown address";
                      return (
                        <li key={listing.mlsNumber} role="option">
                          <button
                            type="button"
                            onClick={() => handleSelectAddress(address)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-b-0 transition-colors"
                          >
                            <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden bg-slate-100">
                              <Image
                                src={getListingImageUrl(listing)}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {address}
                              </p>
                              <p className="text-xs text-slate-500">
                                {listing.address?.city}
                                {listing.address?.state
                                  ? `, ${listing.address.state}`
                                  : ""}
                              </p>
                            </div>
                          </button>
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
