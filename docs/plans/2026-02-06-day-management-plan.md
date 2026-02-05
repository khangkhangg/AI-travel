# Day Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add day management to the collaborate page - edit day numbers, add/delete days, drag-reorder columns.

**Architecture:** Extend the existing KanbanBoard with column-level drag support using @dnd-kit. Add new API endpoints for day CRUD operations. All day_number changes cascade to itinerary_items in the database.

**Tech Stack:** Next.js 14, @dnd-kit/core, @dnd-kit/sortable, PostgreSQL, Tailwind CSS

---

## Task 1: Create Days API - Add Day Endpoint

**Files:**
- Create: `app/api/trips/[id]/days/route.ts`

**Step 1: Create the POST endpoint**

```typescript
// app/api/trips/[id]/days/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this trip
    const tripCheck = await query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get current max day number
    const maxDayResult = await query(
      `SELECT COALESCE(MAX(day_number), 0) as max_day FROM itinerary_items WHERE trip_id = $1`,
      [tripId]
    );
    const newDayNumber = (maxDayResult.rows[0]?.max_day || 0) + 1;

    return NextResponse.json({
      success: true,
      dayNumber: newDayNumber,
    });
  } catch (error) {
    console.error('Failed to add day:', error);
    return NextResponse.json({ error: 'Failed to add day' }, { status: 500 });
  }
}
```

**Step 2: Test manually**

```bash
# Start dev server and test with curl
curl -X POST http://localhost:3000/api/trips/YOUR_TRIP_ID/days \
  -H "Cookie: YOUR_AUTH_COOKIE"
```

**Step 3: Commit**

```bash
git add app/api/trips/[id]/days/route.ts
git commit -m "feat: add POST /api/trips/[id]/days endpoint for adding days"
```

---

## Task 2: Create Days API - Update Day Number Endpoint

**Files:**
- Create: `app/api/trips/[id]/days/[dayNumber]/route.ts`

**Step 1: Create PATCH endpoint for moving days**

```typescript
// app/api/trips/[id]/days/[dayNumber]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayNumber: string }> }
) {
  try {
    const { id: tripId, dayNumber } = await params;
    const oldDayNumber = parseInt(dayNumber);
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newDayNumber } = body;

    if (!newDayNumber || newDayNumber < 1) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 });
    }

    // Verify user has access
    const tripCheck = await query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get max day number
    const maxResult = await query(
      `SELECT COALESCE(MAX(day_number), 0) as max_day FROM itinerary_items WHERE trip_id = $1`,
      [tripId]
    );
    const maxDay = maxResult.rows[0]?.max_day || 1;

    if (newDayNumber > maxDay) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 });
    }

    if (oldDayNumber === newDayNumber) {
      return NextResponse.json({ success: true, message: 'No change needed' });
    }

    // Use a transaction to update day numbers
    // First, move target day to temporary position (-1)
    await query(
      `UPDATE itinerary_items SET day_number = -1 WHERE trip_id = $1 AND day_number = $2`,
      [tripId, oldDayNumber]
    );

    // Shift days between old and new positions
    if (newDayNumber < oldDayNumber) {
      // Moving earlier: shift days between newDay and oldDay forward by 1
      await query(
        `UPDATE itinerary_items
         SET day_number = day_number + 1
         WHERE trip_id = $1 AND day_number >= $2 AND day_number < $3`,
        [tripId, newDayNumber, oldDayNumber]
      );
    } else {
      // Moving later: shift days between oldDay and newDay backward by 1
      await query(
        `UPDATE itinerary_items
         SET day_number = day_number - 1
         WHERE trip_id = $1 AND day_number > $2 AND day_number <= $3`,
        [tripId, oldDayNumber, newDayNumber]
      );
    }

    // Move the target day to its new position
    await query(
      `UPDATE itinerary_items SET day_number = $1 WHERE trip_id = $2 AND day_number = -1`,
      [newDayNumber, tripId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update day number:', error);
    return NextResponse.json({ error: 'Failed to update day' }, { status: 500 });
  }
}
```

**Step 2: Add DELETE endpoint for removing days**

Add this to the same file:

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayNumber: string }> }
) {
  try {
    const { id: tripId, dayNumber } = await params;
    const dayNum = parseInt(dayNumber);
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access
    const tripCheck = await query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check if this would leave 0 days
    const dayCountResult = await query(
      `SELECT COUNT(DISTINCT day_number) as count FROM itinerary_items WHERE trip_id = $1`,
      [tripId]
    );
    const dayCount = parseInt(dayCountResult.rows[0]?.count || '1');

    if (dayCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last day' }, { status: 400 });
    }

    // Delete all items for this day
    await query(
      `DELETE FROM itinerary_items WHERE trip_id = $1 AND day_number = $2`,
      [tripId, dayNum]
    );

    // Renumber remaining days (shift days after deleted one down by 1)
    await query(
      `UPDATE itinerary_items
       SET day_number = day_number - 1
       WHERE trip_id = $1 AND day_number > $2`,
      [tripId, dayNum]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete day:', error);
    return NextResponse.json({ error: 'Failed to delete day' }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add app/api/trips/[id]/days/[dayNumber]/route.ts
git commit -m "feat: add PATCH/DELETE endpoints for day management"
```

---

## Task 3: Create Days API - Bulk Reorder Endpoint

**Files:**
- Create: `app/api/trips/[id]/days/reorder/route.ts`

**Step 1: Create PATCH endpoint for bulk reorder**

```typescript
// app/api/trips/[id]/days/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order } = body; // Array of day numbers in new order, e.g., [3, 1, 2, 4]

    if (!order || !Array.isArray(order)) {
      return NextResponse.json({ error: 'Invalid order array' }, { status: 400 });
    }

    // Verify user has access
    const tripCheck = await query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // First, move all days to negative positions to avoid conflicts
    for (let i = 0; i < order.length; i++) {
      const oldDayNumber = order[i];
      await query(
        `UPDATE itinerary_items SET day_number = $1 WHERE trip_id = $2 AND day_number = $3`,
        [-(i + 1), tripId, oldDayNumber]
      );
    }

    // Then, move them to their new positions
    for (let i = 0; i < order.length; i++) {
      const newDayNumber = i + 1;
      await query(
        `UPDATE itinerary_items SET day_number = $1 WHERE trip_id = $2 AND day_number = $3`,
        [newDayNumber, tripId, -(i + 1)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder days:', error);
    return NextResponse.json({ error: 'Failed to reorder days' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/trips/[id]/days/reorder/route.ts
git commit -m "feat: add PATCH /api/trips/[id]/days/reorder for bulk day reordering"
```

---

## Task 4: Create AddDayColumn Component

**Files:**
- Create: `components/collaborate/AddDayColumn.tsx`

**Step 1: Create the component**

```tsx
// components/collaborate/AddDayColumn.tsx
'use client';

import { Plus } from 'lucide-react';

interface AddDayColumnProps {
  onAddDay: () => void;
}

export default function AddDayColumn({ onAddDay }: AddDayColumnProps) {
  return (
    <div className="w-80 flex-shrink-0">
      <button
        onClick={onAddDay}
        className="w-full h-full min-h-[200px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex flex-col items-center justify-center gap-3 group"
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
          <Plus className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        <span className="text-sm font-medium text-gray-500 group-hover:text-emerald-600 transition-colors">
          Add Day
        </span>
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/collaborate/AddDayColumn.tsx
git commit -m "feat: add AddDayColumn component"
```

---

## Task 5: Update DayColumn with Edit and Delete

**Files:**
- Modify: `components/collaborate/DayColumn.tsx`

**Step 1: Add new props and state**

Add to the interface and component:

```tsx
// Add to DayColumnProps interface (around line 9)
interface DayColumnProps {
  day: DayData;
  travelers: Traveler[];
  isFirstDay: boolean;
  isLastDay: boolean;
  tripStartDate?: string;
  totalDays: number; // NEW
  onVote: (activityId: string, vote: 'up' | 'down') => void;
  onFinalize: (activityId: string) => void;
  onAssignPayer: (activityId: string, payerId: string | null, isSplit: boolean) => void;
  onAddPlace: () => void;
  onAddHotel: () => void;
  onSelectActivity: (id: string | null) => void;
  selectedActivityId: string | null;
  onDelete: (activityId: string) => void;
  onUpdatePrice: (activityId: string, price: number) => void;
  onUpdateUrl: (activityId: string, url: string) => void;
  onUpdateSummary: (activityId: string, summary: string) => void;
  onUpdateDescription: (activityId: string, description: string) => void;
  onUpdateLocation?: (activityId: string, lat: number, lng: number, address?: string) => void;
  marketplaceCounts?: {
    proposals: Record<string, number>;
    suggestions: Record<string, number>;
  };
  acceptedProposals?: Record<string, any>;
  usedSuggestions?: Record<string, any>;
  onEditDayNumber?: (oldDay: number, newDay: number) => void; // NEW
  onDeleteDay?: (dayNumber: number) => void; // NEW
}
```

**Step 2: Add imports and state for inline editing**

```tsx
// Add to imports at top
import { Plus, Hotel, DollarSign, Trash2, GripVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
```

**Step 3: Add editing state and handlers inside the component**

```tsx
// Add after props destructuring (around line 58)
const [isEditingDay, setIsEditingDay] = useState(false);
const [editDayValue, setEditDayValue] = useState(day.dayNumber.toString());
const [isHovering, setIsHovering] = useState(false);
const inputRef = useRef<HTMLInputElement>(null);

// Focus input when entering edit mode
useEffect(() => {
  if (isEditingDay && inputRef.current) {
    inputRef.current.focus();
    inputRef.current.select();
  }
}, [isEditingDay]);

const handleDayNumberSubmit = () => {
  const newDay = parseInt(editDayValue);
  if (newDay && newDay >= 1 && newDay <= totalDays && newDay !== day.dayNumber) {
    onEditDayNumber?.(day.dayNumber, newDay);
  }
  setIsEditingDay(false);
  setEditDayValue(day.dayNumber.toString());
};

const handleDayKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleDayNumberSubmit();
  } else if (e.key === 'Escape') {
    setIsEditingDay(false);
    setEditDayValue(day.dayNumber.toString());
  }
};
```

**Step 4: Update the Day Header JSX**

Replace the existing Day Header section (around lines 96-120):

```tsx
{/* Day Header */}
<div
  className="mb-3"
  onMouseEnter={() => setIsHovering(true)}
  onMouseLeave={() => setIsHovering(false)}
>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      {/* Drag handle - visible on hover */}
      <div className={`cursor-grab text-gray-400 transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
        <GripVertical className="w-4 h-4" />
      </div>

      <div>
        {isEditingDay ? (
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={totalDays}
            value={editDayValue}
            onChange={(e) => setEditDayValue(e.target.value)}
            onBlur={handleDayNumberSubmit}
            onKeyDown={handleDayKeyDown}
            className="w-16 px-2 py-0.5 text-sm font-bold border border-emerald-400 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        ) : (
          <h3
            className="font-bold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors"
            onClick={() => setIsEditingDay(true)}
            title="Click to edit day number"
          >
            Day {day.dayNumber}
            {dayDate && <span className="font-normal text-gray-500 ml-2">• {dayDate}</span>}
          </h3>
        )}
      </div>
    </div>

    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">
        {otherActivities.length} activities
      </span>
      {dailyTotal > 0 && (
        <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <DollarSign className="w-3 h-3" />
          {dailyTotal}
        </span>
      )}

      {/* Delete button - visible on hover, disabled if only 1 day */}
      <button
        onClick={() => onDeleteDay?.(day.dayNumber)}
        disabled={totalDays <= 1}
        className={`p-1 rounded transition-all ${
          isHovering ? 'opacity-100' : 'opacity-0'
        } ${
          totalDays <= 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
        }`}
        title={totalDays <= 1 ? 'Cannot delete the only day' : 'Delete this day'}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
  {day.title && (
    <p className="text-sm text-gray-600 mt-0.5 ml-6">{day.title}</p>
  )}
</div>
```

**Step 5: Commit**

```bash
git add components/collaborate/DayColumn.tsx
git commit -m "feat: add inline day number editing and delete button to DayColumn"
```

---

## Task 6: Update KanbanBoard with Column Drag and Add Day

**Files:**
- Modify: `components/collaborate/KanbanBoard.tsx`

**Step 1: Add new imports and props**

```tsx
// Update imports (line 1-18)
'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DayColumn from './DayColumn';
import AddDayColumn from './AddDayColumn';
import ActivityCard from './ActivityCard';
import { DayData, CollaborateActivity, Traveler } from '@/lib/types/collaborate';

// Add new props to interface (around line 20)
interface KanbanBoardProps {
  days: DayData[];
  travelers: Traveler[];
  tripStartDate?: string;
  onReorder: (activityId: string, newDayNumber: number, newOrderIndex: number) => void;
  onVote: (activityId: string, vote: 'up' | 'down') => void;
  onFinalize: (activityId: string) => void;
  onAssignPayer: (activityId: string, payerId: string | null, isSplit: boolean) => void;
  onAddPlace: (dayNumber: number) => void;
  onAddHotel: (dayNumber: number) => void;
  onSelectActivity: (id: string | null) => void;
  selectedActivityId: string | null;
  onDelete: (activityId: string) => void;
  onUpdatePrice: (activityId: string, price: number) => void;
  onUpdateUrl: (activityId: string, url: string) => void;
  onUpdateSummary: (activityId: string, summary: string) => void;
  onUpdateDescription: (activityId: string, description: string) => void;
  onUpdateLocation?: (activityId: string, lat: number, lng: number, address?: string) => void;
  marketplaceCounts?: {
    proposals: Record<string, number>;
    suggestions: Record<string, number>;
  };
  acceptedProposals?: Record<string, any>;
  usedSuggestions?: Record<string, any>;
  onAddDay?: () => void; // NEW
  onEditDayNumber?: (oldDay: number, newDay: number) => void; // NEW
  onDeleteDay?: (dayNumber: number) => void; // NEW
  onReorderDays?: (order: number[]) => void; // NEW
}
```

**Step 2: Create SortableDayColumn wrapper component**

Add this before the main KanbanBoard component:

```tsx
// Wrapper for sortable day columns (add around line 50)
function SortableDayColumn({
  day,
  ...props
}: {
  day: DayData;
  travelers: Traveler[];
  isFirstDay: boolean;
  isLastDay: boolean;
  tripStartDate?: string;
  totalDays: number;
  onVote: (activityId: string, vote: 'up' | 'down') => void;
  onFinalize: (activityId: string) => void;
  onAssignPayer: (activityId: string, payerId: string | null, isSplit: boolean) => void;
  onAddPlace: () => void;
  onAddHotel: () => void;
  onSelectActivity: (id: string | null) => void;
  selectedActivityId: string | null;
  onDelete: (activityId: string) => void;
  onUpdatePrice: (activityId: string, price: number) => void;
  onUpdateUrl: (activityId: string, url: string) => void;
  onUpdateSummary: (activityId: string, summary: string) => void;
  onUpdateDescription: (activityId: string, description: string) => void;
  onUpdateLocation?: (activityId: string, lat: number, lng: number, address?: string) => void;
  marketplaceCounts?: { proposals: Record<string, number>; suggestions: Record<string, number> };
  acceptedProposals?: Record<string, any>;
  usedSuggestions?: Record<string, any>;
  onEditDayNumber?: (oldDay: number, newDay: number) => void;
  onDeleteDay?: (dayNumber: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `column-${day.dayNumber}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DayColumn day={day} {...props} />
    </div>
  );
}
```

**Step 3: Update the main render return**

Replace the return statement:

```tsx
return (
  <DndContext
    sensors={sensors}
    collisionDetection={closestCorners}
    onDragStart={handleDragStart}
    onDragOver={handleDragOver}
    onDragEnd={handleDragEnd}
  >
    <div className="flex gap-4 min-w-max pb-4">
      <SortableContext
        items={days.map(d => `column-${d.dayNumber}`)}
        strategy={horizontalListSortingStrategy}
      >
        {days.map((day) => (
          <SortableDayColumn
            key={day.dayNumber}
            day={day}
            travelers={travelers}
            isFirstDay={day.dayNumber === 1}
            isLastDay={day.dayNumber === days.length}
            tripStartDate={tripStartDate}
            totalDays={days.length}
            onVote={onVote}
            onFinalize={onFinalize}
            onAssignPayer={onAssignPayer}
            onAddPlace={() => onAddPlace(day.dayNumber)}
            onAddHotel={() => onAddHotel(day.dayNumber)}
            onSelectActivity={onSelectActivity}
            selectedActivityId={selectedActivityId}
            onDelete={onDelete}
            onUpdatePrice={onUpdatePrice}
            onUpdateUrl={onUpdateUrl}
            onUpdateSummary={onUpdateSummary}
            onUpdateDescription={onUpdateDescription}
            onUpdateLocation={onUpdateLocation}
            marketplaceCounts={marketplaceCounts}
            acceptedProposals={acceptedProposals}
            usedSuggestions={usedSuggestions}
            onEditDayNumber={onEditDayNumber}
            onDeleteDay={onDeleteDay}
          />
        ))}
      </SortableContext>

      {/* Add Day Column */}
      {onAddDay && <AddDayColumn onAddDay={onAddDay} />}
    </div>

    <DragOverlay>
      {activeActivity ? (
        <div className="opacity-90 rotate-3">
          <ActivityCard
            activity={activeActivity}
            travelers={travelers}
            onVote={() => {}}
            onFinalize={() => {}}
            onAssignPayer={() => {}}
            onSelect={() => {}}
            onDelete={() => {}}
            onUpdatePrice={() => {}}
            onUpdateUrl={() => {}}
            onUpdateSummary={() => {}}
            onUpdateDescription={() => {}}
            isSelected={false}
            isDragging
          />
        </div>
      ) : null}
    </DragOverlay>
  </DndContext>
);
```

**Step 4: Update handleDragEnd to handle column reordering**

```tsx
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  setActiveId(null);
  setActiveActivity(null);

  if (!over) return;

  const activeId = active.id as string;
  const overId = over.id as string;

  if (activeId === overId) return;

  // Check if dragging a column
  if (activeId.startsWith('column-') && overId.startsWith('column-')) {
    const activeDayNum = parseInt(activeId.replace('column-', ''));
    const overDayNum = parseInt(overId.replace('column-', ''));

    if (onReorderDays) {
      // Create new order array
      const currentOrder = days.map(d => d.dayNumber);
      const activeIndex = currentOrder.indexOf(activeDayNum);
      const overIndex = currentOrder.indexOf(overDayNum);

      const newOrder = [...currentOrder];
      newOrder.splice(activeIndex, 1);
      newOrder.splice(overIndex, 0, activeDayNum);

      onReorderDays(newOrder);
    }
    return;
  }

  // Check if dropping on a day column
  const dayMatch = overId.match(/^day-(\d+)$/);
  if (dayMatch) {
    const targetDay = parseInt(dayMatch[1]);
    const day = days.find(d => d.dayNumber === targetDay);
    const newIndex = day?.activities.length || 0;
    onReorder(activeId, targetDay, newIndex);
    return;
  }

  // Check if dropping on another activity
  const overActivity = findActivity(overId);
  if (overActivity) {
    const targetDay = findDayByActivityId(overId);
    if (targetDay !== undefined) {
      const day = days.find(d => d.dayNumber === targetDay);
      const overIndex = day?.activities.findIndex(a => a.id === overId) || 0;
      onReorder(activeId, targetDay, overIndex);
    }
  }
};
```

**Step 5: Commit**

```bash
git add components/collaborate/KanbanBoard.tsx
git commit -m "feat: add column drag-drop reordering and AddDayColumn to KanbanBoard"
```

---

## Task 7: Update Collaborate Page with Day Management Handlers

**Files:**
- Modify: `app/trips/[id]/collaborate/page.tsx`

**Step 1: Add handler functions after existing handlers (around line 500)**

```tsx
// Handle add day
const handleAddDay = async () => {
  try {
    const response = await fetch(`/api/trips/${tripId}/days`, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      // Optimistically add new day to state
      setTrip(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          days: [...prev.days, { dayNumber: data.dayNumber, activities: [] }],
        };
      });
    }
  } catch (error) {
    console.error('Failed to add day:', error);
  }
};

// Handle edit day number (move day to new position)
const handleEditDayNumber = async (oldDay: number, newDay: number) => {
  try {
    const response = await fetch(`/api/trips/${tripId}/days/${oldDay}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDayNumber: newDay }),
    });

    if (response.ok) {
      fetchTrip(); // Refresh to get updated day numbers
    }
  } catch (error) {
    console.error('Failed to edit day number:', error);
  }
};

// Handle delete day
const handleDeleteDay = async (dayNumber: number) => {
  // Confirm deletion
  const confirmed = window.confirm(
    `Delete Day ${dayNumber}? All activities in this day will be removed.`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`/api/trips/${tripId}/days/${dayNumber}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      fetchTrip(); // Refresh to get updated days
      fetchCosts(); // Update costs
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to delete day');
    }
  } catch (error) {
    console.error('Failed to delete day:', error);
  }
};

// Handle reorder days (drag & drop)
const handleReorderDays = async (order: number[]) => {
  // Optimistically update UI
  setTrip(prev => {
    if (!prev) return prev;
    const newDays = order.map((dayNum, index) => {
      const day = prev.days.find(d => d.dayNumber === dayNum);
      return day ? { ...day, dayNumber: index + 1 } : { dayNumber: index + 1, activities: [] };
    });
    return { ...prev, days: newDays };
  });

  try {
    const response = await fetch(`/api/trips/${tripId}/days/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });

    if (!response.ok) {
      fetchTrip(); // Revert on error
    }
  } catch (error) {
    console.error('Failed to reorder days:', error);
    fetchTrip(); // Revert on error
  }
};
```

**Step 2: Pass new handlers to KanbanBoard**

Find the KanbanBoard component in the JSX (around line 650) and add the new props:

```tsx
<KanbanBoard
  days={trip.days}
  travelers={trip.travelers}
  tripStartDate={trip.start_date}
  onReorder={handleReorder}
  onVote={handleVote}
  onFinalize={handleFinalize}
  onAssignPayer={handleAssignPayer}
  onAddPlace={handleAddPlace}
  onAddHotel={handleAddHotel}
  onSelectActivity={setSelectedActivityId}
  selectedActivityId={selectedActivityId}
  onDelete={handleDelete}
  onUpdatePrice={handleUpdatePrice}
  onUpdateUrl={handleUpdateUrl}
  onUpdateSummary={handleUpdateSummary}
  onUpdateDescription={handleUpdateDescription}
  onUpdateLocation={handleUpdateLocation}
  marketplaceCounts={marketplaceCounts}
  acceptedProposals={acceptedProposals}
  usedSuggestions={usedSuggestions}
  onAddDay={handleAddDay}
  onEditDayNumber={handleEditDayNumber}
  onDeleteDay={handleDeleteDay}
  onReorderDays={handleReorderDays}
/>
```

**Step 3: Commit**

```bash
git add app/trips/[id]/collaborate/page.tsx
git commit -m "feat: add day management handlers to collaborate page"
```

---

## Task 8: Final Testing and Polish

**Step 1: Test all features manually**

1. Navigate to a trip's collaborate page
2. Test inline day number editing:
   - Click on "Day 1" text
   - Type "3" and press Enter
   - Verify days reorder correctly
3. Test delete day:
   - Hover over a day to see trash icon
   - Click trash, confirm dialog
   - Verify day is deleted and others renumber
4. Test add day:
   - Click "+" column at end
   - Verify new empty day appears
5. Test drag reorder (if implemented):
   - Drag a day column to new position
   - Verify reordering works

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete day management feature for collaborate page

- Add/delete days from kanban board
- Inline edit day numbers to reorder
- Column drag-and-drop reordering
- Minimum 1 day constraint enforced"
```

**Step 3: Push changes**

```bash
git push
```

---

## Summary of Files Changed

**New Files (4):**
- `app/api/trips/[id]/days/route.ts` - POST endpoint
- `app/api/trips/[id]/days/[dayNumber]/route.ts` - PATCH/DELETE endpoints
- `app/api/trips/[id]/days/reorder/route.ts` - Bulk reorder endpoint
- `components/collaborate/AddDayColumn.tsx` - Add day UI component

**Modified Files (3):**
- `components/collaborate/DayColumn.tsx` - Inline edit + delete button
- `components/collaborate/KanbanBoard.tsx` - Column drag + add day
- `app/trips/[id]/collaborate/page.tsx` - Handler functions
