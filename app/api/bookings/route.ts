import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// POST - Create new booking (public, no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      guide_id,
      visitor_name,
      visitor_email,
      visitor_phone,
      booking_date,
      start_time,
      end_time,
      party_size,
      notes
    } = body;

    // Validate required fields
    if (!guide_id || !visitor_name || !visitor_email || !booking_date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify guide exists and has guide mode enabled
    const guideResult = await query(
      'SELECT id, is_guide, guide_details FROM users WHERE id = $1',
      [guide_id]
    );

    if (guideResult.rows.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    if (!guideResult.rows[0].is_guide) {
      return NextResponse.json({ error: 'User is not a guide' }, { status: 400 });
    }

    // Create booking
    const result = await query(
      `INSERT INTO tour_bookings (
        guide_id, visitor_name, visitor_email, visitor_phone,
        booking_date, start_time, end_time, party_size, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [guide_id, visitor_name, visitor_email, visitor_phone, booking_date, start_time, end_time, party_size || 1, notes]
    );

    return NextResponse.json({ booking: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

// GET - List bookings for authenticated guide
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const month = searchParams.get('month'); // Format: YYYY-MM
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = 'WHERE guide_id = $1';
    const values: any[] = [user.id];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      values.push(status);
    }

    if (month) {
      whereClause += ` AND to_char(booking_date, 'YYYY-MM') = $${paramIndex++}`;
      values.push(month);
    }

    // Get bookings
    const result = await query(
      `SELECT * FROM tour_bookings
       ${whereClause}
       ORDER BY booking_date DESC, start_time DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    );

    // Get counts by status
    const countsResult = await query(
      `SELECT status, COUNT(*) as count
       FROM tour_bookings
       WHERE guide_id = $1
       GROUP BY status`,
      [user.id]
    );

    const counts = {
      pending: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0
    };
    countsResult.rows.forEach((row: any) => {
      counts[row.status as keyof typeof counts] = parseInt(row.count);
    });

    return NextResponse.json({
      bookings: result.rows,
      counts,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
