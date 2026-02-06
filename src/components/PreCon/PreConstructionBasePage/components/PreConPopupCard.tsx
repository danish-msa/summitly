"use client";

import React from "react";
import Image from "next/image";
import { Bath, Bed, MapPin, Maximize2 } from "lucide-react";
import type { PreConstructionProperty } from "@/components/PreCon/PropertyCards/types";

function formatPrice(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "Coming Soon";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PreConPopupCard({ project }: { project: PreConstructionProperty }) {
  const imageUrl = project.images?.[0] ?? "/placeholder.svg";
  const priceText = formatPrice(project.startingPrice ?? null);
  const address = project.address?.city && project.address?.province
    ? `${project.address.city}, ${project.address.province}`
    : project.address?.street || "—";

  return (
    <div className="p-0 rounded-xl overflow-hidden bg-white shadow-xl max-w-[280px]">
      <div className="relative w-full h-[140px]">
        <Image
          src={imageUrl}
          alt={project.projectName}
          fill
          sizes="280px"
          className="object-cover block rounded-t-xl"
        />
      </div>
      <div className="p-3 space-y-2.5">
        <div className="text-xl font-bold text-gray-900">{priceText}</div>
        {project.projectName ? (
          <p className="text-sm font-medium text-gray-800 line-clamp-2">{project.projectName}</p>
        ) : null}
        <div className="flex items-center gap-3 text-gray-700 flex-wrap">
          {project.details?.bedroomRange ? (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4 text-gray-700" aria-hidden />
              <span className="text-xs">{project.details.bedroomRange}</span>
            </div>
          ) : null}
          {project.details?.bathroomRange ? (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4 text-gray-700" aria-hidden />
              <span className="text-xs">{project.details.bathroomRange}</span>
            </div>
          ) : null}
          {project.details?.sqftRange ? (
            <div className="flex items-center gap-1">
              <Maximize2 className="h-4 w-4 text-gray-700" aria-hidden />
              <span className="text-xs">{project.details.sqftRange}</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-start gap-1.5 text-gray-700">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
          <span className="text-xs">{address}</span>
        </div>
      </div>
    </div>
  );
}
