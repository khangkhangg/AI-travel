import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { ItineraryVisibility } from '@/lib/types/user';

// GET - List itineraries (user's own or public/marketplace)
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    const { searchParams } = new URL(request.url);

    const visibility = searchParams.get('visibility') as ItineraryVisibility | null;
    const userId = searchParams.get('userId');
    const destination = searchParams.get('destination');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const openToOffers = searchParams.get('openToOffers') === 'true';
    const mine = searchParams.get('mine') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT
        i.*,
        u.id as user_id_joined,
        u.full_name as user_full_name,
        u.avatar_url as user_avatar_url,
        u.username as user_username,
        (SELECT COUNT(*) FROM itinerary_collaborators WHERE itinerary_id = i.id) as collaborator_count
      FROM itineraries i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // If requesting own itineraries
    if (mine) {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      sql += ` AND i.user_id = $${paramIndex++}`;
      params.push(user.id);
    }
    // If requesting specific user's itineraries
    else if (userId) {
      sql += ` AND i.user_id = $${paramIndex++}`;
      params.push(userId);
      // Only show public/marketplace itineraries of other users
      if (!user || user.id !== userId) {
        sql += ` AND i.visibility IN ('public', 'marketplace')`;
      }
    }
    // Browsing public/marketplace itineraries
    else {
      sql += ` AND i.visibility IN ('public', 'marketplace')`;
    }

    // Visibility filter
    if (visibility) {
      sql += ` AND i.visibility = $${paramIndex++}`;
      params.push(visibility);
    }

    // Destination filter
    if (destination) {
      sql += ` AND (i.destination_city ILIKE $${paramIndex} OR i.destination_country ILIKE $${paramIndex++})`;
      params.push(`%${destination}%`);
    }

    // Date range filter
    if (startDate) {
      sql += ` AND i.start_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND i.end_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    // Open to offers filter (marketplace browsing)
    if (openToOffers) {
      sql += ` AND i.open_to_offers = TRUE AND i.visibility = 'marketplace'`;
    }

    // Order and pagination
    sql += ` ORDER BY i.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    const itineraries = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      destinationCity: row.destination_city,
      destinationCountry: row.destination_country,
      startDate: row.start_date,
      endDate: row.end_date,
      visibility: row.visibility,
      openToOffers: row.open_to_offers,
      groupSize: row.group_size,
      interests: row.interests || [],
      cloneCount: row.clone_count,
      viewCount: row.view_count,
      clonedFromId: row.cloned_from_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: row.user_full_name ? {
        id: row.user_id_joined,
        fullName: row.user_full_name,
        avatarUrl: row.user_avatar_url,
        username: row.user_username,
      } : undefined,
      collaboratorCount: parseInt(row.collaborator_count),
    }));

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) FROM itineraries WHERE visibility IN ('public', 'marketplace')`,
      []
    );

    return NextResponse.json({
      itineraries,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Failed to fetch itineraries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itineraries' },
      { status: 500 }
    );
  }
}

// POST - Create new itinerary
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      destinationCity,
      destinationCountry,
      startDate,
      endDate,
      visibility = 'private',
      openToOffers = false,
      groupSize = 1,
      interests = [],
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!['public', 'private', 'marketplace'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO itineraries (
        user_id, title, description, destination_city, destination_country,
        start_date, end_date, visibility, open_to_offers, group_size, interests
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        user.id,
        title,
        description || null,
        destinationCity || null,
        destinationCountry || null,
        startDate || null,
        endDate || null,
        visibility,
        openToOffers,
        groupSize,
        interests,
      ]
    );

    const row = result.rows[0];

    // Check if this is user's first itinerary and award badge
    const countResult = await query(
      `SELECT COUNT(*) FROM itineraries WHERE user_id = $1`,
      [user.id]
    );

    if (parseInt(countResult.rows[0].count) === 1) {
      // Award first_itinerary badge
      await query(
        `INSERT INTO user_badges (user_id, badge_type)
         VALUES ($1, 'first_itinerary')
         ON CONFLICT DO NOTHING`,
        [user.id]
      );
    }

    return NextResponse.json({
      itinerary: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        destinationCity: row.destination_city,
        destinationCountry: row.destination_country,
        startDate: row.start_date,
        endDate: row.end_date,
        visibility: row.visibility,
        openToOffers: row.open_to_offers,
        groupSize: row.group_size,
        interests: row.interests || [],
        cloneCount: row.clone_count,
        viewCount: row.view_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      message: 'Itinerary created successfully',
    });
  } catch (error: any) {
    console.error('Failed to create itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to create itinerary' },
      { status: 500 }
    );
  }
}
