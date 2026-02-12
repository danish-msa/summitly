# Buy / Rent / Pre-Con Routing Structure

This document lists **every possible URL structure** for `/buy/`, `/rent/`, and `/pre-con/` pages.

## Overview

- **Buy**: `src/app/buy/[...segments]/page.tsx` + `src/app/buy/page.tsx` (index)
- **Rent**: `src/app/rent/[...segments]/page.tsx` + `src/app/rent/page.tsx` (index)
- **Pre-Con**: `src/app/pre-con/[...segments]/page.tsx`, `src/app/pre-con/[slug]/[unitId]/page.tsx`, plus index/cities/projects

All listing routes use the catch-all `[...segments]`. The first segment is **city slug** or **zipcode/postal code** for buy/rent; for pre-con the first segment can be city, zipcode, property type, status, or year.

---

## Zipcode / Postal Code URLs

Buy, rent, and pre-con support **zipcode (postal code)** as the first segment instead of a city slug. Repliers listing data includes `address.zip` (see `src/lib/api/repliers/types/single-listing.ts`, `src/data/types.ts`); filtering by zip/postal can be passed through to the listings API where supported.

### Zipcode format in URLs

- **Canadian:** `A1A1A1` (no space) or `A1A-1A1` (with hyphen). Example: `M5H2N2`, `M5H-2N2`.
- **US:** `12345` (5-digit) or `12345-6789` (ZIP+4). Example: `90210`.

For routing, the first segment is treated as a zipcode when it matches:

- Canadian: 3 letters + 3 alphanumeric (e.g. `M5H2N2`, `K1A0B1`), optionally with hyphen `A1A-1A1`.
- US: 5 digits, or 5 digits + hyphen + 4 digits.

Otherwise the first segment is treated as a city slug (e.g. `toronto`, `brampton`).

### Buy – Zipcode URL structures

| URL | Description |
|-----|-------------|
| `/buy/M5H2N2` | All properties for sale in that postal code |
| `/buy/90210` | All properties for sale in that ZIP code |
| `/buy/M5H2N2/condos` | Condos for sale in that postal code |
| `/buy/M5H2N2/under-500000` | Under $500K in that postal code |
| `/buy/M5H2N2/under-500000/2-bedroom` | Under $500K, 2 bedroom, in that postal code |
| `/buy/M5H2N2/downtown` | Area/neighbourhood “downtown” within that postal code (if supported) |
| `/buy/M5H2N2/downtown/2-bedroom` | Downtown + 2 bedroom in that postal code |
| `/buy/{zipcode}/{filter-slug}` | Zipcode + any single filter (property type, price, bedrooms, etc.) |
| `/buy/{zipcode}/{filter1}/{filter2}` | Zipcode + two filters (e.g. property type + bedrooms, or price + bedrooms) |
| `/buy/{zipcode}/{area}/{filter}` | Zipcode + area/neighbourhood + filter |

Same combinations as city-based URLs apply: property type, price, bedrooms, bathrooms, sqft, lot size, year built, ownership, feature, status; and multi-segment combos (e.g. type + price + bedrooms).

### Rent – Zipcode URL structures

| URL | Description |
|-----|-------------|
| `/rent/M5H2N2` | All rentals in that postal code |
| `/rent/90210` | All rentals in that ZIP code |
| `/rent/M5H2N2/condos` | Condos for rent in that postal code |
| `/rent/M5H2N2/under-500000/2-bedroom` | Under $500K, 2 bedroom, for rent |
| `/rent/M5H2N2/downtown/2-bedroom` | Downtown + 2 bedroom for rent |
| `/rent/{zipcode}/{filter-slug}` | Zipcode + any single filter |
| `/rent/{zipcode}/{filter1}/{filter2}` | Zipcode + two filters |
| `/rent/{zipcode}/{area}/{filter}` | Zipcode + area + filter |

### Pre-Con – Zipcode URL structures

| URL | Description |
|-----|-------------|
| `/pre-con/M5H2N2` | Pre-construction projects in that postal code |
| `/pre-con/M5H2N2/condos` | Pre-con condos in that postal code |
| `/pre-con/M5H2N2/selling` | Pre-con selling in that postal code |
| `/pre-con/M5H2N2/2025` | Pre-con in that postal code completing 2025 |
| `/pre-con/{zipcode}/{property-type-or-status-or-year}` | Zipcode + one of: property type, status, or completion year |

### Repliers data and configuration

- **Listing address:** Repliers single-listing and listing list responses include `address.zip` (and brokerage `postal` where applicable). See `src/lib/api/repliers/types/single-listing.ts` (`PropertyAddress`), `src/data/types.ts`, and `src/lib/api/repliers/services/listings.ts` (address formatting and mapping).
- **Filtering by zip:** When the first segment is identified as a zipcode, the app can pass it to the listings API (e.g. as `zip` or the parameter name Repliers uses for postal/zip filter). `ListingsParams` in `src/lib/api/repliers/services/listings.ts` supports pass-through of additional params; add zip/postal there when implementing server-side filtering.
- **Locations API:** Repliers Locations API uses `type: 'area' | 'city' | 'neighborhood'`; postal/zip is not a location type there but is on listing addresses. Zipcode-based pages therefore rely on listing filters (e.g. by `address.zip`) rather than location IDs.

---

## Buy – Every Possible URL Structure

**Base:** `/buy` (index), `/buy/[city-or-zipcode]/[filters...]`

### 1. City or zipcode only
| URL | Description |
|-----|-------------|
| `/buy/toronto` | All properties for sale in Toronto |
| `/buy/brampton` | All properties for sale in Brampton |
| `/buy/{city-slug}` | All properties for sale in that city |
| `/buy/M5H2N2` | All properties for sale in that postal code |
| `/buy/90210` | All properties for sale in that ZIP code |
| `/buy/{zipcode}` | All properties for sale in that zip/postal code (see Zipcode / Postal Code URLs) |

### 2. City + single filter (1 segment after city)

#### 2a. Property type only
| URL | Description |
|-----|-------------|
| `/buy/toronto/condos` | Condos for sale |
| `/buy/toronto/houses` | Houses for sale |
| `/buy/toronto/townhouses` | Townhouses for sale |
| `/buy/toronto/lofts` | Lofts for sale |
| `/buy/toronto/semi-detached` | Semi-detached for sale |
| `/buy/toronto/detached` | Detached for sale |
| `/buy/toronto/homes` | Same as detached |
| `/buy/toronto/condo-townhouses` | Condo townhouses |
| `/buy/toronto/row-houses` | Row houses |
| `/buy/{city}/{property-type-slug}` | Any supported property type |

#### 2b. Price only
| URL | Description |
|-----|-------------|
| `/buy/toronto/under-400000` | Under $400K |
| `/buy/toronto/under-500000` | Under $500K |
| `/buy/toronto/under-700000` | Under $700K |
| `/buy/toronto/under-1000000` | Under $1M |
| `/buy/toronto/over-1000000` | Over $1M |
| `/buy/toronto/over-2000000` | Over $2M (luxury) |
| `/buy/toronto/400000-600000` | $400K–$600K range |
| `/buy/toronto/600000-800000` | $600K–$800K |
| `/buy/toronto/1000000-1500000` | $1M–$1.5M |
| `/buy/{city}/under-{amount}` | Any under-X |
| `/buy/{city}/over-{amount}` | Any over-X |
| `/buy/{city}/{min}-{max}` | Any numeric range |

#### 2c. Bedrooms only
| URL | Description |
|-----|-------------|
| `/buy/toronto/1-bedroom` | 1 bedroom |
| `/buy/toronto/2-bedroom` | 2 bedroom |
| `/buy/toronto/3-bedroom` | 3 bedroom |
| `/buy/toronto/4-bedroom` | 4 bedroom |
| `/buy/toronto/5-bedroom` | 5 bedroom |
| `/buy/toronto/5-plus-bedroom` | 5+ bedroom |
| `/buy/toronto/1-beds` | 1 bed (alias) |
| `/buy/{city}/{n}-bedroom` or `{n}-plus-bedroom` | Any bedroom slug |

#### 2d. Bathrooms only
| URL | Description |
|-----|-------------|
| `/buy/toronto/1-bathroom` | 1 bathroom |
| `/buy/toronto/2-bathroom` | 2 bathroom |
| `/buy/toronto/3-bathroom` | … |
| `/buy/toronto/5-plus-bathroom` | 5+ bathroom |
| `/buy/{city}/{n}-bathroom` or `{n}-baths` | Any bathroom slug |

#### 2e. Square footage only
| URL | Description |
|-----|-------------|
| `/buy/toronto/under-600-sqft` | Under 600 sq ft |
| `/buy/toronto/over-1000-sqft` | Over 1,000 sq ft |
| `/buy/toronto/1000-1500-sqft` | 1,000–1,500 sq ft |
| `/buy/toronto/small-condos` | Small condos (under 600) |
| `/buy/toronto/large-condos` | Large condos (over 1,000) |
| `/buy/{city}/{min}-{max}-sqft` | Any sqft range |

#### 2f. Lot size only
| URL | Description |
|-----|-------------|
| `/buy/toronto/large-lots` | Large lots |
| `/buy/toronto/1-plus-acre` | 1+ acre |
| `/buy/toronto/5-plus-acres` | 5+ acres |
| `/buy/{city}/{n}-plus-acre` | Dynamic acre slug |

#### 2g. Year built / age only
| URL | Description |
|-----|-------------|
| `/buy/toronto/new-homes` | New (last 5 years) |
| `/buy/toronto/0-5-years-old` | 0–5 years old |
| `/buy/toronto/renovated-homes` | Renovated |
| `/buy/toronto/heritage-homes` | Heritage (50+ years) |
| `/buy/toronto/mid-century-homes` | Mid-century |

#### 2h. Ownership / fees only
| URL | Description |
|-----|-------------|
| `/buy/toronto/freehold-townhomes` | Freehold townhomes |
| `/buy/toronto/freehold-houses` | Freehold houses |
| `/buy/toronto/low-maintenance-fees` | Low maintenance fees |
| `/buy/toronto/no-amenities` | No amenities |

#### 2i. Feature only
| URL | Description |
|-----|-------------|
| `/buy/toronto/swimming-pool` | Swimming pool |
| `/buy/toronto/2-car-garage` | 2-car garage |
| `/buy/toronto/balcony` | Balcony |
| `/buy/toronto/city-view` | City view |
| `/buy/toronto/fireplace` | Fireplace |
| `/buy/toronto/finished-basement` | Finished basement |
| `/buy/toronto/hardwood-floors` | Hardwood floors |
| `/buy/toronto/open-concept-layout` | Open concept |
| … (see Supported Filters – Features below) | |

#### 2j. Status / time only
| URL | Description |
|-----|-------------|
| `/buy/toronto/new-listings` | New listings |
| `/buy/toronto/last-24-hours` | Last 24 hours |
| `/buy/toronto/last-3-days` | Last 3 days |
| `/buy/toronto/last-7-days` | Last 7 days |
| `/buy/toronto/open-houses` | Open houses |
| `/buy/toronto/price-reduced` | Price reduced |
| `/buy/toronto/back-on-market` | Back on market |
| `/buy/toronto/recently-sold` | Recently sold |
| `/buy/toronto/last-{n}-days` | Dynamic days |

### 3. City + neighbourhood/area (2nd segment = location, not filter)
| URL | Description |
|-----|-------------|
| `/buy/toronto/downtown` | Downtown Toronto (neighbourhood) |
| `/buy/toronto/{area-slug}` | Any area/neighbourhood/intersection |

### 4. City + neighbourhood + filters
| URL | Description |
|-----|-------------|
| `/buy/toronto/downtown/condos` | Condos in Downtown |
| `/buy/toronto/downtown/2-bedroom` | 2 bedroom in Downtown |
| `/buy/toronto/{area}/{filter-slug}` | Area + one filter |
| `/buy/toronto/{area}/{filter1}/{filter2}` | Area + multiple filters (where supported) |

### 5. City + two filters (property type + filter)
| URL | Description |
|-----|-------------|
| `/buy/toronto/condos/under-500000` | Condos under $500K |
| `/buy/toronto/condos/2-bedroom` | 2-bedroom condos |
| `/buy/toronto/condos/2-bathroom` | 2-bathroom condos |
| `/buy/toronto/condos/under-600-sqft` | Condos under 600 sq ft |
| `/buy/toronto/semi-detached/2-bedroom` | 2-bedroom semi-detached |
| `/buy/toronto/detached/3-bedroom` | 3-bedroom detached |
| `/buy/toronto/houses/swimming-pool` | Houses with pool |
| `/buy/{city}/{property-type}/{filter-slug}` | Any property type + one filter |

### 6. City + two filters (price + filter)
| URL | Description |
|-----|-------------|
| `/buy/toronto/under-500000/2-bedroom` | Under $500K, 2 bedroom |
| `/buy/toronto/under-500000/2-bathroom` | Under $500K, 2 bathroom |
| `/buy/toronto/under-500000/over-1000-sqft` | Under $500K, over 1K sq ft |
| `/buy/toronto/under-500000/swimming-pool` | Under $500K, pool |
| `/buy/{city}/{price-slug}/{filter-slug}` | Price + one filter |

### 7. City + three filters (property type + price + filter)
| URL | Description |
|-----|-------------|
| `/buy/toronto/condos/under-500000/2-bedroom` | Condos under $500K, 2 bed |
| `/buy/toronto/condos/under-500000/2-bathroom` | Condos under $500K, 2 bath |
| `/buy/toronto/condos/under-500000/1000-1500-sqft` | Condos under $500K, sqft range |
| `/buy/toronto/condos/under-500000/fireplace` | Condos under $500K, fireplace |
| `/buy/{city}/{property-type}/{price-slug}/{filter-slug}` | Type + price + one filter |

---

## Rent – Every Possible URL Structure

**Base:** `/rent` (index) and `/rent/[city-or-zipcode]/[filters...]`

Rent uses the **same segment rules as Buy**. The first segment can be a **city slug** or a **zipcode** (see Zipcode / Postal Code URLs). Replace `/buy/` with `/rent/` and “for sale” with “for rent.”

### Summary of rent URL patterns
| Pattern | Example |
|--------|---------|
| City only | `/rent/toronto` |
| Zipcode only | `/rent/M5H2N2`, `/rent/90210` |
| City + property type | `/rent/toronto/condos`, `/rent/toronto/houses`, `/rent/toronto/semi-detached`, … |
| City + price | `/rent/toronto/under-500000`, `/rent/toronto/400000-600000`, … |
| City + bedrooms | `/rent/toronto/2-bedroom`, … |
| City + bathrooms | `/rent/toronto/2-bathroom`, … |
| City + sqft | `/rent/toronto/over-1000-sqft`, … |
| City + lot size | `/rent/toronto/large-lots`, … |
| City + year built | `/rent/toronto/new-homes`, … |
| City + ownership | `/rent/toronto/freehold-townhomes`, … |
| City + feature | `/rent/toronto/balcony`, … |
| City + status | `/rent/toronto/new-listings`, … |
| City + neighbourhood | `/rent/toronto/downtown` |
| City + neighbourhood + filters | `/rent/toronto/downtown/condos`, … |
| City + property type + filter | `/rent/toronto/condos/2-bedroom`, `/rent/toronto/detached/under-500000`, … |
| City + price + filter | `/rent/toronto/under-500000/2-bedroom`, … |
| City + property type + price + filter | `/rent/toronto/condos/under-500000/2-bedroom`, … |
| Zipcode + filters | `/rent/M5H2N2/under-500000/2-bedroom`, `/rent/M5H2N2/downtown/2-bedroom`, … |

---

## Pre-Con – Every Possible URL Structure

**Base:** `/pre-con` (index), `/pre-con/cities`, `/pre-con/projects`, plus catch-all and project/unit detail.

### 1. No segments (index)
| URL | Description |
|-----|-------------|
| `/pre-con` | Pre-construction index |

### 2. One segment – property type (no city)
| URL | Description |
|-----|-------------|
| `/pre-con/condos` | All pre-con condos |
| `/pre-con/houses` | All pre-con houses |
| `/pre-con/lofts` | All pre-con lofts |
| `/pre-con/master-planned-communities` | Master-planned communities |
| `/pre-con/multi-family` | Multi-family |
| `/pre-con/offices` | Offices |
| `/pre-con/high-rise-condos` | High-rise condos |
| `/pre-con/mid-rise-condos` | Mid-rise condos |
| `/pre-con/low-rise-condos` | Low-rise condos |
| `/pre-con/link-houses` | Link houses |
| `/pre-con/townhouse-houses` | Townhouse houses |
| `/pre-con/semi-detached-houses` | Semi-detached houses |
| `/pre-con/detached-houses` | Detached houses |

### 3. One segment – status (no city)
| URL | Description |
|-----|-------------|
| `/pre-con/selling` | Selling now |
| `/pre-con/coming-soon` | Coming soon |
| `/pre-con/sold-out` | Sold out |

### 4. One segment – completion year (no city)
| URL | Description |
|-----|-------------|
| `/pre-con/2025` | Completing 2025 |
| `/pre-con/2026` | Completing 2026 |
| `/pre-con/2027` | … |
| `/pre-con/{yyyy}` | Any year 2020–2100 |

### 5. One segment – project slug (detail page)
| URL | Description |
|-----|-------------|
| `/pre-con/{project-slug}` | Project detail (if not city/type/status/year) |

### 6. City or zipcode only
| URL | Description |
|-----|-------------|
| `/pre-con/toronto` | All pre-con in Toronto |
| `/pre-con/brampton` | All pre-con in Brampton |
| `/pre-con/{city-slug}` | Known pre-con city (see list below) |
| `/pre-con/M5H2N2` | Pre-con in that postal code |
| `/pre-con/{zipcode}` | Pre-con in that zip/postal code (see Zipcode / Postal Code URLs) |

### 7. City + property type
| URL | Description |
|-----|-------------|
| `/pre-con/toronto/condos` | Pre-con condos in Toronto |
| `/pre-con/toronto/houses` | Pre-con houses in Toronto |
| `/pre-con/toronto/high-rise-condos` | High-rise condos in Toronto |
| `/pre-con/{city}/{property-type-slug}` | City + any pre-con property type |

### 8. City + status
| URL | Description |
|-----|-------------|
| `/pre-con/toronto/selling` | Selling in Toronto |
| `/pre-con/toronto/coming-soon` | Coming soon in Toronto |
| `/pre-con/toronto/sold-out` | Sold out in Toronto |

### 9. City + completion year
| URL | Description |
|-----|-------------|
| `/pre-con/toronto/2025` | Toronto, completing 2025 |
| `/pre-con/toronto/2026` | Toronto, completing 2026 |
| `/pre-con/{city}/{yyyy}` | City + year |

### 10. Project + unit detail
| URL | Description |
|-----|-------------|
| `/pre-con/{project-slug}/{unitId}` | Unit detail within a project |

### Pre-con known city slugs (from preConCities)
- `toronto`, `brampton`, `hamilton`, `calgary`, `mississauga`, `oakville`, `milton`, `edmonton`

---

## Supported Filter Slugs (Buy & Rent)

### Property types (slug → API type)
| Slug(s) | Display |
|--------|---------|
| `condos`, `condo` | Condos |
| `houses`, `house`, `homes`, `detached`, `detached-homes` | Houses / Detached |
| `townhouses`, `townhouse`, `townhomes`, `row-houses`, `row-homes` | Townhouses |
| `condo-townhouses`, `condo-townhouse`, `condos-townhouse` | Condo Townhouse |
| `semi-detached`, `semi-detached-homes` | Semi-Detached |
| `lofts`, `loft` | Lofts |
| `duplex`, `triplex`, `multiplex` | Duplex / Triplex / Multiplex |

### Price ranges
- **Under:** `under-400000`, `under-500000`, `under-700000`, `under-1000000` (or any `under-{number}`)
- **Over:** `over-1000000`, `over-2000000` (or any `over-{number}`)
- **Range:** `400000-600000`, `600000-800000`, `1000000-1500000` (or any `{min}-{max}`)

### Bedrooms
- `1-bedroom`, `2-bedroom`, `3-bedroom`, `4-bedroom`, `5-bedroom`, `5-plus-bedroom`
- Aliases: `1-beds`, `2-beds`, … (same numeric + `-plus` pattern)

### Bathrooms
- `1-bathroom`, `2-bathroom`, `3-bathroom`, `4-bathroom`, `5-bathroom`, `5-plus-bathroom`
- Aliases: `1-baths`, `2-baths`, …

### Square footage
- `under-600-sqft`, `over-1000-sqft`, `1000-1500-sqft` (or any `under-{n}-sqft`, `over-{n}-sqft`, `{min}-{max}-sqft`)
- `small-condos`, `large-condos`

### Lot size
- `large-lots`, `1-plus-acre`, `5-plus-acres`, or `{n}-plus-acre`

### Year built / age
- `new-homes`, `0-5-years-old`, `renovated-homes`, `heritage-homes`, `mid-century-homes`

### Ownership / fees
- `freehold-townhomes`, `freehold-houses`, `low-maintenance-fees`, `no-amenities`

### Features (examples)
- Basement: `finished-basement`, `walkout-basement`, `separate-entrance`, `legal-basement-apartment`, `in-law-suite`, `secondary-suite`, `mortgage-helper`
- Pool: `swimming-pool`, `in-ground-pool`, `above-ground-pool`, `hot-tub`
- Lot: `big-backyard`, `fenced-yard`, `ravine-lots`, `corner-lots`, `cul-de-sac`, `backing-onto-park`
- View: `city-view`, `lake-view`
- Garage: `1-car-garage`, `2-car-garage`, `3-car-garage`, `detached-garage`, `tandem-parking`
- Interior: `hardwood-floors`, `open-concept-layout`, `high-ceilings`, `gas-stove`, `chefs-kitchen`, `fireplace`
- Condo: `balcony`, `terrace`, `locker`, `parking-included`
- Accessibility: `accessible-homes`, `wheelchair-friendly`, `one-storey-homes`, `bungalows-for-seniors`

### Status / time (buy/rent)
- `new-listings`, `last-24-hours`, `last-3-days`, `last-7-days`, `open-houses`, `this-weekend`, `price-reduced`, `back-on-market`, `recently-sold`
- Dynamic: `last-{n}-days`, `last-{n}-hours`

---

## Page Types (Internal)

The parser maps URL segments to a `PropertyPageType` (buy/rent):

- `by-location` — city only or city + neighbourhood
- `propertyType` — city + single property type
- `price-range` — city + price slug
- `bedrooms` — city + bedroom slug
- `bathrooms` — city + bathroom slug
- `sqft`, `lot-size`, `year-built`, `ownership`, `feature`, `status` — city + that filter
- `propertyType-price`, `propertyType-bedrooms`, `propertyType-bathrooms`, `propertyType-sqft`, `propertyType-lot-size`, `propertyType-year-built`, `propertyType-ownership`, `propertyType-feature` — city + type + filter
- `price-bedrooms`, `price-bathrooms`, `price-sqft`, `price-lot-size`, `price-year-built`, `price-feature` — city + price + filter
- `propertyType-price-bedrooms`, `propertyType-price-bathrooms`, `propertyType-price-sqft`, `propertyType-price-feature` — city + type + price + filter

---

## Related Files

- `src/app/buy/page.tsx`, `src/app/buy/[...segments]/page.tsx`
- `src/app/rent/page.tsx`, `src/app/rent/[...segments]/page.tsx`
- `src/app/pre-con/page.tsx`, `src/app/pre-con/[...segments]/page.tsx`, `src/app/pre-con/[slug]/[unitId]/page.tsx`
- `src/lib/utils/urlSegmentParser.ts` — segment parsing and page type (extend to treat first segment as zipcode when pattern matches)
- `src/lib/utils/locationDetection.ts` — neighbourhood/intersection
- `src/components/Properties/PropertyBasePage/utils.ts` — slug parsers and property type map
- `src/components/Properties/PropertyBasePage/types.ts` — PropertyPageType
- `src/components/Properties/PropertyBasePage/hooks.ts` — passes `city` to API; add `zip` when first segment is zipcode
- `src/components/PreCon/Search/preConSearchData.ts` — pre-con cities
- `src/lib/api/repliers/services/listings.ts` — `ListingsParams` (add zip/postal when supported), address has `zip`
- `src/lib/api/repliers/types/single-listing.ts` — `PropertyAddress.postal`, listing address fields
- `src/data/types.ts` — address `zip` in project data
