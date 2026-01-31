import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// POST - Create user record after signup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, fullName } = body;

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'User already exists' });
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

    // Get stats
    const statsResult = await query(
      `SELECT
        (SELECT COUNT(*) FROM itineraries WHERE user_id = $1) as itineraries_count,
        (SELECT COUNT(*) FROM itineraries WHERE user_id = $1 AND visibility = 'public') as public_itineraries_count,
        (SELECT COALESCE(SUM(clone_count), 0) FROM itineraries WHERE user_id = $1) as total_clones,
        (SELECT COALESCE(SUM(view_count), 0) FROM itineraries WHERE user_id = $1) as total_views,
        (SELECT COUNT(DISTINCT country) FROM user_travel_history WHERE user_id = $1) as countries_visited`,
      [authUser.id]
    );

    const stats = statsResult.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        location: user.location,
        phone: user.phone,
        emailVerified: user.email_verified,
        emailVerifiedAt: user.email_verified_at,
        verificationDeadline: user.verification_deadline,
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
        totalClones: parseInt(stats.total_clones),
        totalViews: parseInt(stats.total_views),
        countriesVisited: parseInt(stats.countries_visited),
      },
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
    const { fullName, bio, location, phone, avatarUrl } = body;

    const result = await query(
      `UPDATE users SET
        full_name = COALESCE($2, full_name),
        bio = COALESCE($3, bio),
        location = COALESCE($4, location),
        phone = COALESCE($5, phone),
        avatar_url = COALESCE($6, avatar_url),
        updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [authUser.id, fullName, bio, location, phone, avatarUrl]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: result.rows[0],
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
