# Profile Page Sidebar Redesign

**Date:** 2026-02-03
**Status:** Approved

## Overview

Redesign the profile page from horizontal tab-based navigation to a collapsible 3-column sidebar layout, inspired by Ofspace dashboard design.

## Layout Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Header (fixed)                                            │
├────────┬───────────────────┬───────────────────────────────┤
│ Icon   │  Navigation       │  Detail Panel                 │
│ Rail   │  List             │  (content)                    │
│ 64px   │  200px            │  flex-1                       │
│        │  (collapsible)    │                               │
└────────┴───────────────────┴───────────────────────────────┘
```

### Three States

1. **Expanded** (desktop ≥1280px): All 3 columns visible
2. **Collapsed** (1024-1279px): Icon rail + detail panel only
3. **Mobile** (<1024px): Drawer navigation, full-width content

## Navigation Structure

### Main Sections

- **Dashboard** - Stats, recent activity, quick actions
- **Profile** - Personal information and content
  - Personal Info (name, username, avatar, bio, contact)
  - Travel History (map + visited/wishlist)
  - Badges (earned badges with progress)
  - Links (social + payment links)
- **Settings** - Configuration options
  - Privacy (visibility toggle, public URL)
  - Guide Mode (toggle + details form)
  - Integrations (Google Calendar, future integrations)
- **Bookings** - Tour booking management (conditional: only if user is guide)

### User Menu (Bottom of Sidebar)

- User avatar always visible at bottom
- Click opens dropdown with:
  - View Public Profile
  - Admin Dashboard (if user.role === 'admin')
  - Sign Out

## Sidebar Component Design

### Icon Rail (64px, always visible)

```
┌────────┐
│   📊   │  Dashboard
│   👤   │  Profile
│   ⚙️   │  Settings
│   📅   │  Bookings (if guide)
│        │
│  ····  │  (spacer)
│        │
│  [<>]  │  Collapse toggle
│ ┌────┐ │
│ │ 🧑 │ │  User avatar
│ └────┘ │
└────────┘
```

### Visual Styling

- Background: `bg-white` with subtle right border
- Active item: `bg-emerald-50` with `border-l-2 border-emerald-500`
- Icons: `text-gray-400`, active: `text-emerald-600`
- Text: `text-gray-700`, active: `text-gray-900 font-medium`
- Hover: `bg-gray-50`

### State Management

- `sidebarExpanded: boolean` - collapse state (persisted to localStorage)
- `activeSection: string` - 'dashboard' | 'profile' | 'settings' | 'bookings'
- `activeSubItem: string | null` - current sub-item

## Content Panels

### Panel Components

```
components/profile/panels/
├── DashboardPanel.tsx      # Stats, activity, quick actions
├── PersonalInfoPanel.tsx   # Name, username, avatar, bio, contact
├── TravelHistoryPanel.tsx  # Map + visited/wishlist lists
├── BadgesPanel.tsx         # Badge grid with progress
├── LinksPanel.tsx          # Social + payment links
├── PrivacyPanel.tsx        # Visibility toggle, public URL
├── GuideModePanel.tsx      # Guide toggle + details form
├── IntegrationsPanel.tsx   # Google Calendar, future integrations
└── BookingsPanel.tsx       # Booking list with filters
```

### Panel Structure Pattern

```tsx
<div className="h-full overflow-y-auto">
  {/* Header */}
  <div className="flex items-center justify-between p-6 border-b">
    <h2 className="text-xl font-semibold">{title}</h2>
    <div>{/* Action buttons */}</div>
  </div>

  {/* Content */}
  <div className="p-6">
    {/* Panel-specific content */}
  </div>
</div>
```

## Responsive Behavior

### Desktop (≥1280px)
- Full 3-column layout
- Sidebar expanded by default

### Tablet (1024-1279px)
- Sidebar collapsed to icon rail
- Click icon to expand as overlay

### Mobile (<1024px)
- Hamburger menu in header
- Slide-out drawer navigation
- Full-width content panel

## File Structure

```
app/profile/
├── page.tsx                    # Simplified wrapper

components/profile/
├── ProfileLayout.tsx           # Main 3-column layout
├── ProfileSidebar.tsx          # Collapsible sidebar
├── ProfileSidebarItem.tsx      # Nav item component
├── ProfileUserMenu.tsx         # User avatar + dropdown
├── panels/
│   ├── DashboardPanel.tsx
│   ├── PersonalInfoPanel.tsx
│   ├── TravelHistoryPanel.tsx
│   ├── BadgesPanel.tsx
│   ├── LinksPanel.tsx
│   ├── PrivacyPanel.tsx
│   ├── GuideModePanel.tsx
│   ├── IntegrationsPanel.tsx
│   └── BookingsPanel.tsx
└── (existing: TravelMap, AddTravelModal, AddLinkModal)
```

## Migration Strategy

1. Create new `ProfileLayout` and `ProfileSidebar` components
2. Extract existing tab content into panel components
3. Wire up navigation state
4. Remove old tab-based UI
5. Test responsive behavior

## No Breaking Changes

- API routes unchanged
- Data fetching logic preserved
- Existing modals reused
