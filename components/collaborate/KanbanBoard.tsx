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
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DayColumn from './DayColumn';
import AddDayColumn from './AddDayColumn';
import ActivityCard from './ActivityCard';
import { DayData, CollaborateActivity, Traveler } from '@/lib/types/collaborate';

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
  onAddDay: () => void;
  onEditDayNumber: (oldDay: number, newDay: number) => void;
  onDeleteDay: (dayNumber: number) => void;
  onReorderDays: (order: number[]) => void;
}

// Sortable wrapper for DayColumn to enable column drag and drop
interface SortableDayColumnProps {
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
  onEditDayNumber: (oldDay: number, newDay: number) => void;
  onDeleteDay: (dayNumber: number) => void;
  marketplaceCounts?: {
    proposals: Record<string, number>;
    suggestions: Record<string, number>;
  };
  acceptedProposals?: Record<string, any>;
  usedSuggestions?: Record<string, any>;
}

function SortableDayColumn(props: SortableDayColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${props.day.dayNumber}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DayColumn {...props} />
    </div>
  );
}

export default function KanbanBoard({
  days,
  travelers,
  tripStartDate,
  onReorder,
  onVote,
  onFinalize,
  onAssignPayer,
  onAddPlace,
  onAddHotel,
  onSelectActivity,
  selectedActivityId,
  onDelete,
  onUpdatePrice,
  onUpdateUrl,
  onUpdateSummary,
  onUpdateDescription,
  onUpdateLocation,
  marketplaceCounts,
  acceptedProposals,
  usedSuggestions,
  onAddDay,
  onEditDayNumber,
  onDeleteDay,
  onReorderDays,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<CollaborateActivity | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findActivity = (id: string): CollaborateActivity | undefined => {
    for (const day of days) {
      const activity = day.activities.find(a => a.id === id);
      if (activity) return activity;
    }
    return undefined;
  };

  const findDayByActivityId = (id: string): number | undefined => {
    for (const day of days) {
      if (day.activities.some(a => a.id === id)) {
        return day.dayNumber;
      }
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveActivity(findActivity(active.id as string) || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over for visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveActivity(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Check if this is a column drag (column IDs start with "column-")
    if (activeId.startsWith('column-')) {
      const activeColumnMatch = activeId.match(/^column-(\d+)$/);
      const overColumnMatch = overId.match(/^column-(\d+)$/);

      if (activeColumnMatch && overColumnMatch) {
        const activeDayNumber = parseInt(activeColumnMatch[1]);
        const overDayNumber = parseInt(overColumnMatch[1]);

        // Calculate new order
        const currentOrder = days.map(d => d.dayNumber);
        const activeIndex = currentOrder.indexOf(activeDayNumber);
        const overIndex = currentOrder.indexOf(overDayNumber);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          // Remove the active day from its position and insert at the new position
          const newOrder = [...currentOrder];
          newOrder.splice(activeIndex, 1);
          newOrder.splice(overIndex, 0, activeDayNumber);
          onReorderDays(newOrder);
        }
      }
      return;
    }

    // Check if dropping on a day column (activity drop zone)
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

  // Column IDs for horizontal sorting
  const columnIds = days.map(d => `column-${d.dayNumber}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
        <div className="flex gap-4 min-w-max pb-4">
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
              onEditDayNumber={onEditDayNumber}
              onDeleteDay={onDeleteDay}
              marketplaceCounts={marketplaceCounts}
              acceptedProposals={acceptedProposals}
              usedSuggestions={usedSuggestions}
            />
          ))}
          <AddDayColumn onAddDay={onAddDay} />
        </div>
      </SortableContext>

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
}
