# Creators Page & Avatar Navigation Design

**Date**: 2026-02-03
**Status**: Approved
**Feature**: Browse creators, clickable avatars, admin featured management

---

## Overview

Enable users to discover travel content creators through:
1. A dedicated `/creators` page with featured sections and searchable grid
2. Clickable creator avatars on itinerary cards (with hover preview)
3. Admin tools to manage featured creators at `/admin`

---

## 1. Creator Definition

A **Creator** is any user with at least one itinerary where `visibility IN ('public', 'marketplace', 'curated')` AND has a `username` set (required for profile URL).

Creator types (for filtering):
- **Verified Guide**: `is_guide = true`
- **Local Expert**: Has at least one `curated` visibility itinerary
- **Regular Creator**: Everyone else with public content

---

## 2. Database Changes

### New table: `featured_creators`

```sql
CREATE TABLE featured_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,  -- matches interest tags: 'food', 'culture', 'nature', etc.
  display_order INT DEFAULT 0,
  featured_until TIMESTAMPTZ,  -- NULL = forever, date = auto-expires
  featured_by UUID REFERENCES users(id),  -- admin who featured them
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)  -- same creator can be in multiple categories
);

CREATE INDEX idx_featured_creators_category ON featured_creators(category);
CREATE INDEX idx_featured_creators_until ON featured_creators(featured_until)
  WHERE featured_until IS NOT NULL;
```

### Query: Get all creators with stats

```sql
SELECT
  u.id,
  u.username,
  u.full_name,
  u.avatar_url,
  u.bio,
  u.location,
  u.is_guide,
  COUNT(DISTINCT t.id) as itinerary_count,
  COALESCE(SUM(t.views_count), 0) as total_views,
  COALESCE(SUM(t.clone_count), 0) as total_clones,
  ARRAY_AGG(DISTINCT t.city) FILTER (WHERE t.city IS NOT NULL) as destinations,
  BOOL_OR(t.visibility = 'curated') as is_local_expert
FROM users u
JOIN trips t ON t.user_id = u.id
WHERE t.visibility IN ('public', 'marketplace', 'curated')
  AND u.username IS NOT NULL
GROUP BY u.id
ORDER BY total_clones DESC;
```

---

## 3. /creators Page Structure

**Route**: `app/creators/page.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Discover Creators"                            │
│  Subtitle: "Find local experts and travel enthusiasts"  │
├─────────────────────────────────────────────────────────┤
│  FEATURED SECTIONS (horizontal scroll per category)     │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 🍜 Food Experts                          See all │   │
│  │ [Card] [Card] [Card] [Card] →                    │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 🏛️ Culture Enthusiasts                   See all │   │
│  │ [Card] [Card] [Card] →                           │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  FILTERS BAR                                            │
│  [🔍 Search...] [Category ▼] [Interests ▼] [City ▼]    │
├─────────────────────────────────────────────────────────┤
│  ALL CREATORS GRID (sorted by total_clones desc)        │
│  [Card] [Card] [Card] [Card]                            │
│  [Card] [Card] [Card] [Card]                            │
│  [Load More...]                                         │
└─────────────────────────────────────────────────────────┘
```

### Featured Sections Behavior

- Only show categories that have at least 1 featured creator
- **Algorithmic fallback**: If admin hasn't featured anyone in a category, auto-select top 3 creators by clone count who have itineraries with that interest tag
- "See all" links to grid view filtered by that interest
- Categories derived from existing interest tags: `food`, `culture`, `nature`, `adventure`, `nightlife`, `shopping`, `relaxation`, `history`

### Filters

| Filter | Type | Options |
|--------|------|---------|
| Search | Text input | Searches name, username |
| Category | Dropdown | All, Verified Guides, Local Experts, Regular Creators |
| Interests | Multi-select | food, culture, nature, adventure, nightlife, shopping, relaxation, history |
| City | Autocomplete | Cities from creators' itinerary destinations |

### Pagination

- Load 12 creators initially
- "Load More" button adds 12 more
- Sort by `total_clones DESC` (most popular first)

---

## 4. Creator Card Component

**Component**: `components/creators/CreatorCard.tsx`

### Visual Structure

```
┌─────────────────────────────────────┐
│  ┌─────┐                            │
│  │     │  Jane Smith                │
│  │ AVA │  @janesmith                │
│  │     │  📍 Tokyo, Japan           │
│  └─────┘                            │
├─────────────────────────────────────┤
│  "Food lover and local expert..."   │  ← bio (2 lines max)
├─────────────────────────────────────┤
│  BADGES                             │
│  [✓ Verified Guide] [🌟 Local Expert]│
├─────────────────────────────────────┤
│  STATS                              │
│  12 itineraries · 1.2K views · 89 clones │
├─────────────────────────────────────┤
│  RECENT ITINERARIES (thumbnails)    │
│  [img] [img] [img]                  │
├─────────────────────────────────────┤
│  [      View Profile      ]         │  ← Primary button
└─────────────────────────────────────┘
```

### Props Interface

```typescript
interface CreatorCardProps {
  creator: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
    isGuide: boolean;
    isLocalExpert: boolean;
    badges: BadgeType[];
    stats: {
      itineraryCount: number;
      totalViews: number;
      totalClones: number;
    };
    recentItineraries: {
      id: string;
      title: string;
      coverImage?: string;
    }[];
  };
  compact?: boolean;  // for featured horizontal scroll (smaller variant)
}
```

### Behavior

- Entire card clickable → navigates to `/profile/[username]`
- Compact mode for featured sections (smaller, horizontal scroll friendly)

---

## 5. Creator Hover Preview

**Component**: `components/creators/CreatorHoverCard.tsx`

**Trigger**: Hover on creator avatar in `ItineraryCard` or `MarketplaceTripCard`

### Visual Structure

```
┌───────────────────────────────────────┐
│  ┌─────┐  Jane Smith                  │
│  │     │  @janesmith                  │
│  │ 48px│  📍 Tokyo · ✓ Verified Guide │
│  └─────┘                              │
├───────────────────────────────────────┤
│  "Passionate about hidden gems..."    │  ← bio (2 lines)
├───────────────────────────────────────┤
│  12 itineraries · 1.2K views · 89 clones │
├───────────────────────────────────────┤
│  Recent:                              │
│  [img] [img] [img]  ← 3 tiny thumbs   │
├───────────────────────────────────────┤
│  [🏆 Explorer] [⭐ Tipped] [🎯 Guide] │  ← badges
├───────────────────────────────────────┤
│           View Profile →              │
└───────────────────────────────────────┘
```

### Behavior

| Interaction | Behavior |
|-------------|----------|
| Hover delay | 300ms before showing (prevents flicker) |
| Hide delay | 150ms after mouse leaves (allows moving to popover) |
| Click avatar | Immediate navigation to `/profile/[username]` |
| Mobile | No hover; tap avatar navigates directly |

### Implementation

Use custom hover state management with `onMouseEnter`/`onMouseLeave` and absolute positioning. Popover appears below avatar (or above if near bottom of viewport).

---

## 6. Admin Featured Creators Tab

**Location**: New tab in `app/admin/page.tsx`

### Tab Layout

```
┌─────────────────────────────────────────────────────────┐
│  Featured Creators Management                           │
│  "Manage which creators appear in featured sections"    │
├─────────────────────────────────────────────────────────┤
│  [🔍 Search creators...]              [+ Add Featured]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🍜 FOOD                                    [Preview]   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ≡ Jane Smith    @jane    Until: Dec 31  [✕]    │   │  ← draggable
│  │ ≡ Bob Chen      @bob     Forever        [✕]    │   │
│  │ ≡ (auto) Maria  @maria   Algorithmic    [Pin]  │   │  ← auto-suggested
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🏛️ CULTURE                                 [Preview]   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ≡ Alex Kim      @alex    Until: Jan 15  [✕]    │   │
│  │ ≡ (auto) Sam    @sam     Algorithmic    [Pin]  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Features

| Feature | Description |
|---------|-------------|
| Add Featured | Modal: search creator, select category, optional expiry date |
| Remove | Click ✕ to remove from featured |
| Reorder | Drag ≡ handle to reorder within category |
| Pin algorithmic | Convert auto-suggested to manual (persists) |
| Preview | Opens `/creators` in new tab to see current state |
| Auto-expiry | Creators with `featured_until` date auto-removed after expiry |

### "Add Featured" Modal

```
┌─────────────────────────────────────┐
│  Add Featured Creator               │
├─────────────────────────────────────┤
│  Creator:                           │
│  [🔍 Search by name or username... ]│
│                                     │
│  Category:                          │
│  [Food ▼]                           │
│                                     │
│  Featured Until (optional):         │
│  [📅 Select date...        ]        │
│  Leave empty to feature forever     │
├─────────────────────────────────────┤
│  [Cancel]              [Add Creator]│
└─────────────────────────────────────┘
```

---

## 7. API Endpoints

### Public Endpoints (no auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/creators` | List creators with filters |
| `GET` | `/api/creators/featured` | Get featured creators by category |
| `GET` | `/api/creators/[username]` | Get single creator's public data |

#### GET /api/creators

**Query Parameters**:
```
?search=jane           - text search name/username
&category=guide        - filter: guide | local_expert | regular
&interests=food,culture - filter by itinerary interests (comma-separated)
&city=Tokyo            - filter by destination city
&limit=12              - results per page (default 12, max 50)
&offset=0              - pagination offset
```

**Response**:
```json
{
  "creators": [
    {
      "id": "uuid",
      "username": "janesmith",
      "fullName": "Jane Smith",
      "avatarUrl": "https://...",
      "bio": "Food lover...",
      "location": "Tokyo, Japan",
      "isGuide": true,
      "isLocalExpert": false,
      "badges": ["verified_guide", "explorer"],
      "stats": {
        "itineraryCount": 12,
        "totalViews": 1234,
        "totalClones": 89
      },
      "recentItineraries": [
        { "id": "uuid", "title": "Tokyo Food Tour", "coverImage": "https://..." }
      ],
      "destinations": ["Tokyo", "Osaka", "Kyoto"]
    }
  ],
  "total": 156,
  "hasMore": true
}
```

#### GET /api/creators/featured

**Response**:
```json
{
  "categories": {
    "food": {
      "emoji": "🍜",
      "label": "Food Experts",
      "creators": [/* CreatorCard data */],
      "isAlgorithmic": false
    },
    "culture": {
      "emoji": "🏛️",
      "label": "Culture Enthusiasts",
      "creators": [/* CreatorCard data */],
      "isAlgorithmic": true  // no manual features, using fallback
    }
  }
}
```

### Admin Endpoints (requires admin auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/featured-creators` | List all featured (manual + algorithmic suggestions) |
| `POST` | `/api/admin/featured-creators` | Add featured creator |
| `PATCH` | `/api/admin/featured-creators/[id]` | Update order/expiry date |
| `DELETE` | `/api/admin/featured-creators/[id]` | Remove from featured |
| `POST` | `/api/admin/featured-creators/reorder` | Bulk update display_order |

#### POST /api/admin/featured-creators

**Request**:
```json
{
  "userId": "uuid",
  "category": "food",
  "featuredUntil": "2026-03-01T00:00:00Z"  // optional
}
```

#### POST /api/admin/featured-creators/reorder

**Request**:
```json
{
  "category": "food",
  "orderedIds": ["uuid1", "uuid2", "uuid3"]
}
```

---

## 8. Files to Create

| File | Purpose |
|------|---------|
| `app/creators/page.tsx` | Creators browse page |
| `components/creators/CreatorCard.tsx` | Creator card component |
| `components/creators/CreatorHoverCard.tsx` | Hover preview for avatars |
| `components/creators/FeaturedSection.tsx` | Horizontal scroll featured row |
| `components/creators/CreatorFilters.tsx` | Search + filter bar |
| `app/api/creators/route.ts` | Public creators list API |
| `app/api/creators/featured/route.ts` | Featured creators API |
| `app/api/creators/[username]/route.ts` | Single creator API |
| `app/api/admin/featured-creators/route.ts` | Admin CRUD for featuring |
| `app/api/admin/featured-creators/[id]/route.ts` | Admin single feature CRUD |
| `app/api/admin/featured-creators/reorder/route.ts` | Admin reorder API |
| `scripts/migrations/024-featured-creators.sql` | Database migration |

---

## 9. Files to Modify

| File | Change |
|------|--------|
| `app/admin/page.tsx` | Add "Featured Creators" tab with management UI |
| `components/landing/ItineraryCard.tsx` | Make avatar clickable, add hover preview |
| `components/landing/MarketplaceTripCard.tsx` | Make avatar clickable, add hover preview |
| `lib/types/user.ts` | Add `Creator`, `CreatorStats`, `FeaturedCreator` types |
| `components/landing/Navbar.tsx` | Add "Creators" link to navigation |

---

## 10. Interest Category Mapping

| Interest Tag | Emoji | Display Label |
|--------------|-------|---------------|
| `food` | 🍜 | Food Experts |
| `culture` | 🏛️ | Culture Enthusiasts |
| `nature` | 🌿 | Nature Lovers |
| `adventure` | ⛰️ | Adventure Seekers |
| `nightlife` | 🌙 | Nightlife Guides |
| `shopping` | 🛍️ | Shopping Experts |
| `relaxation` | 🧘 | Relaxation Gurus |
| `history` | 📜 | History Buffs |

---

## 11. Implementation Notes

### Avatar Click in ItineraryCard

Current avatar rendering (non-clickable):
```tsx
{itinerary.user?.avatarUrl ? (
  <img src={itinerary.user.avatarUrl} ... />
) : (
  <div className="..."><span>{initial}</span></div>
)}
```

Updated with click + hover:
```tsx
<CreatorHoverCard creator={itinerary.user}>
  <Link href={`/profile/${itinerary.user.username}`}>
    {/* avatar rendering */}
  </Link>
</CreatorHoverCard>
```

### Algorithmic Featured Fallback

When no manual features exist for a category:
```sql
SELECT u.*, ...
FROM users u
JOIN trips t ON t.user_id = u.id
WHERE t.visibility IN ('public', 'marketplace', 'curated')
  AND t.interests @> ARRAY['food']  -- the category interest
  AND u.username IS NOT NULL
GROUP BY u.id
ORDER BY SUM(t.clone_count) DESC
LIMIT 3;
```

---

## 12. Future Considerations (Out of Scope)

- Creator verification system (manual approval)
- Creator analytics dashboard
- Follower/following system
- Creator messaging
- Revenue sharing for curated itineraries

These are not part of this implementation but may be added later.
