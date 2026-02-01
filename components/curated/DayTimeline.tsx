'use client';

import { forwardRef } from 'react';
import ActivityTimelineCard from './ActivityTimelineCard';
import { getDayColor } from './TripMap';

interface Activity {
  id: string;
  title: string;
  description?: string;
  category?: string;
  time_slot?: string;
  estimated_cost?: number;
  location_name?: string;
  location_address?: string;
  source_url?: string;
  location_lat?: number;
  location_lng?: number;
  order_index: number;
}

interface DayTimelineProps {
  dayNumber: number;
  dayTitle?: string;
  activities: Activity[];
  onActivityMapView?: (activityId: string) => void;
  onUpdateDescription?: (activityId: string, description: string) => void;
  onUpdateUrl?: (activityId: string, url: string) => void;
  onUpdateLocation?: (activityId: string, lat: number, lng: number, address?: string) => void;
  isOwner?: boolean;
}

const getTimeRange = (activities: Activity[]): string => {
  const times = activities
    .filter((a) => a.time_slot)
    .map((a) => a.time_slot!.toLowerCase());

  if (times.length === 0) return '';

  // Try to determine time range from time slots
  const hasAM = times.some((t) => t.includes('am') || t.includes('morning') || t.includes('breakfast'));
  const hasPM = times.some((t) => t.includes('pm') || t.includes('afternoon') || t.includes('lunch'));
  const hasEvening = times.some((t) => t.includes('evening') || t.includes('dinner') || t.includes('night'));

  if (hasAM && hasEvening) return 'Morning to Evening';
  if (hasAM && hasPM) return 'Morning to Afternoon';
  if (hasPM && hasEvening) return 'Afternoon to Evening';
  if (hasAM) return 'Morning';
  if (hasPM) return 'Afternoon';
  if (hasEvening) return 'Evening';

  return '';
};

const DayTimeline = forwardRef<HTMLDivElement, DayTimelineProps>(
  ({ dayNumber, dayTitle, activities, onActivityMapView, onUpdateDescription, onUpdateUrl, onUpdateLocation, isOwner }, ref) => {
    const dayColor = getDayColor(dayNumber);
    const sortedActivities = [...activities].sort((a, b) => a.order_index - b.order_index);
    const timeRange = getTimeRange(sortedActivities);
    const placeCount = sortedActivities.length;

    return (
      <div ref={ref} data-day={dayNumber} className="scroll-mt-4">
        {/* Day Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Day color indicator */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
              style={{ backgroundColor: dayColor }}
            >
              {dayNumber}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                Day {dayNumber}
                {dayTitle && (
                  <span className="font-normal text-gray-600"> · {dayTitle}</span>
                )}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {timeRange && <span>{timeRange}</span>}
                {timeRange && placeCount > 0 && <span>·</span>}
                {placeCount > 0 && (
                  <span>
                    {placeCount} {placeCount === 1 ? 'place' : 'places'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activities Timeline */}
        <div className="pl-2">
          {sortedActivities.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p>No activities planned for this day</p>
            </div>
          ) : (
            sortedActivities.map((activity, idx) => (
              <ActivityTimelineCard
                key={activity.id}
                activity={activity}
                dayColor={dayColor}
                isFirst={idx === 0}
                isLast={idx === sortedActivities.length - 1}
                onViewOnMap={
                  activity.location_lat && activity.location_lng
                    ? () => onActivityMapView?.(activity.id)
                    : undefined
                }
                onUpdateDescription={onUpdateDescription}
                onUpdateUrl={onUpdateUrl}
                onUpdateLocation={onUpdateLocation}
                isOwner={isOwner}
              />
            ))
          )}
        </div>
      </div>
    );
  }
);

DayTimeline.displayName = 'DayTimeline';

export default DayTimeline;
