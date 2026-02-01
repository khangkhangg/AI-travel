'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Globe, Star, Shield, ExternalLink, Heart } from 'lucide-react';
import { BADGE_DEFINITIONS, PAYMENT_PLATFORMS, PaymentPlatform } from '@/lib/types/user';

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

export default function CreatorProfile({
  creator,
  curatorInfo,
  paymentLinks = [],
}: CreatorProfileProps) {
  const router = useRouter();

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

              {/* Badges */}
              {creator.badges && creator.badges.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                  {creator.badges.map((badge, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                    >
                      {getBadgeIcon(badge.badge_type)}
                      <span>{getBadgeLabel(badge)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-4 mt-4 text-sm text-gray-600">
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
            </div>
          </div>

          {/* Bio / Experience */}
          {(creator.bio || curatorInfo?.experience) && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-gray-600 leading-relaxed text-center md:text-left">
                "{curatorInfo?.experience || creator.bio}"
              </p>
            </div>
          )}

          {/* Curator Credentials */}
          {curatorInfo && (curatorInfo.is_local || curatorInfo.years_lived) && (
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
              {curatorInfo.years_lived && (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {curatorInfo.years_lived}
                  </div>
                  <div className="text-xs text-gray-500">Years Here</div>
                </div>
              )}
              {curatorInfo.is_local === 'yes_live_here' && (
                <div className="px-4 py-2 bg-emerald-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-emerald-700">Local</div>
                  <div className="text-xs text-emerald-600">Expert</div>
                </div>
              )}
              {curatorInfo.is_local === 'visited_multiple' && (
                <div className="px-4 py-2 bg-blue-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-blue-700">Frequent</div>
                  <div className="text-xs text-blue-600">Visitor</div>
                </div>
              )}
            </div>
          )}

          {/* Tip Section */}
          {sortedPaymentLinks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
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

          {/* Actions */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => router.push(`/profile/${creator.username || creator.id}`)}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              View Profile
            </button>
            <button
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              Follow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
