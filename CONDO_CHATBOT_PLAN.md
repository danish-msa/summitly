# Condo Chatbot Implementation Plan

## Overview
Create a specialized chatbot for condo properties with all condo-specific fields based on the provided requirements.

## Condo-Specific Fields to Implement

### Location and Listing Basics
- ✅ LOCATION (already implemented)
- ✅ ASSESSMENT ROLL # (ARN)
- ✅ PIN #
- ✅ AREA
- ✅ MUNICIPALITY
- ✅ COMMUNITY
- ✅ STREET DIRECTION PREFIX
- ✅ STREET #
- ✅ STREET NAME
- ✅ STREET DIRECTION
- 🆕 APT/UNIT # (condo-specific)
- ✅ POSTAL CODE
- 🆕 BUILDING NAME (condo-specific)
- 🆕 PROPERTY MANAGEMENT COMPANY (condo-specific)
- 🆕 CONDO REGISTRY OFFICE (condo-specific)
- 🆕 CONDO CORP # (condo-specific)
- 🆕 LEVEL (condo-specific)
- 🆕 UNIT # (condo-specific)

### Lease Amounts and Dates
- 🆕 LEASE
- 🆕 LEASE PRICE
- 🆕 CONTRACT COMMENCEMENT
- 🆕 EXPIRY DATE
- 🆕 POSSESSION DATE
- 🆕 POSSESSION REMARKS
- 🆕 POSSESSION TYPE
- 🆕 HOLDOVER DAYS
- 🆕 LANDLORD NAME
- 🆕 LEASE TERM
- 🆕 PAYMENT FREQUENCY
- 🆕 PAYMENT METHOD

### Requirements and Inclusions
- 🆕 RENTAL APPLICATION REQUIRED
- 🆕 DEPOSIT REQUIRED
- 🆕 CREDIT CHECK
- 🆕 EMPLOYMENT LETTER
- 🆕 LEASE AGREEMENT
- 🆕 REFERENCES REQUIRED
- 🆕 BUY OPTION
- 🆕 NON-SMOKING POLICY
- 🆕 INCLUDED IN LEASE COST

### Property Exterior and Waterfront
- 🆕 EXTERIOR
- ✅ PROPERTY TYPE (already implemented)
- 🆕 PORTION OF PROPERTY FOR LEASE
- ✅ STYLE
- 🆕 VIEW
- 🆕 EXTERIOR FEATURES
- 🆕 FOUNDATION DETAIL
- 🆕 ROOF
- 🆕 TOPOGRAPHY
- ✅ GARAGE
- ✅ GARAGE TYPE
- ✅ GARAGE PARKING SPACES
- ✅ TOTAL PARKING SPACES
- 🆕 WATERFRONT/RURAL
- 🆕 BODY OF WATER NAME

### Interior Details
- ✅ NUMBER OF ROOMS
- ✅ NUMBER OF BEDROOMS
- ✅ NUMBER OF KITCHENS
- 🆕 INTERIOR FEATURES
- ✅ BASEMENT
- ✅ FIREPLACE/STOVE
- ✅ HEAT SOURCE
- ✅ HEAT TYPE
- ✅ AIR CONDITIONING
- 🆕 PETS PERMITTED
- 🆕 LAUNDRY LEVEL
- 🆕 ACCESSIBILITY FEATURES
- 🆕 ROOMS/DETAILS

### Remarks and Disclosure
- 🆕 COMMENTS
- ✅ REMARKS FOR CLIENTS
- 🆕 OFFER REMARKS (SELLER DIRECTION)
- 🆕 INCLUSIONS
- 🆕 EXCLUSIONS
- 🆕 RENTAL ITEMS/UNDER CONTRACT
- ✅ REALTOR ONLY REMARKS
- 🆕 SELLER PROPERTY INFO STATEMENT
- 🆕 ENERGY CERTIFICATE
- 🆕 GREEN PROPERTY INFO STATEMENT

## Implementation Approach

### Option A: Extend Existing System (RECOMMENDED)

**Pros:**
- Faster implementation
- Reuses existing infrastructure
- Single codebase to maintain
- Unified user experience

**Cons:**
- More complex conditional logic
- Shared routes and services

**Implementation Steps:**
1. Add condo-specific fields to `residential_property_service.py`
2. Create `condo_field_extractor.py` for condo-specific AI extraction
3. Update `chatbot_orchestrator.py` to handle condo button
4. Add condo-specific GPT prompts
5. Update frontend to show/hide condo-specific fields

### Option B: Separate Condo Chatbot

**Pros:**
- Clean separation of concerns
- Easier to customize per property type
- Independent deployment

**Cons:**
- Code duplication
- More maintenance overhead
- Multiple ports/servers to manage

**Implementation Steps:**
1. Create `app/condo_assistant.py` (copy from `voice_assistant_clean.py`)
2. Create `services/condo_property_service.py`
3. Create `app/condoapp.py` (similar to `commercialapp.py`)
4. Configure to run on port 5051
5. Update frontend to route condo button to port 5051

## Recommended Implementation Plan

### Phase 1: Core Condo Fields (Week 1)
- [ ] Add APT/UNIT #, BUILDING NAME, CONDO CORP # to search
- [ ] Add LEVEL and UNIT # to filters
- [ ] Add PROPERTY MANAGEMENT COMPANY to display
- [ ] Update GPT prompts to extract condo fields

### Phase 2: Lease Information (Week 2)
- [ ] Add LEASE PRICE, LEASE TERM, PAYMENT FREQUENCY
- [ ] Add POSSESSION DATE, EXPIRY DATE
- [ ] Add LANDLORD NAME and contact info
- [ ] Create lease-specific search filters

### Phase 3: Requirements (Week 3)
- [ ] Add RENTAL APPLICATION REQUIRED flag
- [ ] Add DEPOSIT REQUIRED, CREDIT CHECK
- [ ] Add PETS PERMITTED, NON-SMOKING POLICY
- [ ] Add INCLUDED IN LEASE COST list

### Phase 4: Advanced Features (Week 4)
- [ ] Add VIEW, EXTERIOR FEATURES
- [ ] Add WATERFRONT/RURAL, BODY OF WATER
- [ ] Add LAUNDRY LEVEL, ACCESSIBILITY FEATURES
- [ ] Add ENERGY CERTIFICATE, GREEN INFO

### Phase 5: Testing and Refinement (Week 5)
- [ ] Test all condo-specific searches
- [ ] Validate AI extraction accuracy
- [ ] User acceptance testing
- [ ] Performance optimization

## Example Queries to Support

```
"2 bedroom condo in Toronto with lake view"
"condo with locker and balcony on 15th floor"
"pet-friendly condo with parking included"
"condo under $2000/month with utilities included"
"luxury condo in Yorkville with concierge"
"condo near subway with in-unit laundry"
"waterfront condo with balcony and gym"
"penthouse condo with rooftop access"
```

## Database Schema Updates Needed

```sql
-- Condo-specific fields
ALTER TABLE properties ADD COLUMN building_name VARCHAR(255);
ALTER TABLE properties ADD COLUMN condo_corp VARCHAR(100);
ALTER TABLE properties ADD COLUMN unit_number VARCHAR(50);
ALTER TABLE properties ADD COLUMN floor_level INT;
ALTER TABLE properties ADD COLUMN property_management VARCHAR(255);
ALTER TABLE properties ADD COLUMN lease_term INT;
ALTER TABLE properties ADD COLUMN payment_frequency VARCHAR(50);
ALTER TABLE properties ADD COLUMN pets_permitted BOOLEAN;
ALTER TABLE properties ADD COLUMN laundry_level VARCHAR(50);
ALTER TABLE properties ADD COLUMN view_type VARCHAR(255);
ALTER TABLE properties ADD COLUMN included_in_lease TEXT;
```

## API Integration Required

Update Repliers API calls to include condo-specific fields:
```python
params = {
    "propertyType": "Condo",
    "buildingName": building_name,
    "condoCorp": condo_corp,
    "floorLevel": floor_level,
    "petsPermitted": pets_permitted,
    # ... additional condo fields
}
```

## Estimated Effort
- **Option A (Extend Existing):** 3-4 weeks
- **Option B (Separate Chatbot):** 6-8 weeks

## Next Steps
1. ✅ Review this plan
2. ⏳ Decide on Option A vs Option B
3. ⏳ Prioritize which condo fields are most critical
4. ⏳ Begin Phase 1 implementation

---

**Note:** This is a comprehensive implementation that requires careful planning and testing. Would you like to proceed with Option A (extend existing) or Option B (separate chatbot)?
