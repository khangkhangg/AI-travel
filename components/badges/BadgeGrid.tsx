'use client';

import { useState } from 'react';
import { UserBadgeLevel, LEVEL_COLORS, BadgeLevel, LEVEL_TIER_NAMES } from '@/lib/badges';
import BadgeShape from './BadgeShape';

interface BadgeGridProps {
  badges: UserBadgeLevel[];
  specialBadges?: { type: string; metadata?: any }[];
  size?: 'sm' | 'md' | 'lg';
}

// Special badge definitions (non-leveled) - shown as level 4 hexagon
const SPECIAL_BADGE_INFO: Record<string, { icon: string; label: string }> = {
  local_expert: { icon: '📍', label: 'Local Expert' },
  verified_guide: { icon: '✅', label: 'Verified' },
  tipped_creator: { icon: '💝', label: 'Tipped' },
};

export default function BadgeGrid({ badges, specialBadges = [], size = 'md' }: BadgeGridProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Filter badges that have at least level 1 (count > 0)
  const activeBadges = badges.filter((b) => b.currentCount > 0);

  // All badges sorted by level (highest first)
  const sortedBadges = [...activeBadges].sort((a, b) => b.level - a.level);

  if (sortedBadges.length === 0 && specialBadges.length === 0) {
    return null;
  }

  const getProgressColor = (level: BadgeLevel) => {
    if (level >= 5) return 'bg-yellow-400';
    if (level >= 4) return 'bg-emerald-500';
    if (level >= 3) return 'bg-slate-400';
    if (level >= 2) return 'bg-amber-600';
    return 'bg-stone-400';
  };

  return (
    <div className="flex flex-wrap items-end gap-4 pb-2">
      {/* Leveled badges */}
      {sortedBadges.map((badge) => (
        <div
          key={badge.track}
          className="relative cursor-pointer"
          onMouseEnter={() => setActiveTooltip(badge.track)}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip === badge.track ? null : badge.track)}
        >
          <BadgeShape
            level={badge.level}
            icon={badge.icon}
            name={badge.name}
            track={badge.track}
            size={size}
          />

          {/* Tooltip */}
          {activeTooltip === badge.track && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50">
              <div className="bg-zinc-900 text-white rounded-xl shadow-2xl p-4 min-w-[220px] text-sm border border-zinc-700">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <div className="font-bold text-base">{badge.name}</div>
                    <div className="text-xs text-zinc-400">
                      {LEVEL_TIER_NAMES[badge.level]} Tier • Level {badge.level}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 mb-3">{badge.description}</p>

                {/* Progress bar */}
                {badge.nextThreshold && (
                  <div className="bg-zinc-800 rounded-lg p-2">
                    <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                      <span>Progress</span>
                      <span className="font-medium text-white">{badge.currentCount} / {badge.nextThreshold}</span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(badge.level)}`}
                        style={{
                          width: `${Math.min(100, (badge.currentCount / badge.nextThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1">
                      <span>→</span>
                      <span>Next: <span className="text-white font-medium">{badge.nextName}</span></span>
                    </div>
                  </div>
                )}

                {/* Max level indicator */}
                {!badge.nextThreshold && (
                  <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-lg p-2 text-center">
                    <span className="text-yellow-400 font-bold text-xs">★ Maximum Level Achieved! ★</span>
                  </div>
                )}

                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                  <div className="border-8 border-transparent border-t-zinc-900" />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Special badges - rendered as level 4 hexagons */}
      {specialBadges.map((badge, idx) => {
        const info = SPECIAL_BADGE_INFO[badge.type];
        if (!info) return null;

        const tooltipId = `special-${badge.type}-${idx}`;
        const label =
          badge.type === 'local_expert' && badge.metadata?.city
            ? `${badge.metadata.city}`
            : info.label;

        return (
          <div
            key={tooltipId}
            className="relative cursor-pointer"
            onMouseEnter={() => setActiveTooltip(tooltipId)}
            onMouseLeave={() => setActiveTooltip(null)}
            onClick={() => setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId)}
          >
            <BadgeShape
              level={4}
              icon={info.icon}
              name={label}
              size={size}
            />

            {activeTooltip === tooltipId && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50">
                <div className="bg-zinc-900 text-white rounded-xl shadow-2xl p-4 min-w-[180px] text-sm border border-zinc-700">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <span className="font-bold">{info.label}</span>
                      {badge.type === 'local_expert' && badge.metadata?.city && (
                        <div className="text-xs text-zinc-400">{badge.metadata.city}</div>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                    <div className="border-8 border-transparent border-t-zinc-900" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
