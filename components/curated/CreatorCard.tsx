'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, MapPin, Globe, Star } from 'lucide-react';
import { BADGE_DEFINITIONS } from '@/lib/types/user';

interface Badge {
  badge_type: string;
  metadata?: any;
}

interface CreatorCardProps {
  creator: {
    id: string;
    name: string;
    username?: string;
    avatar_url?: string;
    badges?: Badge[];
  };
  curatorInfo?: {
    is_local?: string;
    years_lived?: string;
    experience?: string;
  };
  defaultExpanded?: boolean;
}

const getBadgeIcon = (badgeType: string) => {
  switch (badgeType) {
    case 'verified_guide':
      return <Shield className="w-3 h-3" />;
    case 'local_expert':
      return <MapPin className="w-3 h-3" />;
    case 'globetrotter':
      return <Globe className="w-3 h-3" />;
    default:
      return <Star className="w-3 h-3" />;
  }
};

const getBadgeLabel = (badge: Badge): string => {
  const def = BADGE_DEFINITIONS[badge.badge_type as keyof typeof BADGE_DEFINITIONS];
  if (badge.badge_type === 'local_expert' && badge.metadata?.city) {
    return `Local Expert (${badge.metadata.city})`;
  }
  return def?.label || badge.badge_type;
};

export default function CreatorCard({
  creator,
  curatorInfo,
  defaultExpanded = true,
}: CreatorCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Get top badges to display (max 3)
  const topBadges = (creator.badges || [])
    .filter((b) => ['verified_guide', 'local_expert', 'globetrotter', 'explorer'].includes(b.badge_type))
    .slice(0, 3);

  // Build curator tagline
  const getTagline = () => {
    if (curatorInfo?.experience) return curatorInfo.experience;
    if (curatorInfo?.is_local === 'yes_live_here' && curatorInfo?.years_lived) {
      return `Living here for ${curatorInfo.years_lived}`;
    }
    if (curatorInfo?.is_local === 'visited_multiple') {
      return 'Visited multiple times';
    }
    return null;
  };

  const tagline = getTagline();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header - Always visible */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.name}
              className="w-full h-full object-cover"
            />
          ) : (
            creator.name?.charAt(0)?.toUpperCase() || '?'
          )}
        </div>

        {/* Name & Username */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm truncate">
            {creator.name}
          </h4>
          {creator.username && (
            <p className="text-xs text-gray-500 truncate">@{creator.username}</p>
          )}
        </div>

        {/* Expand/Collapse */}
        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Badges */}
          {topBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topBadges.map((badge, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs"
                >
                  {getBadgeIcon(badge.badge_type)}
                  <span>{getBadgeLabel(badge)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tagline */}
          {tagline && (
            <>
              <div className="border-t border-gray-100" />
              <p className="text-xs text-gray-600 italic">"{tagline}"</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
