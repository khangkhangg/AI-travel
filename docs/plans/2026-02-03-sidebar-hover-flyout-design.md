# Sidebar Hover Flyout Design

## Overview

Add hover flyout sub-menus to the collapsed sidebar for quick access to sub-items without expanding the full sidebar.

## Behavior Specification

### Trigger
- Hover over a collapsed sidebar icon that has sub-items
- 200ms delay before flyout appears (prevents accidental triggers)
- Only applies to items with sub-items (Profile, Settings)

### Positioning
- Card anchored directly to the right of the hovered icon
- 8px gap between sidebar and card
- Card vertically centered on the icon

### Hover Zones
- Icon + card form a combined hover area
- 150ms grace period when mouse leaves
- Card stays open while mouse is anywhere in the combined zone
- Invisible bridge element prevents close when crossing the gap

### Animation
- **Enter:** Slide from left (8px) + fade in over 150ms ease-out
- **Exit:** Slide back left + fade out over 100ms (faster exit feels snappier)

## Visual Design

```
┌──────────────────────────────┐
│  Profile                     │  ← Header: text-sm, font-semibold, gray-500
├──────────────────────────────┤
│                              │
│  ● Personal Info             │  ← Active: emerald bg, dot indicator
│                              │
│    Travel History            │  ← Inactive: gray-600, hover:bg-gray-50
│                              │
│    Badges                    │
│                              │
│    Links                     │
│                              │
└──────────────────────────────┘
```

### Styling
- Background: white
- Border: `border border-gray-200`
- Shadow: `shadow-lg`
- Border radius: `rounded-xl`
- Padding: `p-2` for card, `px-3 py-2` for items
- Min-width: 180px
- Z-index: 50

### Item States
| State | Style |
|-------|-------|
| Default | `text-gray-600` |
| Hover | `bg-gray-50 text-gray-900` |
| Active | `bg-emerald-50 text-emerald-700 font-medium` with left dot |

## Implementation

### File Changes
Only `components/profile/ProfileSidebarItem.tsx` needs modification.

### State Management
- `isHovering`: tracks mouse over icon
- `showFlyout`: controls flyout visibility (with delays)
- Timeout refs for enter/exit delays

### Hover Detection Logic
1. `onMouseEnter` on icon → start 200ms timer → show flyout
2. `onMouseLeave` on icon → start 150ms grace timer → hide flyout
3. `onMouseEnter` on flyout → cancel grace timer
4. `onMouseLeave` on flyout → start 150ms grace timer → hide flyout

### CSS Animation
```css
.flyout-enter {
  opacity: 0;
  transform: translateX(-8px);
}
.flyout-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}
.flyout-exit {
  opacity: 1;
  transform: translateX(0);
}
.flyout-exit-active {
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 100ms ease-in, transform 100ms ease-in;
}
```

### Hover Bridge
Invisible element spans the 8px gap to maintain hover state when moving from icon to card.

## Decisions Made
- 200ms hover delay (prevents accidental triggers)
- No pointer arrow (clean minimal look)
- Combined hover zone + grace period (most forgiving UX)
- Slide + fade animation (polished feel)
