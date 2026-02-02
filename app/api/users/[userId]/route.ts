import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - Get public user profile by ID or username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const currentUser = await getUser();

    // Check if userId looks like a UUID (to avoid PostgreSQL UUID parsing errors)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(userId);

    let userResult;

    // Try to find user by ID first (only if it looks like a UUID), then by username
    if (isUuid) {
      userResult = await query(
        `SELECT id, full_name, avatar_url, bio, location, username, profile_visibility, created_at
         FROM users WHERE id = $1`,
        [userId]
      );
    }

    // If not found by ID (or not a UUID), try username
    if (!userResult || userResult.rows.length === 0) {
      userResult = await query(
        `SELECT id, full_name, avatar_url, bio, location, username, profile_visibility, created_at
         FROM users WHERE LOWER(username) = LOWER($1)`,
        [userId]
      );
    }

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const isOwner = currentUser?.id === user.id;

    // Get social links (public)
    const socialLinksResult = await query(
      `SELECT id, platform, value FROM user_social_links WHERE user_id = $1`,
      [user.id]
    );

    // Get payment links (public for tipping)
    const paymentLinksResult = await query(
      `SELECT id, platform, value, is_primary FROM user_payment_links WHERE user_id = $1 ORDER BY is_primary DESC`,
      [user.id]
    );

    // Get travel history (public)
    const travelHistoryResult = await query(
      `SELECT id, user_id, city, country, year, month, lat, lng, is_wishlist, created_at FROM user_travel_history WHERE user_id = $1 ORDER BY is_wishlist ASC, year DESC, month DESC`,
      [user.id]
    );

    // Get followers count (check both tables for compatibility)
    let followersCount = 0;
    try {
      const followersResult = await query(
        `SELECT COUNT(*) as followers_count FROM followers WHERE following_id = $1`,
        [user.id]
      );
      followersCount = parseInt(followersResult.rows[0]?.followers_count || '0');
    } catch {
      // Fallback to user_follows if followers table doesn't exist
      try {
        const fallbackResult = await query(
          `SELECT COUNT(*) as followers_count FROM user_follows WHERE following_id = $1`,
          [user.id]
        );
        followersCount = parseInt(fallbackResult.rows[0]?.followers_count || '0');
      } catch {
        followersCount = 0;
      }
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUser && currentUser.id !== user.id) {
      try {
        const followCheck = await query(
          `SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = $2`,
          [currentUser.id, user.id]
        );
        isFollowing = followCheck.rows.length > 0;
      } catch {
        isFollowing = false;
      }
    }

    // Get badges (public)
    const badgesResult = await query(
      `SELECT id, badge_type, metadata, earned_at FROM user_badges WHERE user_id = $1 ORDER BY earned_at DESC`,
      [user.id]
    );

    // Get public trips count
    const tripsResult = await query(
      `SELECT COUNT(*) as trip_count FROM trips WHERE user_id = $1 AND visibility IN ('public', 'curated')`,
      [user.id]
    );

    // Get countries count
    const countriesResult = await query(
      `SELECT COUNT(DISTINCT country) as countries_count FROM user_travel_history WHERE user_id = $1`,
      [user.id]
    );

    // Get total clones across all user's trips
    let totalClones = 0;
    try {
      const clonesResult = await query(
        `SELECT COALESCE(SUM(clone_count), 0) as total_clones FROM trips WHERE user_id = $1 AND visibility IN ('public', 'curated')`,
        [user.id]
      );
      totalClones = parseInt(clonesResult.rows[0]?.total_clones || '0');
    } catch {
      // clone_count column might not exist yet
      totalClones = 0;
    }

    // Get user's public/curated trips with images
    const publicTripsResult = await query(
      `SELECT t.id, t.title, t.city, t.visibility, t.share_code, t.likes_count, t.created_at,
              COALESCE(t.clone_count, 0) as clone_count,
              COALESCE(
                (SELECT json_agg(ti.image_url ORDER BY ti.display_order)
                 FROM trip_images ti WHERE ti.trip_id = t.id),
                '[]'::json
              ) as images,
              (SELECT COUNT(*) FROM itinerary_items WHERE trip_id = t.id) as item_count
       FROM trips t
       WHERE t.user_id = $1 AND t.visibility IN ('public', 'curated')
       ORDER BY t.created_at DESC
       LIMIT 10`,
      [user.id]
    );

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.full_name,
        username: user.username,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        location: user.location,
        profileVisibility: user.profile_visibility || 'public',
        createdAt: user.created_at,
      },
      isOwner,
      followersCount,
      isFollowing,
      socialLinks: socialLinksResult.rows.map(row => ({
        id: row.id,
        platform: row.platform,
        value: row.value,
      })),
      paymentLinks: paymentLinksResult.rows.map(row => ({
        id: row.id,
        platform: row.platform,
        value: row.value,
        isPrimary: row.is_primary,
      })),
      travelHistory: travelHistoryResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        city: row.city,
        country: row.country,
        year: row.year,
        month: row.month,
        lat: row.lat,
        lng: row.lng,
        isWishlist: row.is_wishlist || false,
        createdAt: row.created_at,
      })),
      badges: badgesResult.rows.map(row => ({
        id: row.id,
        badgeType: row.badge_type,
        metadata: row.metadata,
        earnedAt: row.earned_at,
      })),
      stats: {
        tripCount: parseInt(tripsResult.rows[0].trip_count),
        countriesCount: parseInt(countriesResult.rows[0].countries_count),
        totalClones,
      },
      trips: publicTripsResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        destinationCity: row.city,
        visibility: row.visibility,
        shareCode: row.share_code,
        likesCount: parseInt(row.likes_count || '0'),
        cloneCount: parseInt(row.clone_count || '0'),
        createdAt: row.created_at,
        images: row.images || [],
        itemCount: parseInt(row.item_count || '0'),
      })),
    });
  } catch (error: any) {
    console.error('Failed to get public profile:', error);
    return NextResponse.json(
      { error: 'Failed to get profile', details: error.message },
      { status: 500 }
    );
  }
}
