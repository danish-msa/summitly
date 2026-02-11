# Field Saving Analysis Report

## Issues Found

### 1. ❌ `developmentTeamOverview` - NOT BEING SAVED
- **Status**: Field exists in form but is NOT saved to database
- **Location**: 
  - Form: `src/components/Dashboard/PreConProjectForm.tsx` (line 95, 1950-1951)
  - Missing from: 
    - `src/app/dashboard/admin/pre-con-projects/new/page.tsx` (payload)
    - `src/app/dashboard/admin/pre-con-projects/[id]/edit/page.tsx` (payload)
    - `src/app/api/admin/pre-con-projects/route.ts` (POST handler)
    - `src/app/api/admin/pre-con-projects/[id]/route.ts` (PUT handler)
    - `prisma/schema.prisma` (database schema)
- **Impact**: User input is lost when form is submitted
- **Fix Required**: Either add to schema and API, or remove from form

### 2. ⚠️ `features` - HARDCODED TO EMPTY ARRAY
- **Status**: Field exists in schema but is always saved as empty array
- **Location**:
  - Schema: `prisma/schema.prisma` (line 392) - `features String[] @default([])`
  - API POST: `src/app/api/admin/pre-con-projects/route.ts` (line 367) - `features: []`
  - API PUT: Not handled (would keep existing value)
  - Form: Not collected in form
- **Impact**: Features cannot be saved/updated through dashboard
- **Fix Required**: Add features field to form OR remove from schema if not needed

## ✅ Fields That ARE Saving Correctly

All other fields are properly mapped:
- Basic Info: projectName, developer, startingPrice, endingPrice, avgPricePerSqft, status
- Pricing: parkingPrice, parkingPriceDetail, lockerPrice, lockerPriceDetail, assignmentFee, developmentLevies, developmentCharges
- Address: streetNumber, streetName, city, state, zip, country, neighborhood, majorIntersection, latitude, longitude
- Property Details: propertyType, subPropertyType, bedroomRange, bathroomRange, sqftRange, hasDen, hasStudio, hasLoft, hasWorkLiveLoft, totalUnits, availableUnits, storeys, height
- Maintenance: maintenanceFeesPerSqft, maintenanceFeesDetail, floorPremiums
- Completion: completionDate, completionProgress, promotions
- Media: images, videos
- Amenities: amenities (includes customAmenities)
- Additional: depositStructure, description, documents
- Development Team: developerInfo, architectInfo, builderInfo, interiorDesignerInfo, landscapeArchitectInfo, marketingInfo, salesMarketingCompany

## Recommendations

1. **For `developmentTeamOverview`**: 
   - Option A: Add field to schema and API handlers
   - Option B: Remove from form if not needed
   - Option C: Store in developerInfo JSON if it's part of team info

2. **For `features`**:
   - Option A: Add features input to form (similar to amenities)
   - Option B: Remove from schema if not used
   - Option C: Auto-populate from amenities if they're the same thing

