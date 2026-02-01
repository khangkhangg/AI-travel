# Curated Trip View Design

**Date:** 2026-02-02
**Status:** Approved

## Overview

Transform `/trips/[id]` into a beautiful, single-page curated itinerary view optimized for sharing and discovery. Editing functionality moves to `/trips/[id]/collaborate`.

## Page Layout

### Desktop (60/40 Split)

```
┌─────────────────────────────────────────────────────────┐
│  Header: Title, Location, Stats, Action Buttons         │
├───────────────────────────────┬─────────────────────────┤
│                               │  Creator Card (sticky)  │
│   Day 1 Header                │  - Avatar, name, badges │
│   ├─ Activity Card (timeline) │  - Collapsible (default │
│   ├─ Activity Card            │    expanded)            │
│   └─ Activity Card            ├─────────────────────────┤
│                               │  Map (sticky)           │
│   Day 2 Header                │  - Leaflet with pins    │
│   ├─ Activity Card            │  - Color-coded by day   │
│   └─ Activity Card            │  - Auto-highlights on   │
│                               │    scroll               │
│   Day 3 Header                │                         │
│   └─ ...                      │                         │
├───────────────────────────────┴─────────────────────────┤
│  Full Creator Profile Section                           │
│  - Bio, all badges, credentials, tip buttons            │
└─────────────────────────────────────────────────────────┘
```

### Mobile

Stacks vertically: Header → Map (shorter) → Itinerary → Creator Profile

## Components

### 1. Header

- Back button (returns to My Trips)
- Trip title (large, prominent)
- Location with map pin icon
- Stats pills: Days count, Places count, Estimated budget
- Optional tags (food-focused, walkable, family-friendly)
- Actions: Share button, Save/Favorite heart

### 2. Compact Creator Card (Sticky, Above Map)

```
┌─────────────────────────────────┐
│  [Avatar]  Name           [▼]  │
│            @username           │
│            🏅 Local Expert     │
│            🌍 Verified Guide   │
│            ──────────────────  │
│            "Curator tagline"   │
└─────────────────────────────────┘
```

- Collapse button to minimize to avatar + name only
- Shows top 2-3 badges
- One-line curator experience tagline

### 3. Interactive Map

- Uses existing Leaflet TravelMap component (adapted)
- Day color legend at bottom
- Pin colors: Day 1 (red), Day 2 (blue), Day 3 (green), etc.
- Active day pins: full opacity, slightly larger
- Other days: 40% opacity, dimmed
- On scroll past day header → map auto-pans to fit that day's pins
- Clicking a pin scrolls left column to that activity

### 4. Day Sections with Timeline

**Day Header:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Day 1 · Old Town & Jewish Quarter  🔴
  Morning to Evening · 5 places
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Activity Cards (Timeline Style):**
```
  │
  🔴──┬─────────────────────────────────┐
  │   │  ☕ Café Savoy                   │
  │   │  ───────────────────────────    │
  │   │  9:00 AM · Breakfast · $15      │
  │   │                                 │
  │   │  Historic Art Nouveau café...   │
  │   │                                 │
  │   │  📍 Vítězná 5, Prague 5         │
  │   │  [🗺️ View on Map]               │
  │   └─────────────────────────────────┘
  │
```

Card elements:
- Category icon + Title (bold)
- Time · Category badge · Cost
- Description (2-3 lines)
- Location address
- Optional: "View on Map" link (highlights pin)
- Optional: Source URL link if available

### 5. Full Creator Profile (Bottom)

```
┌─────────────────────────────────────────────────────────┐
│  ─────────────── About the Creator ───────────────      │
│                                                         │
│  [Large Avatar]  Name                                   │
│                  @username · Location                   │
│                  🏅 Local Expert  🌍 Verified Guide     │
│                  🗺️ Globetrotter · X countries         │
│                  ✨ Y curated trips                     │
│                                                         │
│  "Full bio / curator experience text..."                │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ X years  │ │ Local    │ │ Expertise│                │
│  │ in City  │ │ Expert   │ │ Area     │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │  💝 Support this creator                      │     │
│  │  [PayPal] [Venmo] [Ko-fi] [BuyMeACoffee]     │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│              [View Profile]  [Follow]                   │
└─────────────────────────────────────────────────────────┘
```

Tip section:
- Only shows if creator has payment links configured
- Uses existing `user_payment_links` data
- Clicking opens payment link in new tab
- Primary payment method highlighted

## Data Requirements

### From trips table:
- title, city, generated_content
- curator_is_local, curator_years_lived, curator_experience
- user_id (to fetch creator info)

### From users table (creator):
- name, username, avatar_url, bio
- location

### From user_badges table:
- All badges for creator

### From user_payment_links table:
- Payment platforms and links for tip buttons

### From itinerary_items table:
- All activities with day_number, order_index
- title, description, category, time_slot
- estimated_cost, location_name, location_address
- coordinates (lat, lng) for map pins

## Technical Implementation

### New/Modified Files:
1. `app/trips/[id]/page.tsx` - Replace with curated view
2. `components/curated/CuratedTripView.tsx` - Main component
3. `components/curated/TripMap.tsx` - Adapted from TravelMap
4. `components/curated/CreatorCard.tsx` - Compact sticky card
5. `components/curated/CreatorProfile.tsx` - Full bottom section
6. `components/curated/DayTimeline.tsx` - Day header + activity cards
7. `components/curated/ActivityTimelineCard.tsx` - Individual card

### Map Integration:
- Adapt existing `TravelMap.tsx` component
- Add day-based color coding
- Add scroll-spy to detect active day
- Add pin click → scroll to activity

### Scroll Behavior:
- Use Intersection Observer API to detect day sections in viewport
- Update map state when active day changes
- Smooth scroll when clicking "View on Map" or pin

## Styling

- Clean white background for itinerary
- Subtle gray background for creator profile section
- Emerald accent color for highlights, badges, timeline dots
- Day colors: emerald (1), blue (2), amber (3), rose (4), violet (5)
- Cards: subtle shadow, rounded corners (xl)
- Mobile-first responsive design
