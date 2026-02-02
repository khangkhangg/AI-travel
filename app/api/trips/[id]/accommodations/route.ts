import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - get accommodations for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT * FROM trip_accommodations
       WHERE trip_id = $1
       ORDER BY night_number ASC`,
      [id]
    );

    return NextResponse.json({ accommodations: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch accommodations:', error);
    return NextResponse.json({ error: 'Failed to fetch accommodations' }, { status: 500 });
  }
}

// POST - add or update accommodation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify trip ownership
    const tripCheck = await query(
      'SELECT user_id FROM trips WHERE id = $1',
      [id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (tripCheck.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { night_number, date, status, current_booking, location_preference, notes } = body;

    if (night_number === undefined) {
      return NextResponse.json({ error: 'Night number is required' }, { status: 400 });
    }

    // Upsert accommodation
    const result = await query(
      `INSERT INTO trip_accommodations (
        trip_id, night_number, date, status, current_booking, location_preference, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (trip_id, night_number)
      DO UPDATE SET
        date = EXCLUDED.date,
        status = EXCLUDED.status,
        current_booking = EXCLUDED.current_booking,
        location_preference = EXCLUDED.location_preference,
        notes = EXCLUDED.notes
      RETURNING *`,
      [
        id,
        night_number,
        date || null,
        status || 'need',
        current_booking ? JSON.stringify(current_booking) : null,
        location_preference || null,
        notes || null
      ]
    );

    return NextResponse.json({ accommodation: result.rows[0] });
  } catch (error: any) {
    console.error('Failed to save accommodation:', error);
    return NextResponse.json({ error: 'Failed to save accommodation' }, { status: 500 });
  }
}

// PUT - bulk update accommodations (for setting multiple nights at once)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify trip ownership
    const tripCheck = await query(
      'SELECT user_id FROM trips WHERE id = $1',
      [id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (tripCheck.rows[0].user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { accommodations } = body;

    if (!accommodations || !Array.isArray(accommodations)) {
      return NextResponse.json({ error: 'Accommodations array is required' }, { status: 400 });
    }

    // Delete existing and insert new
    await query('DELETE FROM trip_accommodations WHERE trip_id = $1', [id]);

    const results = [];
    for (const acc of accommodations) {
      const result = await query(
        `INSERT INTO trip_accommodations (
          trip_id, night_number, date, status, current_booking, location_preference, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [
          id,
          acc.night_number,
          acc.date || null,
          acc.status || 'need',
          acc.current_booking ? JSON.stringify(acc.current_booking) : null,
          acc.location_preference || null,
          acc.notes || null
        ]
      );
      results.push(result.rows[0]);
    }

    return NextResponse.json({ accommodations: results });
  } catch (error: any) {
    console.error('Failed to update accommodations:', error);
    return NextResponse.json({ error: 'Failed to update accommodations' }, { status: 500 });
  }
}
