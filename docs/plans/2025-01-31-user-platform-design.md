# User Platform Design

**Date:** 2025-01-31
**Status:** Approved

## Overview

Full marketplace platform enabling travelers to plan trips, share itineraries, collaborate with others, and connect with tour guides and hotels.

## Core Features

### 1. Authentication System

**Auth Modal (Dropdown Card)**
- Appears below "Sign In" button when clicked
- 320px wide, stays visible until click outside
- States: Sign In → Register → Forgot Password

**Auth Methods**
- Email + Password (primary)
- Google OAuth
- Apple OAuth
- Remember me checkbox

**Email Verification**
- Required within 30 days of signup
- User can access app immediately with banner reminder
- Account locked after 30 days if unverified
- Resend verification link option

### 2. User Profiles

**Basic Info**
- Display name
- Avatar (upload or from social login)
- Bio/introduction (500 char max)
- Current location (city/country)

**Contact Information**
- Email (required, from auth)
- Phone (optional)
- Social links: Instagram, X/Twitter, Facebook, TikTok, YouTube, LinkedIn, Website

**Travel History**
- Self-reported list of places visited
- Each entry: City, Country, Year/Month, optional notes
- Displayed as:
  - Visual timeline
  - Map pins (Leaflet + OpenStreetMap)

**Payment Links for Tips**
- PayPal email/link
- Venmo username
- CashApp $tag
- Wise email
- Ko-fi link
- Buy Me a Coffee link

**Badge System (Earned Automatically)**

| Badge | Criteria |
|-------|----------|
| First Itinerary | Created 1 itinerary |
| Explorer | 5 itineraries shared |
| Globetrotter | 10+ countries in travel history |
| Helpful | 10 comments/suggestions given |
| Tipped Creator | Received first tip |
| Verified Guide | Registered as tour guide |
| Local Expert: [City] | 3+ itineraries for same city |

### 3. Itinerary Sharing System

**Visibility Modes**

| Mode | Audience | Features |
|------|----------|----------|
| Public | Anyone | View, comment, clone, tip creator |
| Private | Invited users | Collaborate, vote, suggest changes |
| Marketplace | Verified businesses | Receive offers from guides/hotels |

**Public Itineraries**
- Discoverable in browse/search
- Anyone can view and comment
- One-click clone to personal copy
- Creator receives tips via payment links
- Stats: view count, clone count, comments

**Private Itineraries**
- Access via email invite or private link
- Roles: Viewer (read-only) or Collaborator
- Collaborators can:
  - Comment and discuss
  - Suggest activity alternatives
  - Vote on activities (👍/👎)
  - Vote on hotel options
  - @mention other collaborators
- Owner accepts/rejects suggestions

**Marketplace Listing (Opt-in)**
- Toggle: "Open to offers from guides & hotels"
- Requires: Travel dates, destination confirmed
- Visible info: Destination, dates, group size, hotel status
- Businesses can send offers
- Traveler controls visibility

### 4. Collaboration Features

**Inviting Collaborators**
- Share via email or private link
- Assign role: Viewer or Collaborator
- Owner can remove anytime

**Suggestion System**
- Click any activity to suggest alternative
- Original and suggestion shown side-by-side
- Collaborators vote on options
- Owner makes final decision

**Voting**
- Vote on activities: 👍 / 👎
- Vote on hotels when status is "considering"
- Vote on suggested alternatives
- Vote counts visible to all collaborators

**Comments**
- Thread per activity or day
- @mention collaborators
- Notifications for mentions

**Clone Feature**
- One-click creates personal copy
- Cloned itinerary is private by default
- Original creator gets clone count stat
- Edit freely without affecting original

### 5. Marketplace & Business Features

**Business User Types**

1. **Tour Guides** (existing system)
   - Registered via /guide/register
   - Create and manage tours
   - Browse marketplace listings
   - Send service offers

2. **Hotels** (new)
   - Separate registration flow
   - Fields: name, location, star rating, photos, amenities
   - Links: website, Google Maps, Agoda, Booking.com, Airbnb
   - Verification via email domain or manual review

**Marketplace Listing View (for businesses)**
- Filter by destination, dates
- Shows: destination, dates, group size, interests, hotel status
- "Send Offer" action

**Offer System**

*Guide Offers:*
- Select tour to offer
- Custom message
- Optional discount

*Hotel Offers:*
- Room type, dates, price
- Comparison to traveler's current option
- Photos and amenities

*Traveler Receives:*
- Notification of new offer
- Review in "Offers" inbox
- Accept / Decline / Message back

**Trust & Safety**
- Businesses must be verified
- Travelers control visibility (disable anytime)
- Report/block functionality
- Rate limit on offers to prevent spam

### 6. Maps Integration

**Technology:** Leaflet + OpenStreetMap
- Completely free, no usage limits
- Custom styled markers for travel history pins
- Clean tile style to match app aesthetic

## Database Schema

### Users (extend existing)
```sql
users
├── id, email, full_name, avatar_url
├── bio, location, phone
├── email_verified, email_verified_at
├── verification_deadline (30 days from signup)
└── created_at, updated_at
```

### User Extensions
```sql
user_social_links
├── user_id, platform, url/username

user_payment_links
├── user_id, platform, value

user_travel_history
├── user_id, city, country
├── year, month, notes
├── lat, lng (for map pin)

user_badges
├── user_id, badge_type
├── earned_at, metadata
```

### Itineraries
```sql
itineraries
├── id, user_id, title, description
├── destination_city, destination_country
├── start_date, end_date
├── visibility (public, private, marketplace)
├── open_to_offers
├── clone_count, view_count

itinerary_collaborators
├── itinerary_id, user_id, role

itinerary_suggestions
├── itinerary_id, user_id, activity_id
├── suggestion_type, content, status

itinerary_votes
├── itinerary_id, user_id
├── target_type, target_id, vote
```

### Hotels
```sql
hotels
├── id, user_id, name, location
├── star_rating, description
├── is_verified
├── photos, amenities
├── website
├── google_maps_url
├── agoda_url
├── booking_com_url
├── airbnb_url
```

### Business Offers
```sql
business_offers
├── id, business_type, business_id
├── itinerary_id, traveler_id
├── offer_details (JSON)
├── status (pending, accepted, declined)
```

## Implementation Priority

### Phase 1: Auth & Profiles
1. Auth modal component (sign in, register, forgot password)
2. Supabase auth integration (email + Google + Apple)
3. Email verification system
4. User profile page
5. Profile edit form (bio, contacts, social links)
6. Payment links management

### Phase 2: Travel History & Badges
1. Travel history CRUD
2. Leaflet map integration
3. Timeline view component
4. Badge system (auto-award logic)

### Phase 3: Itinerary Sharing
1. Visibility settings UI
2. Public itinerary discovery page
3. Clone functionality
4. Tipping UI (links to payment methods)

### Phase 4: Collaboration
1. Invite collaborators flow
2. Suggestion system
3. Voting UI
4. Comments/discussion threads

### Phase 5: Marketplace
1. Hotel registration
2. Marketplace listing page (for businesses)
3. Offer send/receive system
4. Notifications

## Technical Notes

- **Auth:** Supabase Auth with OAuth providers
- **Maps:** Leaflet + OpenStreetMap (react-leaflet)
- **Real-time:** Supabase Realtime for collaboration
- **Notifications:** In-app + email (Supabase + Resend/SendGrid)
