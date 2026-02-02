// Gamified Badge System - Track definitions, thresholds, and helpers

export type BadgeTrack = 'explorer' | 'creator' | 'influence';
export type BadgeLevel = 1 | 2 | 3 | 4 | 5;

export interface BadgeLevelDefinition {
  level: BadgeLevel;
  name: string;
  threshold: number;
  description: string;
}

export interface BadgeTrackDefinition {
  track: BadgeTrack;
  icon: string;
  title: string;
  levels: BadgeLevelDefinition[];
}

export interface UserBadgeLevel {
  track: BadgeTrack;
  level: BadgeLevel;
  name: string;
  icon: string;
  currentCount: number;
  nextThreshold: number | null;
  nextName: string | null;
  description: string;
}

// Badge track definitions with thresholds
export const BADGE_TRACKS: Record<BadgeTrack, BadgeTrackDefinition> = {
  explorer: {
    track: 'explorer',
    icon: '🌍',
    title: 'Explorer',
    levels: [
      { level: 1, name: 'Tourist', threshold: 1, description: 'Visited 1-2 countries' },
      { level: 2, name: 'Wanderer', threshold: 3, description: 'Visited 3-5 countries' },
      { level: 3, name: 'Nomad', threshold: 6, description: 'Visited 6-10 countries' },
      { level: 4, name: 'Globe Trotter', threshold: 11, description: 'Visited 11-25 countries' },
      { level: 5, name: 'Citizen of Earth', threshold: 26, description: 'Visited 26+ countries' },
    ],
  },
  creator: {
    track: 'creator',
    icon: '✨',
    title: 'Creator',
    levels: [
      { level: 1, name: 'Daydreamer', threshold: 1, description: '1 itinerary created' },
      { level: 2, name: 'Pathfinder', threshold: 3, description: '3-5 itineraries' },
      { level: 3, name: 'Trailblazer', threshold: 6, description: '6-10 itineraries' },
      { level: 4, name: 'Adventure Architect', threshold: 11, description: '11-25 itineraries' },
      { level: 5, name: 'Dream Maker', threshold: 26, description: '26+ itineraries' },
    ],
  },
  influence: {
    track: 'influence',
    icon: '🔥',
    title: 'Influence',
    levels: [
      { level: 1, name: 'Hidden Gem', threshold: 1, description: '1-5 clones' },
      { level: 2, name: 'Local Favorite', threshold: 6, description: '6-15 clones' },
      { level: 3, name: 'Trendsetter', threshold: 16, description: '16-50 clones' },
      { level: 4, name: 'Travel Guru', threshold: 51, description: '51-100 clones' },
      { level: 5, name: 'Legend', threshold: 101, description: '100+ clones' },
    ],
  },
};

// Level color classes (Tailwind)
export const LEVEL_COLORS: Record<BadgeLevel, { text: string; bg: string; border: string }> = {
  1: { text: 'text-gray-400', bg: 'bg-gray-100', border: 'border-gray-300' },
  2: { text: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-400' },
  3: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-400' },
  4: { text: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-400' },
  5: { text: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-400' },
};

// Get level tier name for display
export const LEVEL_TIER_NAMES: Record<BadgeLevel, string> = {
  1: 'Starter',
  2: 'Bronze',
  3: 'Silver',
  4: 'Gold',
  5: 'Platinum',
};

/**
 * Calculate badge level from count
 */
export function getBadgeLevel(track: BadgeTrack, count: number): BadgeLevelDefinition {
  const trackDef = BADGE_TRACKS[track];
  let currentLevel = trackDef.levels[0];

  for (const level of trackDef.levels) {
    if (count >= level.threshold) {
      currentLevel = level;
    } else {
      break;
    }
  }

  return currentLevel;
}

/**
 * Get the next level info (or null if at max)
 */
export function getNextLevel(track: BadgeTrack, currentLevel: BadgeLevel): BadgeLevelDefinition | null {
  const trackDef = BADGE_TRACKS[track];
  const nextLevelIndex = trackDef.levels.findIndex((l) => l.level === currentLevel) + 1;

  if (nextLevelIndex >= trackDef.levels.length) {
    return null; // Already at max level
  }

  return trackDef.levels[nextLevelIndex];
}

/**
 * Get color classes for a level
 */
export function getLevelColor(level: BadgeLevel): { text: string; bg: string; border: string } {
  return LEVEL_COLORS[level];
}

/**
 * Build full badge info for a user
 */
export function buildUserBadgeLevel(track: BadgeTrack, count: number): UserBadgeLevel {
  const trackDef = BADGE_TRACKS[track];
  const currentLevel = getBadgeLevel(track, count);
  const nextLevel = getNextLevel(track, currentLevel.level);

  return {
    track,
    level: currentLevel.level,
    name: currentLevel.name,
    icon: trackDef.icon,
    currentCount: count,
    nextThreshold: nextLevel?.threshold || null,
    nextName: nextLevel?.name || null,
    description: currentLevel.description,
  };
}

/**
 * Calculate all badge levels for a user from their stats
 */
export function calculateAllBadgeLevels(stats: {
  countriesCount: number;
  itinerariesCount: number;
  clonesCount: number;
}): UserBadgeLevel[] {
  return [
    buildUserBadgeLevel('explorer', stats.countriesCount),
    buildUserBadgeLevel('creator', stats.itinerariesCount),
    buildUserBadgeLevel('influence', stats.clonesCount),
  ].sort((a, b) => b.level - a.level); // Sort by level descending (highest first)
}
