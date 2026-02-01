# Collaborative Trip Planning Design

## Overview

A collaborative trip planning page where multiple users can:
- Drag and drop activities across days in a kanban-style view
- Add places via URL (Google Maps or websites with AI parsing)
- Vote on activities and mark them as final
- Discuss activities and overall trip
- Track costs with automatic settlement calculations

## Layout Structure

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Header                                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│  Trip Header: Title | Arrival Time | Departure Time | [Edit Trip]        │
├────────────────────────────────────────────────────┬─────────────────────┤
│  Kanban Board (70%)                                │  Sidebar (30%)      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐              │  ┌─────────────────┐│
│  │  Day 1  │ │  Day 2  │ │  Day 3  │              │  │ [General][Item] ││
│  │ 🏨Hotel │ │ 🏨Hotel │ │         │              │  │ Discussion...   ││
│  ├─────────┤ ├─────────┤ ├─────────┤              │  └─────────────────┘│
│  │Activity │ │Activity │ │Activity │              │  ┌─────────────────┐│
│  │Activity │ │Activity │ │Activity │              │  │ Cost Summary    ││
│  │[+Add]   │ │[+Add]   │ │[+Add]   │              │  │ Settlements     ││
│  └─────────┘ └─────────┘ └─────────┘              │  └─────────────────┘│
│  [+ Add Place via URL]                            │                     │
└────────────────────────────────────────────────────┴─────────────────────┘
```

## Activity Card Design

```
┌─────────────────────────────────────┐
│ ⋮⋮  🍽️ Dinner at Nobu        [✓ Final]
│     📍 Shibuya, Tokyo
│     💰 $90  |  ⏰ 7:00 PM - 9:00 PM
│     ✅ John  ✅ Sarah  ❌ Mike
│     💬 2 comments
│     Paid by: [John ▼]
└─────────────────────────────────────┘
```

Elements:
- Drag handle for reordering
- Activity icon + title
- Final badge (locks when all approve)
- Location, cost, time
- Named votes per traveler
- Comment count (opens sidebar)
- Payer assignment dropdown

## URL Place Fetching (Hybrid Approach)

1. **Google Maps URL** → Extract place ID → Google Places API
2. **Other URLs** → If AI enabled in admin → Server scrape + AI parse
3. **AI disabled** → Error message, suggest Google Maps URL

Admin toggle at `/admin` for "Enable AI URL Parsing" to control costs.

## Cost Summary & Settlements

Calculation logic:
1. Sum all activity costs → Total
2. Fair share = Total ÷ travelers
3. Balance = Paid - Fair Share
4. Generate minimal settlements

```
Total: $2,430 | Per Person: $810
─────────────────────────────────
John paid:  $1,200  → gets $390
Sarah paid:   $630  → owes $180
Mike paid:    $600  → owes $210
─────────────────────────────────
Sarah pays John: $180
Mike pays John: $210
```

## Database Schema

```sql
-- trips table additions
ALTER TABLE trips ADD COLUMN arrival_time TEXT;
ALTER TABLE trips ADD COLUMN departure_time TEXT;

-- itinerary_items additions
ALTER TABLE itinerary_items ADD COLUMN is_final BOOLEAN DEFAULT false;
ALTER TABLE itinerary_items ADD COLUMN payer_id UUID;
ALTER TABLE itinerary_items ADD COLUMN is_split BOOLEAN DEFAULT true;
ALTER TABLE itinerary_items ADD COLUMN time_start TEXT;
ALTER TABLE itinerary_items ADD COLUMN time_end TEXT;
ALTER TABLE itinerary_items ADD COLUMN source_url TEXT;
ALTER TABLE itinerary_items ADD COLUMN place_data JSONB;

-- activity_votes table
CREATE TABLE activity_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_item_id UUID REFERENCES itinerary_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote TEXT CHECK (vote IN ('up', 'down', 'pending')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(itinerary_item_id, user_id)
);

-- cost_settlements table
CREATE TABLE cost_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

```
POST   /api/places/fetch              -- Fetch place from URL
PATCH  /api/trips/[id]/times          -- Update arrival/departure
POST   /api/trips/[id]/items/[itemId]/vote      -- Vote on activity
POST   /api/trips/[id]/items/[itemId]/finalize  -- Mark as final
PATCH  /api/trips/[id]/items/[itemId]/payer     -- Assign payer
GET    /api/trips/[id]/costs          -- Get cost breakdown
POST   /api/trips/[id]/costs/settle   -- Mark settlement paid
PATCH  /api/trips/[id]/items/reorder  -- Reorder/move activity
```

## File Structure

New files:
```
app/trips/[id]/collaborate/page.tsx
components/collaborate/
  ├── KanbanBoard.tsx
  ├── ActivityCard.tsx
  ├── DayColumn.tsx
  ├── AddPlaceModal.tsx
  ├── DiscussionSidebar.tsx
  ├── CostSummary.tsx
  ├── VoteButtons.tsx
  └── HotelSelector.tsx
app/api/places/fetch/route.ts
app/api/trips/[id]/items/reorder/route.ts
app/api/trips/[id]/items/[itemId]/vote/route.ts
app/api/trips/[id]/items/[itemId]/finalize/route.ts
app/api/trips/[id]/costs/route.ts
lib/places/google-places.ts
lib/places/ai-scraper.ts
```

Dependencies:
```
@dnd-kit/core
@dnd-kit/sortable
```

## Discussion System

- Right sidebar with tabs: [General] + [Activity Name]
- Click activity → opens its discussion tab
- Uses existing DiscussionThread component
- Per-activity discussions via itineraryItemId
