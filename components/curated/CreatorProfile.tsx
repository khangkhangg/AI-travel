'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Globe, Star, Shield, ExternalLink, Heart } from 'lucide-react';
import { BADGE_DEFINITIONS, PAYMENT_PLATFORMS, PaymentPlatform } from '@/lib/types/user';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { UserBadgeLevel } from '@/lib/badges';

interface Badge {
  badge_type: string;
  metadata?: any;
}

interface PaymentLink {
  platform: string;
  value: string;
  is_primary?: boolean;
}

interface CreatorProfileProps {
  creator: {
    id: string;
    name: string;
    username?: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    badges?: Badge[];
    trip_count?: number;
    countries_count?: number;
  };
  curatorInfo?: {
    is_local?: string;
    years_lived?: string;
    experience?: string;
  };
  paymentLinks?: PaymentLink[];
}

const getBadgeIcon = (badgeType: string) => {
  switch (badgeType) {
    case 'verified_guide':
      return <Shield className="w-4 h-4" />;
    case 'local_expert':
      return <MapPin className="w-4 h-4" />;
    case 'globetrotter':
      return <Globe className="w-4 h-4" />;
    default:
      return <Star className="w-4 h-4" />;
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
const YEARS_LIVED_LABELS: Record<string, { label: string; sublabel: string }> = {
  'less_than_1': { label: '<1', sublabel: 'Year Here' },
  '1_2_years': { label: '1-2', sublabel: 'Years Here' },
  '3_5_years': { label: '3-5', sublabel: 'Years Here' },
  '5_plus_years': { label: '5+', sublabel: 'Years Here' },
  'na_visitor': { label: 'Visitor', sublabel: 'Not a Local' },
};

// Friendly labels for curator experience
const EXPERIENCE_LABELS: Record<string, { label: string; sublabel: string }> = {
  'first_time': { label: 'First', sublabel: 'Trip' },
  'visited_2_5': { label: '2-5', sublabel: 'Visits' },
  'visited_10_plus': { label: '10+', sublabel: 'Visits' },
  'local_expert': { label: 'Local', sublabel: 'Expert' },
};

export default function CreatorProfile({
  creator,
  curatorInfo,
  paymentLinks = [],
}: CreatorProfileProps) {
  const router = useRouter();
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

  // Sort payment links - primary first
  const sortedPaymentLinks = [...paymentLinks].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return 0;
  });

  const handleTipClick = (link: PaymentLink) => {
    const platform = link.platform as PaymentPlatform;
    let url = link.value;

    // Build proper URL based on platform
    if (platform === 'paypal' && !url.startsWith('http')) {
      url = `https://paypal.me/${url}`;
    } else if (platform === 'venmo' && !url.startsWith('http')) {
      url = `https://venmo.com/${url.replace('@', '')}`;
    } else if (platform === 'cashapp' && !url.startsWith('http')) {
      url = `https://cash.app/${url}`;
    } else if (platform === 'kofi' && !url.startsWith('http')) {
      url = `https://ko-fi.com/${url}`;
    } else if (platform === 'buymeacoffee' && !url.startsWith('http')) {
      url = `https://buymeacoffee.com/${url}`;
    }

    window.open(url, '_blank');
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Section Title */}
        <div className="text-center mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            About the Creator
          </h3>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-3xl overflow-hidden mx-auto md:mx-0">
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
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              {/* Name & Username */}
              <h4 className="text-xl font-bold text-gray-900">{creator.name}</h4>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-gray-500 mt-1">
                {creator.username && <span>@{creator.username}</span>}
                {creator.location && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {creator.location}
                    </span>
                  </>
                )}
              </div>

              {/* Stats + Badges Row */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4">
                {/* Stats */}
                <div className="flex justify-center md:justify-start gap-4 text-sm text-gray-600">
                  {creator.countries_count !== undefined && creator.countries_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      {creator.countries_count} countries
                    </span>
                  )}
                  {creator.trip_count !== undefined && creator.trip_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-emerald-600" />
                      {creator.trip_count} curated trips
                    </span>
                  )}
                </div>

                {/* Gamified Badge Grid */}
                {(badgeLevels.length > 0 || (creator.badges && creator.badges.length > 0)) && (
                  <BadgeGrid
                    badges={badgeLevels}
                    specialBadges={creator.badges?.filter(b => BADGE_DEFINITIONS[b.badge_type as keyof typeof BADGE_DEFINITIONS]).map(b => ({
                      type: b.badge_type,
                      metadata: b.metadata
                    }))}
                    size="md"
                  />
                )}
              </div>

              {/* Actions - View Profile & Follow */}
              <div className="flex justify-center md:justify-start gap-3 mt-4">
                <button
                  onClick={() => router.push(`/profile/${creator.username || creator.id}`)}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  View Profile
                </button>
                <button
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm"
                >
                  Follow
                </button>
              </div>
            </div>
          </div>


          {/* Bio Summary - above tip section */}
          {creator.bio && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-gray-600 leading-relaxed text-center md:text-left">
                {creator.bio.length > 450 ? `${creator.bio.slice(0, 450)}...` : creator.bio}
                {creator.bio.length > 450 && (
                  <button
                    onClick={() => router.push(`/profile/${creator.username || creator.id}`)}
                    className="text-emerald-600 hover:text-emerald-700 font-medium ml-1"
                  >
                    View more
                  </button>
                )}
              </p>
            </div>
          )}

          {/* Tip Section */}
          {sortedPaymentLinks.length > 0 && (
            <div className={`mt-6 pt-6 ${!creator.bio ? 'border-t border-gray-100' : ''}`}>
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-5">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <span className="font-semibold text-gray-800">Support this creator</span>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {sortedPaymentLinks.map((link, idx) => {
                    const platform = PAYMENT_PLATFORMS[link.platform as PaymentPlatform];
                    if (!platform) return null;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleTipClick(link)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                          link.is_primary
                            ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span>{platform.icon}</span>
                        <span>{platform.label}</span>
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
