import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { BadgeTrack, buildUserBadgeLevel } from '@/lib/badges';

// POST - Create user record after signup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, fullName } = body;

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      return NextResponse.json({
        user: existing.rows[0],
        message: 'User already exists'
      });
    }

    // Create user with 30-day verification deadline
    const result = await query(
      `INSERT INTO users (id, email, full_name, email_verified, verification_deadline)
       VALUES ($1, $2, $3, FALSE, NOW() + INTERVAL '30 days')
       RETURNING *`,
      [id, email, fullName || null]
    );

    return NextResponse.json({
      user: result.rows[0],
      message: 'User created successfully',
    });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with all related data
    const userResult = await query(
      `SELECT * FROM users WHERE id = $1`,
      [authUser.id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get social links
    const socialLinksResult = await query(
      `SELECT * FROM user_social_links WHERE user_id = $1`,
      [authUser.id]
    );

    // Get payment links
    const paymentLinksResult = await query(
      `SELECT * FROM user_payment_links WHERE user_id = $1`,
      [authUser.id]
    );

    // Get travel history
    const travelHistoryResult = await query(
      `SELECT * FROM user_travel_history WHERE user_id = $1 ORDER BY year DESC, month DESC`,
      [authUser.id]
    );

    // Get badges
    const badgesResult = await query(
      `SELECT * FROM user_badges WHERE user_id = $1 ORDER BY earned_at DESC`,
      [authUser.id]
    );

    // Get stats from trips table
    const statsResult = await query(
      `SELECT
        (SELECT COUNT(*) FROM trips WHERE user_id = $1) as itineraries_count,
        (SELECT COUNT(*) FROM trips WHERE user_id = $1 AND visibility IN ('public', 'curated')) as public_itineraries_count,
        (SELECT COALESCE(SUM(views_count), 0) FROM trips WHERE user_id = $1) as total_views,
        (SELECT COUNT(DISTINCT country) FROM user_travel_history WHERE user_id = $1 AND (is_wishlist = false OR is_wishlist IS NULL)) as countries_visited`,
      [authUser.id]
    );

    const stats = statsResult.rows[0];

    // Get gamified badge levels
    let badgeLevelsResult = await query(
      `SELECT track, level, current_count, updated_at
       FROM user_badge_levels
       WHERE user_id = $1`,
      [authUser.id]
    );

    // If no badge levels exist, calculate and store them
    if (badgeLevelsResult.rows.length === 0) {
      const trackStats: { track: BadgeTrack; count: number }[] = [
        { track: 'explorer', count: parseInt(stats.countries_visited) || 0 },
        { track: 'creator', count: parseInt(stats.public_itineraries_count) || 0 },
        { track: 'influence', count: 0 }, // Clone tracking not yet implemented in trips table
      ];

      for (const { track, count } of trackStats) {
        const badgeInfo = buildUserBadgeLevel(track, count);
        await query(
          `INSERT INTO user_badge_levels (user_id, track, level, current_count, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id, track)
           DO UPDATE SET level = $3, current_count = $4, updated_at = NOW()`,
          [authUser.id, track, badgeInfo.level, count]
        );
      }

      // Re-fetch badge levels
      badgeLevelsResult = await query(
        `SELECT track, level, current_count, updated_at
         FROM user_badge_levels
         WHERE user_id = $1`,
        [authUser.id]
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        location: user.location,
        phone: user.phone,
        emailVerified: user.email_verified,
        emailVerifiedAt: user.email_verified_at,
        verificationDeadline: user.verification_deadline,
        profileVisibility: user.profile_visibility || 'public',
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      socialLinks: socialLinksResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        platform: row.platform,
        value: row.value,
        createdAt: row.created_at,
      })),
      paymentLinks: paymentLinksResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        platform: row.platform,
        value: row.value,
        isPrimary: row.is_primary,
        createdAt: row.created_at,
      })),
      travelHistory: travelHistoryResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        city: row.city,
        country: row.country,
        year: row.year,
        month: row.month,
        notes: row.notes,
        lat: row.lat,
        lng: row.lng,
        isWishlist: row.is_wishlist || false,
        createdAt: row.created_at,
      })),
      badges: badgesResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        badgeType: row.badge_type,
        metadata: row.metadata,
        earnedAt: row.earned_at,
      })),
      stats: {
        itinerariesCount: parseInt(stats.itineraries_count),
        publicItinerariesCount: parseInt(stats.public_itineraries_count),
        totalClones: 0, // Clone tracking not yet implemented in trips table
        totalViews: parseInt(stats.total_views),
        countriesVisited: parseInt(stats.countries_visited),
      },
      // Gamified badge levels (leveled progression system)
      badgeLevels: badgeLevelsResult.rows.map(row =>
        buildUserBadgeLevel(row.track as BadgeTrack, row.current_count)
      ).sort((a, b) => b.level - a.level),
    });
  } catch (error: any) {
    console.error('Failed to get user:', error);
    return NextResponse.json(
      { error: 'Failed to get user', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, username, bio, location, phone, avatarUrl, profileVisibility } = body;

    // Validate username if provided
    if (username !== undefined) {
      // Username format validation: 3-30 chars, alphanumeric, underscores, dots
      const usernameRegex = /^[a-zA-Z0-9_.]{3,30}$/;
      if (username && !usernameRegex.test(username)) {
        return NextResponse.json(
          { error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and dots' },
          { status: 400 }
        );
      }

      // Check if username is already taken (by another user)
      if (username) {
        const existingUser = await query(
          'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2',
          [username, authUser.id]
        );
        if (existingUser.rows.length > 0) {
          return NextResponse.json(
            { error: 'Username is already taken' },
            { status: 400 }
          );
        }
      }
    }

    const result = await query(
      `UPDATE users SET
        full_name = COALESCE($2, full_name),
        username = COALESCE($3, username),
        bio = COALESCE($4, bio),
        location = COALESCE($5, location),
        phone = COALESCE($6, phone),
        avatar_url = COALESCE($7, avatar_url),
        profile_visibility = COALESCE($8, profile_visibility),
        updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [authUser.id, fullName, username || null, bio, location, phone, avatarUrl, profileVisibility]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...result.rows[0],
        username: result.rows[0].username,
      },
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}
