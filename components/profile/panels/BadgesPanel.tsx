'use client';

import { Award, Trophy, Star } from 'lucide-react';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { UserBadgeLevel } from '@/lib/badges';
import { UserBadge, BADGE_DEFINITIONS } from '@/lib/types/user';

interface BadgesPanelProps {
  badgeLevels: UserBadgeLevel[];
  specialBadges: UserBadge[];
}

export default function BadgesPanel({ badgeLevels, specialBadges }: BadgesPanelProps) {
  const activeBadges = badgeLevels.filter((b) => b.currentCount > 0);
  const totalBadges = activeBadges.length + specialBadges.length;

  // Group badges by level for display
  const highLevelBadges = activeBadges.filter((b) => b.level >= 4);
  const midLevelBadges = activeBadges.filter((b) => b.level >= 2 && b.level < 4);
  const startingBadges = activeBadges.filter((b) => b.level < 2);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Badges & Achievements</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>{totalBadges} earned</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-700">Elite</span>
            </div>
            <p className="text-2xl font-bold text-amber-900">{highLevelBadges.length}</p>
            <p className="text-xs text-amber-600">Level 4+</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Advanced</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{midLevelBadges.length}</p>
            <p className="text-xs text-gray-600">Level 2-3</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">Special</span>
            </div>
            <p className="text-2xl font-bold text-emerald-900">{specialBadges.length}</p>
            <p className="text-xs text-emerald-600">Unique</p>
          </div>
        </div>

        {/* All Badges Display */}
        {totalBadges > 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Your Badges</h3>
            <BadgeGrid
              badges={badgeLevels}
              specialBadges={specialBadges
                .filter((badge) => BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS])
                .map((b) => ({ type: b.badgeType, metadata: b.metadata }))}
              size="lg"
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-medium text-gray-900 mb-1">No badges yet</h3>
            <p className="text-sm text-gray-500">
              Start exploring and creating itineraries to earn your first badge!
            </p>
          </div>
        )}

        {/* Badge Progress */}
        {badgeLevels.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Badge Progress</h3>
            <div className="space-y-4">
              {badgeLevels.map((badge) => (
                <div key={badge.track} className="flex items-center gap-4">
                  <span className="text-2xl">{badge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 text-sm">{badge.name}</p>
                      {badge.nextThreshold ? (
                        <span className="text-xs text-gray-500">
                          {badge.currentCount} / {badge.nextThreshold}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">Max Level!</span>
                      )}
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          badge.level >= 4
                            ? 'bg-amber-500'
                            : badge.level >= 3
                              ? 'bg-emerald-500'
                              : badge.level >= 2
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                        }`}
                        style={{
                          width: badge.nextThreshold
                            ? `${Math.min(100, (badge.currentCount / badge.nextThreshold) * 100)}%`
                            : '100%',
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
