'use client';

import { useState } from 'react';
import { Check, X, MapPin, Award, Globe, Compass, ExternalLink } from 'lucide-react';
import type { TripSuggestion, UserBadge } from '@/lib/types/marketplace';

interface SuggestionCardProps {
  suggestion: TripSuggestion;
  isOwner: boolean;
  onMarkUsed?: (suggestionId: string) => void;
  onDismiss?: (suggestionId: string) => void;
}

const BADGE_LABELS: Record<string, { label: string; icon: typeof Award; color: string }> = {
  local_expert: { label: 'Local Expert', icon: MapPin, color: 'text-emerald-600 bg-emerald-100' },
  explorer: { label: 'Explorer', icon: Compass, color: 'text-blue-600 bg-blue-100' },
  globetrotter: { label: 'Globetrotter', icon: Globe, color: 'text-purple-600 bg-purple-100' },
  verified_guide: { label: 'Verified Guide', icon: Award, color: 'text-amber-600 bg-amber-100' },
  helpful: { label: 'Helpful', icon: Award, color: 'text-pink-600 bg-pink-100' },
};

export default function SuggestionCard({
  suggestion,
  isOwner,
  onMarkUsed,
  onDismiss,
}: SuggestionCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkUsed = async () => {
    if (!onMarkUsed) return;
    setIsLoading(true);
    try {
      await onMarkUsed(suggestion.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (!onDismiss) return;
    setIsLoading(true);
    try {
      await onDismiss(suggestion.id);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const statusBadge = () => {
    if (suggestion.status === 'used') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Used</span>;
    }
    if (suggestion.status === 'dismissed') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Dismissed</span>;
    }
    return null;
  };

  // Get relevant badges to display
  const relevantBadges = suggestion.user_badges?.filter(
    (b) => BADGE_LABELS[b.badge_type]
  ).slice(0, 2) || [];

  return (
    <div className={`bg-white rounded-lg border ${suggestion.status === 'used' ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'} p-4 shadow-sm`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
          {suggestion.user_avatar ? (
            <img src={suggestion.user_avatar} alt={suggestion.user_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-medium">
              {suggestion.user_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-gray-900">{suggestion.user_name || 'Anonymous'}</h4>
            {statusBadge()}
          </div>

          {/* User Badges */}
          {relevantBadges.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {relevantBadges.map((badge, idx) => {
                const config = BADGE_LABELS[badge.badge_type];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                    {badge.metadata?.city && (
                      <span className="opacity-75">• {badge.metadata.city}</span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Date */}
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatDate(suggestion.created_at)}
        </span>
      </div>

      {/* Place Name */}
      <div className="mt-3">
        <div className="flex items-center gap-1.5 text-purple-700 font-medium">
          <MapPin className="w-4 h-4" />
          {suggestion.place_name}
          {/* Google Maps link - use source_url or construct from coordinates */}
          {(suggestion.source_url || (suggestion.location_lat && suggestion.location_lng)) && (
            <a
              href={suggestion.source_url || `https://www.google.com/maps?q=${suggestion.location_lat},${suggestion.location_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
              title="View on Google Maps"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
        {/* Show coordinates if available */}
        {suggestion.location_lat && suggestion.location_lng && (
          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
            📍 Location: ({Number(suggestion.location_lat).toFixed(4)}, {Number(suggestion.location_lng).toFixed(4)})
          </div>
        )}
      </div>

      {/* Reason */}
      <p className="mt-2 text-sm text-gray-600">{suggestion.reason}</p>

      {/* Category */}
      {suggestion.category && (
        <div className="mt-2">
          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-600 rounded">
            {suggestion.category}
          </span>
        </div>
      )}

      {/* Action Buttons (Owner Only) */}
      {isOwner && suggestion.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleMarkUsed}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <Check className="w-4 h-4" />
            I will try
          </button>
          <button
            onClick={handleDismiss}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
