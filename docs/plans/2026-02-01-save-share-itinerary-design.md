# Save & Share Itinerary Design

## Overview

Add Save and Share functionality to the AI-generated itinerary screen, allowing users to save itineraries and share them with various visibility options including a "Curated Itinerary" mode for local experts.

## Save Flow

### Save Button States

| State | Button Text | Style |
|-------|-------------|-------|
| Unsaved | `💾 Save` | Default white |
| Saving | `Saving...` | Disabled |
| Saved | `✓ Saved` | Green tint |
| Has Changes | `💾 Save Changes` | Default white |

### Behavior

1. User clicks **Save**
2. Itinerary saves immediately as **private** (default)
3. **Visibility modal** appears below the Save/Share buttons
4. User can optionally change visibility settings
5. Button updates to "✓ Saved" state

## Share Modal

### Position
- Appears **directly below** the Share button (not center screen)
- Dismissible via X button or clicking outside

### Layout

```
┌─────────────────────────────────────────────┐
│  Share Your Itinerary                    ✕  │
├─────────────────────────────────────────────┤
│  ○ 🔒 Private                               │
│     Only you can access                     │
│                                             │
│  ○ 🌐 Public                                │
│     Anyone can view and comment             │
│                                             │
│  ○ 🏢 Marketplace                           │
│     Travel companies can bid on your trip   │
│                                             │
│  ○ ⭐ Curated Itinerary                     │
│     Share as local expert, earn tips        │
│     [Expandable expertise fields]           │
├─────────────────────────────────────────────┤
│  🔗 https://wanderlust.com/shared/abc123    │
│                                    [Copy]   │
├─────────────────────────────────────────────┤
│                          [Update Sharing]   │
└─────────────────────────────────────────────┘
```

## Visibility Options

### 1. Private (default)
- Only the creator can access
- Share URL works but requires login as owner

### 2. Public
- Anyone with the link can view
- Visitors can comment
- Appears in public itinerary listings

### 3. Marketplace
- Travel companies can view and bid
- Open to offers from tour operators
- Visible in marketplace section

### 4. Curated Itinerary
- For local experts and experienced travelers
- Displays creator's expertise credentials
- Other users can clone for inspiration
- Creator can receive tips

#### Curated Expertise Fields

When "Curated Itinerary" is selected, show additional fields:

**Are you a local?**
- Yes, I live here
- No, but I've visited multiple times
- No, this is my first detailed trip

**How long have you lived/stayed here?**
- Less than 1 year
- 1-2 years
- 3-5 years
- 5+ years
- N/A (visitor)

**Experience with destination:**
- First time visitor
- Visited 2-5 times
- Visited 10+ times
- Local expert / Tour guide

## Share URL & Tooltip

### URL Format
```
https://wanderlust.com/shared/{shareCode}
```
- `shareCode` generated via `nanoid(10)`

### Tooltip on Share Button Hover
After saving, hovering over Share button shows tooltip with the share URL:
```
┌────────────────────────────────────┐
│ 🔗 wanderlust.com/shared/abc123xyz │
└────────────────────────────────────┘
```

### Share Button Visibility Indicator
```
[↗️ Share]              ← not yet shared / private
[↗️ Shared · Public]    ← public visibility
[↗️ Shared · Curated ⭐] ← curated with star
```

## Header "My Trips" Badge

- Show trip count badge **only when count > 0**
- Desktop: `♡ My Trips (3)`
- Mobile menu: `My Trips [3]` (small badge)

## Database Changes

### Add to `trips` table (or create migration)
```sql
ALTER TABLE trips ADD COLUMN IF NOT EXISTS curator_is_local BOOLEAN;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS curator_years_lived TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS curator_experience TEXT;
```

### Update `ItineraryVisibility` type
```typescript
export type ItineraryVisibility = 'public' | 'private' | 'marketplace' | 'curated';
```

## Components to Modify

1. **ItineraryDisplay.tsx** - Add save states, share modal trigger
2. **Header.tsx** - Add trip count badge
3. **New: ShareModal.tsx** - Visibility picker modal
4. **API: /api/trips/route.ts** - Handle visibility updates
5. **API: /api/trips/[id]/route.ts** - PATCH for visibility changes

## Implementation Order

1. Add database columns for curator info
2. Update visibility type to include 'curated'
3. Create ShareModal component
4. Update ItineraryDisplay with save states and modal
5. Add tooltip to Share button
6. Update Header with trip count badge
7. Test full flow
