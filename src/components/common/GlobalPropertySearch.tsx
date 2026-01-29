"use client";

import React from "react";
import { AutocompleteSearch } from "@/components/common/AutocompleteSearch";
import type { PropertyListing } from "@/lib/types";
import type { PropertySuggestion } from "@/hooks/usePropertySearch";

function listingToPropertySuggestion(listing: PropertyListing): PropertySuggestion {
  const addr = listing.address;
  const details = listing.details;
  const sqft = details?.sqft;
  return {
    id: listing.mlsNumber,
    address: addr?.location ?? "",
    city: addr?.city ?? "",
    region: addr?.state ?? "",
    bedrooms: details?.numBedrooms ?? 0,
    bathrooms: details?.numBathrooms ?? 0,
    sqft: typeof sqft === "number" ? sqft : typeof sqft === "string" ? parseInt(sqft, 10) || 0 : 0,
    propertyType: details?.propertyType ?? "",
    yearBuilt: 0,
    boardId: listing.boardId && listing.boardId > 0 ? listing.boardId : undefined,
  };
}

export interface GlobalPropertySearchProps {
  onSuggestionSelect: (property: PropertySuggestion) => void;
  placeholder?: string;
}

const GlobalPropertySearch: React.FC<GlobalPropertySearchProps> = ({
  onSuggestionSelect,
  placeholder = "Enter your property address",
}) => {
  return (
      <AutocompleteSearch
        placeholder={placeholder}
        className="w-full"
        onSelectListing={(listing: PropertyListing) => {
          onSuggestionSelect(listingToPropertySuggestion(listing));
        }}
      />
  );
};

export default GlobalPropertySearch;
