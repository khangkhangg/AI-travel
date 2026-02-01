'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Hotel, DollarSign } from 'lucide-react';
import ActivityCard from './ActivityCard';
import { DayData, CollaborateActivity, Traveler } from '@/lib/types/collaborate';

interface DayColumnProps {
  day: DayData;
  travelers: Traveler[];
  isFirstDay: boolean;
  isLastDay: boolean;
  tripStartDate?: string;
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
}

export default function DayColumn({
  day,
  travelers,
  isFirstDay,
  isLastDay,
  tripStartDate,
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
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.dayNumber}`,
  });

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
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">
              Day {day.dayNumber}
              {dayDate && <span className="font-normal text-gray-500 ml-2">• {dayDate}</span>}
            </h3>
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
          </div>
        </div>
        {day.title && (
          <p className="text-sm text-gray-600 mt-0.5">{day.title}</p>
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
