# AI Travel Planner — Platform Redesign

**Date:** 2026-01-26
**Status:** Design Complete — Ready for Implementation

---

## Overview

Complete redesign of the AI Travel Planner platform, transforming it from a simple trip generator into a full-featured travel marketplace with:

- **Smart trip planning** with AI chat refinements
- **Creator economy** for trip creators to earn tips
- **Booking agent marketplace** for professional travel agents
- **Vendor bidding** for hotels and tour guides to compete for travelers
- **Social collaboration** for group trip planning

---

## User Journey

```
LANDING → PLAN & CHAT → TRIP DETAIL → COLLABORATE & BOOK → SHARE & EARN
```

### User Roles

| Role | Description | Revenue Model |
|------|-------------|---------------|
| **Traveler** | Plan trips, book, collaborate | Consumer |
| **Trip Creator** | Create & publish itineraries | Tips, clone bonuses, referrals |
| **Booking Agent** | Plan for clients, manage bookings | Commission on bookings |

---

## Page Designs

### 1. Landing Page

**Layout: 70/30 split — Main content (left) / Chat panel (right)**

#### Quick Selectors (Top)
- **Conversational prompts** for quick starts:
  - "Beach trip for 2 in March"
  - "Family adventure under $3k"
  - "Solo food tour in Asia"
- **Visual expandable filters:**
  - Date picker
  - Number of people
  - Budget range
  - Travel type pills (Beach, Adventure, Food, Culture, etc.)

#### Chat Side Panel (Always Visible)
- AI assistant with smart suggestions
- Itinerary preview as selections are made
- Smart tags for quick actions
- Sticky — stays visible while scrolling

#### Destination Explorer (Main Area)
- **Interactive world map** — click regions to explore
- **Featured destination hero card** — large, immersive
- **Destination gallery** — smaller cards in horizontal scroll or grid

#### Mobile Behavior
- Chat becomes bottom sheet, swipe up to expand
- Quick selectors collapse into filter bar

---

### 2. Trip Detail View

**Accessed after creating or selecting a trip**

#### Header
- Trip name, dates, collaborator count
- Share button, settings

#### Tabs
- Overview
- Calendar
- Timeline
- Bookings
- Budget
- Collaborators

#### Main Content (Left)
- **Calendar highlight** — visual date range
- **Day-by-day cards:**
  - Drag to reorder
  - Click to expand details
  - Inline tour package suggestions
  - AI warnings (packed days, weather issues)

#### Chat Panel (Right)
- Trip-specific AI assistant
- Smart tags:
  - **Trip adjustments:** +1 day, -1 day, increase budget, add person
  - **Activity preferences:** more food spots, less museums, kid-friendly
  - **Itinerary actions:** swap days, remove activity, find alternative
  - **AI suggestions:** contextual recommendations
- Itinerary preview
- Tour packages tab

---

### 3. Sharing & Visibility Settings

#### Three-Tier Visibility
1. **Private** — Only you and invited collaborators
2. **Link sharing** — Anyone with link can view
3. **Public** — Listed in Discover, open for suggestions & bids

#### Public Trip Options
- Allow community feedback & suggestions
- Allow vendors to bid (hotels, tours, guides)
- Accept tips for this itinerary
- Allow others to clone this trip

---

### 4. Bids & Offers System

#### Vendor Bids
- **Side-by-side comparison** — current plan vs offer
- Vendor verification badges
- Price comparison highlighting savings
- Chat with vendor before accepting
- One-click accept for instant booking

#### Community Suggestions
- Upvote/downvote
- Reply threads
- Apply suggestion button
- Tip the suggester

---

### 5. Collaboration Features

#### Collaborator Management
- **Permission levels:**
  - Owner — full control
  - Editor — add/edit activities, accept bids
  - Viewer — view, comment, vote only

#### Activity Voting
- Propose multiple options for an activity
- Each collaborator votes
- Visual vote count with progress bars
- Inline discussion per option
- Finalize button to lock decision

#### Budget & Cost Splitting
- Automatic total calculation
- Per-category breakdown (accommodation, transport, activities, food, tours)
- Per-person split
- Payment status tracking (paid/pending)
- Send reminders
- Export to Splitwise
- Generate payment links

---

### 6. Creator Profile & Dashboard

#### Public Profile
- Profile photo, bio, specialties
- Stats: itineraries, tips earned, views, followers
- Action buttons: Follow, Tip, Message, Request Custom Trip
- Itinerary gallery with ratings, views, clone counts

#### Creator Dashboard (Private)
- **Earnings breakdown:**
  - Tips received
  - Clone bonuses
  - Referral commissions
- Top performing itineraries
- Engagement metrics (comments, likes, clones)
- Withdraw to bank
- Promote itinerary option

---

### 7. Booking Agent Dashboard

#### Overview Stats
- Active trips count
- Monthly commission
- Total bookings value
- Client satisfaction rating

#### Client CRM
- Client list with status pipeline:
  - Inquiry → Planning → Booked → Traveling → Completed
- Trip value tracking
- Quick actions per client

#### Bid Opportunities
- Browse public trips seeking agents
- Filter by destination, budget, dates
- Estimated commission display
- Submit proposal workflow
- Message traveler directly

#### Agent Tools
- Email templates
- Proposal generator
- Invoice generator
- Partner rates (hotels/tours)
- Commission calculator
- Request reviews

---

## Data Model

### Core Entities

```
User
├── id, email, name, avatar
├── roles: ['traveler', 'creator', 'agent']
├── creator_profile: { bio, specialties, stats }
└── agent_profile: { company, verification, rating }

Trip
├── id, title, owner_id
├── dates: { start, end }
├── settings: { travelers, budget, travel_types }
├── visibility: 'private' | 'link' | 'public'
├── public_options: { allow_feedback, allow_bids, accept_tips, allow_clone }
├── collaborators: [{ user_id, role }]
└── days: [Day]

Day
├── id, trip_id, date, order
└── activities: [Activity]

Activity
├── id, day_id, type, title, description
├── time: { start, end }
├── location: { name, address, coordinates }
├── cost: { amount, currency }
├── booking: Booking | null
└── votes: [Vote]

Booking
├── id, activity_id, vendor_id
├── status: 'pending' | 'confirmed' | 'cancelled'
├── confirmation_number
└── cost: { amount, currency }

Bid
├── id, trip_id, activity_id, vendor_id
├── type: 'hotel' | 'tour' | 'agent'
├── message, offer_details
├── price: { original, offered }
└── status: 'pending' | 'accepted' | 'declined'

Comment
├── id, trip_id, activity_id, user_id
├── content, parent_id (for replies)
└── votes: { up, down }

Vote
├── id, activity_id, user_id
└── option_index

Tip
├── id, from_user_id, to_user_id, trip_id
└── amount, currency, message

Commission
├── id, agent_id, booking_id
├── amount, currency
└── status: 'pending' | 'paid'
```

---

## AI Integration Points

| Feature | AI Use | Trigger |
|---------|--------|---------|
| Smart suggestions | Context-aware prompts | User makes selections |
| Itinerary generation | Full trip from preferences | Form submission |
| Chat refinements | NLP trip modifications | Chat input |
| Weather warnings | Proactive day-swap suggestions | Trip dates set |
| Package matching | Recommend relevant tours | Activity added |
| Price optimization | Suggest timing/alternatives | Budget constraints |
| Smart tags | Contextual action suggestions | Based on itinerary state |

---

## Technical Considerations

### Frontend
- Next.js 16 with App Router
- Tailwind CSS for styling
- Real-time updates via Supabase subscriptions
- Map integration (Google Maps or Mapbox)
- Responsive design with mobile-first approach

### Backend
- Supabase for auth, database, real-time
- PostgreSQL for data storage
- Edge functions for AI calls
- Stripe for payments (tips, bookings)

### Third-Party Integrations
- OpenAI/Anthropic for AI chat
- Google Maps for location data
- Stripe for payments
- Splitwise API for cost splitting export

---

## Implementation Priority

### Phase 1: Core Landing Page
1. Quick selectors (prompts + filters)
2. Chat side panel with AI
3. Interactive map + destination gallery
4. Basic trip generation

### Phase 2: Trip Detail & Collaboration
1. Trip detail view with all tabs
2. Day-by-day editing
3. Collaborator invites & permissions
4. Voting system
5. Cost splitting

### Phase 3: Marketplace & Social
1. Public trip visibility
2. Vendor bidding system
3. Community feedback
4. Creator profiles & tipping

### Phase 4: Agent Platform
1. Agent dashboard
2. CRM features
3. Bid opportunities
4. Commission tracking

---

## Next Steps

1. Review and approve this design
2. Create implementation plan with detailed tasks
3. Set up git worktree for isolated development
4. Begin Phase 1 implementation
