# Pre-Construction Project Field Mapping

This document maps all Prisma schema fields from `PreConstructionProject` to their corresponding UI sections in the PreConItem component.

## UI Sections Overview

1. **Banner** (Top section with project name, status, price)
2. **Breadcrumbs** (Navigation breadcrumbs)
3. **BannerGallery** (Image gallery)
4. **RightSidebar** (CTA sections)
5. **Description** (Project description section)
6. **Project Details** (Detailed project information)
7. **Pricing & Incentives** (Pricing information and promotions)
8. **Deposit Structure** (Payment schedule)
9. **Documents** (PDF documents)
10. **Available Units** (Individual unit listings)
11. **Project Amenities** (Amenities & Lifestyle section)
12. **Development Team** (Team members section)
13. **FAQ** (Frequently asked questions)
14. **Contact Section** (Contact form)

---

## Field Mappings by UI Section

### 1. Banner Section
**Component**: `src/components/Item/Banner/Banner.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `projectName` | Main heading (h1) | Line 139 |
| `status` | Status badge | Line 141-144 |
| `developer` | "by [developer]" link | Line 147 |
| `startingPrice` / `endingPrice` | Price display | Used for price range |
| `address.city` | Short address | Line 31-33 |
| `address.streetNumber` + `address.streetName` | Full address | Line 27-28 |
| `details.bedroomRange` | Bedrooms stat | Line 66-69 |
| `details.bathroomRange` | Bathrooms stat | Line 72-77 |
| `details.sqftRange` | Square feet stat | Line 79-86 |
| `completion.date` | Completion date | (If shown in banner) |

**Questions:**
- Should `avgPricePerSqft` be displayed in the banner?
- Should `completionProgress` be shown in the banner?

---

### 2. Breadcrumbs
**Component**: `src/components/PreConItem/Breadcrumbs.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `city` | Breadcrumb segment | |
| `state` | Breadcrumb segment | |
| `neighborhood` | Breadcrumb segment | (If available) |
| `propertyType` | Breadcrumb segment | (If shown) |

---

### 3. BannerGallery
**Component**: `src/components/Item/Banner/BannerGallery.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `images` (String[]) | Gallery images | Array of image URLs |

**Questions:**
- Should `videos` array be displayed in the gallery or separately?

---

### 4. RightSidebar
**Component**: `src/components/PreConItem/PreConItemBody/RightSidebar.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `projectName` | CTA text | Line 52, 66 |
| `developer` | CTA text | Line 66 |

**Currently Static:**
- "Request Further Info" button
- "Get First Access" CTA

---

### 5. Description Section
**Component**: `src/components/Item/ItemBody/Description.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `description` | Main description text | Line 12-13 |

**Missing from UI:**
- No specific fields mapped for bullet points (currently hardcoded)

---

### 6. Project Details Section
**Component**: `src/components/PreConItem/PreConItemBody/ProjectDetails.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `projectName` | "Project Name" detail | Line 214 |
| `developer` | "Developer" detail | Line 219 |
| `startingPrice` | "Starting Price" detail | Line 224-228 |
| `status` | "Status" detail | Line 233 |
| `completionDate` | "Completion Date" detail | Line 238 |
| `completionProgress` | "Progress" detail (as %) | Line 248 - **NEEDS MAPPING** |
| `bedroomRange` | "Bedroom Range" detail | Line 253 |
| `bathroomRange` | "Bathroom Range" detail | Line 258 |
| `sqftRange` | "Square Footage Range" detail | Line 263 |
| `totalUnits` | "Total Units" detail | Line 268 |
| `availableUnits` | "Available Units" detail | Line 273 |
| `features` (String[]) | "Project Features" badges | Line 304-347 |
| `storeys` | **NOT MAPPED** | Should be added |
| `height` | **NOT MAPPED** | Should be added |
| `propertyType` | **NOT MAPPED** | Should be added |
| `subPropertyType` | **NOT MAPPED** | Should be added |

**Development Team Subsection:**
| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `developerInfo` (JSON) | Developer tab | Line 412-490 |
| `architectInfo` (JSON) | Architect tab | Line 493+ |
| `interiorDesignerInfo` (JSON) | Interior Designer tab | |
| `builderInfo` (JSON) | Builder tab | |
| `landscapeArchitectInfo` (JSON) | Landscape Architect tab | |
| `marketingInfo` (JSON) | Marketing tab | |

**Questions:**
- How should `completionProgress` (0, 1, 2) be converted to percentage? 
  - 0 = Pre-construction (0%?)
  - 1 = Construction (50%?)
  - 2 = Complete (100%?)
- Should `storeys` and `height` be displayed in Project Details?
- Should `propertyType` and `subPropertyType` be shown?

---

### 7. Pricing & Incentives Section
**Component**: `src/components/PreConItem/PreConItemBody/PricingIncentives.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `startingPrice` | "1 Bed Starting From" | Line 73 |
| `endingPrice` | Used for 2 Bed calculation | Line 67 |
| `avgPricePerSqft` | "Price Per Sqft" / "Avg Price Per Sqft" | Line 75-77 - **NEEDS MAPPING** |
| `promotions` | "Limited Time Incentives" | Line 81-89 - **CURRENTLY HARDCODED** |

**Missing from UI:**
| Prisma Field | Should Display | Notes |
|-------------|---------------|-------|
| `parkingPrice` | Parking price | Not mapped |
| `parkingPriceDetail` | Parking price details | Not mapped |
| `lockerPrice` | Locker price | Not mapped |
| `lockerPriceDetail` | Locker price details | Not mapped |
| `assignmentFee` | Assignment fee | Not mapped |
| `developmentLevies` | Development levies | Not mapped |
| `developmentCharges` | Development charges | Not mapped |
| `maintenanceFeesPerSqft` | Maintenance fees | Not mapped |
| `maintenanceFeesDetail` | Maintenance fee details | Not mapped |
| `floorPremiums` | Floor premiums | Not mapped |

**Questions:**
- Should `avgPricePerSqft` be displayed directly instead of calculated?
- Should `promotions` be parsed from string and displayed as individual incentives?
- Where should parking/locker prices be displayed? (Pricing section or separate section?)
- Should maintenance fees be shown in Pricing section or Project Details?

---

### 8. Deposit Structure Section
**Component**: `src/components/PreConItem/PreConItemBody/DepositStructure.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `depositStructure` | Payment schedule text | Line 22, 49 |
| `completionDate` | Incentives expiry date | Line 26-33 - **DERIVED** |

**Questions:**
- Should `depositStructure` be parsed/formatted in a specific way?
- Is the incentives expiry date calculation correct? (Currently: "Apr 1, [year]")

---

### 9. Documents Section
**Component**: `src/components/PreConItem/PreConItemBody/ProjectDocuments.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `documents` (JSON String) | Document cards | Line 24 - **NEEDS PARSING** |

**Expected Document Structure:**
```typescript
{
  id: string;
  name: string;
  url: string;
  type: 'brochure' | 'floorplan' | 'specification' | 'contract' | 'other';
  size?: string;
  uploadedDate?: string;
}
```

**Questions:**
- Is `documents` stored as JSON string in Prisma? (Yes, per schema: `String? @db.Text`)
- Should documents be parsed when fetching from API?

---

### 10. Available Units Section
**Component**: `src/components/PreConItem/PreConItemBody/AvailableUnits.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `projectName` | Section heading | Line 145 |
| `availableUnits` | Unit count | Used for filtering |
| `units` (Relation) | Individual unit cards | **NEEDS MAPPING** |

**PreConstructionUnit Fields:**
| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `unitName` | "Unit {name}" | Line 233 |
| `beds` | Bedrooms | Line 237 |
| `baths` | Bathrooms | Line 241 |
| `sqft` | Square feet | Line 243-252 |
| `price` | Price (if available) | Line 276 - "Contact for pricing" |
| `maintenanceFee` | Maintenance fees | Line 257 |
| `status` | Status badge | Line 261-264 |
| `floorplanImage` | Floorplan image | Line 220 |
| `description` | **NOT MAPPED** | Should be added |
| `features` | **NOT MAPPED** | Should be added |
| `amenities` | **NOT MAPPED** | Should be added |

**Questions:**
- Should unit `description`, `features`, and `amenities` be displayed in the unit card?
- Should there be a detail page for individual units?

---

### 11. Project Amenities Section
**Component**: `src/components/PreConItem/PreConItemBody/ProjectAmenities.tsx`

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `amenities` (String[]) | Categorized amenity list | Line 180-226 - **CURRENTLY HAS MOCK DATA** |
| `projectName` | Section description | Line 309 |

**Questions:**
- Are amenities currently using mock data? (Yes, line 180-226 has fallback mock data)
- Should amenities be categorized automatically or stored with categories?

---

### 12. Development Team Section
**Component**: `src/components/PreConItem/PreConItemBody/ProjectDetails.tsx` (within Project Details)

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `developerInfo` (JSON) | Developer tab | Parsed JSON with name, description, website, stats |
| `architectInfo` (JSON) | Architect tab | Same structure |
| `interiorDesignerInfo` (JSON) | Interior Designer tab | Same structure |
| `builderInfo` (JSON) | Builder tab | Same structure |
| `landscapeArchitectInfo` (JSON) | Landscape Architect tab | Same structure |
| `marketingInfo` (JSON) | Marketing tab | Same structure |
| `salesMarketingCompany` | **NOT MAPPED** | Should this be displayed? |

**Expected JSON Structure:**
```typescript
{
  name: string;
  description?: string;
  website?: string;
  stats?: {
    totalProjects: number;
    activelySelling: number;
    launchingSoon: number;
    registrationPhase: number;
    soldOut: number;
    resale: number;
    cancelled: number;
  };
}
```

**Questions:**
- How should `salesMarketingCompany` be used? (ID reference to Developer table?)
- Should team member info be fetched from Developer table using IDs?

---

### 13. Address & Location Fields
**Used in multiple components**

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `streetNumber` | Full address | Used in address string |
| `streetName` | Full address | Used in address string |
| `city` | City | Used in address, breadcrumbs |
| `state` | State | Used in address, breadcrumbs |
| `zip` | ZIP code | Used in address |
| `country` | Country | Default: "Canada" |
| `neighborhood` | Neighborhood | Used in breadcrumbs, address |
| `majorIntersection` | **NOT MAPPED** | Should be displayed? |
| `latitude` | Map coordinates | Used in Demographics component |
| `longitude` | Map coordinates | Used in Demographics component |

**Questions:**
- Should `majorIntersection` be displayed in the address section or banner?
- Should coordinates be used for map display in Neighborhood section?

---

### 14. Videos
**Component**: Not currently mapped

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `videos` (String[]) | **NOT MAPPED** | Should videos be displayed? |

**Questions:**
- Where should videos be displayed? (BannerGallery, separate section, or both?)
- What format are video URLs? (YouTube, Vimeo, direct links?)

---

### 15. Maintenance & Fees
**Component**: Not fully mapped

| Prisma Field | UI Display | Notes |
|-------------|-----------|-------|
| `maintenanceFeesPerSqft` | **NOT MAPPED** | Should be in Pricing or Details? |
| `maintenanceFeesDetail` | **NOT MAPPED** | Should be in Pricing or Details? |
| `floorPremiums` | **NOT MAPPED** | Should be in Pricing or Details? |

**Questions:**
- Where should maintenance fees be displayed? (Pricing section, Project Details, or separate section?)
- How should `floorPremiums` be formatted and displayed?

---

## Summary of Missing Mappings

### High Priority
1. ✅ `avgPricePerSqft` → PricingIncentives (needs direct mapping)
2. ✅ `promotions` → PricingIncentives (needs parsing from string)
3. ✅ `completionProgress` → ProjectDetails (needs conversion to percentage)
4. ✅ `documents` → ProjectDocuments (needs JSON parsing)
5. ✅ `amenities` → ProjectAmenities (currently using mock data)
6. ✅ `videos` → BannerGallery or separate section
7. ✅ `storeys` → ProjectDetails
8. ✅ `height` → ProjectDetails
9. ✅ `propertyType` → ProjectDetails
10. ✅ `subPropertyType` → ProjectDetails

### Medium Priority
1. `parkingPrice` + `parkingPriceDetail` → Pricing section
2. `lockerPrice` + `lockerPriceDetail` → Pricing section
3. `assignmentFee` → Pricing section
4. `developmentLevies` → Pricing section
5. `developmentCharges` → Pricing section
6. `maintenanceFeesPerSqft` + `maintenanceFeesDetail` → Pricing or Details
7. `floorPremiums` → Pricing or Details
8. `majorIntersection` → Address section
9. Unit `description`, `features`, `amenities` → AvailableUnits cards

### Low Priority
1. `salesMarketingCompany` → Development Team section
2. `country` → Address (if not default)

---

## Questions for Clarification

1. **Completion Progress**: How should `completionProgress` (0, 1, 2) be converted to percentage?
   - 0 = Pre-construction → 0%?
   - 1 = Construction → 50%?
   - 2 = Complete → 100%?

2. **Promotions**: How is `promotions` stored? Is it a comma-separated string or JSON? Should it be parsed into individual incentive items?

3. **Videos**: Where should videos be displayed? What format are the video URLs?

4. **Pricing Fields**: Where should parking/locker prices, assignment fees, and development charges be displayed? (All in Pricing section or separate sections?)

5. **Maintenance Fees**: Should maintenance fees be in Pricing section, Project Details, or a separate section?

6. **Development Team**: Should team member info be fetched from the Developer table using IDs, or is the JSON string sufficient?

7. **Documents**: Should documents be parsed when fetching from API, or is there a separate endpoint?

8. **Unit Details**: Should unit `description`, `features`, and `amenities` be displayed in the unit card or only on the unit detail page?

---

## Next Steps

1. Review this mapping document
2. Answer the clarification questions
3. Implement missing field mappings
4. Update API endpoints to return properly formatted data
5. Update UI components to use real data instead of mock data

