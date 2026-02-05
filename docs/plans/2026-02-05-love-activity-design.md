# Love Activity in Profile Activity Panel

## Overview

Add "love" activity to the profile's Recent Activity section, showing both trips the user has loved and loves received on their trips.

## Requirements

- Show both directions: trips I loved + loves received on my trips
- Clicking links to the trip (love count visible in header)
- Add "Loves Only" filter option
- Visual styling: Rose/pink color scheme matching the header love button

## Data Layer

### New Activity Types

- `trip_loved` - When you love someone's trip
- `love_received` - When someone loves your trip

### API Changes (`/api/users/me/activity/route.ts`)

Add two queries to fetch from `trip_loves` table:

1. **Trips you loved** - JOIN trip_loves with trips where user_id = current user
2. **Loves on your trips** - JOIN trip_loves with trips where trip owner = current user

### Activity Object Structure

```typescript
{
  id: `love-given-${trip_love.id}` | `love-received-${trip_love.id}`,
  type: 'trip_loved' | 'love_received',
  title: 'You loved "Trip to Bali"' | 'John loved your trip',
  subtitle: 'by @username' | '"Trip to Bali"',
  tripId: trip.id,
  loverName?: string,  // for love_received
  loverAvatar?: string,
  createdAt: trip_love.created_at
}
```

## UI Components

### ActivityPanel.tsx Changes

1. **Update ActivityType:**
```typescript
type ActivityType = 'suggestion_made' | 'bid_made' | 'suggestion_received' | 'bid_received' | 'trip_loved' | 'love_received';
```

2. **Add filter:**
```typescript
type FilterType = 'all' | 'bids' | 'suggestions' | 'loves' | 'sent' | 'received';
```

3. **Visual styling:**
- Icon: Heart (lucide-react)
- Color: Rose (`bg-rose-50`, `text-rose-500`)

4. **Quick Stats:** Add "Trips Loved" and "Loves Received" cards

## Files to Modify

| File | Changes |
|------|---------|
| `app/api/users/me/activity/route.ts` | Add queries for trip_loves |
| `components/profile/panels/ActivityPanel.tsx` | Add types, filter, icons, stats |

## Activity Display Examples

- **Trip you loved:** `❤️ You loved "5 Days in Bali"` → `by @traveler123`
- **Love received:** `❤️ @foodie_jane loved your trip` → `"Tokyo Food Tour"`
