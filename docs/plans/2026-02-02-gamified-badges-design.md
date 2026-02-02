# Gamified Badge System Design

## Overview

A leveled badge system with three achievement tracks that motivate users to travel more and engage with the platform. Badges level up as users progress, with fun evolving names.

## Badge Tracks

### 1. Explorer Track (Countries Visited)
| Level | Name | Threshold | Description |
|-------|------|-----------|-------------|
| 1 | Tourist | 1-2 | Just getting started |
| 2 | Wanderer | 3-5 | Building momentum |
| 3 | Nomad | 6-10 | Serious traveler |
| 4 | Globe Trotter | 11-25 | Impressive reach |
| 5 | Citizen of Earth | 26+ | Elite explorer |

### 2. Creator Track (Itineraries Created)
| Level | Name | Threshold | Description |
|-------|------|-----------|-------------|
| 1 | Daydreamer | 1 | First itinerary |
| 2 | Pathfinder | 3-5 | Getting active |
| 3 | Trailblazer | 6-10 | Prolific creator |
| 4 | Adventure Architect | 11-25 | Master planner |
| 5 | Dream Maker | 26+ | Elite creator |

### 3. Influence Track (Itinerary Clones)
| Level | Name | Threshold | Description |
|-------|------|-----------|-------------|
| 1 | Hidden Gem | 1-5 | Getting noticed |
| 2 | Local Favorite | 6-15 | Building following |
| 3 | Trendsetter | 16-50 | Influential |
| 4 | Travel Guru | 51-100 | Major influence |
| 5 | Legend | 101+ | Elite status |

## Visual Design

### Color Hierarchy (by level)
- Level 1-2: Gray (`text-gray-400`, `text-gray-500`)
- Level 3: Bronze (`text-amber-700`)
- Level 4: Emerald (`text-emerald-500`)
- Level 5: Gold (`text-yellow-500`)

### Display Style
- Icon grid with same-size icons
- Color indicates achievement tier
- Tooltip on hover/tap shows:
  - Badge name & icon
  - Current progress description
  - Progress bar (current/next threshold)
  - "Next: [level name]" motivation

### Display Locations
| Location | Display Style |
|----------|---------------|
| Creator card (trip page) | Compact icon grid |
| Creator profile section | Icon grid with tooltips |
| Public profile page | Icon grid with tooltips |
| Profile settings | Full progress cards |

## Database Schema

### New Table: `user_badge_levels`
```sql
CREATE TABLE user_badge_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track VARCHAR(20) NOT NULL, -- 'explorer', 'creator', 'influence'
  level INTEGER NOT NULL DEFAULT 1,
  current_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track)
);

CREATE INDEX idx_user_badge_levels_user ON user_badge_levels(user_id);
```

### Badge Level Updates
Badge levels are updated when:
- User adds a new country to travel history → recalculate explorer level
- User creates/publishes an itinerary → recalculate creator level
- Someone clones user's itinerary → recalculate influence level

## API Endpoints

### GET /api/users/[userId]/badges
Returns user's badge levels for all tracks:
```json
{
  "badges": [
    {
      "track": "explorer",
      "level": 4,
      "name": "Globe Trotter",
      "icon": "🌍",
      "currentCount": 15,
      "nextThreshold": 26,
      "nextName": "Citizen of Earth"
    },
    {
      "track": "creator",
      "level": 3,
      "name": "Trailblazer",
      "icon": "✨",
      "currentCount": 8,
      "nextThreshold": 11,
      "nextName": "Adventure Architect"
    },
    {
      "track": "influence",
      "level": 2,
      "name": "Local Favorite",
      "icon": "🔥",
      "currentCount": 12,
      "nextThreshold": 16,
      "nextName": "Trendsetter"
    }
  ],
  "specialBadges": [
    { "type": "local_expert", "city": "Paris" },
    { "type": "verified_guide" }
  ]
}
```

### POST /api/users/[userId]/badges/recalculate
Recalculates all badge levels for a user (called internally after relevant actions).

## Implementation Tasks

### Task 1: Database Migration
- Create `user_badge_levels` table
- Add to migration API endpoint

### Task 2: Badge Definitions
- Create `/lib/badges.ts` with track definitions, thresholds, colors
- Export helper functions: `getBadgeLevel()`, `getNextLevel()`, `getLevelColor()`

### Task 3: Badge Calculation API
- Create `/api/users/[userId]/badges/route.ts`
- GET: Return current badge levels
- POST to `/recalculate`: Recalculate from user stats

### Task 4: Badge Recalculation Triggers
- Update travel history API → recalculate explorer
- Update trip creation API → recalculate creator
- Update clone API → recalculate influence

### Task 5: UI Component
- Create `BadgeGrid.tsx` component
- Icon display with level colors
- Tooltip with progress bar
- Sort by level (highest first)

### Task 6: Integration
- Add BadgeGrid to CreatorProfile
- Add BadgeGrid to CreatorCard
- Add BadgeGrid to public profile designs

## Special Badges (Unchanged)
These remain as separate one-time achievements:
- 📍 Local Expert - 3+ itineraries for same city
- ✓ Verified Guide - Registered tour guide
- 💝 Tipped Creator - Received first tip

## Success Criteria
- [ ] Badge levels persist in database
- [ ] Levels update automatically on relevant actions
- [ ] UI displays badges with correct colors
- [ ] Tooltips show progress and next level
- [ ] Badges sorted by level (most impressive first)
