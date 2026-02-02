# Business Marketplace Design

## Overview

A marketplace system allowing travelers to request services (guide, hotel, transport, experience, health) on their itineraries, and businesses to submit proposals/bids.

## Key Features

1. **Marketplace Status** - Travelers set itinerary to "Marketplace" with service needs
2. **Business Accounts** - Hotels, guides, transport, experiences, health services can register
3. **Proposal System** - Businesses create detailed proposals with pricing breakdowns
4. **Creator + Guide** - Creators can enable guide mode to bid on trips
5. **Destination-First Browsing** - Businesses filter by location, then service type

---

## Data Model

### New Tables

```sql
-- Business accounts
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('guide', 'hotel', 'transport', 'experience', 'health')),
  business_name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  coverage_areas JSONB DEFAULT '[]', -- [{city, region, country}]
  contact_info JSONB DEFAULT '{}', -- {phone, email, address}
  social_links JSONB DEFAULT '{}', -- {website, instagram, facebook, tripadvisor, google_maps}
  verified BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business type-specific details
CREATE TABLE business_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  details JSONB NOT NULL, -- Type-specific fields (see below)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotel details: {star_rating, room_types: [{name, price, capacity}], amenities: [], check_in_time, check_out_time, breakfast_options, cancellation_policy}
-- Transport details: {vehicle_types: [{type, capacity, price_per_km, price_per_day}], airport_pickup_price, driver_languages: []}
-- Guide details: {languages: [], specialties: [], hourly_rate, daily_rate, max_group_size, certifications: [], can_help_book: []}
-- Experience details: {activity_types: [], duration_options: [], equipment_provided: [], skill_levels: [], inclusions: [], age_restrictions}
-- Health details: {service_types: [], facilities: [], certifications: [], consultation_fee, treatment_packages: [{name, description, price}]}

-- Business services catalog
CREATE TABLE business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  price_type VARCHAR(20) CHECK (price_type IN ('hourly', 'daily', 'fixed', 'per_person')),
  base_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  add_ons JSONB DEFAULT '[]', -- [{name, price, description}]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip service needs (marketplace requests)
CREATE TABLE trip_service_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES itinerary_items(id) ON DELETE CASCADE, -- NULL = trip-level
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('guide', 'hotel', 'transport', 'experience', 'health')),
  notes TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'has_offers', 'booked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip accommodation needs (per-night)
CREATE TABLE trip_accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  night_number INTEGER NOT NULL,
  date DATE,
  status VARCHAR(20) DEFAULT 'need' CHECK (status IN ('need', 'booked_open', 'booked_final')),
  current_booking JSONB, -- {hotel_name, price_per_night, booking_ref}
  location_preference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace proposals (bids)
CREATE TABLE marketplace_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  service_needs_ids UUID[], -- Which needs this proposal covers
  services_offered JSONB NOT NULL, -- [{service_name, days_covered: [], description}]
  pricing_breakdown JSONB NOT NULL, -- [{item, amount}]
  total_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  message TEXT,
  terms JSONB, -- {cancellation_policy, valid_until, inclusions, exclusions}
  attachments JSONB DEFAULT '[]', -- [{type, url, name}]
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'negotiating', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator guide mode (extends existing users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guide BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS guide_details JSONB;
-- {languages: [], specialties: [], hourly_rate, daily_rate, coverage_areas: [], can_help_book: []}
```

---

## Business Registration Flow

### Route: `/business/register`

**Step 1: Business Type Selection**
- Guide, Hotel, Transport, Experience, Health
- Single selection, determines subsequent fields

**Step 2: Common Fields (all types)**
- Business name, description, logo upload
- Coverage areas (multi-select cities/regions)
- Contact: phone, email, address
- Social links: website, Instagram, Facebook, TripAdvisor, Google Maps
- Business license upload (optional, for verification)

**Step 3: Type-Specific Fields**

| Type | Fields |
|------|--------|
| **Hotel** | Star rating, room types & prices, amenities checklist, check-in/out times, breakfast options, cancellation policy |
| **Transport** | Vehicle types with capacity & pricing, airport pickup price, driver languages |
| **Guide** | Languages, specialties, hourly/daily rates, max group size, certifications |
| **Experience** | Activity categories, duration options, equipment provided, skill levels, inclusions, age restrictions |
| **Health** | Service types (dental/wellness/medical/cosmetic), facilities, certifications, consultation fees, treatment packages |

**Step 4: Services & Pricing**
- Add individual services with base prices
- Add-on options with prices
- Package deals (optional)

---

## Marketplace Status Selection

### ShareModal Enhancement

When user selects "Marketplace" visibility:

1. **Service Needs Selection** (trip-level defaults)
   - Checkboxes: Guide, Hotel, Transport, Experience, Health
   - Budget range (optional): min-max per person
   - Additional notes text field

2. **Tip about per-activity overrides**
   - Link to Collaborate page for granular control

### Collaborate Page Enhancement

On each activity card, add "Need Service" button:
- Opens small modal with service type checkboxes
- Optional note field
- Saves to `trip_service_needs` with `activity_id`

### Accommodation Management

New section in Collaborate page: "Accommodations"
- Shows each night of the trip
- Status options: Need Hotel, Booked (Open to offers), Booked (Final)
- For "Booked" status: enter hotel name, price, booking ref
- Location preference field
- Notes field

---

## Marketplace Trip Detail Page (Business View)

### Layout: `/trips/[id]` (when marketplace)

**1. Hero Summary Card**
```
Title, destination, dates, travelers, budget
┌─────────────────────────────────────────┐
│ SERVICES NEEDED                         │
│ 🎯 Guide (Days 1-4)      [Make Offer]  │
│ 🏨 Hotel (4 nights)      [Make Offer]  │
│ 🚗 Transport (Day 1, 3)  [Make Offer]  │
│                                         │
│ Notes: "Family with 2 kids..."         │
└─────────────────────────────────────────┘
```

**2. Accommodations Section**
- Card per night/stay segment
- Shows status: Need / Booked (open) / Booked (final)
- For "Booked (open)": shows current booking, "Beat this price" button
- For "Need": shows location preference, "Bid on this" button

**3. Full Itinerary**
- Day-by-day timeline
- Each day header shows: "Staying at: [Hotel Name / Need Hotel]"
- Activities with service indicators if they need specific services
- "Bid" buttons on activities needing services

---

## Proposal/Bid Flow

### Create Proposal Modal

**Fields:**
1. Services you'll provide (checkboxes matching trip needs)
2. Days/items covered (for guide/experience)
3. Pricing breakdown (itemized: base + add-ons)
4. Total price
5. Message to traveler
6. Terms: cancellation policy, valid until date
7. Attachments: portfolio, reviews, license

### Traveler Proposal View

In trip dashboard, "Proposals" tab shows:
- List of proposals grouped by service type
- Each shows: business name, rating, price, summary
- Actions: View Details, Accept, Negotiate, Decline

### Proposal States
- `pending` - Awaiting traveler response
- `accepted` - Traveler accepted
- `declined` - Traveler declined
- `negotiating` - Back-and-forth discussion
- `expired` - Past valid_until date

---

## Creator + Guide Integration

### Enable Guide Mode

In Creator profile settings:
- Toggle: "Enable Guide Mode"
- When enabled, show additional fields:
  - Languages spoken
  - Specialties (food, history, adventure, photography...)
  - Hourly/daily rates
  - Coverage areas
  - **Can help book:** Hotels, Transport, Restaurants, Experiences, Health

### Profile Display

Public profile shows:
- Badges: "Creator" + "Also a Guide" (if enabled)
- Guide info section (if enabled): languages, rates, specialties
- "Can help book: Hotels, Transport, Restaurants..."
- "Book as Guide" button (opens contact/booking flow)

### /creators Page

- Show "Also a Guide" badge on creator cards
- Filter option: "Show Guides Only"
- Display "Can help book" services

---

## Landing Page Updates

### Business Marketplace Section

Enhanced with:
- **Filters:** Destination (primary), Service Type, Dates, Budget
- **Listing cards:** Show destination, dates, travelers, budget, needed services
- **CTA:** "Register as Business" button

### "Register Business" CTA

Replace current "Register Business" button text with link to `/business/register`

---

## /discover Page Updates

### New Tab: "Marketplace"

Alongside existing tabs (Curated Trips, Tours, Creators), add:
- **Marketplace** tab showing all marketplace itineraries
- Filters: Destination, Service type, Date range, Budget range, Group size
- Sort: Newest, Departing soon, Highest budget

---

## API Endpoints

### Businesses
- `POST /api/businesses` - Register business
- `GET /api/businesses` - List businesses (with filters)
- `GET /api/businesses/[id]` - Get business details
- `PATCH /api/businesses/[id]` - Update business
- `POST /api/businesses/[id]/services` - Add service
- `GET /api/businesses/[id]/proposals` - Get business's proposals

### Marketplace
- `GET /api/marketplace` - List marketplace itineraries (with filters)
- `POST /api/trips/[id]/service-needs` - Add service need
- `GET /api/trips/[id]/service-needs` - Get trip's service needs
- `POST /api/trips/[id]/accommodations` - Set accommodation status
- `GET /api/trips/[id]/accommodations` - Get trip accommodations

### Proposals
- `POST /api/trips/[id]/proposals` - Submit proposal
- `GET /api/trips/[id]/proposals` - Get proposals for trip (owner only)
- `PATCH /api/proposals/[id]` - Update proposal status
- `POST /api/proposals/[id]/messages` - Add negotiation message

### Creator Guide Mode
- `PATCH /api/users/me/guide-mode` - Enable/update guide mode
- `GET /api/creators?guide=true` - Filter creators who are guides

---

## Implementation Order

### Phase 1: Database & Core API
1. Create new tables (migration)
2. Business registration API
3. Trip service needs API
4. Trip accommodations API

### Phase 2: Business Registration UI
1. `/business/register` page with multi-step form
2. Business dashboard `/business` page
3. Business profile view

### Phase 3: Marketplace Status UI
1. Enhance ShareModal with service selection
2. Add accommodation section to Collaborate page
3. Add per-activity service needs in Collaborate

### Phase 4: Marketplace Browsing
1. Update MarketplaceItineraries component with filters
2. Add Marketplace tab to /discover
3. Update landing page section

### Phase 5: Proposal System
1. Proposal creation modal
2. Proposal listing for travelers
3. Proposal management for businesses
4. Negotiation messaging

### Phase 6: Creator Guide Mode
1. Guide mode toggle in profile settings
2. Update creator profile display
3. Update /creators page with guide filter

---

## Success Metrics

- Number of marketplace listings created
- Number of business registrations
- Proposals submitted per listing
- Proposal acceptance rate
- Time to first proposal
- Business rating/review scores
