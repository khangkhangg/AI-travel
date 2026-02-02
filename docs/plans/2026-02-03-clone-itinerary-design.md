# Clone Itinerary Feature Design

## Overview
Allow users to clone trips from public profiles. Track clone counts per trip and display total clones in user stats.

## Database Changes

### Add columns to `trips` table:
```sql
ALTER TABLE trips ADD COLUMN clone_count INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN cloned_from_id UUID REFERENCES trips(id) ON DELETE SET NULL;
```

### Auto-increment trigger:
```sql
CREATE OR REPLACE FUNCTION increment_trip_clone_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cloned_from_id IS NOT NULL THEN
    UPDATE trips SET clone_count = clone_count + 1 WHERE id = NEW.cloned_from_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_trip_clone_count
  AFTER INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION increment_trip_clone_count();
```

## API Endpoint

### POST `/api/trips/[id]/clone`

**Request:** Empty body or `{ "title": "Custom title" }`

**Response (success):**
```json
{ "tripId": "new-uuid", "message": "Trip cloned successfully" }
```

**Response (not authenticated):**
```json
{ "error": "Unauthorized", "requiresAuth": true }
```

**Logic:**
1. Check authentication (return 401 with `requiresAuth: true` if not)
2. Fetch original trip (must be public/curated)
3. Copy trip with `cloned_from_id` set to original
4. Copy all `itinerary_items` to new trip
5. Database trigger auto-increments original's `clone_count`
6. Return new trip ID

## UI Changes

### 1. Travel Cards (JourneyDesign.tsx, ExplorerDesign.tsx, WandererDesign.tsx)
- Replace `+` button with Clone (Copy icon)
- Show clone count badge on cards (if > 0)
- On click:
  - If authenticated: clone trip, redirect to new trip
  - If not authenticated: show AuthModal

### 2. Stats Section
Add "CLONES" between TRIPS and FOLLOWERS:
```
12          1          5          0
COUNTRIES   TRIPS      CLONES     FOLLOWERS
```

### 3. AuthModal Integration
- Reuse existing `AuthModal` component
- Pass `onAuthSuccess` callback to trigger clone after login
- Store pending clone action in component state

## User Flows

### Logged-in User:
1. Click Clone → API call → Redirect to new trip

### Not Logged-in User:
1. Click Clone → AuthModal opens
2. Sign in → Modal calls `onAuthSuccess` → Clone happens → Redirect to new trip

### Registration Flow:
1. Click Clone → AuthModal opens → Click "Create account"
2. Register → "Check email" message shown
3. User verifies email, logs in
4. User returns to trip page, clicks Clone again → Clone happens

## Files to Modify

1. `lib/db/migrations/add_clone_to_trips.sql` - New migration
2. `app/api/trips/[id]/clone/route.ts` - New API endpoint
3. `app/api/users/[userId]/route.ts` - Add totalClones to stats
4. `app/profile/[username]/page.tsx` - Pass totalClones to designs
5. `components/profile/designs/JourneyDesign.tsx` - Clone button + stats
6. `components/profile/designs/ExplorerDesign.tsx` - Clone button + stats
7. `components/profile/designs/WandererDesign.tsx` - Clone button + stats
