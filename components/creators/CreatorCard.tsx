'use client';

import Link from 'next/link';
import { MapPin, Eye, Copy, FileText, CheckCircle, Star } from 'lucide-react';
import { Creator, BADGE_DEFINITIONS, BadgeType } from '@/lib/types/user';

interface CreatorCardProps {
  creator: Creator;
  compact?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export default function CreatorCard({ creator, compact = false }: CreatorCardProps) {
  const displayBadges = creator.badges.slice(0, 3);

  if (compact) {
    // Compact variant for featured sections (horizontal scroll)
    return (
      <Link
        href={`/profile/${creator.username}`}
        className="flex-shrink-0 w-64 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 overflow-hidden group"
      >
        <div className="p-4">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3 mb-3">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.fullName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ring-2 ring-white shadow">
                <span className="text-white font-semibold text-lg">
                  {creator.fullName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                {creator.fullName}
              </h3>
              <p className="text-sm text-gray-500 truncate">@{creator.username}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {creator.stats.itineraryCount}
            </span>
            <span className="flex items-center gap-1">
              <Copy className="w-3 h-3" />
              {formatNumber(creator.stats.totalClones)}
            </span>
          </div>

          {/* Badges */}
          {displayBadges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {displayBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                >
                  {BADGE_DEFINITIONS[badge]?.icon}
                  <span className="truncate max-w-[80px]">{BADGE_DEFINITIONS[badge]?.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Full card variant for grid
  return (
    <Link
      href={`/profile/${creator.username}`}
      className="block bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-200 overflow-hidden group"
    >
      <div className="p-5">
        {/* Header: Avatar + Name + Location */}
        <div className="flex items-start gap-4 mb-4">
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creator.fullName}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ring-2 ring-white shadow-md">
              <span className="text-white font-bold text-2xl">
                {creator.fullName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
              {creator.fullName}
            </h3>
            <p className="text-sm text-gray-500">@{creator.username}</p>
            {creator.location && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{creator.location}</span>
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{creator.bio}</p>
        )}

        {/* Badges */}
        {displayBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {creator.isGuide && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <CheckCircle className="w-3 h-3" />
                Verified Guide
              </span>
            )}
            {creator.isLocalExpert && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                <Star className="w-3 h-3" />
                Local Expert
              </span>
            )}
            {displayBadges
              .filter((b) => b !== 'verified_guide' && b !== 'local_expert')
              .slice(0, 2)
              .map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                >
                  {BADGE_DEFINITIONS[badge]?.icon}
                  {BADGE_DEFINITIONS[badge]?.label}
                </span>
              ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {creator.stats.itineraryCount} itineraries
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            {formatNumber(creator.stats.totalViews)}
          </span>
          <span className="flex items-center gap-1.5">
            <Copy className="w-4 h-4" />
            {formatNumber(creator.stats.totalClones)}
          </span>
        </div>

        {/* Recent Itineraries */}
        {creator.recentItineraries.length > 0 && (
          <div className="flex gap-2 mb-4">
            {creator.recentItineraries.slice(0, 3).map((itinerary) => (
              <div
                key={itinerary.id}
                className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0"
              >
                {itinerary.coverImage ? (
                  <img
                    src={itinerary.coverImage}
                    alt={itinerary.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* View Profile Button */}
        <div className="pt-3 border-t border-gray-100">
          <span className="block w-full text-center py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-medium text-sm group-hover:bg-emerald-100 transition-colors">
            View Profile
          </span>
        </div>
      </div>
    </Link>
  );
}
