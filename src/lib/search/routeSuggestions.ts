/**
 * Route suggestions for autocomplete search.
 * Matches user query to buy/rent/pre-con URL structure so users can jump to
 * listing pages (e.g. "condos in toronto" → /buy/toronto/condos, /rent/toronto/condos).
 */

import { preConCities } from "@/components/PreCon/Search/preConSearchData";

export type RouteSuggestionCategory = "Buy" | "Rent" | "Pre-Con";

export interface RouteSuggestion {
  label: string;
  href: string;
  category: RouteSuggestionCategory;
  /** Lowercase keywords used for matching (label words + synonyms). */
  keywords: string[];
}

// Property type slugs and display labels (aligned with urlSegmentParser / BUY_RENT_PRECON_ROUTING)
// Include common typos in keywords so "detched" → detached, etc.
const PROPERTY_TYPES: { slug: string; label: string; keywords: string[] }[] = [
  { slug: "condos", label: "Condos", keywords: ["condo", "condos", "condo apartment"] },
  {
    slug: "houses",
    label: "Houses",
    keywords: ["house", "houses", "homes", "home", "detached"],
  },
  {
    slug: "townhouses",
    label: "Townhouses",
    keywords: ["townhouse", "townhouses", "townhome", "townhomes"],
  },
  { slug: "lofts", label: "Lofts", keywords: ["loft", "lofts"] },
  {
    slug: "semi-detached",
    label: "Semi-Detached",
    keywords: ["semi-detached", "semi detached", "semi"],
  },
  {
    slug: "detached",
    label: "Detached",
    keywords: [
      "detached",
      "detached homes",
      "detched",
      "detatch",
      "detach",
      "detached home",
    ],
  },
];

// Pre-con specific types and statuses
const PRE_CON_PROPERTY_TYPES: { slug: string; label: string; keywords: string[] }[] = [
  ...PROPERTY_TYPES,
  { slug: "high-rise-condos", label: "High-Rise Condos", keywords: ["high-rise", "high rise", "highrise"] },
  { slug: "mid-rise-condos", label: "Mid-Rise Condos", keywords: ["mid-rise", "mid rise", "midrise"] },
  { slug: "low-rise-condos", label: "Low-Rise Condos", keywords: ["low-rise", "low rise", "lowrise"] },
];

const PRE_CON_STATUSES: { slug: string; label: string; keywords: string[] }[] = [
  { slug: "selling", label: "Selling now", keywords: ["selling", "sell", "available", "now selling"] },
  { slug: "coming-soon", label: "Coming soon", keywords: ["coming soon", "coming-soon", "upcoming"] },
  { slug: "sold-out", label: "Sold out", keywords: ["sold out", "sold-out", "sold"] },
];

// Completion years for pre-con (next few years)
const COMPLETION_YEARS = [2025, 2026, 2027, 2028];

// Build city slug -> name (preConCities use id as slug)
const CITIES = preConCities.map((c) => ({
  slug: c.id,
  name: c.name,
  keywords: [c.name.toLowerCase(), c.id.toLowerCase()],
}));

/** Build all suggestion records (lazy-initialized). */
let allSuggestions: RouteSuggestion[] | null = null;

function buildSuggestions(): RouteSuggestion[] {
  if (allSuggestions) return allSuggestions;
  const out: RouteSuggestion[] = [];

  for (const city of CITIES) {
    const cityKw = [city.slug, city.name.toLowerCase(), ...city.keywords];

    // Buy: city only
    out.push({
      label: `Homes for sale in ${city.name}`,
      href: `/buy/${city.slug}`,
      category: "Buy",
      keywords: ["buy", "sale", "for sale", "purchase", "homes", "properties", ...cityKw],
    });

    // Rent: city only
    out.push({
      label: `Rentals in ${city.name}`,
      href: `/rent/${city.slug}`,
      category: "Rent",
      keywords: ["rent", "rental", "rentals", "lease", "apartments", "rent in", ...cityKw],
    });

    // Pre-con: city only
    out.push({
      label: `Pre-construction in ${city.name}`,
      href: `/pre-con/${city.slug}`,
      category: "Pre-Con",
      keywords: ["pre-con", "precon", "pre-construction", "preconstruction", "new development", ...cityKw],
    });

    // Buy: city + property type
    for (const pt of PROPERTY_TYPES) {
      out.push({
        label: `${pt.label} for sale in ${city.name}`,
        href: `/buy/${city.slug}/${pt.slug}`,
        category: "Buy",
        keywords: ["buy", "sale", "for sale", ...pt.keywords, ...cityKw],
      });
    }

    // Rent: city + property type
    for (const pt of PROPERTY_TYPES) {
      out.push({
        label: `${pt.label} for rent in ${city.name}`,
        href: `/rent/${city.slug}/${pt.slug}`,
        category: "Rent",
        keywords: ["rent", "rental", "rentals", ...pt.keywords, ...cityKw],
      });
    }

    // Pre-con: city + property type
    for (const pt of PRE_CON_PROPERTY_TYPES) {
      out.push({
        label: `Pre-construction ${pt.label.toLowerCase()} in ${city.name}`,
        href: `/pre-con/${city.slug}/${pt.slug}`,
        category: "Pre-Con",
        keywords: ["pre-con", "precon", "pre-construction", ...pt.keywords, ...cityKw],
      });
    }
  }

  // Pre-con: property type only (no city)
  for (const pt of PRE_CON_PROPERTY_TYPES) {
    out.push({
      label: `Pre-construction ${pt.label.toLowerCase()}`,
      href: `/pre-con/${pt.slug}`,
      category: "Pre-Con",
      keywords: ["pre-con", "precon", "pre-construction", ...pt.keywords],
    });
  }

  // Pre-con: status only
  for (const st of PRE_CON_STATUSES) {
    out.push({
      label: `Pre-con ${st.label.toLowerCase()}`,
      href: `/pre-con/${st.slug}`,
      category: "Pre-Con",
      keywords: ["pre-con", "precon", "pre-construction", ...st.keywords],
    });
  }

  // Pre-con: completion year
  for (const year of COMPLETION_YEARS) {
    const yearStr = String(year);
    out.push({
      label: `Pre-con completing ${yearStr}`,
      href: `/pre-con/${yearStr}`,
      category: "Pre-Con",
      keywords: ["pre-con", "precon", "pre-construction", "completing", "completion", yearStr],
    });
  }

  // Bedroom filters (buy/rent) – for ALL property types, not just condos
  const bedroomSlugs = ["1-bedroom", "2-bedroom", "3-bedroom", "4-bedroom", "5-plus-bedroom"];
  const bedroomLabels = ["1 bedroom", "2 bedroom", "3 bedroom", "4 bedroom", "5+ bedroom"];
  const bedroomKeywords = ["1 bed", "2 bed", "3 bed", "4 bed", "5 bed", "beds", "bedroom", "bedrooms"];
  for (const city of CITIES) {
    for (let i = 0; i < bedroomSlugs.length; i++) {
      const slug = bedroomSlugs[i];
      const bl = bedroomLabels[i];
      const bedKw = [bl, slug.replace(/-/g, " "), bedroomKeywords[i] ?? `${i + 1} bed`, "bed", "beds", "bedroom", "bedrooms"];
      for (const pt of PROPERTY_TYPES) {
        out.push({
          label: `${bl} ${pt.label.toLowerCase()} for sale in ${city.name}`,
          href: `/buy/${city.slug}/${pt.slug}/${slug}`,
          category: "Buy",
          keywords: ["buy", "sale", "for sale", ...pt.keywords, ...bedKw, ...city.keywords],
        });
        out.push({
          label: `${bl} ${pt.label.toLowerCase()} for rent in ${city.name}`,
          href: `/rent/${city.slug}/${pt.slug}/${slug}`,
          category: "Rent",
          keywords: ["rent", "rental", "rentals", ...pt.keywords, ...bedKw, ...city.keywords],
        });
      }
    }
  }

  // Bathroom filters (buy/rent) – for ALL property types
  const bathroomSlugs = ["1-bathroom", "2-bathroom", "3-bathroom", "4-bathroom", "5-plus-bathroom"];
  const bathroomLabels = ["1 bathroom", "2 bathroom", "3 bathroom", "4 bathroom", "5+ bathroom"];
  const bathroomKeywords = ["1 bath", "2 bath", "3 bath", "4 bath", "5 bath", "baths", "bathroom", "bathrooms"];
  for (const city of CITIES) {
    for (let i = 0; i < bathroomSlugs.length; i++) {
      const slug = bathroomSlugs[i];
      const btl = bathroomLabels[i];
      const bathKw = [
        btl,
        slug.replace(/-/g, " "),
        bathroomKeywords[i] ?? `${i + 1} bath`,
        "bath",
        "baths",
        "bathroom",
        "bathrooms",
      ];
      for (const pt of PROPERTY_TYPES) {
        out.push({
          label: `${btl} ${pt.label.toLowerCase()} for sale in ${city.name}`,
          href: `/buy/${city.slug}/${pt.slug}/${slug}`,
          category: "Buy",
          keywords: ["buy", "sale", "for sale", ...pt.keywords, ...bathKw, ...city.keywords],
        });
        out.push({
          label: `${btl} ${pt.label.toLowerCase()} for rent in ${city.name}`,
          href: `/rent/${city.slug}/${pt.slug}/${slug}`,
          category: "Rent",
          keywords: ["rent", "rental", "rentals", ...pt.keywords, ...bathKw, ...city.keywords],
        });
      }
    }
  }

  // Price filters (buy/rent) – generic "homes" + ALL property types
  const priceFilters: { slug: string; label: string; keywords: string[] }[] = [
    { slug: "under-500000", label: "Under $500K", keywords: ["under 500", "under 500k", "500000", "affordable", "500k"] },
    { slug: "under-1000000", label: "Under $1M", keywords: ["under 1m", "under 1 million", "1000000", "1m"] },
    { slug: "over-1000000", label: "Over $1M", keywords: ["over 1m", "over 1 million", "luxury", "1000000"] },
  ];
  for (const city of CITIES) {
    for (const pf of priceFilters) {
      // Generic "Homes for sale/rent in {city} {price}" (all types – matches "homes under 500000")
      out.push({
        label: `Homes for sale in ${city.name} ${pf.label}`,
        href: `/buy/${city.slug}/${pf.slug}`,
        category: "Buy",
        keywords: ["buy", "sale", "for sale", "homes", "houses", "properties", ...pf.keywords, ...city.keywords],
      });
      out.push({
        label: `Homes for rent in ${city.name} ${pf.label}`,
        href: `/rent/${city.slug}/${pf.slug}`,
        category: "Rent",
        keywords: ["rent", "rental", "rentals", "homes", "properties", ...pf.keywords, ...city.keywords],
      });
      // By property type
      for (const pt of PROPERTY_TYPES) {
        out.push({
          label: `${pt.label} for sale in ${city.name} ${pf.label}`,
          href: `/buy/${city.slug}/${pt.slug}/${pf.slug}`,
          category: "Buy",
          keywords: ["buy", "sale", "for sale", "homes", "houses", ...pt.keywords, ...pf.keywords, ...city.keywords],
        });
        out.push({
          label: `${pt.label} for rent in ${city.name} ${pf.label}`,
          href: `/rent/${city.slug}/${pt.slug}/${pf.slug}`,
          category: "Rent",
          keywords: ["rent", "rental", "rentals", "homes", ...pt.keywords, ...pf.keywords, ...city.keywords],
        });
      }
    }
  }

  allSuggestions = out;
  return out;
}

/**
 * Normalize query for matching: lowercase, collapse spaces, strip punctuation.
 */
function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True if two strings are at most 1 edit apart (insert, delete, or replace).
 */
function oneEditAway(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < shorter.length && edits <= 1) {
    if (shorter[i] === longer[j]) {
      i++;
      j++;
      continue;
    }
    edits++;
    if (shorter.length === longer.length) {
      i++;
      j++;
    } else {
      j++; // insertion in longer
    }
  }
  if (j < longer.length) edits += longer.length - j;
  return edits <= 1;
}

/**
 * True if token matches keyword (exact substring or 1-char typo for words >= 4 chars).
 */
function tokenMatchesKeyword(token: string, keyword: string): boolean {
  if (token.length < 2) return false;
  if (keyword.includes(token) || token.includes(keyword)) return true;
  if (token.length >= 4 && keyword.length >= 4 && oneEditAway(token, keyword)) return true;
  return false;
}

/**
 * Score a suggestion against the query. Higher = better match.
 * Suggestions that match more query tokens (especially property type + bedroom) rank higher.
 */
function scoreSuggestion(s: RouteSuggestion, normalizedQuery: string, tokens: string[]): number {
  const labelLower = s.label.toLowerCase();
  let score = 0;
  let tokensMatched = 0;
  for (const token of tokens) {
    // Single digit (e.g. "1", "2") can match bedroom or bathroom number in label
    if (token.length === 1 && /^[1-5]$/.test(token)) {
      if (
        labelLower.includes(`${token} bedroom`) ||
        labelLower.includes(`${token} bed`) ||
        labelLower.includes(`${token}-bedroom`) ||
        labelLower.includes(`${token} bathroom`) ||
        labelLower.includes(`${token} bath`) ||
        labelLower.includes(`${token}-bathroom`)
      ) {
        score += 2;
        tokensMatched++;
      }
      continue;
    }
    if (token.length < 2) continue;
    if (labelLower.includes(token)) {
      score += 2;
      tokensMatched++;
    } else {
      const keywordMatch = s.keywords.some((kw) => tokenMatchesKeyword(token, kw));
      if (keywordMatch) {
        score += 1;
        tokensMatched++;
      }
    }
  }
  // Strong boost when most/all tokens matched (user intent is specific)
  if (tokens.length > 0 && tokensMatched >= Math.min(tokens.length, 2)) {
    score += tokensMatched * 2;
  }
  // Category boost
  if (normalizedQuery.includes("buy") && s.category === "Buy") score += 2;
  if (normalizedQuery.includes("rent") && s.category === "Rent") score += 2;
  if (
    (normalizedQuery.includes("pre") || normalizedQuery.includes("precon") || normalizedQuery.includes("pre-con")) &&
    s.category === "Pre-Con"
  ) {
    score += 2;
  }
  // When user clearly asks for baths/bathroom, rank bathroom suggestions above bedroom-only
  const queryWantsBath = /\bbath(s|room)?\b/.test(normalizedQuery);
  const suggestionIsBathroom = labelLower.includes("bathroom") || s.keywords.some((kw) => kw.includes("bath"));
  const suggestionIsBedroomOnly =
    (labelLower.includes("bedroom") || s.keywords.some((kw) => kw.includes("bed"))) && !suggestionIsBathroom;
  if (queryWantsBath) {
    if (suggestionIsBathroom) score += 8;
    if (suggestionIsBedroomOnly) score -= 6;
  }
  return score;
}

export interface GetRouteSuggestionsOptions {
  limit?: number;
  /** If true, return popular suggestions when query is short/empty. */
  includePopularWhenShort?: boolean;
}

const DEFAULT_LIMIT = 8;
const POPULAR_SUGGESTIONS: Pick<RouteSuggestion, "label" | "href" | "category">[] = [
  { label: "Condos for sale in Toronto", href: "/buy/toronto/condos", category: "Buy" },
  { label: "Houses for sale in Toronto", href: "/buy/toronto/houses", category: "Buy" },
  { label: "Condos for rent in Toronto", href: "/rent/toronto/condos", category: "Rent" },
  { label: "Pre-construction condos", href: "/pre-con/condos", category: "Pre-Con" },
  { label: "Pre-con selling now", href: "/pre-con/selling", category: "Pre-Con" },
];

/**
 * Get route suggestions that match the user's query.
 * Used by AutocompleteSearch to show "Browse by" links (buy/rent/pre-con pages).
 */
export function getRouteSuggestions(
  query: string,
  options: GetRouteSuggestionsOptions = {}
): RouteSuggestion[] {
  const { limit = DEFAULT_LIMIT, includePopularWhenShort = true } = options;
  const normalized = normalizeQuery(query);
  const tokens = normalized.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    if (includePopularWhenShort) {
      const suggestions = buildSuggestions();
      const byHref = new Map(suggestions.map((s) => [s.href, s]));
      return POPULAR_SUGGESTIONS.map((p) => byHref.get(p.href) ?? { ...p, keywords: [] }).slice(0, limit);
    }
    return [];
  }

  const suggestions = buildSuggestions();
  const scored = suggestions
    .map((s) => ({ s, score: scoreSuggestion(s, normalized, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  // Dedupe by href (keep highest score)
  const seen = new Set<string>();
  const result: RouteSuggestion[] = [];
  for (const { s } of scored) {
    if (seen.has(s.href)) continue;
    seen.add(s.href);
    result.push(s);
    if (result.length >= limit) break;
  }
  return result;
}
