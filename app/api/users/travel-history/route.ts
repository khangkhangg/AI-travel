import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - Get user's travel history
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT * FROM user_travel_history
       WHERE user_id = $1
       ORDER BY year DESC NULLS LAST, month DESC NULLS LAST, created_at DESC`,
      [user.id]
    );

    const travelHistory = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      city: row.city,
      country: row.country,
      year: row.year,
      month: row.month,
      notes: row.notes,
      lat: row.lat ? parseFloat(row.lat) : null,
      lng: row.lng ? parseFloat(row.lng) : null,
      isWishlist: row.is_wishlist || false,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ travelHistory });
  } catch (error: any) {
    console.error('Failed to fetch travel history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch travel history' },
      { status: 500 }
    );
  }
}

// POST - Add new travel history entry
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { city, country, year, month, notes, lat, lng, isWishlist } = body;

    if (!city || !country) {
      return NextResponse.json(
        { error: 'City and country are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO user_travel_history (user_id, city, country, year, month, notes, lat, lng, is_wishlist)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user.id, city, country, year || null, month || null, notes || null, lat || null, lng || null, isWishlist || false]
    );

    // Check for globetrotter badge (10+ countries)
    const countriesResult = await query(
      `SELECT COUNT(DISTINCT country) as count FROM user_travel_history WHERE user_id = $1`,
      [user.id]
    );

    if (parseInt(countriesResult.rows[0].count) >= 10) {
      await query(
        `INSERT INTO user_badges (user_id, badge_type)
         VALUES ($1, 'globetrotter')
         ON CONFLICT DO NOTHING`,
        [user.id]
      );
    }

    const row = result.rows[0];
    return NextResponse.json({
      travelHistory: {
        id: row.id,
        userId: row.user_id,
        city: row.city,
        country: row.country,
        year: row.year,
        month: row.month,
        notes: row.notes,
        lat: row.lat ? parseFloat(row.lat) : null,
        lng: row.lng ? parseFloat(row.lng) : null,
        isWishlist: row.is_wishlist || false,
        createdAt: row.created_at,
      },
      message: 'Travel history added successfully',
    });
  } catch (error: any) {
    console.error('Failed to add travel history:', error);
    return NextResponse.json(
      { error: 'Failed to add travel history' },
      { status: 500 }
    );
  }
}

// DELETE - Remove travel history entry
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await query(
      `DELETE FROM user_travel_history WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Travel history deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete travel history:', error);
    return NextResponse.json(
      { error: 'Failed to delete travel history' },
      { status: 500 }
    );
  }
}

// PUT - Update travel history entry
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, city, country, year, month, notes, lat, lng } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE user_travel_history SET
        city = COALESCE($3, city),
        country = COALESCE($4, country),
        year = $5,
        month = $6,
        notes = $7,
        lat = $8,
        lng = $9,
        updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user.id, city, country, year, month, notes, lat, lng]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      travelHistory: {
        id: row.id,
        userId: row.user_id,
        city: row.city,
        country: row.country,
        year: row.year,
        month: row.month,
        notes: row.notes,
        lat: row.lat ? parseFloat(row.lat) : null,
        lng: row.lng ? parseFloat(row.lng) : null,
        createdAt: row.created_at,
      },
      message: 'Travel history updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update travel history:', error);
    return NextResponse.json(
      { error: 'Failed to update travel history' },
      { status: 500 }
    );
  }
}
