'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Circle } from 'lucide-react';
import {
  TripSlots,
  SLOT_LABELS,
  SlotKey,
  calculateSlotProgress,
} from '@/lib/types/chat-session';

interface SlotProgressBarProps {
  slots: TripSlots;
  isExpanded?: boolean;
  activeSlot?: string;
}

/**
 * Format a date string to "Mar 15, 2025" format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format the value of a slot for display
 */
function formatSlotValue(key: SlotKey, slots: TripSlots): string | null {
  switch (key) {
    case 'destination':
      return slots.destination;

    case 'dates':
      if (!slots.dates.startDate || !slots.dates.duration) return null;
      return `${formatDate(slots.dates.startDate)} (${slots.dates.duration} day${slots.dates.duration !== 1 ? 's' : ''})`;

    case 'budget':
      if (!slots.budget.amount) return null;
      const formattedAmount = slots.budget.amount.toLocaleString('en-US');
      const currency = slots.budget.currency === 'USD' ? '$' : slots.budget.currency;
      return slots.budget.perPerson
        ? `${currency}${formattedAmount} per person`
        : `${currency}${formattedAmount} total`;

    case 'travelers':
      const { adults, children } = slots.travelers;
      if (adults === 0) return null;
      const parts: string[] = [];
      if (adults > 0) {
        parts.push(`${adults} adult${adults !== 1 ? 's' : ''}`);
      }
      if (children > 0) {
        parts.push(`${children} child${children !== 1 ? 'ren' : ''}`);
      }
      return parts.join(', ');

    case 'travelStyle':
      if (!slots.travelStyle) return null;
      return slots.travelStyle.charAt(0).toUpperCase() + slots.travelStyle.slice(1);

    case 'interests':
      if (slots.interests.length === 0) return null;
      return slots.interests
        .map((i) => i.charAt(0).toUpperCase() + i.slice(1))
        .join(', ');

    case 'accommodationType':
      if (!slots.accommodationType) return null;
      return slots.accommodationType.charAt(0).toUpperCase() + slots.accommodationType.slice(1);

    default:
      return null;
  }
}

/**
 * Check if a slot is filled
 */
function isSlotFilled(key: SlotKey, slots: TripSlots): boolean {
  switch (key) {
    case 'destination':
      return !!slots.destination?.trim();
    case 'dates':
      return slots.dates.startDate !== null && slots.dates.duration !== null && slots.dates.duration > 0;
    case 'budget':
      return slots.budget.amount !== null && slots.budget.amount > 0;
    case 'travelers':
      return slots.travelers.adults > 0;
    case 'travelStyle':
      return !!slots.travelStyle?.trim();
    case 'interests':
      return slots.interests.length > 0;
    case 'accommodationType':
      return !!slots.accommodationType?.trim();
    default:
      return false;
  }
}

const SLOT_ORDER: SlotKey[] = [
  'destination',
  'dates',
  'budget',
  'travelers',
  'travelStyle',
  'interests',
  'accommodationType',
];

export default function SlotProgressBar({
  slots,
  isExpanded: initialExpanded = false,
  activeSlot,
}: SlotProgressBarProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const progress = calculateSlotProgress(slots);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-colors"
      >
        <span className="text-sm font-semibold text-emerald-800">
          Planning your trip...
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-emerald-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-emerald-600" />
        )}
      </button>

      {/* Slot List */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-2">
          {SLOT_ORDER.map((key) => {
            const filled = isSlotFilled(key, slots);
            const value = formatSlotValue(key, slots);
            const isActive = activeSlot === key;

            return (
              <div
                key={key}
                className={`flex items-start gap-3 py-1.5 ${
                  isActive ? 'animate-pulse' : ''
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {filled ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      <Circle className="w-2 h-2 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Label and Value */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-sm font-medium ${
                        filled ? 'text-emerald-700' : 'text-gray-400'
                      }`}
                    >
                      {SLOT_LABELS[key]}
                    </span>
                    {isActive && !filled && (
                      <span className="text-xs text-amber-500 font-medium">
                        (asking...)
                      </span>
                    )}
                  </div>
                  {filled && value && (
                    <p className="text-sm text-gray-600 truncate">{value}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Bar */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Bar */}
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {/* Text */}
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
            {progress.filled}/{progress.total} complete
          </span>
        </div>
      </div>
    </div>
  );
}
