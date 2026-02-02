'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Shield, MapPin, Globe, Star, ExternalLink } from 'lucide-react';
import { BADGE_DEFINITIONS } from '@/lib/types/user';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { UserBadgeLevel } from '@/lib/badges';

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

// Friendly labels for curator years lived
const YEARS_LIVED_LABELS: Record<string, string> = {
  'less_than_1': 'less than 1 year',
  '1_2_years': '1-2 years',
  '3_5_years': '3-5 years',
  '5_plus_years': '5+ years',
  'na_visitor': 'visitor',
};

// Friendly labels for curator experience
const EXPERIENCE_LABELS: Record<string, string> = {
  'first_time': 'First-time visitor with detailed research',
  'visited_2_5': 'Visited 2-5 times',
  'visited_10_plus': 'Visited 10+ times',
  'local_expert': 'Local expert',
};

export default function CreatorCard({
  creator,
  curatorInfo,
  defaultExpanded = true,
}: CreatorCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [badgeLevels, setBadgeLevels] = useState<UserBadgeLevel[]>([]);

  // Fetch gamified badge levels
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch(`/api/users/${creator.id}/badges`);
        if (res.ok) {
          const data = await res.json();
          setBadgeLevels(data.badges || []);
        }
      } catch (error) {
        console.error('Failed to fetch badge levels:', error);
      }
    };

    if (creator.id) {
      fetchBadges();
    }
  }, [creator.id]);

  // Get special badges to display
  const specialBadges = (creator.badges || [])
    .filter((b) => BADGE_DEFINITIONS[b.badge_type as keyof typeof BADGE_DEFINITIONS])
    .map(b => ({ type: b.badge_type, metadata: b.metadata }));

  // Build curator tagline
  const getTagline = () => {
    if (curatorInfo?.experience) {
      return EXPERIENCE_LABELS[curatorInfo.experience] || curatorInfo.experience;
    }
    if (curatorInfo?.is_local === 'yes_live_here' && curatorInfo?.years_lived) {
      const yearsLabel = YEARS_LIVED_LABELS[curatorInfo.years_lived] || curatorInfo.years_lived;
      return `Living here for ${yearsLabel}`;
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
          {/* Gamified Badge Grid */}
          {(badgeLevels.length > 0 || specialBadges.length > 0) && (
            <BadgeGrid
              badges={badgeLevels}
              specialBadges={specialBadges}
              size="sm"
            />
          )}

          {/* Tagline */}
          {tagline && (
            <>
              <div className="border-t border-gray-100" />
              <p className="text-xs text-gray-600 italic">"{tagline}"</p>
            </>
          )}

          {/* View Profile Link */}
          <div className="pt-1">
            <Link
              href={`/profile/${creator.username || creator.id}`}
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View Profile
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
