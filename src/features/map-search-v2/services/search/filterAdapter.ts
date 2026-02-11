import type { ListingsParams } from "@/lib/api/repliers";
import type { FilterState } from "@/lib/types/filters";

export function uiFiltersToRepliersParams(filters: FilterState): Partial<ListingsParams> {
  const params: Record<string, unknown> = {};

  if (filters.minPrice && filters.minPrice > 0) params.minPrice = Number(filters.minPrice);
  if (filters.maxPrice && filters.maxPrice > 0) params.maxPrice = Number(filters.maxPrice);

  if (filters.bedrooms && filters.bedrooms > 0) {
    // Repliers supports `minBeds`; we also send legacy key for back-compat
    params.minBeds = Number(filters.bedrooms);
    params.minBedrooms = Number(filters.bedrooms);
  }

  if (filters.bathrooms && filters.bathrooms > 0) {
    params.minBaths = Number(filters.bathrooms);
    params.minBathrooms = Number(filters.bathrooms);
  }

  if (filters.propertyType && filters.propertyType !== "all") params.propertyType = filters.propertyType;
  if (filters.community && filters.community !== "all") params.neighborhood = filters.community;

  const type = filters.listingType?.toLowerCase();
  if (type === "sale" || type === "lease") params.type = type;
  if (type === "sell") params.type = "sale";
  if (type === "rent") params.type = "lease";

  // You can extend this mapping as needed (city, radius, etc.)
  return params as Partial<ListingsParams>;
}

