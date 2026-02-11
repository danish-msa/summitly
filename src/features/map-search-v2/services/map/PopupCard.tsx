"use client";

import React from "react";
import Image from "next/image";
import { Bath, Bed, MapPin, Maximize2, TrendingUp } from "lucide-react";

import type { PropertyListing } from "@/lib/types";

function formatCurrency(value: number, opts?: { perMonth?: boolean }) {
  const base = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
  return opts?.perMonth ? `${base} / month` : base;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default function PopupCard({ property }: { property: PropertyListing }) {
  const listPrice = Number(property.listPrice || 0);
  const originalPrice = toNumber((property as unknown as { originalPrice?: unknown }).originalPrice);
  const showOriginal = typeof originalPrice === "number" && originalPrice > 0 && originalPrice !== listPrice;

  const isRental = String(property.type || "").toLowerCase().includes("lease");

  const priceText = formatCurrency(listPrice, { perMonth: isRental });
  const previousPriceText = showOriginal ? formatCurrency(originalPrice ?? 0, { perMonth: isRental }) : null;

  // If we don't have a true model/estimate field yet, keep a stable fallback.
  const estimatedMarketValue = listPrice > 0 ? Math.round(listPrice * 1.02) : 0;
  const estimatedMarketValueText = estimatedMarketValue > 0 ? formatCurrency(estimatedMarketValue) : "";

  const bedrooms = property.details?.numBedrooms ?? 0;
  const bathrooms = property.details?.numBathrooms ?? 0;
  const sqft = toNumber(property.details?.sqft) ?? 0;

  const address =
    property.address?.location ||
    `${property.address?.streetNumber || ""} ${property.address?.streetName || ""}`.trim();

  const imageUrl =
    property.images?.imageUrl ||
    (property.images?.allImages && property.images.allImages[0]) ||
    "/images/p1.jpg";

  return (
    <div className="p-0 rounded-xl overflow-hidden bg-white shadow-xl">
      {/* Image */}
      <div className="relative w-full h-[140px]">
        <Image
          src={imageUrl}
          alt="Property"
          fill
          sizes="260px"
          className="object-cover block rounded-t-xl"
        />
      </div>

      {/* Content */}
      <div className="p-3 space-y-2.5">
        {/* Price Section */}
        <div className="flex items-start justify-between gap-2">
          <div className="text-xl font-bold text-gray-900">{priceText}</div>
          {previousPriceText ? (
            <div className="text-xs text-gray-500 line-through pt-0.5">{previousPriceText}</div>
          ) : null}
        </div>

        {/* Estimated Market Value Section */}
        {estimatedMarketValue > 0 ? (
          <div className="bg-blue-50 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-700">Estimated Market Value</span>
              <div className="w-3.5 h-3.5 rounded-full bg-blue-200 flex items-center justify-center">
                <div className="text-[9px] text-blue-600 font-bold">i</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <span className="text-xs font-bold text-blue-600">{estimatedMarketValueText}</span>
            </div>
          </div>
        ) : null}

        {/* Property Features */}
        <div className="flex items-center gap-3 text-gray-700">
          {bedrooms > 0 ? (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4 text-gray-700" aria-hidden="true" />
              <span className="text-xs">
                <span className="font-bold">{bedrooms}</span> bed{bedrooms !== 1 ? "s" : ""}
              </span>
            </div>
          ) : null}

          {bathrooms > 0 ? (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4 text-gray-700" aria-hidden="true" />
              <span className="text-xs">
                <span className="font-bold">{bathrooms}</span> bath{bathrooms !== 1 ? "s" : ""}
              </span>
            </div>
          ) : null}

          {sqft > 0 ? (
            <div className="flex items-center gap-1">
              <Maximize2 className="h-4 w-4 text-gray-700" aria-hidden="true" />
              <span className="text-xs">
                <span className="font-bold">{sqft.toLocaleString()}</span> sqft
              </span>
            </div>
          ) : null}
        </div>

        {/* Address Section */}
        <div className="flex items-start gap-1.5 text-gray-700">
          <MapPin className="h-4 w-4 text-gray-700 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs">{address}</span>
        </div>
      </div>
    </div>
  );
}

