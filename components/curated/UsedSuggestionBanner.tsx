'use client';

import { Lightbulb, ChevronDown, ChevronUp, MapPin, ExternalLink } from 'lucide-react';
import type { TripSuggestion } from '@/lib/types/marketplace';

interface UsedSuggestionBannerProps {
  suggestion: TripSuggestion;
  expanded: boolean;
  onToggle: () => void;
}

export default function UsedSuggestionBanner({
  suggestion,
  expanded,
  onToggle,
}: UsedSuggestionBannerProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="mb-3 border-2 border-amber-200 bg-amber-50 rounded-lg overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <span className="font-medium text-amber-900">
            Suggested by {suggestion.user_name}
          </span>
          <span className="text-amber-700">·</span>
          <span className="font-semibold text-amber-800">
            {suggestion.place_name}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-amber-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-600" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-200 pt-3">
          {/* Suggester info */}
          <div className="flex items-center gap-2">
            {suggestion.user_avatar ? (
              <img
                src={suggestion.user_avatar}
                alt={suggestion.user_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-600">
                  {getInitials(suggestion.user_name)}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">{suggestion.user_name}</div>
              <div className="text-sm text-gray-600">
                {suggestion.category && (
                  <span className="capitalize">{suggestion.category}</span>
                )}
              </div>
            </div>
          </div>

          {/* Place name */}
          <div>
            <div className="text-sm font-medium text-gray-900 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              {suggestion.place_name}
            </div>
            {suggestion.location_address && (
              <p className="text-sm text-gray-600 pl-5">{suggestion.location_address}</p>
            )}
          </div>

          {/* Reason/recommendation */}
          {suggestion.reason && (
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1.5">💭 Why this place:</div>
              <p className="text-sm text-gray-700 italic border-l-2 border-amber-300 pl-3">
                &quot;{suggestion.reason}&quot;
              </p>
            </div>
          )}

          {/* Source URL */}
          {suggestion.source_url && (
            <a
              href={suggestion.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors group"
            >
              <MapPin className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              View on map
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
