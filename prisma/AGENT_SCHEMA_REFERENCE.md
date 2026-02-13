# Agent Schema Reference

This document maps your agent fields (from the ChatGPT spec) to the Prisma models.

## Tables Overview

| Table | Purpose |
|-------|---------|
| `Agent` | Core identity, contact, bio, specializations, languages, CTA flags, ratings summary |
| `AgentStats` | Performance: years_experience, total_properties_sold, active_listings_count |
| `AgentSocialLinks` | Social: linkedin, facebook, instagram, twitter, youtube + flexible `other` (Json) |
| `AgentServiceArea` | Areas served (one row per area; unique per agent) |
| `AgentFeaturedListing` | Featured listing MLS numbers + sort_order |
| `AgentMarketStats` | top_cities + property_type_distribution (Json) |
| `AgentActivitySummary` | Last 12 months: transactions, active_listings, buyers/sellers, for_sale_count, sold_count |
| `AgentReview` | Individual reviews: reviewer_name, rating, review_text, created_at |

---

## Field Mapping

### 1. Agent (core)

| Your field | Prisma field | Notes |
|------------|--------------|--------|
| agent_id | `Agent.id` | cuid |
| first_name | `first_name` | |
| last_name | `last_name` | |
| full_name | `full_name` | |
| job_title | `job_title` | |
| agent_type | `agent_type` | Enum: COMMERCIAL, RESIDENTIAL, BOTH |
| profile_image | `profile_image` | Full image URL (String, optional). On create/update, external URLs are fetched and stored in S3; the saved value is the S3 URL. |
| cover_image | `cover_image` | Full image URL (String, optional). Same as profile_image — external URLs are uploaded to S3 and the stored value is the S3 URL. |
| slug | `slug` | Unique, e.g. "david-cohen" |
| sort_order | `sort_order` | Int for display order |

### 2. Specializations (on Agent)

| Your field | Prisma field |
|------------|--------------|
| primary_focus | `primary_focus` |
| property_specialties | `property_specialties` (String[]) |
| industry_role | `industry_role` |

### 3. AgentStats (1:1)

| Your field | Prisma field |
|------------|--------------|
| years_experience | `years_experience` (Int) |
| total_properties_sold | `total_properties_sold` |
| active_listings_count | `active_listings_count` |

### 4. Contact (on Agent)

| Your field | Prisma field |
|------------|--------------|
| email | `email` |
| phone | `phone` |
| website_url | `website_url` |

### 5. AgentSocialLinks (1:1)

| Your field | Prisma field |
|------------|--------------|
| linkedin | `linkedin` |
| facebook | `facebook` |
| instagram | `instagram` |
| twitter | `twitter` |
| youtube | `youtube` |
| other | `other` (Json) for new platforms |

### 6. Bio (on Agent)

| Your field | Prisma field |
|------------|--------------|
| about_agent | `about_agent` (Long text) |
| tagline | `tagline` |

### 7. Languages (on Agent)

| Your field | Prisma field |
|------------|--------------|
| languages_spoken | `languages_spoken` (String[]) |

### 8. AgentFeaturedListing (1:many)

| Your field | Prisma field |
|------------|--------------|
| featured_listing_ids | `AgentFeaturedListing.mlsNumber` (one row per listing) |
| sort_order | `sort_order` per listing |

### 9. AgentServiceArea (1:many)

| Your field | Prisma field |
|------------|--------------|
| areas_served | `AgentServiceArea.area_name` (one row per area; unique per agent) |

### 10. AgentMarketStats (1:1, Json)

| Your field | Prisma field | Example |
|------------|--------------|---------|
| top_cities | `top_cities` | `[{ "city_name": "Toronto", "percentage": 15 }]` |
| property_type_distribution | `property_type_distribution` | `[{ "property_type": "Detached", "percentage": 40 }]` |

### 11. AgentActivitySummary (1:1)

| Your field | Prisma field |
|------------|--------------|
| activity_period | `activity_period` (e.g. "last_12_months") |
| total_transactions | `total_transactions` |
| active_listings | `active_listings` |
| worked_with_buyers | `worked_with_buyers` |
| worked_with_sellers | `worked_with_sellers` |
| for_sale_count | `for_sale_count` |
| sold_count | `sold_count` |

### 12. Ratings (on Agent)

| Your field | Prisma field |
|------------|--------------|
| overall_rating | `overall_rating` (Float) |
| total_reviews_count | `total_reviews_count` (Int) |

### 13. AgentReview (1:many)

| Your field | Prisma field |
|------------|--------------|
| review_id | `AgentReview.id` |
| reviewer_name | `reviewer_name` |
| rating | `rating` (Int 1–5) |
| review_text | `review_text` |
| created_at | `createdAt` |

### 14. CTA / Engagement (on Agent)

| Your field | Prisma field |
|------------|--------------|
| allow_contact_form | `allow_contact_form` |
| allow_reviews | `allow_reviews` |
| response_time | `response_time` |
| verified_agent | `verified_agent` |

### 15. Meta (on Agent)

| Your field | Prisma field |
|------------|--------------|
| status | `status` (Enum: ACTIVE, INACTIVE) |
| created_at | `createdAt` |
| updated_at | `updatedAt` |
| slug | `slug` |
| sort_order | `sort_order` |

---

## Optional: Link to User

- `Agent.userId` is optional. When set, the agent can be associated with a `User` (e.g. for login).
- `User.agent` is the inverse relation.

---

## Enums

- **AgentType**: `COMMERCIAL` | `RESIDENTIAL` | `BOTH`
- **AgentStatus**: `ACTIVE` | `INACTIVE`

---

## Next Steps

1. Run `npx prisma migrate dev --name add_agent_schema` to create the migration.
2. Update `/api/agents` and OurAgents UI to read from `Agent` (and related tables) when you’re ready to switch from `User` + `AgentProfile` or sample data.
