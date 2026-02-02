'use client';

import { useState } from 'react';
import { UserBadgeLevel, LEVEL_COLORS, BadgeLevel } from '@/lib/badges';

interface BadgeGridProps {
  badges: UserBadgeLevel[];
  specialBadges?: { type: string; metadata?: any }[];
  size?: 'sm' | 'md' | 'lg';
}

// Special badge definitions (non-leveled)
const SPECIAL_BADGE_INFO: Record<string, { icon: string; label: string }> = {
  local_expert: { icon: '📍', label: 'Local Expert' },
  verified_guide: { icon: '✓', label: 'Verified Guide' },
  tipped_creator: { icon: '💝', label: 'Tipped Creator' },
};

export default function BadgeGrid({ badges, specialBadges = [], size = 'md' }: BadgeGridProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const getLevelColorClass = (level: BadgeLevel): string => {
    return LEVEL_COLORS[level].text;
  };

  // Filter badges that have at least level 1 (count > 0)
  const activeBadges = badges.filter((b) => b.currentCount > 0);

  // All badges sorted by level (highest first)
  const sortedBadges = [...activeBadges].sort((a, b) => b.level - a.level);

  if (sortedBadges.length === 0 && specialBadges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Leveled badges */}
      {sortedBadges.map((badge) => (
        <div
          key={badge.track}
          className="relative"
          onMouseEnter={() => setActiveTooltip(badge.track)}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip === badge.track ? null : badge.track)}
        >
          {/* Badge icon */}
          <span
            className={`cursor-pointer transition-transform hover:scale-110 ${sizeClasses[size]} ${getLevelColorClass(badge.level)}`}
          >
            {badge.icon}
          </span>

          {/* Tooltip */}
          {activeTooltip === badge.track && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
              <div className="bg-gray-900 text-white rounded-lg shadow-lg p-3 min-w-[200px] text-sm">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${getLevelColorClass(badge.level)}`}>{badge.icon}</span>
                  <div>
                    <div className="font-semibold">{badge.name}</div>
                    <div className="text-xs text-gray-400">{badge.description}</div>
                  </div>
                </div>

                {/* Progress bar */}
                {badge.nextThreshold && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{badge.currentCount} / {badge.nextThreshold}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          badge.level >= 4 ? 'bg-emerald-500' : badge.level >= 3 ? 'bg-amber-500' : 'bg-gray-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (badge.currentCount / badge.nextThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      → Next: <span className="text-white">{badge.nextName}</span>
                    </div>
                  </div>
                )}

                {/* Max level indicator */}
                {!badge.nextThreshold && (
                  <div className="mt-2 text-xs text-yellow-400 font-medium">
                    ★ Max Level Achieved!
                  </div>
                )}

                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                  <div className="border-8 border-transparent border-t-gray-900" />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Special badges */}
      {specialBadges.map((badge, idx) => {
        const info = SPECIAL_BADGE_INFO[badge.type];
        if (!info) return null;

        const tooltipId = `special-${badge.type}-${idx}`;
        const label =
          badge.type === 'local_expert' && badge.metadata?.city
            ? `${info.label}: ${badge.metadata.city}`
            : info.label;

        return (
          <div
            key={tooltipId}
            className="relative"
            onMouseEnter={() => setActiveTooltip(tooltipId)}
            onMouseLeave={() => setActiveTooltip(null)}
            onClick={() => setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId)}
          >
            <span
              className={`cursor-pointer transition-transform hover:scale-110 ${sizeClasses[size]} text-emerald-500`}
            >
              {info.icon}
            </span>

            {activeTooltip === tooltipId && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                <div className="bg-gray-900 text-white rounded-lg shadow-lg p-3 min-w-[160px] text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{info.icon}</span>
                    <span className="font-semibold">{label}</span>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                    <div className="border-8 border-transparent border-t-gray-900" />
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
