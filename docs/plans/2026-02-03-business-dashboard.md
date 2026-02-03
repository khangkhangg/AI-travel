# Business Dashboard & Public Profile Implementation Plan

**Date:** 2026-02-03
**Status:** Planned
**Feature:** Business Dashboard, Public Business Profile, Reviews, eKYC Verification

---

## Overview

Create a comprehensive business management system that allows registered businesses to:
1. Manage their marketplace presence via a dashboard
2. Have a public-facing business profile page (like user profiles)
3. Receive and display customer reviews with user verification badges
4. Complete eKYC verification with document uploads
5. Receive notifications via Email and Telegram

---

## Database Schema

### New Tables

```sql
-- Business reviews from users
CREATE TABLE business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  -- User verification flags (crowdsourced trust signals)
  verified_contact BOOLEAN DEFAULT FALSE,
  verified_location BOOLEAN DEFAULT FALSE,
  verified_services BOOLEAN DEFAULT FALSE,
  verified_pricing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate reviews
  UNIQUE(business_id, reviewer_id)
);

-- Business verification documents for eKYC
CREATE TABLE business_verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'business_license', 'owner_id'
  document_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, document_type)
);

-- Business notification preferences
CREATE TABLE business_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  -- Email notifications
  email_new_trips BOOLEAN DEFAULT TRUE,
  email_proposal_updates BOOLEAN DEFAULT TRUE,
  email_new_reviews BOOLEAN DEFAULT TRUE,
  email_weekly_digest BOOLEAN DEFAULT FALSE,
  -- Telegram notifications
  telegram_id VARCHAR(100),
  telegram_verified BOOLEAN DEFAULT FALSE,
  telegram_new_trips BOOLEAN DEFAULT TRUE,
  telegram_proposal_updates BOOLEAN DEFAULT TRUE,
  telegram_new_reviews BOOLEAN DEFAULT TRUE,
  telegram_daily_summary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id)
);

-- Add columns to existing businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS
  verification_counts JSONB DEFAULT '{"contact": 0, "location": 0, "services": 0, "pricing": 0}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS
  ekyc_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS
  ekyc_verified_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS
  slug VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS
  completed_trips_count INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS
  response_rate DECIMAL(5,2) DEFAULT 0;

-- Create unique index for slug
CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_idx ON businesses(slug) WHERE slug IS NOT NULL;

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS business_reviews_business_id_idx ON business_reviews(business_id);
CREATE INDEX IF NOT EXISTS business_reviews_reviewer_id_idx ON business_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS business_reviews_rating_idx ON business_reviews(rating);
```

---

## File Structure

```
app/
├── business/
│   ├── page.tsx                    # Business dashboard (main)
│   └── [id]/
│       └── page.tsx                # Public business profile page
│
├── api/
│   └── businesses/
│       ├── [id]/
│       │   ├── reviews/
│       │   │   └── route.ts        # GET/POST reviews
│       │   └── route.ts            # GET single business
│       ├── verification/
│       │   └── route.ts            # POST upload docs, GET status
│       └── notifications/
│           └── route.ts            # GET/PUT notification settings

components/
├── business/
│   ├── BusinessLayout.tsx          # Dashboard layout with sidebar
│   ├── BusinessSidebar.tsx         # Dashboard navigation sidebar
│   ├── BusinessPublicPage.tsx      # Public profile page component
│   ├── BusinessReviewForm.tsx      # Review submission modal
│   ├── BusinessReviewCard.tsx      # Single review display
│   ├── VerificationBadges.tsx      # Verification status badges
│   └── panels/
│       ├── DashboardPanel.tsx      # Overview stats
│       ├── ProposalsPanel.tsx      # Manage proposals
│       ├── MarketplacePanel.tsx    # Browse opportunities
│       ├── ReviewsPanel.tsx        # View reviews
│       ├── ServicesPanel.tsx       # Manage services
│       ├── ProfilePanel.tsx        # Business info
│       ├── VerificationPanel.tsx   # eKYC document upload
│       └── SettingsPanel.tsx       # Notifications & preferences
```

---

## API Endpoints

### Reviews API

**GET `/api/businesses/[id]/reviews`**
```typescript
// Query params: ?limit=10&offset=0&sort=recent|rating
// Response:
{
  reviews: [
    {
      id: string,
      rating: number,
      review_text: string,
      verified_contact: boolean,
      verified_location: boolean,
      verified_services: boolean,
      verified_pricing: boolean,
      created_at: string,
      reviewer: {
        id: string,
        name: string,
        avatar_url: string
      }
    }
  ],
  total: number,
  averageRating: number,
  verificationCounts: {
    contact: number,
    location: number,
    services: number,
    pricing: number
  }
}
```

**POST `/api/businesses/[id]/reviews`**
```typescript
// Request body:
{
  rating: number,           // 1-5 required
  review_text: string,      // optional
  verified_contact: boolean,
  verified_location: boolean,
  verified_services: boolean,
  verified_pricing: boolean
}
```

### Verification API

**GET `/api/businesses/verification`**
```typescript
// Response (for current user's business):
{
  documents: [
    {
      document_type: 'business_license' | 'owner_id',
      status: 'pending' | 'approved' | 'rejected',
      uploaded_at: string,
      reviewed_at: string | null,
      rejection_reason: string | null
    }
  ],
  ekyc_verified: boolean
}
```

**POST `/api/businesses/verification`**
```typescript
// Multipart form data:
// - file: File
// - document_type: 'business_license' | 'owner_id'
```

### Notification Settings API

**GET `/api/businesses/notifications`**
```typescript
// Response:
{
  email_new_trips: boolean,
  email_proposal_updates: boolean,
  email_new_reviews: boolean,
  email_weekly_digest: boolean,
  telegram_id: string | null,
  telegram_verified: boolean,
  telegram_new_trips: boolean,
  telegram_proposal_updates: boolean,
  telegram_new_reviews: boolean,
  telegram_daily_summary: boolean
}
```

**PUT `/api/businesses/notifications`**
```typescript
// Request body: same as response structure
```

---

## Component Specifications

### 1. BusinessLayout.tsx
- Similar to `ProfileLayout.tsx`
- `flex h-screen bg-gray-50` layout
- Sidebar on left, main content on right
- Receives `business` prop and `children` render prop

### 2. BusinessSidebar.tsx
- Similar to `ProfileSidebar.tsx`
- Navigation items:
  - Dashboard (LayoutDashboard icon)
  - Proposals (FileText icon) - with pending badge
  - Marketplace (Globe icon)
  - Reviews (Star icon) - with new reviews badge
  - Services (Briefcase icon)
  - Profile (Building2 icon)
    - Sub: Business Info
    - Sub: Coverage Areas
    - Sub: Contact Info
    - Sub: Verification
  - Settings (Settings icon)
    - Sub: Notifications
    - Sub: Status

### 3. BusinessPublicPage.tsx
- Dark theme matching `JourneyDesign.tsx`
- Sections:
  1. Header (back button, share, contact)
  2. Hero (giant business name, logo, type badge)
  3. Stats bar (reviews, completed trips, response rate, eKYC badge)
  4. Verification status section
  5. Services offered grid
  6. Reviews section with "Write Review" button
  7. Connect section (social links, contact info, Telegram)

### 4. BusinessReviewForm.tsx
- Modal component
- Star rating selector
- Textarea for review
- Verification checkboxes:
  - Contact information accurate
  - Location/coverage correct
  - Services match description
  - Pricing as advertised
- Submit button

### 5. VerificationPanel.tsx
- Document upload zones (drag & drop)
- Status indicators for each document
- Preview of uploaded documents
- User verification counts display

---

## Implementation Order

### Phase 1: Database & Core APIs
1. Create database migration
2. Implement reviews API
3. Implement verification API
4. Implement notifications API

### Phase 2: Business Dashboard
1. Create BusinessLayout component
2. Create BusinessSidebar component
3. Implement DashboardPanel
4. Implement ProfilePanel
5. Implement VerificationPanel
6. Implement SettingsPanel
7. Implement ProposalsPanel
8. Implement MarketplacePanel
9. Implement ReviewsPanel
10. Implement ServicesPanel

### Phase 3: Public Business Page
1. Create BusinessPublicPage component
2. Create BusinessReviewForm modal
3. Create VerificationBadges component
4. Create BusinessReviewCard component
5. Wire up `/business/[id]` route

### Phase 4: Notifications
1. Implement Telegram bot setup instructions
2. Add notification triggers to relevant APIs
3. Create notification service

---

## Design Specifications

### Public Business Page (Dark Theme)

**Colors:**
- Background: `bg-zinc-950`
- Text primary: `text-white`
- Text secondary: `text-zinc-400`
- Accent: `text-teal-400` / `bg-teal-500`
- eKYC badge: `text-blue-400` / `bg-blue-500/20`
- Review stars: `text-amber-400`

**Typography:**
- Business name: `text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter`
- Section headers: `text-2xl md:text-3xl font-black tracking-tight`
- Stats numbers: `text-5xl md:text-6xl font-black`

**Components:**
- Cards: `bg-zinc-900/50 border border-zinc-800 rounded-2xl`
- Buttons: `bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl`
- Badges: `px-3 py-1.5 rounded-full text-sm font-medium`

### Business Dashboard (Light Theme)

**Colors:**
- Background: `bg-gray-50`
- Sidebar: `bg-white border-r border-gray-200`
- Cards: `bg-white border border-gray-100 rounded-2xl`
- Accent: `emerald-500` / `teal-500`

---

## Security Considerations

1. **Document uploads**: Store in secure bucket with signed URLs
2. **eKYC documents**: Encrypt at rest, auto-delete after verification
3. **Reviews**: One review per user per business
4. **Telegram**: Verify connection via bot token exchange
5. **Rate limiting**: Apply to review submissions and document uploads

---

## Testing Checklist

- [ ] Business can register and access dashboard
- [ ] Business can upload verification documents
- [ ] Admin can approve/reject documents
- [ ] Users can submit reviews with verification flags
- [ ] Reviews display correctly on public page
- [ ] Verification counts update when reviews submitted
- [ ] Telegram ID can be saved and notifications work
- [ ] Public business page displays all information
- [ ] Mobile responsive for all pages

---

## Future Enhancements

1. **Review responses**: Allow businesses to respond to reviews
2. **Photo reviews**: Allow users to attach photos to reviews
3. **Booking system**: Direct booking through business page
4. **Analytics**: Detailed analytics for businesses
5. **Verified purchase badges**: Mark reviews from actual customers
6. **AI-powered review summaries**: Summarize common themes
