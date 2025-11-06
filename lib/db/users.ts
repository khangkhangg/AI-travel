import { query } from './index';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'premium';
  subscription_expires_at: Date | null;
  trips_generated_count: number;
  last_trip_generated_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function getUser(userId: string): Promise<User | null> {
  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function createUser(user: {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}): Promise<User> {
  const result = await query(
    `INSERT INTO users (id, email, full_name, avatar_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       full_name = EXCLUDED.full_name,
       avatar_url = EXCLUDED.avatar_url,
       updated_at = NOW()
     RETURNING *`,
    [user.id, user.email, user.full_name || null, user.avatar_url || null]
  );
  return result.rows[0];
}

export async function canGenerateTrip(userId: string): Promise<{
  canGenerate: boolean;
  reason?: string;
  tripsRemaining?: number;
}> {
  const user = await getUser(userId);

  if (!user) {
    return { canGenerate: false, reason: 'User not found' };
  }

  // Premium users can generate unlimited trips
  if (user.subscription_tier === 'premium') {
    const now = new Date();
    if (user.subscription_expires_at && new Date(user.subscription_expires_at) > now) {
      return { canGenerate: true };
    }
    // Subscription expired, treat as free
  }

  // Free users: 1 trip initially, then 1 per month
  if (user.trips_generated_count === 0) {
    // First trip, always allowed
    return { canGenerate: true, tripsRemaining: 1 };
  }

  // Check if last trip was generated more than 30 days ago
  if (user.last_trip_generated_at) {
    const lastGenerated = new Date(user.last_trip_generated_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (lastGenerated < thirtyDaysAgo) {
      return { canGenerate: true, tripsRemaining: 1 };
    }
  }

  const daysUntilNextTrip = user.last_trip_generated_at
    ? Math.ceil((new Date(user.last_trip_generated_at).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))
    : 0;

  return {
    canGenerate: false,
    reason: `Free tier limit reached. You can generate another trip in ${daysUntilNextTrip} days or upgrade to Premium for unlimited trips.`,
    tripsRemaining: 0
  };
}

export async function incrementTripCount(userId: string): Promise<void> {
  await query(
    `UPDATE users
     SET trips_generated_count = trips_generated_count + 1,
         last_trip_generated_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
}

export async function updateSubscription(
  userId: string,
  tier: 'free' | 'premium',
  expiresAt?: Date
): Promise<User> {
  const result = await query(
    `UPDATE users
     SET subscription_tier = $2,
         subscription_expires_at = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [userId, tier, expiresAt || null]
  );
  return result.rows[0];
}

export async function getUserStats(userId: string) {
  const stats = await query(
    `SELECT
       COUNT(DISTINCT t.id) as total_trips,
       COUNT(DISTINCT tl.id) as total_likes_received,
       COUNT(DISTINCT f.id) as followers_count,
       COUNT(DISTINCT f2.id) as following_count
     FROM users u
     LEFT JOIN trips t ON t.user_id = u.id
     LEFT JOIN trip_likes tl ON tl.trip_id = t.id
     LEFT JOIN followers f ON f.following_id = u.id
     LEFT JOIN followers f2 ON f2.follower_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId]
  );
  return stats.rows[0] || { total_trips: 0, total_likes_received: 0, followers_count: 0, following_count: 0 };
}
