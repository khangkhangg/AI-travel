# Business Marketplace Panel Design

## Overview

Display marketplace trips matching the business's coverage areas in the BusinessMarketplacePanel, allowing businesses to discover and bid on relevant trip opportunities.

## Requirements

- Fuzzy city matching (partial match, case-insensitive)
- Rich trip display: title, city, dates, duration, activities, description preview, love count, bid count, creator info
- "View Trip" and "Submit Bid" actions
- Empty states for no coverage areas or no matching trips

## API Layer

### New Endpoint: `GET /api/businesses/me/marketplace-trips`

**Query logic:**
```sql
SELECT trips WHERE visibility = 'marketplace'
AND LOWER(city) ILIKE ANY(business_coverage_cities)
```

**Response:**
```typescript
{
  trips: [{
    id: string,
    title: string,
    city: string,
    startDate: string,
    endDate: string,
    duration: number,
    activityCount: number,
    travelerCount: number,
    description: string,     // first 150 chars
    loveCount: number,
    bidCount: number,
    hasMyBid: boolean,
    creator: {
      name: string,
      username: string,
      avatarUrl: string
    }
  }],
  matchedCities: string[]
}
```

## UI Component

### BusinessMarketplacePanel.tsx

**Header:**
- Title "Marketplace"
- Subtitle: "Showing trips in: [matched cities]"
- Stats: total trips, trips with your bids

**Trip Cards (grid):**
- Trip title (link to trip)
- City + dates badge
- Duration + activity count
- Description preview (2 lines)
- Creator avatar + name
- Love count + bid count badges
- "View Trip" / "Submit Bid" buttons
- "Already Bid" badge if hasMyBid

**Empty States:**
- No coverage areas: prompt to set up profile
- No matching trips: "No marketplace trips in your areas yet"

## Files

| File | Action |
|------|--------|
| `app/api/businesses/me/marketplace-trips/route.ts` | Create |
| `components/business/panels/BusinessMarketplacePanel.tsx` | Modify |

## Mockups

See: `/private/tmp/claude-501/-Users-khang-AI-travel-AI-travel/2efd002e-5b9a-4df2-804a-50c332fefa3f/scratchpad/marketplace-mockups.html`
