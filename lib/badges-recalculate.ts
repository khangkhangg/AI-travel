import { query } from '@/lib/db';
import { BadgeTrack, buildUserBadgeLevel } from '@/lib/badges';

/**
 * Recalculate a specific badge track for a user
 * Call this after relevant actions (e.g., after adding travel history, creating trip, etc.)
 */
export async function recalculateBadgeTrack(
  userId: string,
  track: BadgeTrack
): Promise<void> {
  try {
    let count = 0;

    switch (track) {
      case 'explorer':
        // Count distinct countries visited
        const countriesResult = await query(
          `SELECT COUNT(DISTINCT country) as count
           FROM user_travel_history
           WHERE user_id = $1 AND (is_wishlist = false OR is_wishlist IS NULL)`,
          [userId]
        );
        count = parseInt(countriesResult.rows[0]?.count) || 0;
        break;

      case 'creator':
        // Count public/curated trips
        const tripsResult = await query(
          `SELECT COUNT(*) as count
           FROM trips
           WHERE user_id = $1 AND visibility IN ('public', 'curated')`,
          [userId]
        );
        count = parseInt(tripsResult.rows[0]?.count) || 0;
        break;

      case 'influence':
        // Sum of all clone counts
        const clonesResult = await query(
          `SELECT COALESCE(SUM(clone_count), 0) as count
           FROM trips
           WHERE user_id = $1`,
          [userId]
        );
        count = parseInt(clonesResult.rows[0]?.count) || 0;
        break;
    }

    const badgeInfo = buildUserBadgeLevel(track, count);

    // Upsert badge level
    await query(
      `INSERT INTO user_badge_levels (user_id, track, level, current_count, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, track)
       DO UPDATE SET level = $3, current_count = $4, updated_at = NOW()`,
      [userId, track, badgeInfo.level, count]
    );
  } catch (error) {
    console.error(`Failed to recalculate ${track} badge for user ${userId}:`, error);
    // Don't throw - badge recalculation is not critical
  }
}

/**
 * Recalculate all badge tracks for a user
 */
export async function recalculateAllBadges(userId: string): Promise<void> {
  await Promise.all([
    recalculateBadgeTrack(userId, 'explorer'),
    recalculateBadgeTrack(userId, 'creator'),
    recalculateBadgeTrack(userId, 'influence'),
  ]);
}
