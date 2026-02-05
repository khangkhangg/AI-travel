# Day Management Feature - Design Document

## Overview

Add day management functionality to the collaborate page kanban board, allowing users to edit day numbers, add new days, delete days, and reorder days via drag & drop.

## Features

### 1. Inline Edit Day Number
- Click "Day X" text → becomes number input
- User types new position (1-N) → day moves to that position
- Other days automatically renumber
- On blur/Enter → save changes

### 2. Drag & Drop Columns
- Each day column is draggable via grip handle in header
- Drag column left/right to reorder
- Visual feedback: shadow on dragged column, drop zones highlight
- Uses `@dnd-kit/sortable` (already in use for activities)

### 3. Add Day Column
- "+" column at end of kanban board (same width as day columns)
- Dashed border, muted gray background
- Centered "+" icon with "Add Day" text
- Click → creates new empty day at position N+1
- New day has empty hotel slot + "Add Activity" button

### 4. Delete Day
- Trash icon in day header (appears on hover)
- Disabled when only 1 day remains (grayed out with tooltip)
- Confirmation dialog: "Delete Day X? All activities will be removed."
- Deletes all activities in that day, renumbers remaining days

## UI Design

### Day Header (Enhanced)
```
┌─────────────────────────────────────────────────┐
│  [≡] [Day 11] • Sun, Mar 8    2 activities  [🗑] │
│   ↑     ↑                                    ↑   │
│  drag  inline                             delete │
│  handle edit                              button │
└─────────────────────────────────────────────────┘
```

### Add Day Column
```
┌─────────────────────────┐
│                         │
│       ┌─────────┐       │
│       │   +     │       │
│       │ Add Day │       │
│       └─────────┘       │
│                         │
│   Click to add Day N+1  │
│                         │
└─────────────────────────┘

- w-80 (same as day columns)
- Dashed border (border-dashed border-gray-300)
- Hover: border turns emerald
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trips/[id]/days` | POST | Create new day |
| `/api/trips/[id]/days/[dayNumber]` | PATCH | Update day number (move) |
| `/api/trips/[id]/days/[dayNumber]` | DELETE | Delete day & its activities |
| `/api/trips/[id]/days/reorder` | PATCH | Bulk reorder days (drag) |

### POST /api/trips/[id]/days
Request: `{ dayNumber: number }` (typically maxDay + 1)
Response: `{ success: true, dayNumber: number }`

### PATCH /api/trips/[id]/days/[dayNumber]
Request: `{ newDayNumber: number }`
Response: `{ success: true, days: DayData[] }`
- Moves all activities from old day to new position
- Renumbers affected days

### DELETE /api/trips/[id]/days/[dayNumber]
Response: `{ success: true, days: DayData[] }`
- Deletes all `itinerary_items` where `day_number = dayNumber`
- Renumbers remaining days
- Fails if only 1 day remains

### PATCH /api/trips/[id]/days/reorder
Request: `{ order: number[] }` (e.g., [3, 1, 2, 4, 5])
Response: `{ success: true, days: DayData[] }`
- Updates all day_number values in one transaction

## Files to Modify

### Existing Files
| File | Changes |
|------|---------|
| `components/collaborate/DayColumn.tsx` | Add inline edit, delete button, drag handle |
| `components/collaborate/KanbanBoard.tsx` | Add column-level drag/drop, add "+" column |
| `app/trips/[id]/collaborate/page.tsx` | Add handlers for day operations |

### New Files
| File | Purpose |
|------|---------|
| `app/api/trips/[id]/days/route.ts` | POST handler for creating days |
| `app/api/trips/[id]/days/[dayNumber]/route.ts` | PATCH/DELETE for single day |
| `app/api/trips/[id]/days/reorder/route.ts` | PATCH for bulk reorder |
| `components/collaborate/AddDayColumn.tsx` | "+" column component |

## Constraints

- Minimum 1 day required (cannot delete last day)
- Day numbers must be sequential (1, 2, 3... no gaps)
- Only trip owner/collaborators can modify days
