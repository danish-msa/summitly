# Property Pages - All Available URLs

This document lists all the possible URL patterns you can access with the new property base page structure.

## Base URL Structure

All URLs follow the pattern: `/properties/[citySlug]/...`

**City Slug Format**: `{city-name}`
- Example: `toronto`, `vancouver`, `calgary`

---

## 1. Single Parameter Pages

**Route**: `/properties/[citySlug]/[slug]`

### Property Type Pages

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/homes` | `/properties/toronto/homes` | All homes for sale |
| `/properties/{citySlug}/houses` | `/properties/toronto/houses` | Houses for sale |
| `/properties/{citySlug}/condos` | `/properties/toronto/condos` | Condos for sale |
| `/properties/{citySlug}/condo` | `/properties/toronto/condo` | Condos (singular) |
| `/properties/{citySlug}/townhouses` | `/properties/toronto/townhouses` | Townhouses for sale |
| `/properties/{citySlug}/townhouse` | `/properties/toronto/townhouse` | Townhouses (singular) |
| `/properties/{citySlug}/townhomes` | `/properties/toronto/townhomes` | Townhomes for sale |
| `/properties/{citySlug}/lofts` | `/properties/toronto/lofts` | Lofts for sale |
| `/properties/{citySlug}/loft` | `/properties/toronto/loft` | Lofts (singular) |
| `/properties/{citySlug}/semi-detached` | `/properties/toronto/semi-detached` | Semi-detached homes |
| `/properties/{citySlug}/semi-detached-homes` | `/properties/toronto/semi-detached-homes` | Semi-detached homes (full) |
| `/properties/{citySlug}/detached` | `/properties/toronto/detached` | Detached homes |
| `/properties/{citySlug}/detached-homes` | `/properties/toronto/detached-homes` | Detached homes (full) |

### Price Range Pages

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/under-400000` | `/properties/toronto/under-400000` | Homes under $400,000 |
| `/properties/{citySlug}/under-500000` | `/properties/toronto/under-500000` | Homes under $500,000 |
| `/properties/{citySlug}/under-700000` | `/properties/toronto/under-700000` | Homes under $700,000 |
| `/properties/{citySlug}/under-1000000` | `/properties/toronto/under-1000000` | Homes under $1,000,000 |
| `/properties/{citySlug}/over-1000000` | `/properties/toronto/over-1000000` | Homes over $1,000,000 |
| `/properties/{citySlug}/over-2000000` | `/properties/toronto/over-2000000` | Luxury homes over $2,000,000 |
| `/properties/{citySlug}/400000-600000` | `/properties/toronto/400000-600000` | Homes $400K-$600K |
| `/properties/{citySlug}/600000-800000` | `/properties/toronto/600000-800000` | Homes $600K-$800K |
| `/properties/{citySlug}/1000000-1500000` | `/properties/toronto/1000000-1500000` | Homes $1M-$1.5M |

### Bedroom Pages

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/1-bedroom` | `/properties/toronto/1-bedroom` | 1-bedroom homes |
| `/properties/{citySlug}/2-bedroom` | `/properties/toronto/2-bedroom` | 2-bedroom homes |
| `/properties/{citySlug}/3-bedroom` | `/properties/toronto/3-bedroom` | 3-bedroom homes |
| `/properties/{citySlug}/4-bedroom` | `/properties/toronto/4-bedroom` | 4-bedroom homes |
| `/properties/{citySlug}/5-bedroom` | `/properties/toronto/5-bedroom` | 5+ bedroom homes |
| `/properties/{citySlug}/5-plus-bedroom` | `/properties/toronto/5-plus-bedroom` | 5+ bedroom homes (explicit) |

### Bathroom Pages

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/1-bathroom` | `/properties/toronto/1-bathroom` | 1-bathroom homes |
| `/properties/{citySlug}/2-bathroom` | `/properties/toronto/2-bathroom` | 2-bathroom homes |
| `/properties/{citySlug}/3-bathroom` | `/properties/toronto/3-bathroom` | 3-bathroom homes |
| `/properties/{citySlug}/4-bathroom` | `/properties/toronto/4-bathroom` | 4-bathroom homes |
| `/properties/{citySlug}/5-bathroom` | `/properties/toronto/5-bathroom` | 5+ bathroom homes |
| `/properties/{citySlug}/5-plus-bathroom` | `/properties/toronto/5-plus-bathroom` | 5+ bathroom homes (explicit) |

### Size (Square Footage) Pages

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/under-600-sqft` | `/properties/toronto/under-600-sqft` | Homes under 600 sq ft |
| `/properties/{citySlug}/over-1000-sqft` | `/properties/toronto/over-1000-sqft` | Homes over 1,000 sq ft |
| `/properties/{citySlug}/1000-1500-sqft` | `/properties/toronto/1000-1500-sqft` | Homes 1,000-1,500 sq ft |
| `/properties/{citySlug}/2000-3000-sqft` | `/properties/toronto/2000-3000-sqft` | Homes 2,000-3,000 sq ft |
| `/properties/{citySlug}/small-condos` | `/properties/toronto/small-condos` | Small condos (under 600 sq ft) |
| `/properties/{citySlug}/large-condos` | `/properties/toronto/large-condos` | Large condos (over 1,000 sq ft) |

### Lot Size Pages

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/large-lots` | `/properties/toronto/large-lots` | Homes on large lots |
| `/properties/{citySlug}/1-plus-acre` | `/properties/toronto/1-plus-acre` | Homes on 1+ acre |
| `/properties/{citySlug}/5-plus-acres` | `/properties/toronto/5-plus-acres` | Homes on 5+ acres |

### Year Built / Age Pages

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/new-homes` | `/properties/toronto/new-homes` | New homes (built in last 5 years) |
| `/properties/{citySlug}/0-5-years-old` | `/properties/toronto/0-5-years-old` | Homes 0-5 years old |
| `/properties/{citySlug}/renovated-homes` | `/properties/toronto/renovated-homes` | Renovated homes |
| `/properties/{citySlug}/heritage-homes` | `/properties/toronto/heritage-homes` | Heritage homes (50+ years old) |
| `/properties/{citySlug}/mid-century-homes` | `/properties/toronto/mid-century-homes` | Mid-century homes |

### Ownership / Fee Structure Pages

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/freehold-townhomes` | `/properties/toronto/freehold-townhomes` | Freehold townhomes |
| `/properties/{citySlug}/freehold-houses` | `/properties/toronto/freehold-houses` | Freehold houses |
| `/properties/{citySlug}/low-maintenance-fees` | `/properties/toronto/low-maintenance-fees` | Condos with low maintenance fees (under $400/month) |
| `/properties/{citySlug}/no-amenities` | `/properties/toronto/no-amenities` | Condos with no amenities (lower fees) |

### Feature-Based Pages

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/finished-basement` | `/properties/toronto/finished-basement` | Homes with finished basement |
| `/properties/{citySlug}/walkout-basement` | `/properties/toronto/walkout-basement` | Homes with walkout basement |
| `/properties/{citySlug}/swimming-pool` | `/properties/toronto/swimming-pool` | Homes with swimming pool |
| `/properties/{citySlug}/in-ground-pool` | `/properties/toronto/in-ground-pool` | Homes with in-ground pool |
| `/properties/{citySlug}/2-car-garage` | `/properties/toronto/2-car-garage` | Homes with 2-car garage |
| `/properties/{citySlug}/hardwood-floors` | `/properties/toronto/hardwood-floors` | Homes with hardwood floors |
| `/properties/{citySlug}/fireplace` | `/properties/toronto/fireplace` | Homes with fireplace |
| `/properties/{citySlug}/balcony` | `/properties/toronto/balcony` | Condos with balcony |
| `/properties/{citySlug}/city-view` | `/properties/toronto/city-view` | Homes with city view |
| `/properties/{citySlug}/lake-view` | `/properties/toronto/lake-view` | Homes with lake view |
| `/properties/{citySlug}/corner-lots` | `/properties/toronto/corner-lots` | Homes on corner lots |
| `/properties/{citySlug}/cul-de-sac` | `/properties/toronto/cul-de-sac` | Homes on cul-de-sac |

### Status / Time-Based Pages

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/new-listings` | `/properties/toronto/new-listings` | New listings |
| `/properties/{citySlug}/last-24-hours` | `/properties/toronto/last-24-hours` | Listings from last 24 hours |
| `/properties/{citySlug}/last-3-days` | `/properties/toronto/last-3-days` | Listings from last 3 days |
| `/properties/{citySlug}/last-7-days` | `/properties/toronto/last-7-days` | Listings from last 7 days |
| `/properties/{citySlug}/open-houses` | `/properties/toronto/open-houses` | Open houses |
| `/properties/{citySlug}/price-reduced` | `/properties/toronto/price-reduced` | Price-reduced homes |
| `/properties/{citySlug}/back-on-market` | `/properties/toronto/back-on-market` | Back-on-market homes |

---

## 2. Two Parameter Pages (Combinations)

**Route**: `/properties/[citySlug]/[slug]/[slug2]`

### Property Type + Price Range

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/condos/under-500000` | `/properties/toronto/condos/under-500000` | Condos under $500K |
| `/properties/{citySlug}/condos/under-700000` | `/properties/toronto/condos/under-700000` | Condos under $700K |
| `/properties/{citySlug}/townhouses/under-800000` | `/properties/toronto/townhouses/under-800000` | Townhouses under $800K |
| `/properties/{citySlug}/detached-homes/under-1200000` | `/properties/toronto/detached-homes/under-1200000` | Detached homes under $1.2M |
| `/properties/{citySlug}/condos/600000-800000` | `/properties/toronto/condos/600000-800000` | Condos $600K-$800K |
| `/properties/{citySlug}/houses/1000000-1500000` | `/properties/toronto/houses/1000000-1500000` | Houses $1M-$1.5M |
| `/properties/{citySlug}/homes/over-2000000` | `/properties/toronto/homes/over-2000000` | Luxury homes over $2M |

### Property Type + Bedrooms

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/condos/1-bedroom` | `/properties/toronto/condos/1-bedroom` | 1-bedroom condos |
| `/properties/{citySlug}/condos/2-bedroom` | `/properties/toronto/condos/2-bedroom` | 2-bedroom condos |
| `/properties/{citySlug}/condos/3-bedroom` | `/properties/toronto/condos/3-bedroom` | 3-bedroom condos |
| `/properties/{citySlug}/houses/1-bedroom` | `/properties/toronto/houses/1-bedroom` | 1-bedroom houses |
| `/properties/{citySlug}/houses/2-bedroom` | `/properties/toronto/houses/2-bedroom` | 2-bedroom houses |
| `/properties/{citySlug}/houses/3-bedroom` | `/properties/toronto/houses/3-bedroom` | 3-bedroom houses |
| `/properties/{citySlug}/houses/4-bedroom` | `/properties/toronto/houses/4-bedroom` | 4-bedroom houses |
| `/properties/{citySlug}/townhouses/2-bedroom` | `/properties/toronto/townhouses/2-bedroom` | 2-bedroom townhouses |
| `/properties/{citySlug}/townhouses/3-bedroom` | `/properties/toronto/townhouses/3-bedroom` | 3-bedroom townhouses |

### Property Type + Bathrooms

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/condos/1-bathroom` | `/properties/toronto/condos/1-bathroom` | 1-bathroom condos |
| `/properties/{citySlug}/condos/2-bathroom` | `/properties/toronto/condos/2-bathroom` | 2-bathroom condos |
| `/properties/{citySlug}/condos/3-bathroom` | `/properties/toronto/condos/3-bathroom` | 3-bathroom condos |
| `/properties/{citySlug}/houses/1-bathroom` | `/properties/toronto/houses/1-bathroom` | 1-bathroom houses |
| `/properties/{citySlug}/houses/2-bathroom` | `/properties/toronto/houses/2-bathroom` | 2-bathroom houses |
| `/properties/{citySlug}/houses/3-bathroom` | `/properties/toronto/houses/3-bathroom` | 3-bathroom houses |
| `/properties/{citySlug}/houses/4-bathroom` | `/properties/toronto/houses/4-bathroom` | 4-bathroom houses |
| `/properties/{citySlug}/townhouses/2-bathroom` | `/properties/toronto/townhouses/2-bathroom` | 2-bathroom townhouses |
| `/properties/{citySlug}/townhouses/3-bathroom` | `/properties/toronto/townhouses/3-bathroom` | 3-bathroom townhouses |

### Price Range + Bedrooms

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/under-800000/3-bedroom` | `/properties/toronto/under-800000/3-bedroom` | 3-bedroom homes under $800K |
| `/properties/{citySlug}/under-600000/2-bedroom` | `/properties/toronto/under-600000/2-bedroom` | 2-bedroom homes under $600K |
| `/properties/{citySlug}/600000-800000/2-bedroom` | `/properties/toronto/600000-800000/2-bedroom` | 2-bedroom homes $600K-$800K |
| `/properties/{citySlug}/1000000-1500000/3-bedroom` | `/properties/toronto/1000000-1500000/3-bedroom` | 3-bedroom homes $1M-$1.5M |

### Price Range + Bathrooms

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/under-800000/3-bathroom` | `/properties/toronto/under-800000/3-bathroom` | 3-bathroom homes under $800K |
| `/properties/{citySlug}/under-600000/2-bathroom` | `/properties/toronto/under-600000/2-bathroom` | 2-bathroom homes under $600K |
| `/properties/{citySlug}/600000-800000/2-bathroom` | `/properties/toronto/600000-800000/2-bathroom` | 2-bathroom homes $600K-$800K |
| `/properties/{citySlug}/1000000-1500000/3-bathroom` | `/properties/toronto/1000000-1500000/3-bathroom` | 3-bathroom homes $1M-$1.5M |

### Property Type + Square Footage

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/condos/under-600-sqft` | `/properties/toronto/condos/under-600-sqft` | Small condos under 600 sq ft |
| `/properties/{citySlug}/condos/over-1000-sqft` | `/properties/toronto/condos/over-1000-sqft` | Large condos over 1,000 sq ft |
| `/properties/{citySlug}/houses/1000-1500-sqft` | `/properties/toronto/houses/1000-1500-sqft` | Houses 1,000-1,500 sq ft |

### Property Type + Lot Size

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/houses/large-lots` | `/properties/toronto/houses/large-lots` | Houses on large lots |
| `/properties/{citySlug}/houses/1-plus-acre` | `/properties/toronto/houses/1-plus-acre` | Houses on 1+ acre |

### Property Type + Year Built

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/condos/new-homes` | `/properties/toronto/condos/new-homes` | New condos (built in last 5 years) |
| `/properties/{citySlug}/houses/renovated-homes` | `/properties/toronto/houses/renovated-homes` | Renovated houses |

### Property Type + Features

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/condos/balcony` | `/properties/toronto/condos/balcony` | Condos with balcony |
| `/properties/{citySlug}/houses/swimming-pool` | `/properties/toronto/houses/swimming-pool` | Houses with swimming pool |
| `/properties/{citySlug}/houses/2-car-garage` | `/properties/toronto/houses/2-car-garage` | Houses with 2-car garage |

### Price Range + Square Footage

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/under-500000/1000-1500-sqft` | `/properties/toronto/under-500000/1000-1500-sqft` | Homes under $500K, 1,000-1,500 sq ft |
| `/properties/{citySlug}/under-800000/over-1000-sqft` | `/properties/toronto/under-800000/over-1000-sqft` | Homes under $800K, over 1,000 sq ft |

### Price Range + Features

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/under-500000/swimming-pool` | `/properties/toronto/under-500000/swimming-pool` | Homes under $500K with pool |
| `/properties/{citySlug}/over-1000000/city-view` | `/properties/toronto/over-1000000/city-view` | Luxury homes over $1M with city view |

---

## 3. Three Parameter Pages (Full Combinations)

**Route**: `/properties/[citySlug]/[slug]/[slug2]/[slug3]`

### Property Type + Price Range + Bedrooms

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/condos/under-500000/2-bedroom` | `/properties/toronto/condos/under-500000/2-bedroom` | 2-bedroom condos under $500K |
| `/properties/{citySlug}/condos/under-600000/1-bedroom` | `/properties/toronto/condos/under-600000/1-bedroom` | 1-bedroom condos under $600K |
| `/properties/{citySlug}/townhouses/under-800000/3-bedroom` | `/properties/toronto/townhouses/under-800000/3-bedroom` | 3-bedroom townhouses under $800K |
| `/properties/{citySlug}/houses/under-1200000/4-bedroom` | `/properties/toronto/houses/under-1200000/4-bedroom` | 4-bedroom houses under $1.2M |
| `/properties/{citySlug}/condos/600000-800000/2-bedroom` | `/properties/toronto/condos/600000-800000/2-bedroom` | 2-bedroom condos $600K-$800K |
| `/properties/{citySlug}/houses/1000000-1500000/3-bedroom` | `/properties/toronto/houses/1000000-1500000/3-bedroom` | 3-bedroom houses $1M-$1.5M |

### Property Type + Price Range + Bathrooms

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/condos/under-500000/2-bathroom` | `/properties/toronto/condos/under-500000/2-bathroom` | 2-bathroom condos under $500K |
| `/properties/{citySlug}/condos/under-600000/1-bathroom` | `/properties/toronto/condos/under-600000/1-bathroom` | 1-bathroom condos under $600K |
| `/properties/{citySlug}/townhouses/under-800000/3-bathroom` | `/properties/toronto/townhouses/under-800000/3-bathroom` | 3-bathroom townhouses under $800K |
| `/properties/{citySlug}/houses/under-1200000/4-bathroom` | `/properties/toronto/houses/under-1200000/4-bathroom` | 4-bathroom houses under $1.2M |
| `/properties/{citySlug}/condos/600000-800000/2-bathroom` | `/properties/toronto/condos/600000-800000/2-bathroom` | 2-bathroom condos $600K-$800K |
| `/properties/{citySlug}/houses/1000000-1500000/3-bathroom` | `/properties/toronto/houses/1000000-1500000/3-bathroom` | 3-bathroom houses $1M-$1.5M |

### Property Type + Price Range + Square Footage

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/condos/under-500000/1000-1500-sqft` | `/properties/toronto/condos/under-500000/1000-1500-sqft` | Condos under $500K, 1,000-1,500 sq ft |
| `/properties/{citySlug}/houses/under-800000/over-1000-sqft` | `/properties/toronto/houses/under-800000/over-1000-sqft` | Houses under $800K, over 1,000 sq ft |

### Property Type + Price Range + Features

| URL Pattern | Example | Description |
|------------|---------|-------------|
| `/properties/{citySlug}/condos/under-500000/balcony` | `/properties/toronto/condos/under-500000/balcony` | Condos under $500K with balcony |
| `/properties/{citySlug}/houses/over-1000000/swimming-pool` | `/properties/toronto/houses/over-1000000/swimming-pool` | Luxury houses over $1M with pool |
| `/properties/{citySlug}/houses/under-800000/2-car-garage` | `/properties/toronto/houses/under-800000/2-car-garage` | Houses under $800K with 2-car garage |

---

## Quick Test URLs (Toronto)

Here are some ready-to-use URLs you can test right now:

### Single Parameter
- `/properties/toronto/houses`
- `/properties/toronto/condos`
- `/properties/toronto/townhouses`
- `/properties/toronto/under-500000`
- `/properties/toronto/under-1000000`
- `/properties/toronto/over-2000000`
- `/properties/toronto/1-bedroom`
- `/properties/toronto/2-bedroom`
- `/properties/toronto/3-bedroom`
- `/properties/toronto/1-bathroom`
- `/properties/toronto/2-bathroom`
- `/properties/toronto/3-bathroom`

### Two Parameters
- `/properties/toronto/condos/under-500000`
- `/properties/toronto/townhouses/under-800000`
- `/properties/toronto/condos/2-bedroom`
- `/properties/toronto/houses/3-bedroom`
- `/properties/toronto/condos/2-bathroom`
- `/properties/toronto/houses/3-bathroom`
- `/properties/toronto/under-800000/3-bedroom`
- `/properties/toronto/under-800000/3-bathroom`

### Three Parameters
- `/properties/toronto/condos/under-500000/2-bedroom`
- `/properties/toronto/townhouses/under-800000/3-bedroom`
- `/properties/toronto/houses/under-1200000/4-bedroom`
- `/properties/toronto/condos/under-500000/2-bathroom`
- `/properties/toronto/townhouses/under-800000/3-bathroom`
- `/properties/toronto/houses/under-1200000/4-bathroom`

---

## Notes

1. **City Slug**: Use just the city name (e.g., `toronto`, `vancouver`, `calgary`)
2. **Price Formats**:
   - Under: `under-{amount}` (no commas, no dollar sign)
   - Over: `over-{amount}`
   - Range: `{min}-{max}` (no commas, no dollar signs)
3. **Bedroom Format**: `{number}-bedroom` or `5-plus-bedroom` for 5+
4. **Bathroom Format**: `{number}-bathroom` or `5-plus-bathroom` for 5+
5. **Square Footage Format**: `under-{amount}-sqft`, `over-{amount}-sqft`, or `{min}-{max}-sqft`
6. **Lot Size Format**: `large-lots`, `{number}-plus-acre`, or `{number}-plus-acres`
7. **Year Built Format**: `new-homes`, `0-5-years-old`, `renovated-homes`, `heritage-homes`, `mid-century-homes`
8. **Ownership Format**: `freehold-{type}`, `low-maintenance-fees`, `no-amenities`
9. **Feature Format**: Use kebab-case (e.g., `swimming-pool`, `2-car-garage`, `city-view`)
10. **Status Format**: `new-listings`, `last-{number}-hours`, `last-{number}-days`, `open-houses`, `price-reduced`, `back-on-market`
11. **Property Types**: Use plural forms (condos, houses, townhouses) or singular (condo, house, townhouse) - both work
12. **Order Matters**: For combinations, the order should be: `propertyType/priceRange/filter` (e.g., `condos/under-500000/2-bedroom`)

---

## Total Count

- **Single Parameter Pages**: ~100+ variations (including all filter types)
- **Two Parameter Pages**: ~200+ combinations (including all filter types)
- **Three Parameter Pages**: ~150+ combinations (including all filter types)
- **Total**: 450+ unique URL patterns per city

## Feature Reference

### Available Features

**Basement Features:**
- `finished-basement`, `walkout-basement`, `separate-entrance`, `legal-basement-apartment`, `in-law-suite`, `secondary-suite`, `mortgage-helper`

**Pool Features:**
- `swimming-pool`, `in-ground-pool`, `above-ground-pool`, `hot-tub`

**Yard/Lot Features:**
- `big-backyard`, `fenced-yard`, `ravine-lots`, `corner-lots`, `cul-de-sac`, `backing-onto-park`

**View Features:**
- `city-view`, `lake-view`

**Parking/Garage:**
- `1-car-garage`, `2-car-garage`, `3-car-garage`, `detached-garage`, `tandem-parking`

**Interior Features:**
- `hardwood-floors`, `open-concept-layout`, `high-ceilings`, `gas-stove`, `chefs-kitchen`, `fireplace`

**Condo Features:**
- `balcony`, `terrace`, `locker`, `parking-included`

**Accessibility:**
- `accessible-homes`, `wheelchair-friendly`, `one-storey-homes`, `bungalows-for-seniors`

