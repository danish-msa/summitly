import type { ListingsParams } from "@/lib/api/repliers";
import type { FilterState } from "@/lib/types/filters";

function dateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function uiFiltersToRepliersParams(filters: FilterState): Partial<ListingsParams> {
  const params: Record<string, unknown> = {};
  const today = new Date();

  if (filters.minPrice && filters.minPrice > 0) params.minPrice = Number(filters.minPrice);
  if (filters.maxPrice && filters.maxPrice > 0) params.maxPrice = Number(filters.maxPrice);

  if (filters.bedrooms && filters.bedrooms > 0) {
    params.minBeds = Number(filters.bedrooms);
    params.minBedrooms = Number(filters.bedrooms);
  }

  if (filters.bathrooms && filters.bathrooms > 0) {
    params.minBaths = Number(filters.bathrooms);
    params.minBathrooms = Number(filters.bathrooms);
  }

  if (filters.propertyType && filters.propertyType !== "all") params.propertyType = filters.propertyType;
  if (filters.community && filters.community !== "all") params.neighborhood = filters.community;
  if (filters.lastStatus && filters.lastStatus !== "all") params.lastStatus = filters.lastStatus;

  if (filters.yearBuilt && filters.yearBuilt !== "all") {
    const now = new Date().getFullYear();
    const [minY, maxY] = (() => {
      switch (filters.yearBuilt) {
        case "0-5": return [now - 5, now];
        case "5-10": return [now - 10, now - 5];
        case "10-20": return [now - 20, now - 10];
        case "20-50": return [now - 50, now - 20];
        case "50+": return [0, now - 50];
        default: return [null, null];
      }
    })();
    if (minY != null) params.minYearBuilt = minY;
    if (maxY != null) params.maxYearBuilt = maxY;
  }

  const type = filters.listingType?.toLowerCase();
  if (type === "sale" || type === "lease") params.type = type;
  if (type === "sell") params.type = "sale";
  if (type === "rent") params.type = "lease";

  // Keyword search (Repliers search param; multiple terms comma-separated)
  const searchTerms: string[] = [];
  if (filters.searchKeywords?.trim()) searchTerms.push(filters.searchKeywords.trim());
  if (filters.hasPool === "yes") searchTerms.push("pool");
  if (filters.flooringType && filters.flooringType !== "all") searchTerms.push(filters.flooringType);
  if (searchTerms.length > 0) params.search = searchTerms.join(",");

  if (filters.minGarageSpaces != null && filters.minGarageSpaces > 0) {
    params.minGarageSpaces = Number(filters.minGarageSpaces);
  }
  if (filters.minParkingSpaces != null && filters.minParkingSpaces > 0) {
    params.minParkingSpaces = Number(filters.minParkingSpaces);
  }

  // Time on Summitly -> minListDate / maxListDate (YYYY-MM-DD)
  const timeOn = filters.timeOnSummitly;
  if (timeOn && timeOn !== "none") {
    if (timeOn === "new") {
      params.minListDate = dateString(addDays(today, -2));
    } else if (timeOn === "lt3") {
      params.minListDate = dateString(addDays(today, -3));
    } else if (timeOn === "lt7") {
      params.minListDate = dateString(addDays(today, -7));
    } else if (timeOn === "lt14") {
      params.minListDate = dateString(addDays(today, -14));
    } else if (timeOn === "gt7") {
      params.maxListDate = dateString(addDays(today, -7));
    } else if (timeOn === "gt14") {
      params.maxListDate = dateString(addDays(today, -14));
    } else if (timeOn === "gt30") {
      params.maxListDate = dateString(addDays(today, -30));
    }
  }

  // Open house (Repliers may support openHouseEndDate / openHouseInNextDays; pass-through)
  const openHouse = filters.openHouseFilter;
  if (openHouse && openHouse !== "any") {
    if (openHouse === "within-3") (params as Record<string, unknown>).openHouseInNextDays = 3;
    else if (openHouse === "within-7") (params as Record<string, unknown>).openHouseInNextDays = 7;
    else if (openHouse === "this-weekend") (params as Record<string, unknown>).openHouseInNextDays = 3;
  }

  return params as Partial<ListingsParams>;
}

