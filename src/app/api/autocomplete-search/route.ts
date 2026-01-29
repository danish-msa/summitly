import { NextRequest, NextResponse } from "next/server";
import { RepliersAPI } from "@/lib/api/repliers";

const MIN_QUERY_LENGTH = 3;
const LISTINGS_LIMIT = 10;
const LOCATIONS_LIMIT = 10; // Repliers locations/autocomplete max is 10

/**
 * GET /api/autocomplete-search?q=...
 * Combines Listings + Locations autocomplete (Repliers).
 * Min 3 chars; 400ms debounce should be applied on the client.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { listings: [], locations: [], error: "Query must be at least 3 characters" },
      { status: 200 }
    );
  }

  try {
    const [listingsResult, locations] = await Promise.all([
      RepliersAPI.listings.searchAutocomplete({
        search: q,
        resultsPerPage: LISTINGS_LIMIT,
      }),
      RepliersAPI.locations.autocomplete({
        search: q,
        resultsPerPage: LOCATIONS_LIMIT,
      }),
    ]);

    return NextResponse.json({
      listings: listingsResult.listings ?? [],
      count: listingsResult.count ?? 0,
      locations: locations ?? [],
    });
  } catch (err) {
    const message =
      err && typeof err === "object" && "message" in err && typeof (err as { message: string }).message === "string"
        ? (err as { message: string }).message
        : err instanceof Error
          ? err.message
          : "Autocomplete search failed";
    return NextResponse.json(
      { listings: [], locations: [], error: message },
      { status: 500 }
    );
  }
}
