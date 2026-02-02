import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import {
  BadgeTrack,
  BADGE_TRACKS,
  buildUserBadgeLevel,
  UserBadgeLevel,
} from '@/lib/badges';

// GET - Get user's badge levels
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get badge levels from database
    const badgeLevelsResult = await query(
      `SELECT track, level, current_count, updated_at
       FROM user_badge_levels
       WHERE user_id = $1`,
      [userId]
    );

    // If no stored badges, calculate from stats
    if (badgeLevelsResult.rows.length === 0) {
      const badges = await calculateAndStoreBadgeLevels(userId);
      return NextResponse.json({ badges, specialBadges: await getSpecialBadges(userId) });
    }

    // Build badge info from stored levels
    const badges: UserBadgeLevel[] = badgeLevelsResult.rows.map((row) => {
      return buildUserBadgeLevel(row.track as BadgeTrack, row.current_count);
    });

    // Sort by level descending (highest first)
    badges.sort((a, b) => b.level - a.level);

    // Get special badges
    const specialBadges = await getSpecialBadges(userId);

    return NextResponse.json({ badges, specialBadges });
  } catch (error: any) {
    console.error('Failed to get badges:', error);
    return NextResponse.json(
      { error: 'Failed to get badges', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Recalculate badge levels from stats
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const user = await getUser();

    // Only allow recalculating own badges or by system
    const body = await request.json().catch(() => ({}));
    const isSystemCall = body.systemKey === process.env.INTERNAL_API_KEY;

    if (!isSystemCall && (!user || user.id !== userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const badges = await calculateAndStoreBadgeLevels(userId);
    const specialBadges = await getSpecialBadges(userId);

    return NextResponse.json({
      message: 'Badge levels recalculated',
      badges,
      specialBadges,
    });
  } catch (error: any) {
    console.error('Failed to recalculate badges:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate badges', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Calculate badge levels from user stats and store in database
 */
async function calculateAndStoreBadgeLevels(userId: string): Promise<UserBadgeLevel[]> {
  // Get user stats
  const stats = await getUserStats(userId);

  const trackStats: { track: BadgeTrack; count: number }[] = [
    { track: 'explorer', count: stats.countriesCount },
    { track: 'creator', count: stats.itinerariesCount },
    { track: 'influence', count: stats.clonesCount },
  ];

  const badges: UserBadgeLevel[] = [];

  for (const { track, count } of trackStats) {
    const badgeInfo = buildUserBadgeLevel(track, count);

    // Upsert badge level
    await query(
      `INSERT INTO user_badge_levels (user_id, track, level, current_count, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, track)
       DO UPDATE SET level = $3, current_count = $4, updated_at = NOW()`,
      [userId, track, badgeInfo.level, count]
    );

    badges.push(badgeInfo);
  }

  // Sort by level descending
  badges.sort((a, b) => b.level - a.level);

  return badges;
}

/**
 * Get user stats for badge calculation
 */
async function getUserStats(userId: string): Promise<{
  countriesCount: number;
  itinerariesCount: number;
  clonesCount: number;
}> {
  // Countries visited (from travel history)
  let countriesCount = 0;
  try {
    const countriesResult = await query(
      `SELECT COUNT(DISTINCT country) as count
       FROM user_travel_history
       WHERE user_id = $1 AND is_wishlist = false`,
      [userId]
    );
    countriesCount = parseInt(countriesResult.rows[0]?.count) || 0;
  } catch {
    // Table might not exist
  }

  // Itineraries created (public/curated trips)
  let itinerariesCount = 0;
  try {
    const itinerariesResult = await query(
      `SELECT COUNT(*) as count
       FROM trips
       WHERE user_id = $1 AND visibility IN ('public', 'curated')`,
      [userId]
    );
    itinerariesCount = parseInt(itinerariesResult.rows[0]?.count) || 0;
  } catch {
    // Table might not exist
  }

  // Total clones of user's itineraries
  // Note: clone_count column not yet implemented in trips table
  let clonesCount = 0;

  return { countriesCount, itinerariesCount, clonesCount };
}

/**
 * Get special badges (non-leveled achievements)
 */
async function getSpecialBadges(userId: string): Promise<{ type: string; metadata?: any }[]> {
  const specialBadges: { type: string; metadata?: any }[] = [];

  try {
    const badgesResult = await query(
      `SELECT badge_type, metadata
       FROM user_badges
       WHERE user_id = $1`,
      [userId]
    );

    for (const row of badgesResult.rows) {
      specialBadges.push({
        type: row.badge_type,
        metadata: row.metadata,
      });
    }
  } catch {
    // Table might not exist
  }

  return specialBadges;
}
