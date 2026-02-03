# Tour Booking System Design

## Overview

Allow visitors to book tours with guides directly from their public profile. Guides manage bookings via a new Bookings tab in their private profile with calendar and table views.

## Database Schema

```sql
CREATE TABLE tour_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id),
  visitor_name VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(50),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  party_size INTEGER DEFAULT 1,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, rejected, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tour_bookings_guide_id ON tour_bookings(guide_id);
CREATE INDEX idx_tour_bookings_date ON tour_bookings(booking_date);
CREATE INDEX idx_tour_bookings_status ON tour_bookings(status);
```

**Google Calendar settings:**
- Admin toggle: `site_settings` table with key `google_calendar_booking_enabled`
- Guide embed code: stored in `guide_details` JSON as `google_calendar_embed`

## Components

### 1. Public Profile - Booking Form

Location: Added to "Available as Guide" section in `JourneyDesign.tsx`

**Fields:**
- Date (date picker)
- Start time / End time (time selectors)
- Party size (number input)
- Visitor name, email, phone
- Notes (optional textarea)

**Behavior:**
- Shows estimated cost (hourly_rate × duration)
- Submits to `/api/bookings` POST
- Shows success message with "pending confirmation" status

**Google Calendar option:**
- Only shows if admin enabled AND guide has embed code
- Renders guide's Google Calendar embed code
- Displayed as alternative booking method

### 2. Private Profile - Floating Sidebar

Location: `/app/profile/page.tsx`

**Sidebar items:**
- Profile (existing)
- Settings (existing)
- Bookings (new, only for guides)

**Visual:**
- Fixed/sticky position on left
- Shows pending/confirmed counts as badges
- Collapses on mobile

### 3. Private Profile - Bookings Tab

**Calendar View:**
- Monthly mini calendar
- Dots/badges showing booking counts per day
- Color coded: yellow=pending, green=confirmed

**Table View:**
- Columns: Name, Date, Time, Party Size, Status, Actions
- Actions: Confirm, Reject buttons for pending bookings
- Filter by status dropdown
- Click row to see full details

### 4. Admin Settings

Location: `/app/admin/page.tsx`

**New section: Guide Booking Settings**
- Toggle: "Google Calendar Direct Booking"
- Description text explaining the feature
- When enabled, guides see Google Calendar embed field in their settings

### 5. Guide Settings - Google Calendar Embed

Location: Guide Mode section in `/app/profile/page.tsx` Settings tab

**Field:**
- Textarea for pasting full Google Calendar embed code
- Only visible when admin has enabled Google Calendar feature
- Help text with instructions

## API Endpoints

### POST /api/bookings
Create new booking request

### GET /api/bookings
List bookings for authenticated guide (with filters)

### GET /api/bookings/[id]
Get booking details

### PATCH /api/bookings/[id]
Update booking status (confirm/reject)

### GET /api/admin/site-settings?key=google_calendar_booking_enabled
Check if Google Calendar is enabled

### PATCH /api/admin/site-settings
Update Google Calendar setting (admin only)

## Status Flow

```
[Visitor books] → PENDING → [Guide confirms] → CONFIRMED
                         → [Guide rejects]  → REJECTED
                         → [Visitor cancels] → CANCELLED
```

## Implementation Order

1. Database migration for tour_bookings table
2. Booking API endpoints (CRUD)
3. Public profile booking form component
4. Private profile floating sidebar
5. Private profile bookings tab with calendar + table
6. Admin Google Calendar toggle
7. Guide settings Google Calendar embed field
8. Test all flows
