'use client';

import { useDroppable } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Hotel, DollarSign, Trash2, GripVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ActivityCard from './ActivityCard';
import { DayData, CollaborateActivity, Traveler } from '@/lib/types/collaborate';

interface DayColumnProps {
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
  onEditDayNumber?: (oldDay: number, newDay: number) => void;
  onDeleteDay?: (dayNumber: number) => void;
  marketplaceCounts?: {
    proposals: Record<string, number>;
    suggestions: Record<string, number>;
  };
  acceptedProposals?: Record<string, any>;
  usedSuggestions?: Record<string, any>;
  dragListeners?: SyntheticListenerMap;
}

export default function DayColumn({
  day,
  travelers,
  isFirstDay,
  isLastDay,
  tripStartDate,
  totalDays,
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
  onEditDayNumber,
  onDeleteDay,
  marketplaceCounts,
  acceptedProposals,
  usedSuggestions,
  dragListeners,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.dayNumber}`,
  });

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

  // Calculate the actual date for this day based on trip start date
  const getDayDate = (): string | null => {
    if (!tripStartDate) return null;
    const startDate = new Date(tripStartDate);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + day.dayNumber - 1);
    return dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const dayDate = getDayDate();

  // Separate hotel from other activities
  const hotelActivity = day.activities.find(a =>
    a.category?.toLowerCase() === 'accommodation' ||
    a.category?.toLowerCase() === 'hotel'
  );
  const otherActivities = day.activities.filter(a =>
    a.category?.toLowerCase() !== 'accommodation' &&
    a.category?.toLowerCase() !== 'hotel'
  );

  // Calculate daily total cost (ensure numbers, not strings)
  const dailyTotal = day.activities.reduce((sum, activity) => {
    return sum + (Number(activity.estimated_cost) || 0);
  }, 0);

  return (
    <div
      ref={setNodeRef}
      className={`w-80 flex-shrink-0 bg-gray-100 rounded-2xl p-3 ${
        isOver ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''
      }`}
    >
      {/* Day Header */}
      <div
        className="mb-3"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Drag handle - visible on hover */}
            <div
              {...dragListeners}
              className={`cursor-grab text-gray-400 transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`}
            >
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

      {/* Hotel Section */}
      <div className="mb-3 p-3 bg-blue-50 rounded-xl border-2 border-dashed border-blue-200">
        {hotelActivity ? (
          <ActivityCard
            activity={hotelActivity}
            travelers={travelers}
            onVote={onVote}
            onFinalize={onFinalize}
            onAssignPayer={onAssignPayer}
            onSelect={onSelectActivity}
            onDelete={onDelete}
            onUpdatePrice={onUpdatePrice}
            onUpdateUrl={onUpdateUrl}
            onUpdateSummary={onUpdateSummary}
            onUpdateDescription={onUpdateDescription}
            onUpdateLocation={onUpdateLocation}
            isSelected={selectedActivityId === hotelActivity.id}
            isHotel
            proposalCount={marketplaceCounts?.proposals[hotelActivity.id] || 0}
            suggestionCount={marketplaceCounts?.suggestions[hotelActivity.id] || 0}
            acceptedProposal={acceptedProposals?.[hotelActivity.id]}
            usedSuggestion={usedSuggestions?.[hotelActivity.id]}
          />
        ) : (
          <button
            onClick={onAddHotel}
            className="w-full flex items-center justify-center gap-2 py-3 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Hotel className="w-4 h-4" />
            <span className="text-sm font-medium">Add Hotel</span>
          </button>
        )}
      </div>

      {/* Activities List */}
      <SortableContext
        items={otherActivities.map(a => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[100px]">
          {otherActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              travelers={travelers}
              onVote={onVote}
              onFinalize={onFinalize}
              onAssignPayer={onAssignPayer}
              onSelect={onSelectActivity}
              onDelete={onDelete}
              onUpdatePrice={onUpdatePrice}
              onUpdateUrl={onUpdateUrl}
              onUpdateSummary={onUpdateSummary}
              onUpdateDescription={onUpdateDescription}
              onUpdateLocation={onUpdateLocation}
              isSelected={selectedActivityId === activity.id}
              proposalCount={marketplaceCounts?.proposals[activity.id] || 0}
              suggestionCount={marketplaceCounts?.suggestions[activity.id] || 0}
              acceptedProposal={acceptedProposals?.[activity.id]}
              usedSuggestion={usedSuggestions?.[activity.id]}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Button */}
      <button
        onClick={onAddPlace}
        className="w-full mt-3 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-600 hover:bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-400 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Activity</span>
      </button>
    </div>
  );
}
