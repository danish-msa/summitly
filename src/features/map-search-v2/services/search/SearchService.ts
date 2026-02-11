import type { LngLatBounds } from "mapbox-gl";

import { RepliersAPI, type Cluster, type ClusterParams, type ListingsParams, type ListingsResult } from "@/lib/api/repliers";
import type { PropertyListing } from "@/lib/types";
import type { FilterState } from "@/lib/types/filters";

import { toMapBounds, toRectangleString, polygonToMapParam } from "../../utils/mapBounds";
import { uiFiltersToRepliersParams } from "./filterAdapter";

export type SearchResponse = {
  list: PropertyListing[];
  clusters: Cluster[];
  count: number;
  pages: number;
  page: number;
};

class MapSearchService {
  private disabled = false;
  private requestId = 0;

  disableRequests() {
    this.disabled = true;
  }

  enableRequests() {
    this.disabled = false;
  }

  async fetch(params: {
    bounds: LngLatBounds | null;
    polygon: Array<[number, number]> | null; // [lng,lat]
    zoom: number;
    pageNum?: number;
    resultsPerPage?: number;
    status?: string | string[];
    lastStatus?: string | string[];
    city?: string | null;
    filters: FilterState;
  }): Promise<SearchResponse | null> {
    if (this.disabled) return null;
    const requestId = ++this.requestId;

    const mapParam = (() => {
      if (params.polygon && params.polygon.length >= 3) return polygonToMapParam(params.polygon);
      if (params.bounds) return toRectangleString(toMapBounds(params.bounds));
      return null;
    })();

    if (!mapParam) return null;

    const clusterPrecision = Math.max(1, Math.min(29, Math.round(params.zoom) + 2));
    const clusterLimit = 200;

    const base: Record<string, unknown> = {
      map: mapParam,
      status: params.status ?? "A",
      lastStatus: params.lastStatus,
      city: params.city ?? undefined,
      ...uiFiltersToRepliersParams(params.filters),
    };

    // Clusters (map aggregates)
    const clusterParamsObj: ClusterParams = {
      ...(base as unknown as ListingsParams),
      clusterPrecision,
      clusterLimit,
    };
    const clustersPromise = RepliersAPI.listings.getClusters(clusterParamsObj);

    // Listings for side list (paged)
    const listingsParamsObj: ListingsParams = {
      ...(base as unknown as ListingsParams),
      resultsPerPage: params.resultsPerPage ?? 20,
      pageNum: params.pageNum ?? 1,
    };
    const listingsPromise: Promise<ListingsResult> = RepliersAPI.listings.getFiltered(listingsParamsObj);

    const [clusterResult, listResult] = await Promise.all([clustersPromise, listingsPromise]);

    // Ignore stale result
    if (requestId !== this.requestId) return null;
    if (this.disabled) return null;

    return {
      list: listResult.listings,
      clusters: clusterResult.clusters as Cluster[],
      count: listResult.count ?? clusterResult.count ?? 0,
      pages: listResult.numPages ?? 1,
      page: params.pageNum ?? 1,
    };
  }
}

const mapSearchServiceInstance = new MapSearchService();
export default mapSearchServiceInstance;

