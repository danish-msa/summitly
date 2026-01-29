"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import PropertyCard from "@/components/Helper/PropertyCard";

// Mock property data type matching PropertyCard interface
type MockProperty = {
  mlsNumber: string;
  listPrice: number;
  type: string;
  images: {
    imageUrl: string;
    allImages: string[];
  };
  details: {
    propertyType: string;
    numBedrooms: number;
    numBathrooms: number;
    sqft: number | string;
  };
  address: {
    city: string | null;
    location: string;
  };
  listedDate?: string;
  status?: string;
};

type Props = {
  width?: number;
  properties?: MockProperty[];
  datasetName?: string;
  className?: string;
};

// Mock properties for preview
const mockProperties: MockProperty[] = [
  {
    mlsNumber: "MLS-001",
    listPrice: 15420000,
    type: "Sale",
    images: {
      imageUrl: "/images/p1.jpg",
      allImages: ["/images/p1.jpg", "/images/p2.jpg"],
    },
    details: {
      propertyType: "Single Family",
      numBedrooms: 7,
      numBathrooms: 8,
      sqft: 8694,
    },
    address: {
      city: "Phoenix",
      location: "15413 N 19th Way, Phoenix, AZ 85022",
    },
    listedDate: new Date().toISOString(),
    status: "Active",
  },
  {
    mlsNumber: "MLS-002",
    listPrice: 12450000,
    type: "Sale",
    images: {
      imageUrl: "/images/p2.jpg",
      allImages: ["/images/p2.jpg", "/images/p3.jpg"],
    },
    details: {
      propertyType: "Single Family",
      numBedrooms: 6,
      numBathrooms: 7,
      sqft: 7500,
    },
    address: {
      city: "Phoenix",
      location: "1904 Via Casa Alta, Phoenix, AZ 85022",
    },
    listedDate: new Date().toISOString(),
    status: "Active",
  },
  {
    mlsNumber: "MLS-003",
    listPrice: 18200000,
    type: "Sale",
    images: {
      imageUrl: "/images/p3.jpg",
      allImages: ["/images/p3.jpg", "/images/p4.jpg"],
    },
    details: {
      propertyType: "Single Family",
      numBedrooms: 8,
      numBathrooms: 9,
      sqft: 11234,
    },
    address: {
      city: "Phoenix",
      location: "2105 E Camelback Rd, Phoenix, AZ 85016",
    },
    listedDate: new Date().toISOString(),
    status: "Active",
  },
  {
    mlsNumber: "MLS-004",
    listPrice: 9800000,
    type: "Sale",
    images: {
      imageUrl: "/images/p4.jpg",
      allImages: ["/images/p4.jpg", "/images/p5.jpg"],
    },
    details: {
      propertyType: "Single Family",
      numBedrooms: 5,
      numBathrooms: 6,
      sqft: 6500,
    },
    address: {
      city: "Phoenix",
      location: "3456 N Central Ave, Phoenix, AZ 85012",
    },
    listedDate: new Date().toISOString(),
    status: "Active",
  },
];

export function DatasetPreviewPanel({ width = 320, properties = mockProperties, datasetName = "properties-92037", className }: Props) {
  const [searchValue, setSearchValue] = React.useState("Properties By Place - 1904 Via Casa Alta - Best...");

  return (
    <aside
      className={cn(
        "shrink-0 border-l border-slate-200 bg-white flex flex-col min-w-0 overflow-hidden",
        className
      )}
    >
      <div className="h-full flex flex-col">
        {/* Header - same style as Search History */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold text-slate-900">Dataset Preview</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 rounded"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download Sample
          </button>
        </div>

        {/* Search/Filter Bar */}
        <div className="shrink-0 border-b border-slate-100 px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 min-w-0 h-8 px-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500/60 focus:border-sky-500"
              placeholder="Search properties..."
            />
            <span className="text-[11px] text-slate-500 whitespace-nowrap">1 of 1</span>
          </div>
        </div>

        {/* Content - Property Cards Grid (auto-arranges with panel width) */}
        <div className="flex-1 overflow-auto px-2 py-3 min-w-0">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
            }}
          >
            {properties.map((property) => (
              <PropertyCard key={property.mlsNumber} property={property} />
            ))}
          </div>

          {properties.length > 4 && (
            <p className="mt-4 px-2 text-[11px] text-slate-500 text-center">
              +{properties.length - 4} more properties available in full dataset
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
