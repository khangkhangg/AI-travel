import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { CreateGuideRequest } from '@/lib/types/tour';

// GET - List tour guides or check if user is a guide
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const checkSelf = searchParams.get('self') === 'true';

    if (checkSelf) {
      const user = await getUser();
      if (!user) {
        return NextResponse.json({ isGuide: false });
      }

      const result = await query(
        `SELECT tg.*, u.full_name, u.avatar_url, u.email
         FROM tour_guides tg
         JOIN users u ON u.id = tg.user_id
         WHERE tg.user_id = $1`,
        [user.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ isGuide: false });
      }

      const row = result.rows[0];
      return NextResponse.json({
        isGuide: true,
        guide: {
          id: row.id,
          userId: row.user_id,
          businessName: row.business_name,
          bio: row.bio,
          phone: row.phone,
          website: row.website,
          languages: row.languages || [],
          certifications: row.certifications || [],
          yearsExperience: row.years_experience,
          isVerified: row.is_verified,
          isActive: row.is_active,
          rating: parseFloat(row.rating) || 0,
          totalReviews: row.total_reviews,
          totalBookings: row.total_bookings,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          user: {
            fullName: row.full_name,
            email: row.email,
            avatarUrl: row.avatar_url,
          },
        },
      });
    }

    // List all active guides
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM tour_guides WHERE is_active = true',
      []
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT tg.*, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM tours WHERE guide_id = tg.id AND status = 'active') as active_tours
       FROM tour_guides tg
       JOIN users u ON u.id = tg.user_id
       WHERE tg.is_active = true
       ORDER BY tg.rating DESC, tg.total_reviews DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const guides = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      businessName: row.business_name,
      bio: row.bio,
      languages: row.languages || [],
      yearsExperience: row.years_experience,
      isVerified: row.is_verified,
      rating: parseFloat(row.rating) || 0,
      totalReviews: row.total_reviews,
      totalBookings: row.total_bookings,
      activeTours: parseInt(row.active_tours),
      user: {
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
      },
    }));

    return NextResponse.json({
      guides,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Failed to fetch tour guides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour guides' },
      { status: 500 }
    );
  }
}

// POST - Register as a tour guide
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already a guide
    const existingGuide = await query(
      'SELECT * FROM tour_guides WHERE user_id = $1',
      [user.id]
    );

    if (existingGuide.rows.length > 0) {
      return NextResponse.json(
        { error: 'You are already registered as a tour guide' },
        { status: 400 }
      );
    }

    const body: CreateGuideRequest = await request.json();

    const result = await query(
      `INSERT INTO tour_guides (
        user_id, business_name, bio, phone, website,
        languages, certifications, years_experience
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        user.id,
        body.businessName || null,
        body.bio || null,
        body.phone || null,
        body.website || null,
        body.languages || [],
        body.certifications || [],
        body.yearsExperience || 0,
      ]
    );

    const row = result.rows[0];

    return NextResponse.json({
      guide: {
        id: row.id,
        userId: row.user_id,
        businessName: row.business_name,
        bio: row.bio,
        phone: row.phone,
        website: row.website,
        languages: row.languages || [],
        certifications: row.certifications || [],
        yearsExperience: row.years_experience,
        isVerified: row.is_verified,
        isActive: row.is_active,
        rating: 0,
        totalReviews: 0,
        totalBookings: 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      message: 'Successfully registered as a tour guide!',
    });
  } catch (error: any) {
    console.error('Failed to register tour guide:', error);
    return NextResponse.json(
      { error: 'Failed to register as tour guide', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update guide profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateGuideRequest = await request.json();

    const result = await query(
      `UPDATE tour_guides SET
        business_name = COALESCE($2, business_name),
        bio = COALESCE($3, bio),
        phone = COALESCE($4, phone),
        website = COALESCE($5, website),
        languages = COALESCE($6, languages),
        certifications = COALESCE($7, certifications),
        years_experience = COALESCE($8, years_experience),
        updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [
        user.id,
        body.businessName,
        body.bio,
        body.phone,
        body.website,
        body.languages,
        body.certifications,
        body.yearsExperience,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tour guide profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      guide: result.rows[0],
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update tour guide:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
