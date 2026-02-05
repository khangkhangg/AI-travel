# Business Reviews System Design

## Overview

Enable users to add reviews on public business profiles and allow businesses to respond from their dashboard.

## Design Decisions

1. **Response Model**: Simple + status (one reply per review, with open/resolved/flagged status)
2. **Review Button Placement**: Both header and reviews tab on public profile
3. **Form Style**: Modal/dialog for review submission

## Database Changes

```sql
ALTER TABLE business_reviews ADD COLUMN IF NOT EXISTS
  response_text TEXT,
  response_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'flagged'));
```

## API Changes

**Endpoint:** `app/api/businesses/[id]/reviews/route.ts`

Add PATCH handler for business responses:
- Verify user owns the business
- Update response_text, response_at, status
- Only business owner can respond

## Component Changes

### Public Profile (`app/business/[handle]/page.tsx`)
- Add "Write a Review" button in header
- Add review modal using existing `BusinessReviewForm`
- Refresh reviews list on success

### Dashboard (`components/business/panels/BusinessReviewsPanel.tsx`)
- Add response form (textarea + submit)
- Add status dropdown (Open/Resolved/Flagged)
- Show existing response with blue background

## UI Design

**Review Card with Response:**
- User avatar, name, star rating, date
- Review text
- Business response in `bg-blue-50 border-l-4 border-blue-400` box
- Status badge: Open (yellow), Resolved (green), Flagged (red)

**Stars:** `text-yellow-400` filled, `text-gray-300` empty

## Files Modified

1. `lib/db/migrations/add_review_responses.sql`
2. `app/api/businesses/[id]/reviews/route.ts`
3. `app/business/[handle]/page.tsx`
4. `components/business/panels/BusinessReviewsPanel.tsx`
